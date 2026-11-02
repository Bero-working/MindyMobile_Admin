import { z } from 'zod';
import {
  ApiError,
  createApiClient,
  safeSegment,
  type ApiClientOptions,
} from '@/shared/http/apiClient';
import {
  conversation,
  directResult,
  fileAccess,
  message,
  messageEvent,
  notification,
  pageOf,
  sendResult,
  unreadCount,
  type ChatMessage,
} from './schema';
import { messageProblem } from './model';

const LIST_LIMIT = 20;
const MESSAGE_LIMIT = 50;
const EVENT_LIMIT = 100;
export function createChatService(options: ApiClientOptions = {}) {
  const api = createApiClient(options);
  const root = (id: string) => `/chat/conversations/${safeSegment(id)}`;
  const page = <T>(result: {
    data: T[];
    meta: { nextCursor: string | null; hasMore: boolean };
  }) => ({
    items: result.data,
    hasMore: result.meta.hasMore && !!result.meta.nextCursor,
    next: result.meta.nextCursor,
  });
  const conversations = pageOf(conversation);
  const notifications = pageOf(notification);
  const messages = pageOf(message);
  const events = pageOf(messageEvent);
  return {
    /** Token refresh for the socket, which cannot refresh by itself. */
    renew: api.renew,
    async conversations(type: 'GROUP' | 'DIRECT' | '', cursor?: string) {
      return page(
        await api.read(conversations, '/chat/conversations', {
          params: {
            limit: LIST_LIMIT,
            ...(type ? { type } : {}),
            ...(cursor ? { cursor } : {}),
          },
        })
      );
    },
    async conversation(id: string) {
      const data = await api.read(conversation, root(id));
      if (data.id !== id) throw new ApiError('error', 'INVALID_RESPONSE');
      return data;
    },
    async ensureDirect(peerUserId: string) {
      return (
        await api.read(directResult, '/chat/conversations/direct', {
          method: 'POST',
          data: { peerUserId },
        })
      ).conversation;
    },
    async history(id: string, cursor?: string) {
      const result = await api.read(messages, `${root(id)}/messages`, {
        params: { limit: MESSAGE_LIMIT, ...(cursor ? { cursor } : {}) },
      });
      if (result.data.some((m) => m.conversationId !== id))
        throw new ApiError('error', 'INVALID_RESPONSE');
      return { ...page(result), highWatermark: result.meta.highWatermark };
    },
    /**
     * Everything after a checkpoint, across pages. The upper watermark is only
     * returned once the last page arrived, so a partial run never skips events.
     */
    async catchUp(id: string, afterSequence: string) {
      const changed: ChatMessage[] = [];
      let cursor: string | null = null;
      for (;;) {
        const params: Record<string, string | number> = cursor
          ? { limit: EVENT_LIMIT, cursor }
          : { limit: EVENT_LIMIT, afterSequence };
        const result: z.infer<typeof events> = await api.read(
          events,
          `${root(id)}/events`,
          { params }
        );
        for (const event of result.data)
          if (event.message) changed.push(event.message);
        if (!result.meta.hasMore || !result.meta.nextCursor)
          return { messages: changed, through: result.meta.throughSequence };
        cursor = result.meta.nextCursor;
      }
    },
    /** The same clientMessageId and body may be resent: the server replays. */
    async send(id: string, clientMessageId: string, body: string) {
      if (messageProblem(body)) throw new ApiError('invalid', 'INVALID_BODY');
      return (
        await api.read(sendResult, `${root(id)}/messages`, {
          method: 'POST',
          data: { clientMessageId, type: 'TEXT', body },
        })
      ).message;
    },
    markRead: (id: string, throughSequence: string) =>
      api.request(`${root(id)}/read`, {
        method: 'PUT',
        data: { throughSequence },
      }),
    fileUrl: async (conversationId: string, messageId: string) =>
      (
        await api.read(
          fileAccess,
          `${root(conversationId)}/messages/${safeSegment(messageId)}/file-access`,
          { method: 'POST' }
        )
      ).url,
    async notifications(cursor?: string) {
      return page(
        await api.read(notifications, '/notifications', {
          params: { limit: LIST_LIMIT, ...(cursor ? { cursor } : {}) },
        })
      );
    },
    unreadCount: async () =>
      (await api.read(unreadCount, '/notifications/unread-count')).unreadCount,
    readNotification: (id: string) =>
      api.request(`/notifications/${safeSegment(id)}/read`, {
        method: 'PATCH',
      }),
    readAllNotifications: () =>
      api.request('/notifications/read-all', { method: 'POST' }),
  };
}
export type ChatService = ReturnType<typeof createChatService>;
