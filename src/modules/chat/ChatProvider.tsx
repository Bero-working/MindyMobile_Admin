import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { env } from '@/config/env';
import { messageEvent, type MessageEvent } from './schema';
import type { ChatService } from './service';

export type ChatSignal =
  | { kind: 'message'; event: MessageEvent }
  | { kind: 'membership'; conversationId: string }
  | { kind: 'revoked'; conversationId: string }
  | { kind: 'notifications' };
export type SocketFactory = (url: string, origin: string) => Socket;
const defaultFactory: SocketFactory = (url, origin) =>
  io(url, {
    path: '/socket.io',
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: false,
    // React Native sends native cookies itself; the backend checks the exact Origin.
    extraHeaders: { Origin: origin },
  });
/** The Socket.IO namespace lives on the host, without the REST prefix. */
export const socketUrl = (apiUrl: string | undefined) => {
  const host = apiUrl?.match(/^https?:\/\/[^/]+/)?.[0];
  return host ? `${host}/chat` : undefined;
};
type ChatContext = {
  service: ChatService;
  connected: boolean;
  subscribe: (listener: (signal: ChatSignal) => void) => () => void;
  join: (conversationId: string) => () => void;
};
const Context = createContext<ChatContext | null>(null);
/**
 * Holds one socket for the signed-in mentor while any screen listens. Socket
 * events only make screens fresher: every screen also works over HTTP alone.
 */
export function ChatProvider({
  service,
  apiUrl = env.API_URL,
  origin = env.API_ORIGIN,
  socketFactory = defaultFactory,
  children,
}: PropsWithChildren<{
  service: ChatService;
  apiUrl?: string | undefined;
  origin?: string | undefined;
  socketFactory?: SocketFactory;
}>) {
  const [connected, setConnected] = useState(false);
  const socket = useRef<Socket | null>(null);
  const listeners = useRef(new Set<(signal: ChatSignal) => void>());
  const joined = useRef(new Set<string>());
  const renewed = useRef(false);
  const emit = useCallback((signal: ChatSignal) => {
    listeners.current.forEach((listener) => listener(signal));
  }, []);
  const stop = useCallback(() => {
    socket.current?.removeAllListeners();
    socket.current?.disconnect();
    socket.current = null;
    setConnected(false);
  }, []);
  const start = useCallback(() => {
    const url = socketUrl(apiUrl);
    if (socket.current || !url || !origin) return;
    const next = socketFactory(url, origin);
    socket.current = next;
    // An expired token closes the socket: refresh over HTTP once, then reconnect.
    const renewAndReconnect = () => {
      if (renewed.current) return;
      renewed.current = true;
      service
        .renew()
        .then((ok) => {
          if (ok && socket.current === next) next.connect();
        })
        .catch(() => {});
    };
    next.on('connect', () => {
      renewed.current = false;
      setConnected(true);
      joined.current.forEach((conversationId) =>
        next.emit('conversation:join', { conversationId }, () => {})
      );
    });
    next.on('disconnect', (reason: string) => {
      setConnected(false);
      if (reason === 'io server disconnect') renewAndReconnect();
    });
    next.on(
      'connect_error',
      (error: Error & { data?: { statusCode?: number } }) => {
        if (error.data?.statusCode === 401) renewAndReconnect();
      }
    );
    for (const name of [
      'message:created',
      'message:updated',
      'message:deleted',
    ])
      next.on(name, (payload: object) => {
        const parsed = messageEvent.safeParse(payload);
        if (parsed.success) emit({ kind: 'message', event: parsed.data });
      });
    const conversationSignal =
      (kind: 'membership' | 'revoked') =>
      (payload: { conversationId?: string } | null) => {
        const conversationId = payload?.conversationId;
        if (typeof conversationId === 'string') emit({ kind, conversationId });
      };
    next.on(
      'conversation:membership-changed',
      conversationSignal('membership')
    );
    next.on('conversation:access-changed', conversationSignal('revoked'));
    for (const name of ['notification:created', 'notifications:read'])
      next.on(name, () => emit({ kind: 'notifications' }));
    next.connect();
  }, [apiUrl, origin, socketFactory, service, emit]);
  useEffect(() => stop, [stop]);
  // Stable on purpose: a new identity on connect would make listeners
  // resubscribe, which stops and restarts the socket in a loop.
  const subscribe = useCallback<ChatContext['subscribe']>(
    (listener) => {
      listeners.current.add(listener);
      start();
      return () => {
        listeners.current.delete(listener);
        if (!listeners.current.size) stop();
      };
    },
    [start, stop]
  );
  const join = useCallback<ChatContext['join']>((conversationId) => {
    joined.current.add(conversationId);
    socket.current?.emit('conversation:join', { conversationId }, () => {});
    return () => {
      joined.current.delete(conversationId);
      socket.current?.emit('conversation:leave', { conversationId }, () => {});
    };
  }, []);
  const value = useMemo<ChatContext>(
    () => ({ service, connected, subscribe, join }),
    [service, connected, subscribe, join]
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useChat() {
  const context = useContext(Context);
  if (!context) throw new Error('ChatProvider required');
  return context;
}
