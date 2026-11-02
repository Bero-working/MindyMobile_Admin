import axios, { type AxiosInstance } from 'axios';
import {
  compareSequence,
  messageProblem,
  upsertMessages,
} from '@/modules/chat/model';
import { socketUrl } from '@/modules/chat/ChatProvider';
import type { ChatMessage } from '@/modules/chat/schema';
import { createChatService } from '@/modules/chat/service';

const conversationId = '11111111-1111-4111-8111-111111111111';
const messageId = '22222222-2222-4222-8222-222222222222';
const userId = '33333333-3333-4333-8333-333333333333';
const clientMessageId = '44444444-4444-4444-8444-444444444444';
const wireMessage = {
  id: messageId,
  conversationId,
  sender: { id: userId, displayName: 'Mentor', avatarUrl: null },
  clientMessageId,
  sequence: '12',
  lastChangedSequence: '12',
  type: 'TEXT',
  body: 'Xin chào',
  file: null,
  replyTo: null,
  version: 1,
  createdAt: '2026-11-02T07:32:00.000Z',
  editedAt: null,
  deletedAt: null,
};
function setup() {
  const client: AxiosInstance = axios.create();
  const request = jest.spyOn(client, 'request');
  const api = createChatService({
    baseURL: 'https://example.test/api',
    origin: 'https://mobile.test',
    client,
  });
  const reply = (data: object, status = 200) =>
    request.mockResolvedValueOnce({ status, data, headers: {} });
  return { api, request, reply };
}
const message = (patch: Partial<ChatMessage>) =>
  ({ ...wireMessage, ...patch }) as ChatMessage;
describe('model', () => {
  test('sequences compare numerically beyond 2^53', () => {
    expect(compareSequence('9', '10')).toBeLessThan(0);
    expect(
      compareSequence('9007199254740993', '9007199254740992')
    ).toBeGreaterThan(0);
  });
  test('merge orders by sequence and never restores an older version', () => {
    const deleted = message({
      id: 'a',
      sequence: '5',
      version: 2,
      body: null,
      deletedAt: wireMessage.createdAt,
    });
    const merged = upsertMessages(
      [deleted],
      [
        message({ id: 'a', sequence: '5', version: 1, body: 'old' }),
        message({ id: 'b', sequence: '3' }),
      ]
    );
    expect(merged.map((m) => m.id)).toEqual(['b', 'a']);
    expect(merged[1]?.body).toBeNull();
  });
  test('blank and oversized text cannot be sent; code points are counted', () => {
    expect(messageProblem('   ')).toBe('empty');
    expect(messageProblem('a'.repeat(4001))).toBe('tooLong');
    expect(messageProblem('😀'.repeat(4000))).toBeUndefined();
  });
  test('the socket uses the host, without the REST prefix', () => {
    expect(socketUrl('https://api.test:8443/api/v1/')).toBe(
      'https://api.test:8443/chat'
    );
    expect(socketUrl(undefined)).toBeUndefined();
  });
});
describe('service', () => {
  test('a resend keeps the client message id and sends the Origin', async () => {
    const { api, request, reply } = setup();
    reply({ message: wireMessage, replayed: true });
    await api.send(conversationId, clientMessageId, 'Xin chào');
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: `/chat/conversations/${conversationId}/messages`,
        data: { clientMessageId, type: 'TEXT', body: 'Xin chào' },
        headers: { Origin: 'https://mobile.test' },
      })
    );
  });
  test('a lost response is uncertain so it can be resent safely', async () => {
    const { api, request } = setup();
    request.mockRejectedValueOnce(new Error('socket hang up'));
    await expect(
      api.send(conversationId, clientMessageId, 'x')
    ).rejects.toMatchObject({ kind: 'uncertain' });
  });
  test('rate limiting keeps retryAfterMs', async () => {
    const { api, reply } = setup();
    reply({ code: 'CHAT_RATE_LIMITED', retryAfterMs: 1500 }, 429);
    await expect(
      api.send(conversationId, clientMessageId, 'x')
    ).rejects.toMatchObject({ kind: 'rateLimited', retryAfterMs: 1500 });
  });
  test('a disabled backend is reported as unavailable', async () => {
    const { api, reply } = setup();
    reply({ code: 'CHAT_DISABLED' }, 503);
    await expect(api.conversations('')).rejects.toMatchObject({
      kind: 'unavailable',
    });
  });
  test('catch-up follows cursors and only then returns the watermark', async () => {
    const { api, request, reply } = setup();
    const event = {
      eventId: messageId,
      sequence: '12',
      type: 'MESSAGE_CREATED',
      message: wireMessage,
      occurredAt: wireMessage.createdAt,
    };
    reply({
      data: [event],
      meta: { nextCursor: 'next', hasMore: true, throughSequence: '20' },
    });
    reply({
      data: [{ ...event, message: null }],
      meta: { nextCursor: null, hasMore: false, throughSequence: '20' },
    });
    const result = await api.catchUp(conversationId, '10');
    expect(result.through).toBe('20');
    expect(result.messages).toHaveLength(1);
    expect(request.mock.calls[0]?.[0]).toMatchObject({
      params: { limit: 100, afterSequence: '10' },
    });
    // A cursor replaces after/through; the server rejects a mix.
    expect(request.mock.calls[1]?.[0]).toMatchObject({
      params: { limit: 100, cursor: 'next' },
    });
    expect(
      (request.mock.calls[1]?.[0] as { params: object }).params
    ).not.toHaveProperty('afterSequence');
  });
  test('expired events surface as gone so the room can resnapshot', async () => {
    const { api, reply } = setup();
    reply({ code: 'CHAT_RESYNC_REQUIRED' }, 410);
    await expect(api.catchUp(conversationId, '1')).rejects.toMatchObject({
      kind: 'gone',
    });
  });
  test('history from another conversation is rejected', async () => {
    const { api, reply } = setup();
    reply({
      data: [{ ...wireMessage, conversationId: userId }],
      meta: { nextCursor: null, hasMore: false, highWatermark: '12' },
    });
    await expect(api.history(conversationId)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });
  test('notification reads use their documented verbs', async () => {
    const { api, request, reply } = setup();
    reply({});
    await api.readNotification(messageId);
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        url: `/notifications/${messageId}/read`,
      })
    );
    reply({ unreadCount: 3 });
    expect(await api.unreadCount()).toBe(3);
  });
});
