import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { createLeaveService } from '@/modules/leave/services/leaveService';
import type { LeaveIntent } from '@/modules/leave/types';
const id = '11111111-1111-4111-8111-111111111111',
  other = '22222222-2222-4222-8222-222222222222';
const clock = '2026-11-02T09:00:00+07:00';
const session = {
  sessionId: id,
  classId: id,
  classUnitId: id,
  title: 'Lesson',
  startsAt: '2026-11-09T18:00:00+07:00',
  endsAt: '2026-11-09T20:00:00+07:00',
  status: 'SCHEDULED',
  assignmentType: 'SUBSTITUTE',
  primaryMentor: { id, displayName: 'Primary' },
  effectiveMentor: { id: other, displayName: 'Substitute' },
  version: 3,
  makeupForSessionId: null,
  makeupRootSessionId: null,
  actualStartedAt: null,
  actualEndedAt: null,
  asOf: clock,
};
const leave = {
  id,
  mentorId: other,
  fromDate: '2026-11-09',
  toDate: '2026-11-09',
  period: 'FULL_DAY',
  reason: 'Family',
  status: 'PENDING',
  version: 1,
  submittedAt: clock,
  expiresAt: session.startsAt,
  itemCount: 21,
  page: 1,
  pageSize: 20,
  items: [
    {
      classId: id,
      sourceSessionId: id,
      sourceVersion: 3,
      sourceStartsAt: session.startsAt,
      sourceEndsAt: session.endsAt,
      startsAt: '2026-11-12T18:00:00+07:00',
      endsAt: '2026-11-12T20:00:00+07:00',
      replacementSessionId: null,
    },
  ],
  classExtensions: [{ classId: id, endDate: '2026-11-30' }],
  review: null,
  studentConflictCount: null,
  asOf: clock,
  timeZone: 'Asia/Ho_Chi_Minh',
};
const conflict = {
  id,
  version: 7,
  status: 'OPEN',
  makeupPlacementId: other,
  makeupPlacementVersion: 4,
  student: { id, displayName: null },
  sourceSession: session,
  conflictingIntervals: [],
};
const placement = {
  id: other,
  conflictId: id,
  targetSession: session,
  status: 'ASSIGNED',
  version: 1,
};
const page = (items: object[], total = items.length) => ({
  items,
  total,
  page: 1,
  pageSize: 20,
});
function setup(options: Parameters<typeof createLeaveService>[0] = {}) {
  const client = axios.create(),
    request = jest.spyOn(client, 'request');
  const source = createLeaveService({
    baseURL: 'https://mindy.test/api/v1',
    client,
    ...options,
  });
  const reply = (data: object | string, status = 200) =>
    request.mockResolvedValueOnce({ data, status, headers: {} });
  return { source, request, reply };
}
const intent = (kind: LeaveIntent['kind']): LeaveIntent => ({
  kind,
  role: ['create', 'withdraw'].includes(kind) ? 'MENTOR' : 'MANAGER',
  ...(kind !== 'create' ? { id } : {}),
  key: other,
  body:
    kind === 'create'
      ? {
          reason: 'Family',
          fromDate: '2026-11-09',
          toDate: '2026-11-09',
          period: 'FULL_DAY',
          sourceVersions: [{ sessionId: id, version: 3 }],
          sessionMappings: [
            {
              sourceSessionId: id,
              targetDate: '2026-11-12',
              targetPeriod: 'EVENING',
              startsAt: '2026-11-12T18:00:00+07:00',
              endsAt: '2026-11-12T20:00:00+07:00',
            },
          ],
        }
      : {
          reason: 'Reviewed',
          expectedVersion: 1,
          ...(kind === 'approve'
            ? { acknowledgeStudentConflicts: false as const }
            : {}),
          ...(kind === 'place'
            ? {
                targetSessionId: id,
                expectedTargetVersion: 3,
                contentMatchConfirmed: true as const,
              }
            : {}),
        },
});
test('S1/S4 list filters, paging and null conflict counts survive mapping', async () => {
  const { source, request, reply } = setup();
  reply(page([leave], 42));
  const result = await source.read({
    kind: 'list',
    role: 'MANAGER',
    status: 'PENDING',
    mentorId: other,
    page: 2,
  });
  expect(request.mock.calls[0]?.[0]).toMatchObject({
    url: '/management/mentor-leave-requests',
    params: { page: 2, pageSize: 20, mentorId: other, status: 'PENDING' },
    withCredentials: true,
  });
  expect(result).toMatchObject({
    kind: 'success',
    data: { total: 42, requests: [{ studentConflictCount: null }] },
  });
  reply(page([leave]));
  await source.read({ kind: 'list', role: 'MENTOR' });
  expect(request.mock.calls[1]?.[0]?.url).toBe('/mentor/leave-requests');
});
test('S3/S5 detail maps item IDs, server stale state and stable conflict identity', async () => {
  const { source, reply } = setup();
  reply({
    ...leave,
    sourcesCurrent: false,
    studentConflictCount: 2,
    studentConflicts: [
      { sourceSessionId: id, studentId: other, conflictingSessionId: id },
      { sourceSessionId: id, studentId: id, conflictingSessionId: other },
    ],
  });
  const result = await source.read({ kind: 'detail', role: 'MANAGER', id });
  expect(result).toMatchObject({
    kind: 'success',
    data: {
      total: 21,
      request: {
        sourcesCurrent: false,
        studentConflictCount: 2,
        items: [{ id }],
        studentConflicts: [
          { id: `${id}:${other}:${id}` },
          { id: `${id}:${id}:${other}` },
        ],
      },
    },
  });
  reply(leave);
  expect(await source.read({ kind: 'detail', role: 'MANAGER', id })).toEqual({
    kind: 'error',
    code: 'INVALID_RESPONSE',
  });
  reply(leave);
  expect(
    await source.read({ kind: 'detail', role: 'MENTOR', id: other })
  ).toMatchObject({ kind: 'error', code: 'RESOURCE_MISMATCH' });
});
test('S2 preview and slots use read-only POST with DTO-only bodies and server versions', async () => {
  const { source, reply, request } = setup();
  reply({
    affectedSessions: [session],
    sourceVersions: [{ sessionId: id, version: 3 }],
    noticeEligible: false,
    noticeDeadline: clock,
    asOf: clock,
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  expect(
    await source.read({
      kind: 'preview',
      role: 'MENTOR',
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      period: 'FULL_DAY',
    })
  ).toMatchObject({
    kind: 'success',
    data: {
      preview: {
        noticeEligible: false,
        sources: [{ id, assignment: 'SUBSTITUTE', version: 3 }],
      },
    },
  });
  expect(request.mock.calls[0]?.[0]).toMatchObject({
    method: 'POST',
    data: {
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      period: 'FULL_DAY',
    },
  });
  expect(request.mock.calls[0]?.[0]?.headers).toBeUndefined();
  reply({
    slots: [session],
    sessionVersion: 4,
    asOf: clock,
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  expect(
    await source.read({
      kind: 'slots',
      role: 'MENTOR',
      id,
      targetDate: '2026-11-12',
      targetPeriod: 'EVENING',
    })
  ).toMatchObject({ kind: 'success', data: { sessionVersion: 4, total: 1 } });
  expect(request.mock.calls[1]?.[0]?.data).toEqual({
    sourceSessionId: id,
    targetDate: '2026-11-12',
    targetPeriod: 'EVENING',
  });
});
test('S6/S7 preserve separate conflict/placement/target versions and effective mentor', async () => {
  const { source, reply, request } = setup();
  reply(page([conflict]));
  expect(
    await source.read({
      kind: 'conflicts',
      role: 'MANAGER',
      classId: id,
      status: 'OPEN',
    })
  ).toMatchObject({
    kind: 'success',
    data: {
      conflicts: [
        {
          version: 7,
          placementVersion: 4,
          placementId: other,
          studentName: null,
        },
      ],
    },
  });
  reply(page([{ session, remainingCapacity: 2 }]));
  expect(
    await source.read({ kind: 'candidates', role: 'MANAGER', id, page: 2 })
  ).toMatchObject({
    kind: 'success',
    data: {
      candidates: [
        {
          mentorName: 'Substitute',
          remainingCapacity: 2,
          session: { version: 3 },
        },
      ],
    },
  });
  expect(request.mock.calls[1]?.[0]).toMatchObject({
    url: `/management/student-schedule-conflicts/${id}/makeup-candidates`,
    params: { page: 2, pageSize: 20 },
  });
});
test.each([
  'create',
  'withdraw',
  'reject',
  'approve',
  'place',
  'cancel',
] as const)(
  'mutation %s uses exact contract and validates result',
  async (kind) => {
    const { source, reply, request } = setup();
    const input = intent(kind);
    if (kind === 'place')
      reply({ placement, conflictVersion: 8, targetSessionVersion: 4 });
    else if (kind === 'cancel')
      reply({ ...placement, id, status: 'CANCELLED' });
    else if (kind === 'approve')
      reply({
        request: { ...leave, status: 'APPROVED' },
        replacements: [session],
        classExtensions: leave.classExtensions,
        studentConflictCount: 0,
      });
    else
      reply({
        ...leave,
        status:
          kind === 'withdraw'
            ? 'WITHDRAWN'
            : kind === 'reject'
              ? 'REJECTED'
              : 'PENDING',
      });
    expect((await source.write(input)).kind).toBe('success');
    expect(request.mock.calls[0]?.[0]).toMatchObject({
      method: 'POST',
      data: input.body,
      headers: { 'Idempotency-Key': other },
      withCredentials: true,
    });
    expect(request.mock.calls[0]?.[0]?.data).not.toHaveProperty('key');
  }
);
test('all selectors use role endpoints and mentor detail avoids scanning people', async () => {
  const { source, reply, request } = setup();
  reply(page([{ id, name: 'Class' }]));
  await source.read({ kind: 'classes', role: 'MENTOR' });
  reply(page([{ id, name: 'Class' }]));
  await source.read({ kind: 'classes', role: 'MANAGER' });
  reply({ id, displayName: 'Mentor' });
  await source.read({ kind: 'mentors', role: 'MANAGER', id });
  expect(request.mock.calls.map((c) => c[0]?.url)).toEqual([
    '/mentor/classes',
    '/manager/classes',
    `/manager/mentors/${id}`,
  ]);
});
test('lost mutation response is uncertain, exact key/body replay succeeds, preview network error is safe', async () => {
  const { source, reply, request } = setup();
  const input = intent('create');
  request.mockRejectedValueOnce(new Error('timeout'));
  expect((await source.write(input)).kind).toBe('uncertain');
  reply(leave);
  expect((await source.write(input)).kind).toBe('success');
  expect(request.mock.calls[0]?.[0]?.data).toEqual(
    request.mock.calls[1]?.[0]?.data
  );
  expect(request.mock.calls[0]?.[0]?.headers).toEqual(
    request.mock.calls[1]?.[0]?.headers
  );
  request.mockRejectedValueOnce(new Error('timeout'));
  expect(
    (
      await source.read({
        kind: 'slots',
        role: 'MENTOR',
        id,
        targetDate: '2026-11-12',
        targetPeriod: 'EVENING',
      })
    ).kind
  ).toBe('error');
});
test('server errors, malformed successful mutations and version conflicts never become false success', async () => {
  const { source, reply } = setup();
  reply('<html>Unavailable</html>', 503);
  expect((await source.write(intent('approve'))).kind).toBe('uncertain');
  reply({ code: 'LEAVE_VERSION_CONFLICT', requestId: 'trace' }, 409);
  expect(await source.write(intent('approve'))).toEqual({
    kind: 'error',
    code: 'LEAVE_VERSION_CONFLICT',
    requestId: 'trace',
  });
  reply({ invalid: true });
  expect((await source.write(intent('create'))).kind).toBe('uncertain');
  reply(leave, 404);
  expect((await source.read({ kind: 'detail', role: 'MENTOR', id })).kind).toBe(
    'notFound'
  );
});
test('reject invalid bodies, acknowledge override, wrong roles and stale identity before HTTP', async () => {
  const { source, request } = setup({ getRole: () => 'MENTOR' });
  expect((await source.read({ kind: 'conflicts', role: 'MANAGER' })).kind).toBe(
    'denied'
  );
  expect(
    (await source.write({ ...intent('place'), role: 'MENTOR' })).kind
  ).toBe('denied');
  expect(
    (
      await source.write({
        ...intent('approve'),
        body: { reason: 'x', expectedVersion: 1 },
      })
    ).kind
  ).toBe('error');
  expect(
    (await source.write({ ...intent('create'), key: 'invalid' })).kind
  ).toBe('error');
  expect(request).not.toHaveBeenCalled();
});
test('offline does not dispatch mutation', async () => {
  jest
    .mocked(NetInfo.fetch)
    .mockResolvedValueOnce({ isConnected: false } as Awaited<
      ReturnType<typeof NetInfo.fetch>
    >);
  const { source, request } = setup();
  expect((await source.write(intent('create'))).kind).toBe('offline');
  expect(request).not.toHaveBeenCalled();
});
test('401 refresh retries unchanged intent; stale identity discards response', async () => {
  const restore = jest.fn(async () => ({
    kind: 'user' as const,
    user: {
      email: 'mentor@test.invalid',
      displayName: 'Mentor',
      role: 'MENTOR',
    },
  }));
  const { source, reply, request } = setup({ restore });
  reply({}, 401);
  reply(leave);
  expect((await source.write(intent('create'))).kind).toBe('success');
  expect(restore).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0]?.[0]?.data).toEqual(
    request.mock.calls[1]?.[0]?.data
  );
  expect(request.mock.calls[0]?.[0]?.headers).toEqual(
    request.mock.calls[1]?.[0]?.headers
  );
  let active = true;
  const second = setup({ isActive: () => active });
  second.request.mockImplementationOnce(async () => {
    active = false;
    return { data: page([leave]), status: 200, headers: {} };
  });
  expect(
    (await second.source.read({ kind: 'list', role: 'MENTOR' })).kind
  ).toBe('denied');
});

test('concurrent unauthorized reads share one refresh; an expired session is not retried', async () => {
  const restore = jest.fn(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    return {
      kind: 'user' as const,
      user: {
        email: 'mentor@test.invalid',
        displayName: 'Mentor',
        role: 'MENTOR',
      },
    };
  });
  const { source, reply, request } = setup({ restore });
  reply({}, 401);
  reply({}, 401);
  reply(page([leave]));
  reply(page([leave]));
  const results = await Promise.all([
    source.read({ kind: 'list', role: 'MENTOR' }),
    source.read({ kind: 'list', role: 'MENTOR' }),
  ]);
  expect(results.map((r) => r.kind)).toEqual(['success', 'success']);
  expect(restore).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledTimes(4);
  const onExpired = jest.fn();
  const expired = setup({
    restore: async () => ({ kind: 'signedOut' }),
    onExpired,
  });
  expired.reply({}, 401);
  expect((await expired.source.write(intent('create'))).kind).toBe('denied');
  expect(onExpired).toHaveBeenCalledTimes(1);
  expect(expired.request).toHaveBeenCalledTimes(1);
});
