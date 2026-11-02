import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { createAttendanceService } from '@/modules/attendance/services/attendanceService';
import type { Intent } from '@/modules/attendance/types';
const id = '11111111-1111-4111-8111-111111111111';
const guest = '22222222-2222-4222-8222-222222222222';
const person = { id, displayName: null };
const session = {
  sessionId: id,
  classId: id,
  classUnitId: id,
  title: 'Session',
  startsAt: '2026-11-02T09:00:00+07:00',
  endsAt: '2026-11-02T10:00:00+07:00',
  status: 'IN_PROGRESS',
  assignmentType: 'PRIMARY',
  primaryMentor: person,
  effectiveMentor: person,
  version: 3,
  makeupForSessionId: null,
  makeupRootSessionId: null,
  actualStartedAt: '2026-11-02T09:00:00+07:00',
  actualEndedAt: null,
  editableUntil: '2026-11-04T00:00:00+07:00',
  asOf: '2026-11-02T09:30:00+07:00',
  timeZone: 'Asia/Ho_Chi_Minh',
  permissions: {
    canStart: false,
    canEditAttendance: true,
    canFinalize: true,
    canSyncRoster: true,
    canRecover: false,
    canViewAttendanceAudits: false,
  },
};
const totals = { eligible: 2, present: 1, absent: 0, unmarked: 1 };
const item = {
  attendanceId: id,
  enrollmentId: id,
  entryType: 'REGULAR',
  makeupPlacementId: null,
  student: person,
  status: 'PRESENT',
  checkedInAt: null,
  admittedAt: session.asOf,
};
const page = (items: object[], total = items.length) => ({
  items,
  total,
  page: 1,
  pageSize: 20,
});
const roster = { ...page([item]), session, totals, pendingPaymentCount: 4 };
const written = {
  session,
  totals,
  changedEnrollmentIds: [id],
  changedMakeupPlacementIds: [guest],
};
const intent: Intent = {
  key: guest,
  sessionId: id,
  role: 'MENTOR',
  kind: 'save',
  expectedVersion: 3,
  records: [{ enrollmentId: id, status: 'PRESENT' }],
};
function setup(
  options: Partial<Parameters<typeof createAttendanceService>[0]> = {}
) {
  const client = axios.create();
  const request = jest.spyOn(client, 'request');
  const onExpired = jest.fn();
  const service = createAttendanceService({
    baseURL: 'https://test.mindy.vn/api/v1/',
    client,
    onExpired,
    userId: id,
    noteOrigin: 'https://mobile.mindy.vn',
    ...options,
  });
  const reply = (data: object | string, status = 200) =>
    request.mockResolvedValueOnce({ status, data });
  return { service, request, reply, onExpired };
}
beforeEach(() => jest.clearAllMocks());
test('roster maps server totals, permissions, deadline and guest identity', async () => {
  const { service, request, reply } = setup();
  reply({
    ...roster,
    total: 2,
    items: [
      item,
      {
        ...item,
        attendanceId: guest,
        entryType: 'MAKEUP',
        makeupPlacementId: guest,
        status: 'UNMARKED',
      },
    ],
  });
  const r = await service.read({
    kind: 'attendance',
    role: 'MENTOR',
    sessionId: id,
    pageSize: 20,
  });
  expect(r.kind).toBe('success');
  if (r.kind !== 'success') return;
  expect(r.data.rows[1]).toMatchObject({
    id: guest,
    makeupPlacementId: guest,
    status: 'UNMARKED',
  });
  expect(r.data.totals).toEqual({ ...totals, pendingPaymentCount: 4 });
  expect(r.data.session).toMatchObject({
    version: 3,
    editableUntil: session.editableUntil,
    isEffectiveMentor: true,
  });
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({
      url: `/class-sessions/${id}/attendance`,
      withCredentials: true,
      params: { page: 1, pageSize: 20 },
    })
  );
});
test('context reads attendance permissions without inventing capabilities', async () => {
  const { service, request, reply } = setup();
  reply(roster);
  expect(
    (await service.read({ kind: 'context', role: 'MENTOR', sessionId: id }))
      .kind
  ).toBe('success');
  expect(request).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({ params: { page: 1, pageSize: 1 } })
  );
});
test('wrong session response and malformed totals fail closed', async () => {
  const { service, reply } = setup();
  reply({ ...roster, session: { ...session, sessionId: guest } });
  expect(
    (await service.read({ kind: 'attendance', role: 'MENTOR', sessionId: id }))
      .kind
  ).toBe('error');
  reply({ ...roster, totals: { ...totals, eligible: -1 } });
  expect(
    (await service.read({ kind: 'attendance', role: 'MENTOR', sessionId: id }))
      .kind
  ).toBe('error');
});
test('guest-only writes include empty regular array and preserve retry body/key/version', async () => {
  const { service, request, reply } = setup();
  const value = {
    ...intent,
    records: [],
    guestRecords: [{ makeupPlacementId: guest, status: 'ABSENT' as const }],
  };
  request.mockRejectedValueOnce(new Error('lost response'));
  expect((await service.write(value)).kind).toBe('uncertain');
  reply(written);
  const r = await service.write(value);
  expect(r.kind).toBe('success');
  expect(JSON.stringify(request.mock.calls[0]?.[0])).toBe(
    JSON.stringify(request.mock.calls[1]?.[0])
  );
  expect(request).toHaveBeenLastCalledWith(
    expect.objectContaining({
      method: 'PUT',
      data: {
        expectedVersion: 3,
        records: [],
        guestRecords: value.guestRecords,
      },
      headers: { 'Idempotency-Key': guest },
    })
  );
});
test.each(['start', 'sync', 'bulk', 'finalize'] as const)(
  '%s uses correct verb/path and only its DTO fields',
  async (kind) => {
    const { service, request, reply } = setup();
    reply(written);
    const value = {
      ...intent,
      kind,
      role: 'MANAGER' as const,
      reason: 'Verified',
      checked: false,
      actualEndedAt: session.asOf,
    };
    expect((await service.write(value)).kind).toBe('success');
    const path = {
      start: 'start',
      sync: 'attendance/sync-roster',
      bulk: 'attendance/bulk',
      finalize: 'finalize',
    }[kind];
    const body = {
      expectedVersion: 3,
      reason: 'Verified',
      ...(kind === 'bulk' ? { checked: false } : {}),
      ...(kind === 'finalize' ? { actualEndedAt: session.asOf } : {}),
    };
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `/class-sessions/${id}/${path}`,
        method: kind === 'bulk' ? 'PUT' : 'POST',
        data: body,
      })
    );
  }
);
test('note uses independent version zero and configured Origin, validates session', async () => {
  const { service, request, reply } = setup();
  reply({ sessionId: id, version: 0, note: null });
  const r = await service.read({ kind: 'note', role: 'MENTOR', sessionId: id });
  expect(r.kind).toBe('success');
  reply({
    sessionId: id,
    version: 1,
    note: { content: 'A', nextSteps: 'B', version: 1, updatedAt: session.asOf },
  });
  expect(
    (
      await service.write({
        ...intent,
        kind: 'note',
        expectedVersion: 0,
        content: 'A',
        nextSteps: 'B',
      })
    ).kind
  ).toBe('success');
  expect(request).toHaveBeenLastCalledWith(
    expect.objectContaining({
      headers: { 'Idempotency-Key': guest, Origin: 'https://mobile.mindy.vn' },
      data: { expectedVersion: 0, content: 'A', nextSteps: 'B' },
    })
  );
});
test('note without allowed Origin fails before write', async () => {
  const { service, request } = setup({ noteOrigin: '' });
  expect(
    await service.write({ ...intent, kind: 'note', content: '', nextSteps: '' })
  ).toMatchObject({ kind: 'error', code: 'ORIGIN_NOT_CONFIGURED' });
  expect(request).not.toHaveBeenCalled();
});
test.each([
  'SESSION_VERSION_CONFLICT',
  'SESSION_STATE_CONFLICT',
  'ATTENDANCE_EDIT_WINDOW_EXPIRED',
  'ATTENDANCE_RECOVERY_RECORD_EXISTS',
  'TEACHING_VERSION_CONFLICT',
])('preserves %s with requestId', async (code) => {
  const { service, reply } = setup();
  reply({ code, requestId: 'support' }, 409);
  expect(await service.write(intent)).toEqual({
    kind: 'error',
    code,
    requestId: 'support',
  });
});
test('recovery uses insert-only DTO and rejects oversized body before sending', async () => {
  const { service, request, reply } = setup();
  reply(written);
  const value = {
    ...intent,
    kind: 'recover' as const,
    role: 'MANAGER' as const,
    reason: 'Verified',
    evidenceNote: 'Historical record',
    actualStartedAt: session.actualStartedAt,
    actualEndedAt: session.asOf,
    recoveryRecords: [
      {
        enrollmentId: id,
        status: 'PRESENT' as const,
        admissionBasis: 'PAID_BEFORE_START' as const,
      },
    ],
  };
  expect((await service.write(value)).kind).toBe('success');
  expect(request).toHaveBeenLastCalledWith(
    expect.objectContaining({
      url: `/management/class-sessions/${id}/attendance/recover`,
      data: expect.objectContaining({ records: value.recoveryRecords }),
    })
  );
  request.mockClear();
  expect(
    (await service.write({ ...value, evidenceNote: 'a'.repeat(270000) })).kind
  ).toBe('error');
  expect(request).not.toHaveBeenCalled();
});
test('unfiltered incomplete has no implicit date window and carries server issue', async () => {
  const { service, request, reply } = setup();
  reply({
    ...page([
      { session, issue: 'STARTED_NOT_FINALIZED', deadlineExpired: false },
    ]),
    asOf: session.asOf,
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  const r = await service.read({
    kind: 'incomplete',
    role: 'MANAGER',
    pageSize: 1,
  });
  expect(r.kind).toBe('success');
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({
      url: '/management/class-sessions/incomplete',
      params: { page: 1, pageSize: 1 },
    })
  );
});
test('audit filter uses guest ID and maps actual actor/evidence', async () => {
  const { service, request, reply } = setup();
  reply(
    page([
      {
        id,
        attendanceId: id,
        enrollmentId: id,
        entryType: 'MAKEUP',
        makeupPlacementId: guest,
        actor: person,
        oldStatus: null,
        newStatus: 'ABSENT',
        action: 'ADMIT',
        occurredAt: session.asOf,
        reason: null,
        recoveryEvidence: null,
        version: 1,
        recoveryAuditId: null,
      },
    ])
  );
  const r = await service.read({
    kind: 'audits',
    role: 'MANAGER',
    sessionId: id,
    makeupPlacementId: guest,
  });
  expect(r.kind).toBe('success');
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({
      params: { page: 1, pageSize: 20, makeupPlacementId: guest },
    })
  );
});
test('offline read and mutation send no HTTP or reconnect replay', async () => {
  const { service, request } = setup();
  jest
    .mocked(NetInfo.fetch)
    .mockResolvedValueOnce({ isConnected: false } as Awaited<
      ReturnType<typeof NetInfo.fetch>
    >);
  expect(
    (await service.read({ kind: 'attendance', role: 'MENTOR', sessionId: id }))
      .kind
  ).toBe('offline');
  jest
    .mocked(NetInfo.fetch)
    .mockResolvedValueOnce({ isConnected: false } as Awaited<
      ReturnType<typeof NetInfo.fetch>
    >);
  expect((await service.write(intent)).kind).toBe('error');
  expect(request).not.toHaveBeenCalled();
});
test('401 refresh replays same immutable intent once, rejects stale identity', async () => {
  const restore = jest.fn().mockResolvedValue({
    kind: 'user',
    user: { email: 'mentor@test.com', role: 'MENTOR' },
  });
  let active = true;
  const { service, request, reply } = setup({
    restore,
    isActive: () => active,
  });
  reply({}, 401);
  reply(written);
  expect((await service.write(intent)).kind).toBe('success');
  expect(restore).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(request.mock.calls[0]?.[0])).toBe(
    JSON.stringify(request.mock.calls[1]?.[0])
  );
  request.mockImplementationOnce(async () => {
    active = false;
    return { status: 200, data: roster };
  });
  expect(
    (await service.read({ kind: 'attendance', role: 'MENTOR', sessionId: id }))
      .kind
  ).toBe('denied');
});
test('HTML 503 write is uncertain, read is error; no fixture fallback', async () => {
  const { service, reply } = setup();
  reply('<html>Bad gateway</html>', 503);
  expect(await service.write(intent)).toMatchObject({ kind: 'uncertain' });
  reply('<html>Bad gateway</html>', 503);
  expect(
    (await service.read({ kind: 'attendance', role: 'MENTOR', sessionId: id }))
      .kind
  ).toBe('error');
});
test('invalid IDs, unsupported role and non-UUID mutation key never reach HTTP', async () => {
  const { service, request } = setup();
  expect(
    (
      await service.read({
        kind: 'attendance',
        role: 'MENTOR',
        sessionId: 'fake',
      })
    ).kind
  ).toBe('error');
  expect(
    (await service.read({ kind: 'audits', role: 'MENTOR', sessionId: id })).kind
  ).toBe('denied');
  expect((await service.write({ ...intent, key: 'counter' })).kind).toBe(
    'error'
  );
  expect(request).not.toHaveBeenCalled();
});

