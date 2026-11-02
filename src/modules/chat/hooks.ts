import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { newIntentKey } from '@/modules/attendance/services/intentKey';
import { useAppendedList, useRemoteRead } from '@/shared/hooks/useRemoteRead';
import { ApiError } from '@/shared/http/apiClient';
import { useChat, type ChatSignal } from './ChatProvider';
import { maxSequence, upsertMessages } from './model';
import type { ChatMessage, ChatNotification, Conversation } from './schema';

const FALLBACK_POLL_MS = 15_000;
const READ_DEBOUNCE_MS = 500;
function useChatSignal(listener: (signal: ChatSignal) => void) {
  const { subscribe } = useChat();
  const current = useRef(listener);
  current.current = listener;
  useEffect(() => subscribe((signal) => current.current(signal)), [subscribe]);
}
export function useUnreadCount() {
  const { service } = useChat();
  const count = useRemoteRead('chat-unread', () => service.unreadCount());
  useChatSignal((signal) => {
    if (signal.kind === 'notifications') count.refresh();
  });
  return count.data;
}
export function useConversations(type: 'GROUP' | 'DIRECT' | '') {
  const { service } = useChat();
  const list = useAppendedList(
    `conversations:${type}`,
    (next) => service.conversations(type, next ? String(next) : undefined),
    (row: Conversation) => row.id
  );
  useChatSignal((signal) => {
    if (signal.kind !== 'membership') list.refresh();
  });
  return list;
}
export function useNotifications() {
  const { service } = useChat();
  const list = useAppendedList(
    'notifications',
    (next) => service.notifications(next ? String(next) : undefined),
    (row: ChatNotification) => row.id
  );
  useChatSignal((signal) => {
    if (signal.kind === 'notifications') list.refresh();
  });
  return list;
}
export type PendingMessage = {
  clientMessageId: string;
  body: string;
  failure?: ApiError | undefined;
};
/**
 * One open conversation: an HTTP snapshot, then event catch-up from the last
 * complete checkpoint. Live socket events are merged by id and version, so the
 * same message may safely arrive from any of these paths.
 */
export function useConversationRoom(conversationId: string) {
  const { service, connected, join } = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [older, setOlder] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState<ApiError>();
  const checkpoint = useRef<string | null>(null);
  const marked = useRef('0');
  const merge = useCallback((incoming: ChatMessage[]) => {
    setMessages((previous) => upsertMessages(previous, incoming));
    const own = new Set(incoming.map((m) => m.clientMessageId));
    setPending((previous) =>
      previous.filter((p) => !own.has(p.clientMessageId))
    );
  }, []);
  const header = useRemoteRead(`conversation:${conversationId}`, () =>
    service.conversation(conversationId)
  );
  const snapshot = async (restart: boolean) => {
    const page = await service.history(conversationId);
    // A live event may have arrived during the first request: keep it.
    setMessages((previous) =>
      upsertMessages(restart ? [] : previous, page.items)
    );
    setOlder(page.hasMore ? page.next : null);
    checkpoint.current = page.highWatermark ?? '0';
    return true;
  };
  const history = useRemoteRead(`messages:${conversationId}`, async () => {
    if (checkpoint.current === null) return snapshot(false);
    try {
      const result = await service.catchUp(conversationId, checkpoint.current);
      merge(result.messages);
      if (result.through)
        checkpoint.current = maxSequence(checkpoint.current, result.through);
      return true;
    } catch (e) {
      // Events older than retention are gone: start again from a new snapshot.
      if (e instanceof ApiError && e.kind === 'gone') return snapshot(true);
      throw e;
    }
  });
  useEffect(() => join(conversationId), [join, conversationId]);
  const reconnected = useRef(connected);
  const refreshHistory = history.refresh;
  useEffect(() => {
    if (connected && !reconnected.current) refreshHistory();
    reconnected.current = connected;
  }, [connected, refreshHistory]);
  // Without a socket the conversation still stays current.
  useEffect(() => {
    if (connected) return;
    const timer = setInterval(() => {
      if (AppState.currentState !== 'background') refreshHistory();
    }, FALLBACK_POLL_MS);
    return () => clearInterval(timer);
  }, [connected, refreshHistory]);
  useChatSignal((signal) => {
    if (signal.kind === 'message') {
      const { event } = signal;
      if (event.message?.conversationId === conversationId)
        merge([event.message]);
    } else if (
      signal.kind !== 'notifications' &&
      signal.conversationId === conversationId
    ) {
      header.refresh();
      if (signal.kind === 'revoked') refreshHistory();
    }
  });
  const newest = messages.at(-1)?.sequence;
  useEffect(() => {
    if (
      !newest ||
      maxSequence(marked.current, newest) === marked.current ||
      AppState.currentState === 'background'
    )
      return;
    const timer = setTimeout(() => {
      marked.current = newest;
      service.markRead(conversationId, newest).catch(() => {
        // Retried by the next message or reload; never blocks reading.
        marked.current = '0';
      });
    }, READ_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [newest, history.data, service, conversationId]);
  const dispatch = useCallback(
    async (item: PendingMessage) => {
      setPending((previous) =>
        previous.map((p) =>
          p.clientMessageId === item.clientMessageId
            ? { ...p, failure: undefined }
            : p
        )
      );
      try {
        merge([
          await service.send(conversationId, item.clientMessageId, item.body),
        ]);
        setPending((previous) =>
          previous.filter((p) => p.clientMessageId !== item.clientMessageId)
        );
      } catch (e) {
        const failure = e instanceof ApiError ? e : new ApiError('uncertain');
        setPending((previous) =>
          previous.map((p) =>
            p.clientMessageId === item.clientMessageId ? { ...p, failure } : p
          )
        );
      }
    },
    [service, conversationId, merge]
  );
  const send = (body: string) => {
    const item = { clientMessageId: newIntentKey(), body: body.trim() };
    setPending((previous) => [...previous, item]);
    dispatch(item);
  };
  const loadOlder = async () => {
    if (!older || loadingOlder) return;
    setLoadingOlder(true);
    setOlderError(undefined);
    try {
      const page = await service.history(conversationId, older);
      merge(page.items);
      setOlder(page.hasMore ? page.next : null);
    } catch (e) {
      setOlderError(e instanceof ApiError ? e : new ApiError('error'));
    } finally {
      setLoadingOlder(false);
    }
  };
  return {
    header,
    history,
    messages,
    pending,
    send,
    resend: dispatch,
    hasOlder: !!older,
    loadingOlder,
    olderError,
    loadOlder,
  };
}
