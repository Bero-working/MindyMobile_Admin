import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { createTeachingService } from '@/modules/teaching/services/teachingService';
import type { AuthService } from '@/modules/auth/types';
import { classSessionSummary } from '@/modules/teaching/services/classSessionSummary';
import type { TeachingSession } from '@/modules/teaching/types';

const classId = '11111111-1111-4111-8111-111111111111';
const sessionId = '22222222-2222-4222-8222-222222222222';
const mentor = { id: classId, displayName: 'Mentor' };
const summary = {
  id: classId,
  code: 'C1',
  name: 'Class',
  status: 'IN_PROGRESS',
  startDate: '2026-10-01',
  endDate: '2026-12-31',
  deliveryMode: 'OFFLINE',
  maxStudents: 20,
  availableSeats: 4,
  mentor,
  assignmentType: 'PRIMARY',
  accessScope: 'CLASS',
};
const shell = {
  id: classId,
  classId,
  code: 'C1',
  name: 'Class',
  status: 'IN_PROGRESS',
  course: { id: classId, title: 'English' },
  accessScope: 'CLASS',
  assignmentType: 'PRIMARY',
  capabilities: { readClass: true, readClassRoster: true },
  visibleUnitCount: 3,
  visibleSessionCount: 12,
};
const session = {
  sessionId,
  classId,
  classUnitId: classId,
  title: 'Session',
  startsAt: '2026-10-31T11:00:00Z',
  endsAt: '2026-10-31T12:00:00Z',
  status: 'SCHEDULED',
  primaryMentor: mentor,
  effectiveMentor: null,
  assignmentType: 'PRIMARY',
  version: 2,
  makeupForSessionId: null,
  makeupRootSessionId: null,
  actualStartedAt: null,
  actualEndedAt: null,
};
const context = {
  session,
  accessScope: 'SESSION',
  roomName: 'Room',
  meetingUrl: 'https://meet.google.com/test',
};
const page = (items: object[], total = items.length) => ({
  items,
  page: 1,
  pageSize: 20,
  total,
});
const setup = (restore?: AuthService['restore']) => {
  const client = axios.create();
  const request = jest.spyOn(client, 'request');
  const onExpired = jest.fn();
  const service = createTeachingService({
    baseURL: 'https://test.mindy.vn/api/v1/',
    client,
    ...(restore ? { restore } : {}),
    onExpired,
  });
  const reply = (data: object, status = 200) =>
    request.mockResolvedValueOnce({ status, data });
  return { service, request, reply, onExpired };
};
beforeEach(() => jest.clearAllMocks());

test('session progress excludes cancellations and waits until a session ends', () => {
  const make = (startsAt: string, endsAt: string, status = 'SCHEDULED') =>
    ({ startsAt, endsAt, status, actualEnd: null }) as TeachingSession;
  expect(
    classSessionSummary(
      [
        make('2026-10-30T18:00:00+07:00', '2026-10-30T20:00:00+07:00'),
        make(
          '2026-10-31T18:00:00+07:00',
          '2026-10-31T20:00:00+07:00',
          'IN_PROGRESS'
        ),
        make('2026-11-01T18:00:00+07:00', '2026-11-01T20:00:00+07:00'),
        make(
          '2026-10-29T18:00:00+07:00',
          '2026-10-29T20:00:00+07:00',
          'CANCELLED'
        ),
      ],
      Date.parse('2026-10-31T19:00:00+07:00')
    )
  ).toMatchObject({
    sessionCount: 3,
    elapsedSessions: 1,
    nextSessionAt: '2026-10-31T18:00:00+07:00',
    scheduleDays: [5, 6],
    scheduleTime: '18:00',
  });
  expect(classSessionSummary([], 0)).toMatchObject({
    sessionCount: 0,
    elapsedSessions: 0,
  });
});