test('manager sessions paginate the real nested class endpoint before local filtering', async () => {
  const { service, request, reply } = setup();
  const scheduled = {
    ...session,
    sessionId: guest,
    status: 'SCHEDULED',
    actualStartedAt: null,
  };
  reply({
    class: { id, name: 'Real class', code: 'C1', status: 'IN_PROGRESS' },
    sessions: { items: [scheduled], page: 1, pageSize: 100, total: 2 },
  });
  reply({
    class: { id, name: 'Real class', code: 'C1', status: 'IN_PROGRESS' },
    sessions: { items: [session], page: 2, pageSize: 100, total: 2 },
  });
  const r = await service.read({
    kind: 'managerSessions',
    role: 'MANAGER',
    classId: id,
    mode: 'correction',
  });
  expect(r.kind).toBe('success');
  if (r.kind !== 'success') return;
  expect(r.data.total).toBe(1);
  expect(r.data.sessions[0]?.classTitle).toBe('Real class');
  expect(request).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      url: `/management/classes/${id}`,
      params: { page: 2, pageSize: 100 },
    })
  );
});
test('student list does not fetch enrollment per row; selected student uses existing classes API', async () => {
  const { service, request, reply } = setup();
  reply(page([person]));
  const students = await service.read({
    kind: 'managementStudents',
    role: 'MANAGER',
  });
  expect(students.kind).toBe('success');
  expect(request).toHaveBeenCalledTimes(1);
  reply(
    page([
      {
        enrollmentId: guest,
        class: { id, name: 'Real class', code: 'C1', status: 'IN_PROGRESS' },
      },
    ])
  );
  const classes = await service.read({
    kind: 'classes',
    role: 'MANAGER',
    studentId: id,
  });
  expect(classes.kind).toBe('success');
  if (classes.kind !== 'success') return;
  expect(classes.data.managementStudents[0]?.enrollments).toEqual([
    { classId: id, enrollmentId: guest },
  ]);
  expect(request).toHaveBeenLastCalledWith(
    expect.objectContaining({ url: `/manager/students/${id}/classes` })
  );
});
test('candidate guest stays provisional and has no invented totals or session', async () => {
  const { service, reply } = setup();
  reply({
    ...page([
      {
        enrollmentId: id,
        student: person,
        entryType: 'MAKEUP',
        makeupPlacementId: guest,
      },
    ]),
    provisional: true,
    asOf: session.asOf,
  });
  const r = await service.read({
    kind: 'candidates',
    role: 'MENTOR',
    sessionId: id,
  });
  expect(r.kind).toBe('success');
  if (r.kind !== 'success') return;
  expect(r.data.session).toBeUndefined();
  expect(r.data.totals).toBeUndefined();
  expect(r.data.rows[0]?.status).toBe('UNMARKED');
});
test('null deadline and nonmatching mentor identity cannot enable note editing', async () => {
  const { service, reply } = setup({ userId: guest });
  reply({ ...roster, session: { ...session, editableUntil: null } });
  const r = await service.read({
    kind: 'context',
    role: 'MENTOR',
    sessionId: id,
  });
  expect(r.kind).toBe('success');
  if (r.kind !== 'success') return;
  expect(r.data.session).toMatchObject({
    editableUntil: '',
    isEffectiveMentor: false,
  });
});
test('second 401 expires session; 403 and 404 remain separate failures', async () => {
  const restore = jest.fn().mockResolvedValue({ kind: 'user', user: {} });
  const { service, reply, onExpired, request } = setup({ restore });
  reply({}, 401);
  reply({}, 401);
  expect((await service.write(intent)).kind).toBe('denied');
  expect(onExpired).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledTimes(2);
  reply({ code: 'SCOPE_DENIED' }, 403);
  expect(
    await service.read({ kind: 'context', role: 'MENTOR', sessionId: id })
  ).toEqual({ kind: 'denied', code: 'SCOPE_DENIED' });
  reply({ code: 'SESSION_NOT_FOUND' }, 404);
  expect((await service.write(intent)).kind).toBe('notFound');
});
test('successful HTTP with malformed mutation response stays uncertain', async () => {
  const { service, reply } = setup();
  reply({ session });
  expect((await service.write(intent)).kind).toBe('uncertain');
});
test('manager correction and finalize require reason and real end time before HTTP', async () => {
  const { service, request } = setup();
  expect(await service.write({ ...intent, role: 'MANAGER' })).toMatchObject({
    kind: 'error',
    code: 'REASON_REQUIRED',
  });
  expect(
    (
      await service.write({
        ...intent,
        role: 'MANAGER',
        kind: 'finalize',
        reason: 'Verified',
      })
    ).kind
  ).toBe('error');
  expect(request).not.toHaveBeenCalled();
});

