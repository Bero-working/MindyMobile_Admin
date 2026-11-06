import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { ComponentProps, ReactElement } from 'react';
import type { Socket } from 'socket.io-client';
import { MindyThemeProvider } from '@/components/ui/theme';
import { ChatProvider } from '@/modules/chat/ChatProvider';
import {
  ChatConversationScreen,
  ChatConversationsScreen,
  ChatNewMessageScreen,
  ChatNotificationsScreen,
} from '@/modules/chat/ChatScreens';
import { ChatBubble } from '@/modules/chat/EntryPoints';
import { formatConversationTime, layoutMessages } from '@/modules/chat/model';
import type { ChatService } from '@/modules/chat/service';
import { ApiError } from '@/shared/http/apiClient';
import i18n from '@/translations';

const mockNavigate = jest.fn();
jest.mock('@/modules/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    state: { user: { id: 'me', role: 'MENTOR' } },
    notify: jest.fn(),
  }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    addListener: () => () => {},
  }),
}));
const iso = '2026-11-02T07:32:00.000Z';
const message = (id: string, sequence: string, patch = {}) => ({
  id,
  conversationId: 'c1',
  sender: { id: 'peer', displayName: 'An' },
  clientMessageId: null,
  sequence,
  lastChangedSequence: sequence,
  type: 'TEXT' as const,
  body: `body ${id}`,
  file: null,
  replyTo: null,
  version: 1,
  createdAt: iso,
  editedAt: null,
  deletedAt: null,
  ...patch,
});
const conversation = (patch = {}) => ({
  id: 'c1',
  type: 'DIRECT' as const,
  classId: null,
  name: null,
  peer: { id: 'peer', displayName: 'An' },
  capabilities: { canRead: true as const, canSend: true },
  accessMode: 'ACTIVE' as const,
  lastReadSequence: '0',
  highWatermark: '2',
  unreadCount: 2,
  lastMessage: null,
  activityAt: iso,
  ...patch,
});
const fake = (patch: Partial<ChatService> = {}): ChatService =>
  ({
    renew: jest.fn().mockResolvedValue(true),
    conversations: jest.fn().mockResolvedValue({
      items: [conversation()],
      hasMore: false,
      next: null,
    }),
    conversation: jest.fn().mockResolvedValue(conversation()),
    history: jest.fn().mockResolvedValue({
      items: [message('m1', '1'), message('m2', '2')],
      hasMore: false,
      next: null,
      highWatermark: '2',
    }),
    catchUp: jest.fn().mockResolvedValue({ messages: [], through: '2' }),
    send: jest.fn(),
    markRead: jest.fn().mockResolvedValue({}),
    fileUrl: jest.fn(),
    unreadCount: jest.fn().mockResolvedValue(0),
    notifications: jest
      .fn()
      .mockResolvedValue({ items: [], hasMore: false, next: null }),
    readNotification: jest.fn().mockResolvedValue({}),
    readAllNotifications: jest.fn().mockResolvedValue({}),
    ensureDirect: jest.fn(),
    ...patch,
  }) as never;