test('mentor cards only call list and all session pages, preserving available seats', async () => {
  const { service, reply, request } = setup();
  reply(page([{ ...summary, deliveryMode: 'ONLINE' }]));
  reply(
    page(
      [
        {
          ...session,
          startsAt: '2020-01-01T11:00:00Z',
          endsAt: '2020-01-01T12:00:00Z',
        },
      ],
      2
    )
  );
  reply({
    ...page(
      [
        {
          ...session,
          sessionId: classId,
          startsAt: '2099-01-01T11:00:00Z',
          endsAt: '2099-01-01T12:00:00Z',
        },
      ],
      2
    ),
    page: 2,
  });
  expect(
    await service.read({
      kind: 'classes',
      role: 'MENTOR',
      includeCardDetails: true,
    })
  ).toMatchObject({
    kind: 'success',
    data: {
      classes: [
        {
          sessionCount: 2,
          elapsedSessions: 1,
          nextSessionAt: '2099-01-01T11:00:00Z',
          availableSeats: 4,
          maxStudents: 20,
          enrollmentCounts: { ACTIVE: null },
        },
      ],
    },
  });
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({
      url: `/mentor/classes/${classId}/sessions`,
      params: { page: 2, pageSize: 100 },
    })
  );
  expect(request.mock.calls.map(([config]) => config.url)).toEqual([
    '/mentor/classes',
    `/mentor/classes/${classId}/sessions`,
    `/mentor/classes/${classId}/sessions`,
  ]);
});

test('substitute cards never fetch a whole-class roster or inaccessible context', async () => {
  const { service, reply, request } = setup();
  reply(page([{ ...summary, accessScope: 'SESSION' }]));
  reply(page([{ ...session, capabilities: { readSessionContext: true } }]));
  expect(
    await service.read({
      kind: 'classes',
      role: 'MENTOR',
      includeCardDetails: true,
    })
  ).toMatchObject({
    kind: 'success',
    data: {
      classes: [{ readClassRoster: false, enrollmentCounts: { ACTIVE: null } }],
    },
  });
  expect(request).toHaveBeenCalledTimes(2);
});

test('mentor detail reads only workspace and never preloads list, sessions or students', async () => {
  const { service, reply, request } = setup();
  reply(shell);
  expect(
    await service.read({ kind: 'class', classId, role: 'MENTOR' })
  ).toMatchObject({
    kind: 'success',
    data: {
      classInfo: {
        course: 'English',
        unitCount: 3,
        sessionCount: 12,
        enrollmentCounts: { ACTIVE: null },
      },
    },
  });
  expect(request).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({ url: `/mentor/classes/${classId}` })
  );
});

test('incomplete session pagination does not produce partial progress', async () => {
  const { service, reply } = setup();
  reply(page([summary]));
  reply(page([session], 2));
  reply({ ...page([], 2), page: 2 });
  expect(
    await service.read({
      kind: 'classes',
      role: 'MENTOR',
      includeCardDetails: true,
    })
  ).toMatchObject({
    kind: 'success',
    data: { classes: [{ sessionCount: null }] },
  });
});

test('late unauthorized response from an old account cannot expire the current account', async () => {
  const client = axios.create();
  let complete: (reply: { status: number; data: object }) => void = () => {};
  jest.spyOn(client, 'request').mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      })
  );
  const onExpired = jest.fn();
  let active = true;
  const source = createTeachingService({
    baseURL: 'https://test.mindy.vn',
    client,
    onExpired,
    isActive: () => active,
  });
  const pending = source.read({ kind: 'classes', role: 'MENTOR' });
  await new Promise<void>((resolve) => setImmediate(resolve));
  active = false;
  complete({ status: 401, data: {} });
  expect(await pending).toEqual({ kind: 'denied' });
  expect(onExpired).not.toHaveBeenCalled();
});

