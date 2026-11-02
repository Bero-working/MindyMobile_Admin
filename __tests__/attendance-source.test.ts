import { createAttendanceMock } from '@/modules/attendance/services/mockAttendance';
import type { Intent, ReadResult } from '@/modules/attendance/types';
const key = '00000000-0000-4000-8000-000000000001';
const intent: Intent = {
  kind: 'bulk',
  key,
  sessionId: 'large-roster',
  role: 'MENTOR',
  expectedVersion: 3,
  checked: true,
};
const success = (result: ReadResult) => {
  if (result.kind !== 'success') throw new Error(result.kind);
  return result.data;
};
test('editing a completed session preserves its roster, audits and actual times', async () => {
  const source = createAttendanceMock();
  const request = {
    kind: 'attendance' as const,
    role: 'MANAGER' as const,
    sessionId: 'completed-recent',
    pageSize: 100,
  };
  const before = success(await source.read(request));
  const session = before.session!;
  const update: Intent = {
    kind: 'updateSession',
    key,
    role: 'MANAGER',
    sessionId: session.id,
    expectedVersion: session.version,
    title: 'Updated session',
    startsAt: session.startsAt,
    endsAt: session.endsAt.replace('20:00', '20:30'),
  };
  expect((await source.write(update)).kind).toBe('success');
  const after = success(await source.read(request));
  expect(after.rows).toEqual(before.rows);
  expect(after.audits).toEqual(before.audits);
  expect(after.session).toMatchObject({
    status: session.status,
    actualStartedAt: session.actualStartedAt,
    actualEndedAt: session.actualEndedAt,
    title: 'Updated session',
    endsAt: update.endsAt,
  });
  expect(
    await source.write({
      ...update,
      key: 'invalid-time',
      expectedVersion: after.session!.version,
      endsAt: session.startsAt,
    })
  ).toMatchObject({ kind: 'error', code: 'SESSION_TIME_INVALID' });
  const mentor = success(await source.read({ ...request, role: 'MENTOR' }));
  expect(
    await source.write({
      ...update,
      key: 'mentor-edit',
      role: 'MENTOR',
      expectedVersion: mentor.session!.version,
    })
  ).toMatchObject({ kind: 'denied' });
});
test('TC-P2-S1-33/34: bulk includes unloaded regular and guest; replay is idempotent', async () => {
  const source = createAttendanceMock();
  const first = success(
    await source.read({
      kind: 'attendance',
      role: 'MENTOR',
      sessionId: 'large-roster',
      pageSize: 100,
    })
  );
  expect(first.total).toBeGreaterThan(100);
  expect(first.rows).toHaveLength(100);
  const written = await source.write(intent);
  expect(written.kind).toBe('success');
  const repeated = await source.write(intent);
  expect(repeated).toEqual(written);
  const next = success(
    await source.read({
      kind: 'attendance',
      role: 'MENTOR',
      sessionId: 'large-roster',
      page: 2,
      pageSize: 100,
    })
  );
  expect(next.rows.every((r) => r.status === 'PRESENT')).toBe(true);
  expect(next.totals?.present).toBe(next.total);
});
test('TC-P2-S1-22/23: lost response retry has one effect', async () => {
  let scenario = 'uncertain' as 'success' | 'uncertain';
  const source = createAttendanceMock(() => scenario);
  expect((await source.write(intent)).kind).toBe('uncertain');
  scenario = 'success';
  const repeated = await source.write(intent);
  expect(repeated.kind).toBe('success');
  const data = success(
    await source.read({
      kind: 'attendance',
      role: 'MENTOR',
      sessionId: 'large-roster',
    })
  );
  expect(data.session?.version).toBe(4);
});
test('TC-P2-S2-01/03/31: notes use own version and do not mutate attendance', async () => {
  const source = createAttendanceMock();
  const result = await source.write({
    ...intent,
    kind: 'note',
    expectedVersion: 0,
    content: '  Nội dung  ',
    nextSteps: '',
  });
  expect(result.kind).toBe('success');
  const note = success(
    await source.read({
      kind: 'note',
      role: 'MENTOR',
      sessionId: 'large-roster',
    })
  );
  expect(note.noteVersion).toBe(1);
  expect(note.note?.content).toBe('  Nội dung  ');
  expect(note.session?.version).toBe(3);
});
test('TC-P2-S5-06/20/27: manager reason and actual end required', async () => {
  const source = createAttendanceMock();
  expect(await source.write({ ...intent, role: 'MANAGER' })).toMatchObject({
    kind: 'error',
    code: 'REASON_REQUIRED',
  });
  expect(
    await source.write({
      ...intent,
      kind: 'finalize',
      role: 'MANAGER',
      reason: 'Đối chiếu sổ',
    })
  ).toMatchObject({ kind: 'error', code: 'END_REQUIRED' });
});
test('TC-P2-S6-28/36: recovery is insert-only; omitted students remain missing', async () => {
  const source = createAttendanceMock();
  const recovery: Intent = {
    ...intent,
    sessionId: 'overdue-not-started',
    kind: 'recover',
    expectedVersion: 3,
    role: 'MANAGER',
    reason: 'Thiếu bản ghi',
    evidenceNote: 'Sổ lớp',
    actualStartedAt: '2026-10-30T18:30:00+07:00',
    actualEndedAt: '2026-10-30T20:00:00+07:00',
    recoveryRecords: [
      {
        enrollmentId: 'recovery-1',
        status: 'PRESENT',
        admissionBasis: 'PAID_BEFORE_START',
      },
    ],
  };
  expect((await source.write(recovery)).kind).toBe('success');
  const data = success(
    await source.read({
      kind: 'attendance',
      role: 'MANAGER',
      sessionId: recovery.sessionId,
    })
  );
  expect(data.total).toBe(1);
  expect(data.rows[0]?.enrollmentId).toBe('recovery-1');
  expect(
    await source.write({
      ...recovery,
      key: key.replace(/1$/, '2'),
      expectedVersion: 4,
    })
  ).toMatchObject({ kind: 'error', code: 'ATTENDANCE_RECOVERY_RECORD_EXISTS' });
});