type Handler = (payload?: object | string) => void;
function fakeSocket() {
  const handlers = new Map<string, Handler>();
  const socket = {
    on: (name: string, handler: Handler) => handlers.set(name, handler),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    removeAllListeners: jest.fn(),
  };
  return {
    socket,
    factory: () => socket as never,
    fire: (name: string, payload?: object | string) =>
      handlers.get(name)?.(payload),
  };
}
function mount(
  service: ChatService,
  element: ReactElement,
  factory?: () => Socket
) {
  return render(
    <MindyThemeProvider>
      <ChatProvider
        service={service}
        apiUrl="https://api.test/api"
        origin="https://mobile.test"
        {...(factory ? { socketFactory: factory } : {})}
      >
        {element}
      </ChatProvider>
    </MindyThemeProvider>
  );
}
const navigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  addListener: () => () => {},
};
const room = (title?: string) => (
  <ChatConversationScreen
    {...({
      route: { params: { conversationId: 'c1', ...(title ? { title } : {}) } },
      navigation,
    } as object as ComponentProps<typeof ChatConversationScreen>)}
  />
);
beforeEach(async () => {
  mockNavigate.mockClear();
  await i18n.changeLanguage('vi');
});
test('the home bubble shows unread and opens the conversations', async () => {
  const live = fakeSocket();
  const unreadCount = jest
    .fn()
    .mockResolvedValueOnce(3)
    .mockResolvedValueOnce(4);
  mount(fake({ unreadCount }), <ChatBubble />, live.factory);
  expect(
    await screen.findByTestId('workspace-open-chat-badge')
  ).toHaveTextContent('3');
  await act(async () => {
    live.fire('notification:created', {});
  });
  expect(screen.getByTestId('workspace-open-chat-badge')).toHaveTextContent(
    '4'
  );
  fireEvent.press(screen.getByTestId('workspace-open-chat'));
  expect(mockNavigate).toHaveBeenCalledWith('ChatConversations');
});
test('connecting keeps the same socket instead of restarting it', async () => {
  const live = fakeSocket();
  const factory = jest.fn(live.factory);
  mount(fake(), <ChatBubble />, factory);
  await waitFor(() => expect(live.socket.connect).toHaveBeenCalledTimes(1));
  await act(async () => {
    live.fire('connect');
  });
  expect(factory).toHaveBeenCalledTimes(1);
  expect(live.socket.connect).toHaveBeenCalledTimes(1);
  expect(live.socket.disconnect).not.toHaveBeenCalled();
});
test('an expired socket session refreshes once, then reconnects', async () => {
  const live = fakeSocket();
  const service = fake();
  mount(service, <ChatBubble />, live.factory);
  await waitFor(() => expect(live.socket.connect).toHaveBeenCalledTimes(1));
  await act(async () => {
    live.fire('disconnect', 'io server disconnect');
    live.fire('disconnect', 'io server disconnect');
  });
  expect(service.renew).toHaveBeenCalledTimes(1);
  expect(live.socket.connect).toHaveBeenCalledTimes(2);
});
test('no unread means no badge and no invented count', async () => {
  const unreadCount = jest.fn().mockResolvedValue(0);
  mount(fake({ unreadCount }), <ChatBubble />, fakeSocket().factory);
  await waitFor(() => expect(unreadCount).toHaveBeenCalled());
  expect(screen.queryByTestId('workspace-open-chat-badge')).toBeNull();
  expect(screen.getByLabelText('Mở tin nhắn')).toBeTruthy();
});
test('the conversation list shows names, unread and opens a room', async () => {
  const conversations = jest.fn().mockResolvedValue({
    items: [conversation({ lastMessage: message('m2', '2') })],
    hasMore: false,
    next: null,
  });
  mount(
    fake({ conversations }),
    <ChatConversationsScreen
      {...({ route: {}, navigation } as object as ComponentProps<
        typeof ChatConversationsScreen
      >)}
    />,
    fakeSocket().factory
  );
  expect(await screen.findByTestId('chat-list-unread-c1')).toHaveTextContent(
    '2'
  );
  expect(conversations).toHaveBeenCalledWith('', undefined);
  expect(screen.getByText('body m2')).toBeTruthy();
  fireEvent.press(screen.getByTestId('chat-list-row-c1'));
  expect(mockNavigate).toHaveBeenCalledWith('ChatConversation', {
    conversationId: 'c1',
    title: 'An',
  });
});
test('previews name the sender; only direct chats join the people strip', async () => {
  const group = conversation({
    id: 'c2',
    type: 'GROUP',
    name: 'Lớp A',
    peer: null,
    unreadCount: 0,
    lastMessage: message('m3', '3', { body: 'Chào lớp' }),
  });
  const mine = conversation({
    lastMessage: message('m2', '2', {
      sender: { id: 'me', displayName: 'Me' },
      body: 'Oge',
    }),
  });
  mount(
    fake({
      conversations: jest.fn().mockResolvedValue({
        items: [mine, group],
        hasMore: false,
        next: null,
      }),
    }),
    <ChatConversationsScreen
      {...({ route: {}, navigation } as object as ComponentProps<
        typeof ChatConversationsScreen
      >)}
    />,
    fakeSocket().factory
  );
  expect(await screen.findByText('Bạn: Oge')).toBeTruthy();
  expect(screen.getByText('An: Chào lớp')).toBeTruthy();
  expect(screen.queryByTestId('chat-list-person-c2')).toBeNull();
  fireEvent.press(screen.getByTestId('chat-list-person-c1'));
  expect(mockNavigate).toHaveBeenCalledWith('ChatConversation', {
    conversationId: 'c1',
    title: 'An',
  });
});
test('empty direct chats stay in the people strip while empty groups stay in the inbox', async () => {
  mount(
    fake({
      conversations: jest.fn().mockResolvedValue({
        items: [
          conversation(),
          conversation({
            id: 'group',
            type: 'GROUP',
            name: 'Lớp A',
            peer: null,
          }),
        ],
        hasMore: false,
        next: null,
      }),
    }),
    <ChatConversationsScreen
      {...({ route: {}, navigation } as object as ComponentProps<
        typeof ChatConversationsScreen
      >)}
    />,
    fakeSocket().factory
  );
  expect(await screen.findByTestId('chat-list-person-c1')).toBeTruthy();
  expect(screen.queryByTestId('chat-list-row-c1')).toBeNull();
  expect(screen.getByTestId('chat-list-row-group')).toBeTruthy();
  fireEvent.press(screen.getByTestId('chat-list-create'));
  expect(mockNavigate).toHaveBeenCalledWith('ChatNewMessage');
});

