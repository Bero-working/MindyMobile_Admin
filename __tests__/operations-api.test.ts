import axios from 'axios';
import { createOperationsService } from '@/modules/operations/services/operationsService';
const id = '11111111-1111-4111-8111-111111111111',
  key = '22222222-2222-4222-8222-222222222222';
const clock = '2026-11-02T09:30:00+07:00';
const person = { id, displayName: 'Manager' };
const session = {
  sessionId: id,
  classId: id,
  classUnitId: id,
  title: 'Session',
  startsAt: '2026-11-09T18:30:00+07:00',
  endsAt: '2026-11-09T20:00:00+07:00',
  status: 'SCHEDULED',
  assignmentType: 'PRIMARY',
  primaryMentor: person,
  effectiveMentor: person,
  version: 3,
  makeupForSessionId: null,
  makeupRootSessionId: null,
  actualStartedAt: null,
  actualEndedAt: null,
  asOf: clock,
  timeZone: 'Asia/Ho_Chi_Minh',
};
const line = {
  id,
  classId: id,
  className: 'K08',
  courseTitle: 'IELTS',
  totalAmount: 6500000,
  priceAmount: 6500000,
  quantity: 1,
};
const order = {
  id,
  orderCode: 'MD7K3QX9PA2B4C',
  paymentType: 'CASH',
  status: 'PENDING',
  totalAmount: 6500000,
  expiresAt: '2026-11-10T00:00:00+07:00',
  createdAt: clock,
  paidAt: null,
  student: person,
  payment: null,
  details: [line],
};
function setup(options: Parameters<typeof createOperationsService>[0] = {}) {
  const client = axios.create(),
    request = jest.spyOn(client, 'request');
  const source = createOperationsService({
    baseURL: 'https://mindy.test/api/v1',
    client,
    ...options,
  });
  const reply = (data: object | string, status = 200) =>
    request.mockResolvedValueOnce({
      data,
      status,
      headers: { date: 'Mon, 02 Nov 2026 02:30:00 GMT' },
    });
  return { source, reply, request };
}
test('S4 orders use server filters, exact-code search removes other filters, and Date anchors deadline', async () => {
  const { source, request, reply } = setup();
  reply({ items: [order], total: 1, page: 1, pageSize: 20 });
  const result = await source.read({ kind: 'orders', status: 'PENDING' });
  expect(result.kind).toBe('success');
  if (result.kind === 'success')
    expect(result.data.asOf).toBe('2026-11-02T02:30:00.000Z');
  expect(request.mock.calls[0]?.[0]).toMatchObject({
    url: '/manager/orders',
    params: { paymentType: 'CASH', status: 'PENDING', page: 1, pageSize: 20 },
    withCredentials: true,
  });
  reply({ items: [order], total: 1, page: 1, pageSize: 20 });
  await source.read({
    kind: 'orders',
    orderCode: ' md7k3qx9pa2b4c ',
    status: 'PAID',
    classId: id,
  });
  expect(request.mock.calls[1]?.[0]?.params).toEqual({
    paymentType: 'CASH',
    orderCode: 'MD7K3QX9PA2B4C',
    page: 1,
    pageSize: 20,
  });
});
test('S1 candidate version and server asOf are preserved', async () => {
  const { source, reply } = setup();
  reply({
    items: [{ ...person, isCurrent: true }],
    total: 1,
    page: 1,
    pageSize: 20,
    sessionId: id,
    sessionVersion: 8,
    asOf: clock,
  });
  expect(await source.read({ kind: 'candidates', id })).toMatchObject({
    kind: 'success',
    data: {
      sessionVersion: 8,
      candidates: [{ name: 'Manager', isCurrent: true }],
    },
  });
});
test('S1/S2 mutations strip internal fields, preserve reason/version/key, and never send title on schedule', async () => {
  const { source, request, reply } = setup();
  reply(session);
  await source.write({
    kind: 'assign',
    id,
    key,
    expectedVersion: 3,
    reason: ' test ',
    mentorId: null,
  });
  expect(request.mock.calls[0]?.[0]).toMatchObject({
    method: 'PATCH',
    url: `/management/class-sessions/${id}/mentor`,
    data: { expectedVersion: 3, reason: 'test', mentorId: null },
    headers: { 'Idempotency-Key': key },
  });
  reply(session);
  await source.write({
    kind: 'reschedule',
    id,
    key,
    expectedVersion: 3,
    reason: 'move',
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    title: 'must strip',
  });
  expect(request.mock.calls[1]?.[0]?.data).toEqual({
    expectedVersion: 3,
    reason: 'move',
    startsAt: session.startsAt,
    endsAt: session.endsAt,
  });
});
test('S3 replacement returns new resource with a fresh source version', async () => {
  const { source, reply, request } = setup();
  reply(
    {
      originalSessionId: id,
      originalVersion: 4,
      classEndDate: '2026-12-01',
      session: { ...session, sessionId: key, makeupForSessionId: id },
    },
    201
  );
  expect(
    await source.write({
      kind: 'replace',
      id,
      key,
      expectedVersion: 4,
      reason: 'makeup',
      classUnitId: id,
      title: 'new',
      startsAt: session.startsAt,
      endsAt: session.endsAt,
    })
  ).toMatchObject({
    kind: 'success',
    data: { session: { id: key, makeupForSessionId: id } },
  });
  expect(request.mock.calls[0]?.[0]?.data).not.toHaveProperty('mentorId');
});
test('S5 CASH sends only amount without key/version, and does not claim collector identity', async () => {
  const { source, reply, request } = setup();
  reply({ ...order, status: 'PAID', paidAt: clock });
  expect(
    await source.write({ kind: 'collect', id, receivedAmount: 6500000 })
  ).toMatchObject({
    kind: 'success',
    data: { order: { status: 'PAID', confirmedBy: null } },
  });
  expect(request.mock.calls[0]?.[0]).toMatchObject({
    url: `/manager/cash-orders/${id}/confirm`,
    data: { receivedAmount: 6500000 },
  });
  expect(request.mock.calls[0]?.[0]?.headers).toBeUndefined();
});
test('malformed success after mutation and HTML 503 are uncertain; conflict remains distinct', async () => {
  const { source, reply } = setup();
  reply('<html>bad</html>', 503);
  expect(
    await source.write({ kind: 'collect', id, receivedAmount: 1 })
  ).toMatchObject({ kind: 'uncertain' });
  reply({ broken: true });
  expect(
    await source.write({
      kind: 'cancel',
      id,
      key,
      expectedVersion: 3,
      reason: 'cancel',
    })
  ).toMatchObject({ kind: 'uncertain', code: 'INVALID_RESPONSE' });
  reply({ code: 'SESSION_STATE_CONFLICT', requestId: 'req' }, 409);
  expect(
    await source.write({
      kind: 'cancel',
      id,
      key,
      expectedVersion: 3,
      reason: 'cancel',
    })
  ).toEqual({
    kind: 'error',
    code: 'SESSION_STATE_CONFLICT',
    requestId: 'req',
  });
});
test('invalid IDs/unsafe money fail before networking; 403 never falls back to fixtures', async () => {
  const { source, request, reply } = setup();
  expect(
    await source.write({
      kind: 'collect',
      id,
      receivedAmount: Number.MAX_SAFE_INTEGER + 1,
    })
  ).toMatchObject({ kind: 'error', code: 'INVALID_INPUT' });
  expect(await source.read({ kind: 'order', id: 'invalid' })).toMatchObject({
    kind: 'error',
  });
  expect(request).not.toHaveBeenCalled();
  reply({ code: 'ORDER_ACCESS_DENIED' }, 403);
  expect(await source.read({ kind: 'order', id })).toMatchObject({
    kind: 'denied',
  });
});
test('401 single flight renewal retries same request only for active Manager', async () => {
  const restore = jest.fn(async () => ({
    kind: 'user' as const,
    user: {
      id,
      email: 'manager@example.test',
      displayName: 'Manager',
      role: 'MANAGER',
    },
  }));
  const { source, reply, request } = setup({ restore });
  reply({}, 401);
  reply(order);
  expect(await source.read({ kind: 'order', id })).toMatchObject({
    kind: 'success',
  });
  expect(restore).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0]?.[0]).toEqual(request.mock.calls[1]?.[0]);
});