test('Manager utility scopes sessions to the selected class before pagination', async () => {
  const source = createAttendanceMock();
  const request = {
    kind: 'managerSessions' as const,
    role: 'MANAGER' as const,
    mode: 'history' as const,
    status: 'IN_PROGRESS' as const,
    classId: 'primary',
    pageSize: 1,
  };
  const first = success(await source.read(request));
  const second = success(await source.read({ ...request, page: 2 }));
  expect(first.total).toBe(2);
  expect(
    [...first.sessions, ...second.sessions].every(
      (item) => item.classId === 'primary'
    )
  ).toBe(true);
  const other = success(
    await source.read({ ...request, classId: 'substitute' })
  );
  expect(other.sessions).toEqual([]);
  expect(other.total).toBe(0);
  const classes = success(
    await source.read({
      kind: 'classes',
      role: 'MANAGER',
      pageSize: 1,
      page: 2,
    })
  );
  expect(classes.total).toBe(2);
  expect(classes.classes.map((item) => item.id)).toEqual(['substitute']);
});

test('Manager utility lists paginate by session and refresh membership after finalizing', async () => {
  const source = createAttendanceMock();
  const request = {
    kind: 'managerSessions' as const,
    role: 'MANAGER' as const,
    mode: 'finalize' as const,
    status: 'IN_PROGRESS' as const,
    pageSize: 1,
  };
  const first = success(await source.read(request)),
    second = success(await source.read({ ...request, page: 2 }));
  expect(first.sessions).toHaveLength(1);
  expect(first.total).toBeGreaterThan(1);
  expect(first.sessions[0]?.id).not.toBe(second.sessions[0]?.id);
  const session = first.sessions[0]!;
  expect(
    await source.write({
      ...intent,
      kind: 'finalize',
      role: 'MANAGER',
      sessionId: session.id,
      expectedVersion: session.version,
      reason: 'Xác nhận giờ thực tế',
      actualEndedAt: session.endsAt,
    })
  ).toMatchObject({ kind: 'success' });
  const queue = success(await source.read({ ...request, pageSize: 20 }));
  expect(queue.sessions.some((item) => item.id === session.id)).toBe(false);
  const history = success(
    await source.read({
      ...request,
      mode: 'history',
      status: 'COMPLETED',
      pageSize: 20,
    })
  );
  expect(history.sessions.some((item) => item.id === session.id)).toBe(true);
});

test('New session attendance and newly admitted students default to absent', async () => {
  const source = createAttendanceMock();
  const request = {
    kind: 'attendance' as const,
    role: 'MENTOR' as const,
    sessionId: 'today-scheduled',
    pageSize: 100,
  };
  const before = success(await source.read(request));
  expect(
    await source.write({
      kind: 'start',
      key: 'start-default-absent',
      role: 'MENTOR',
      sessionId: request.sessionId,
      expectedVersion: before.session!.version,
    })
  ).toMatchObject({ kind: 'success' });
  const started = success(await source.read(request));
  expect(started.rows.length).toBeGreaterThan(0);
  expect(started.rows.every((row) => row.status === 'ABSENT')).toBe(true);
  expect(
    await source.write({
      kind: 'sync',
      key: 'sync-default-absent',
      role: 'MENTOR',
      sessionId: request.sessionId,
      expectedVersion: started.session!.version,
    })
  ).toMatchObject({ kind: 'success' });
  const synced = success(await source.read(request));
  expect(synced.rows.find((row) => row.id === 'synced-1')?.status).toBe(
    'ABSENT'
  );
});