test('new messages require selecting a matching recipient and search later pages', async () => {
  const conversations = jest
    .fn()
    .mockResolvedValueOnce({
      items: [conversation()],
      hasMore: true,
      next: 'next',
    })
    .mockResolvedValue({
      items: [
        conversation({ id: 'c2', peer: { id: 'peer2', displayName: 'Hải' } }),
      ],
      hasMore: false,
      next: null,
    });
  const send = jest.fn();
  mount(
    fake({ conversations, send }),
    <ChatNewMessageScreen
      {...({ route: {}, navigation } as object as ComponentProps<
        typeof ChatNewMessageScreen
      >)}
    />,
    fakeSocket().factory
  );
  const input = screen.getByTestId('chat-new-recipient-input');
  expect(screen.queryByTestId('chat-composer-input')).toBeNull();
  fireEvent.changeText(input, 'hai');
  expect(await screen.findByTestId('chat-new-person-c2')).toBeTruthy();
  expect(conversations).toHaveBeenCalledWith('DIRECT', 'next');
  expect(screen.queryByTestId('chat-new-person-c1')).toBeNull();
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('chat-new-person-c2'));
  expect(mockNavigate).toHaveBeenCalledWith('ChatConversation', {
    conversationId: 'c2',
    title: 'Hải',
    compose: true,
  });
});