test('Manager finalize utility includes in-progress sessions whose scheduled end has not passed', async () => {
  const { service, request, reply } = setup();
  reply({
    ...page([{ id, name: 'Live class', code: 'C1', status: 'IN_PROGRESS' }]),
    pageSize: 100,
  });
  reply({
    class: { id, name: 'Live class', code: 'C1', status: 'IN_PROGRESS' },
    sessions: {
      ...page([{ ...session, endsAt: '2026-11-02T23:00:00+07:00' }]),
      pageSize: 100,
    },
  });
  const r = await service.read({
    kind: 'managerSessions',
    role: 'MANAGER',
    mode: 'finalize',
    status: 'IN_PROGRESS',
  });
  expect(r.kind).toBe('success');
  if (r.kind !== 'success') return;
  expect(r.data.total).toBe(1);
  expect(r.data.sessions[0]).toMatchObject({
    id,
    classTitle: 'Live class',
    status: 'IN_PROGRESS',
  });
  expect(request).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ url: '/management/classes' })
  );
  expect(request.mock.calls.some(([c]) => c.url?.includes('incomplete'))).toBe(
    false
  );
});

test('logout while NetInfo resolves cancels a write before it can use another account cookie', async () => {
  let active = true;
  const { service, request } = setup({ isActive: () => active });
  jest.mocked(NetInfo.fetch).mockImplementationOnce(async () => {
    active = false;
    return { isConnected: true } as Awaited<ReturnType<typeof NetInfo.fetch>>;
  });
  expect((await service.write(intent)).kind).toBe('denied');
  expect(request).not.toHaveBeenCalled();
});

test('wire validation uses Unicode character limits consistently with the note editor', async () => {
  const { service, reply, request } = setup();
  const content = '😀'.repeat(6000);
  reply({
    sessionId: id,
    version: 1,
    note: { content, nextSteps: '', version: 1, updatedAt: session.asOf },
  });
  expect(
    (
      await service.write({
        ...intent,
        kind: 'note',
        expectedVersion: 0,
        content,
        nextSteps: '',
      })
    ).kind
  ).toBe('success');
  request.mockClear();
  expect(
    (
      await service.write({
        ...intent,
        kind: 'note',
        expectedVersion: 0,
        content: '😀'.repeat(10001),
        nextSteps: '',
      })
    ).kind
  ).toBe('error');
  expect(request).not.toHaveBeenCalled();
});