test('Mentor list preserves server scope and leaves unavailable progress unknown', async () => {
  const { service, reply, request } = setup();
  reply(
    page([{ ...summary, accessScope: 'SESSION', assignmentType: 'SUBSTITUTE' }])
  );
  expect(
    await service.read({
      kind: 'classes',
      role: 'MENTOR',
      status: 'IN_PROGRESS',
      page: 2,
    })
  ).toMatchObject({
    kind: 'success',
    data: {
      classes: [
        {
          scope: 'SESSION',
          readClassRoster: false,
          currentUnit: null,
          unitCount: null,
          room: null,
        },
      ],
    },
  });
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({
      url: '/mentor/classes',
      withCredentials: true,
      params: { page: 2, pageSize: 20, status: 'IN_PROGRESS' },
    })
  );
});
test('Manager uses read namespace and q search, with no branch or unsupported search parameter', async () => {
  const { service, reply, request } = setup();
  reply(page([summary]));
  expect(
    (await service.read({ kind: 'classes', role: 'MANAGER', q: ' C1 ' })).kind
  ).toBe('success');
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({
      url: '/manager/classes',
      params: { page: 1, pageSize: 20, q: 'C1' },
    })
  );
});
test('class shell capabilities are authoritative and missing facts are null', async () => {
  const { service, reply } = setup();
  reply(shell);
  expect(
    await service.read({ kind: 'class', role: 'MENTOR', classId })
  ).toMatchObject({
    kind: 'success',
    data: {
      classInfo: {
        readClassRoster: true,
        unitCount: 3,
        sessionCount: 12,
        currentUnit: null,
        deliveryMode: null,
        enrollmentCounts: { ACTIVE: null },
      },
    },
  });
});
test('substitute direct roster request cannot call class students endpoint', async () => {
  const { service, reply, request } = setup();
  reply({ ...shell, accessScope: 'SESSION' });
  expect(
    await service.read({ kind: 'students', role: 'MENTOR', classId })
  ).toEqual({ kind: 'denied' });
  expect(request).toHaveBeenCalledTimes(1);
});
test('class roster maps orderStatus and does not invent contact data', async () => {
  const { service, reply, request } = setup();
  reply(shell);
  reply(
    page([
      {
        enrollmentId: classId,
        studentName: 'Student',
        enrollmentStatus: 'PENDING_PAYMENT',
        orderStatus: 'PENDING',
        paymentType: 'CASH',
        paidAt: null,
        expiresAt: '2026-11-01T00:00:00Z',
      },
    ])
  );
  expect(
    await service.read({
      kind: 'students',
      role: 'MENTOR',
      classId,
      status: 'PENDING',
    })
  ).toMatchObject({
    kind: 'success',
    data: {
      students: [
        {
          enrollment: 'PENDING_PAYMENT',
          order: 'PENDING',
          email: null,
          studentStatus: null,
        },
      ],
      classInfo: { id: classId, name: shell.name, readClassRoster: true },
    },
  });
  expect(request).toHaveBeenCalledTimes(2);
  expect(request.mock.calls[1]?.[0].params).toEqual({
    page: 1,
    pageSize: 20,
    orderStatus: 'PENDING',
  });
});
test('timetable obeys capabilities and never substitutes primary mentor for a missing snapshot', async () => {
  const { service, reply } = setup();
  reply(page([{ ...session, capabilities: { readSessionContext: false } }]));
  expect(
    await service.read({ kind: 'sessions', role: 'MENTOR', classId })
  ).toMatchObject({
    kind: 'success',
    data: {
      sessions: [
        {
          readSessionContext: false,
          effectiveMentor: null,
          effectiveMentorId: null,
          meetingUrl: null,
          version: 2,
        },
      ],
    },
  });
});
test('context maps room, link, version and actual start from its own endpoint', async () => {
  const { service, reply } = setup();
  reply(context);
  expect(
    await service.read({ kind: 'context', role: 'MENTOR', sessionId })
  ).toMatchObject({
    kind: 'success',
    data: {
      session: {
        id: sessionId,
        room: 'Room',
        meetingUrl: context.meetingUrl,
        version: 2,
      },
    },
  });
});
test.each(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'])(
  'session roster selects correct read endpoint for %s',
  async (status) => {
    const { service, reply, request } = setup();
    reply({ ...context, session: { ...session, status } });
    reply(
      page([
        {
          enrollmentId: classId,
          student: mentor,
          entryType: 'MAKEUP',
          makeupPlacementId: sessionId,
        },
      ])
    );
    expect(
      await service.read({ kind: 'sessionStudents', role: 'MENTOR', sessionId })
    ).toMatchObject({
      kind: 'success',
      data: {
        students: [{ admission: 'MAKEUP', order: null, enrollment: null }],
      },
    });
    expect(request.mock.calls[1]?.[0].url).toBe(
      `/class-sessions/${sessionId}/${status === 'SCHEDULED' ? 'attendance-candidates' : 'attendance'}`
    );
  }
);
test('cancelled session has no candidate or snapshot request', async () => {
  const { service, reply, request } = setup();
  reply({ ...context, session: { ...session, status: 'CANCELLED' } });
  expect(
    await service.read({ kind: 'sessionStudents', role: 'MENTOR', sessionId })
  ).toEqual({ kind: 'unavailable' });
  expect(request).toHaveBeenCalledTimes(1);
});
test('Manager timetable uses management namespace, detail keeps enrollment counts', async () => {
  const { service, reply, request } = setup();
  reply({
    ...summary,
    course: { id: classId, code: 'E', title: 'English' },
    roomName: null,
    unitCount: 3,
    sessionCount: 12,
    enrollmentCounts: {
      ACTIVE: 10,
      PENDING_PAYMENT: 1,
      COMPLETED: 0,
      CANCELLED: 2,
    },
  });
  reply({ class: { id: classId }, sessions: page([session]) });
  expect(
    await service.read({ kind: 'class', role: 'MANAGER', classId })
  ).toMatchObject({
    kind: 'success',
    data: { classInfo: { enrollmentCounts: { ACTIVE: 10 } } },
  });
  expect(
    (await service.read({ kind: 'sessions', role: 'MANAGER', classId })).kind
  ).toBe('success');
  expect(request.mock.calls.map(([config]) => config.url)).toEqual([
    `/manager/classes/${classId}`,
    `/management/classes/${classId}`,
  ]);
});
test.each([403, 404, 429, 500])(
  'HTTP %s maps to recoverable UI state without exposing response body',
  async (status) => {
    const { service, reply } = setup();
    reply({ requestId: 'req-1', message: 'private' }, status);
    expect(await service.read({ kind: 'classes', role: 'MENTOR' })).toEqual({
      kind: status === 403 ? 'denied' : status === 404 ? 'notFound' : 'error',
      requestId: 'req-1',
    });
  }
);
test('malformed response and mismatched context resource fail closed', async () => {
  const { service, reply } = setup();
  reply({ items: [] });
  reply({ ...context, session: { ...session, sessionId: classId } });
  expect(await service.read({ kind: 'classes', role: 'MENTOR' })).toEqual({
    kind: 'error',
  });
  expect(
    await service.read({ kind: 'context', role: 'MENTOR', sessionId })
  ).toEqual({ kind: 'error' });
});
test('offline and missing configuration perform no HTTP', async () => {
  const { service, request } = setup();
  jest
    .mocked(NetInfo.fetch)
    .mockResolvedValueOnce({ isConnected: false } as Awaited<
      ReturnType<typeof NetInfo.fetch>
    >);
  expect(await service.read({ kind: 'classes', role: 'MENTOR' })).toEqual({
    kind: 'offline',
  });
  expect(request).not.toHaveBeenCalled();
  expect(
    await createTeachingService({ baseURL: '' }).read({
      kind: 'classes',
      role: 'MENTOR',
    })
  ).toEqual({ kind: 'error' });
});
test('concurrent 401 responses share renewal, replay once, and expire after another 401', async () => {
  let finish: (
    value: Awaited<ReturnType<AuthService['restore']>>
  ) => void = () => {};
  const restore = jest.fn(
    () =>
      new Promise<Awaited<ReturnType<AuthService['restore']>>>((resolve) => {
        finish = resolve;
      })
  );
  const { service, reply, onExpired } = setup(restore);
  reply({}, 401);
  reply({}, 401);
  reply(page([]));
  reply({}, 401);
  const first = service.read({ kind: 'classes', role: 'MENTOR' });
  const second = service.read({ kind: 'classes', role: 'MENTOR' });
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(restore).toHaveBeenCalledTimes(1);
  finish({
    kind: 'user',
    user: { email: 'a@example.test', displayName: 'A', role: 'MENTOR' },
  });
  expect((await first).kind).toBe('success');
  expect((await second).kind).toBe('denied');
  expect(onExpired).toHaveBeenCalledTimes(1);
});