test('runs group one sender; breaks come from sender, time and unread', () => {
  const at = (minute: number) =>
    `2026-11-02T07:${String(minute).padStart(2, '0')}:00.000Z`;
  const me = { sender: { id: 'me', displayName: 'Me' } };
  const rows = layoutMessages(
    [
      message('m1', '1', { ...me, createdAt: at(0) }),
      message('m2', '2', { ...me, createdAt: at(1) }),
      message('m3', '3', { createdAt: at(2) }),
      message('m4', '4', { createdAt: at(3) }),
      message('m5', '5', { createdAt: at(30) }),
      message('m6', '6', { createdAt: at(31) }),
    ],
    'me',
    { lastRead: '3', highWatermark: '4' }
  );
  expect(
    rows.map((r) => [r.startsRun, r.endsRun, r.showTime, r.showUnread])
  ).toEqual([
    [true, false, true, false],
    [false, true, false, false],
    [true, true, false, false],
    [true, true, false, true],
    [true, false, true, false],
    [false, true, false, false],
  ]);
});
test('messages that arrive while the room is open add no unread line', () => {
  const rows = layoutMessages([message('m3', '3')], 'me', {
    lastRead: '2',
    highWatermark: '2',
  });
  expect(rows[0]?.showUnread).toBe(false);
});
test('a group names the sender once, marks unread and shows the reply', async () => {
  const quoted = message('m1', '1', {
    sender: { id: 'me', displayName: 'Me' },
    body: 'ngủ đi',
    createdAt: iso,
  });
  mount(
    fake({
      conversation: jest.fn().mockResolvedValue(
        conversation({
          type: 'GROUP',
          name: 'Lớp A',
          peer: null,
          lastReadSequence: '1',
          highWatermark: '3',
        })
      ),
      history: jest.fn().mockResolvedValue({
        items: [
          quoted,
          message('m2', '2', { body: 'bảo dưỡng' }),
          message('m3', '3', {
            body: 'đáp lại',
            replyTo: { id: 'm1', senderDisplayName: 'Me', deleted: false },
          }),
        ],
        hasMore: false,
        next: null,
        highWatermark: '3',
      }),
    }),
    room(),
    fakeSocket().factory
  );
  expect(await screen.findByTestId('chat-room-unread')).toBeTruthy();
  expect(screen.getAllByText('An')).toHaveLength(1);
  expect(screen.getByText('An đã trả lời bạn')).toBeTruthy();
  expect(screen.getAllByText('ngủ đi')).toHaveLength(2);
});
test('only my newest message says sent', async () => {
  const mine = { sender: { id: 'me', displayName: 'Me' } };
  mount(
    fake({
      history: jest.fn().mockResolvedValue({
        items: [message('m1', '1', mine), message('m2', '2', mine)],
        hasMore: false,
        next: null,
        highWatermark: '2',
      }),
    }),
    room(),
    fakeSocket().factory
  );
  expect(await screen.findAllByText('Đã gửi')).toHaveLength(1);
});
test('list time is a clock today, a weekday this week, then a date', () => {
  const now = Date.parse('2026-11-05T05:00:00.000Z');
  expect(formatConversationTime('2026-11-05T01:11:00.000Z', 'vi', now)).toBe(
    '08:11'
  );
  // 18:00 UTC is already the next day in Vietnam.
  expect(formatConversationTime('2026-11-04T18:00:00.000Z', 'vi', now)).toBe(
    '01:00'
  );
  expect(formatConversationTime('2026-11-03T07:00:00.000Z', 'en', now)).toBe(
    'Tue'
  );
  expect(formatConversationTime('2026-10-20T07:00:00.000Z', 'vi', now)).toBe(
    '20/10'
  );
  expect(formatConversationTime('2025-10-20T07:00:00.000Z', 'vi', now)).toBe(
    '20/10/2025'
  );
});
test('a disabled backend is explained, not shown as an empty inbox', async () => {
  mount(
    fake({
      conversations: jest
        .fn()
        .mockRejectedValue(new ApiError('unavailable', 'CHAT_DISABLED')),
    }),
    <ChatConversationsScreen
      {...({ route: {}, navigation } as object as ComponentProps<
        typeof ChatConversationsScreen
      >)}
    />,
    fakeSocket().factory
  );
  expect(await screen.findByTestId('chat-list-unavailable')).toBeTruthy();
  expect(screen.queryByTestId('chat-list-empty')).toBeNull();
});
test('opening a room loads a snapshot and marks the newest message read', async () => {
  const service = fake();
  const live = fakeSocket();
  mount(service, room('An'), live.factory);
  expect(await screen.findByTestId('chat-message-m2')).toBeTruthy();
  await waitFor(
    () => expect(service.markRead).toHaveBeenCalledWith('c1', '2'),
    { timeout: 2000 }
  );
  expect(service.catchUp).not.toHaveBeenCalled();
});
test('live events merge once; reconnecting catches up from the checkpoint', async () => {
  const service = fake();
  const live = fakeSocket();
  mount(service, room(), live.factory);
  await screen.findByTestId('chat-message-m2');
  await act(async () => {
    live.fire('connect');
  });
  expect(live.socket.emit).toHaveBeenCalledWith(
    'conversation:join',
    { conversationId: 'c1' },
    expect.any(Function)
  );
  const event = {
    eventId: '00000000-0000-4000-8000-000000000000',
    sequence: '3',
    type: 'MESSAGE_CREATED',
  };
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const conversationId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  // A malformed or foreign event changes nothing.
  await act(async () => {
    live.fire('message:created', { nope: true });
    live.fire('message:created', {
      ...event,
      message: {
        ...message('x', '3'),
        id,
        conversationId,
        sender: { id, displayName: 'B' },
      },
    });
  });
  expect(screen.queryByTestId(`chat-message-${id}`)).toBeNull();
  await act(async () => {
    live.fire('disconnect', 'transport close');
  });
  await act(async () => {
    live.fire('connect');
  });
  await waitFor(() => expect(service.catchUp).toHaveBeenCalledWith('c1', '2'));
});
test('an expired checkpoint falls back to a fresh snapshot', async () => {
  const service = fake({
    catchUp: jest
      .fn()
      .mockRejectedValue(new ApiError('gone', 'CHAT_RESYNC_REQUIRED')),
  });
  const live = fakeSocket();
  mount(service, room(), live.factory);
  await screen.findByTestId('chat-message-m2');
  await act(async () => {
    live.fire('connect');
    live.fire('disconnect', 'transport close');
  });
  await act(async () => {
    live.fire('connect');
  });
  await waitFor(() => expect(service.history).toHaveBeenCalledTimes(2));
  expect(screen.getByTestId('chat-message-m2')).toBeTruthy();
  expect(screen.queryByTestId('chat-room-refresh-error')).toBeNull();
});
test('sending shows pending, then resends the same id after a failure', async () => {
  const sent = message('m3', '3', {
    sender: { id: 'me', displayName: 'Me' },
    body: 'Chào em',
  });
  const send = jest
    .fn()
    .mockRejectedValueOnce(new ApiError('uncertain', 'NETWORK'))
    .mockResolvedValueOnce(sent);
  mount(fake({ send }), room(), fakeSocket().factory);
  const input = await screen.findByTestId('chat-composer-input');
  fireEvent.changeText(input, '  Chào em  ');
  await act(async () => {
    fireEvent.press(screen.getByTestId('chat-composer-send'));
  });
  const key = send.mock.calls[0]?.[1] as string;
  expect(send).toHaveBeenCalledWith('c1', key, 'Chào em');
  expect(input.props.value).toBe('');
  expect(await screen.findByTestId(`chat-pending-${key}-error`)).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId(`chat-pending-${key}`));
  });
  expect(send).toHaveBeenLastCalledWith('c1', key, 'Chào em');
  expect(await screen.findByTestId('chat-message-m3')).toBeTruthy();
  expect(screen.queryByTestId(`chat-pending-${key}`)).toBeNull();
});
test('blank text cannot be sent', async () => {
  const send = jest.fn();
  mount(fake({ send }), room(), fakeSocket().factory);
  const input = await screen.findByTestId('chat-composer-input');
  fireEvent.changeText(input, '   ');
  fireEvent.press(screen.getByTestId('chat-composer-send'));
  expect(send).not.toHaveBeenCalled();
});
test('a read-only conversation has no composer', async () => {
  mount(
    fake({
      conversation: jest.fn().mockResolvedValue(
        conversation({
          capabilities: { canRead: true, canSend: false },
          accessMode: 'HISTORY_READ_ONLY',
        })
      ),
    }),
    room(),
    fakeSocket().factory
  );
  expect(await screen.findByTestId('chat-room-read-only')).toBeTruthy();
  expect(screen.queryByTestId('chat-composer-input')).toBeNull();
});
test('tombstones hide the body and file', async () => {
  mount(
    fake({
      history: jest.fn().mockResolvedValue({
        items: [
          message('m1', '1', {
            body: null,
            deletedAt: iso,
            version: 2,
            file: {
              id: 'f',
              originalFilename: 'a.pdf',
              mimeType: 'application/pdf',
              sizeBytes: 1,
              kind: 'PDF',
            },
          }),
        ],
        hasMore: false,
        next: null,
        highWatermark: '1',
      }),
    }),
    room(),
    fakeSocket().factory
  );
  expect(await screen.findByText('Tin nhắn đã bị xóa')).toBeTruthy();
  expect(screen.queryByTestId('chat-message-m1-file')).toBeNull();
});
test('lost access hides messages', async () => {
  mount(
    fake({
      conversation: jest.fn().mockRejectedValue(new ApiError('notFound')),
      history: jest.fn().mockRejectedValue(new ApiError('notFound')),
    }),
    room(),
    fakeSocket().factory
  );
  expect(await screen.findByTestId('chat-room-not-found')).toBeTruthy();
  expect(screen.queryByTestId('chat-composer-input')).toBeNull();
});
test('a notification opens its conversation and marks itself read', async () => {
  const notification = {
    id: 'n1',
    type: 'CHAT_MESSAGE',
    actorId: 'peer',
    conversationId: 'c1',
    messageId: 'm1',
    title: 'An',
    body: 'Bạn có tin nhắn mới.',
    readAt: null,
    createdAt: iso,
  };
  const service = fake({
    notifications: jest
      .fn()
      .mockResolvedValue({ items: [notification], hasMore: false, next: null }),
  });
  mount(
    service,
    <ChatNotificationsScreen
      {...({ route: {}, navigation } as object as ComponentProps<
        typeof ChatNotificationsScreen
      >)}
    />,
    fakeSocket().factory
  );
  expect(
    await screen.findByTestId('chat-notifications-unread-n1')
  ).toBeTruthy();
  expect(screen.queryByText(/push/i)).toBeNull();
  fireEvent.press(screen.getByTestId('chat-notifications-row-n1'));
  expect(service.readNotification).toHaveBeenCalledWith('n1');
  expect(mockNavigate).toHaveBeenCalledWith('ChatConversation', {
    conversationId: 'c1',
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('chat-notifications-read-all'));
  });
  expect(service.readAllNotifications).toHaveBeenCalled();
});
