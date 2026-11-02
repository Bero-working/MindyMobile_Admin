import { addDays, vietnamDate } from '@/modules/teaching/format';
import type {
  AttendanceData,
  AttendanceRow,
  AttendanceScenario,
  AttendanceSession,
  AttendanceSource,
  Audit,
  Intent,
  Mark,
  ReadRequest,
  WriteResult,
} from '../types';
import type { TeachingRole } from '@/modules/teaching/types';

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export const emptyData = (): AttendanceData => ({
  managementStudents: [],
  sessions: [],
  rows: [],
  total: 0,
  note: null,
  noteVersion: 0,
  incomplete: [],
  audits: [],
  students: [],
  classes: [],
});
// Development fixture. Deliberately separate from HTTP and persistent storage.
export function createAttendanceMock(
  getScenario: () => AttendanceScenario = () => 'success'
): AttendanceSource {
  const sessions = new Map<string, AttendanceSession>();
  const rosters = new Map<string, AttendanceRow[]>();
  const notes = new Map<
    string,
    { note: AttendanceData['note']; version: number }
  >();
  const audits = new Map<string, Audit[]>();
  const results = new Map<string, { body: string; result: WriteResult }>();
  let auditId = 0;
  const consumedConflicts = new Set<string>();
  const today = vietnamDate();
  const sessionFor = (id: string, role: TeachingRole): AttendanceSession => {
    const old = sessions.get(id);
    const scheduled =
      /substitute|next|not-started|scheduled/.test(id) && !/completed/.test(id);
    const completed = /completed|done|past/.test(id);
    const cancelled = id.includes('cancelled');
    const overdue = id.includes('overdue') || id.includes('expired');
    const date = overdue
      ? addDays(today, -2)
      : id.includes('next')
        ? addDays(today, 2)
        : today;
    const asOf = `${today}T21:00:00+07:00`;
    const status =
      old?.status ??
      (cancelled
        ? 'CANCELLED'
        : scheduled
          ? 'SCHEDULED'
          : completed
            ? 'COMPLETED'
            : 'IN_PROGRESS');
    const expired = id.includes('expired') || getScenario() === 'expired';
    const manager = role === 'MANAGER';
    const value: AttendanceSession = {
      id,
      classId: id.includes('substitute') ? 'substitute' : 'primary',
      classTitle: id.includes('substitute')
        ? 'Giao tiếp B1 · Lớp 07'
        : 'IELTS Foundation K12',
      title: 'Buổi 8: Line graphs',
      startsAt: `${date}T18:30:00+07:00`,
      endsAt: `${date}T20:00:00+07:00`,
      actualStartedAt: scheduled ? null : `${date}T18:32:00+07:00`,
      actualEndedAt: completed ? `${date}T20:00:00+07:00` : null,
      effectiveMentor: scheduled ? null : 'Trần Thị Linh',
      isEffectiveMentor: !id.includes('other'),
      editableUntil: `${addDays(date, 2)}T00:00:00+07:00`,
      asOf,
      version: 3,
      ...old,
      status,
      permissions: {
        canStart: !manager && status === 'SCHEDULED' && date === today,
        canEditAttendance:
          status !== 'SCHEDULED' &&
          (!cancelled || manager) &&
          (manager || !expired),
        canSyncRoster: !manager && status === 'IN_PROGRESS' && !expired,
        canFinalize: status === 'IN_PROGRESS' && (manager || !expired),
        canRecover:
          manager && (status === 'SCHEDULED' || status === 'COMPLETED'),
        canViewAttendanceAudits: manager,
      },
    };
    sessions.set(id, value);
    return value;
  };
  const rosterFor = (session: AttendanceSession): AttendanceRow[] => {
    if (!rosters.has(session.id))
      rosters.set(
        session.id,
        session.status === 'SCHEDULED' || getScenario() === 'empty'
          ? []
          : Array.from(
              { length: session.id.includes('large') ? 105 : 18 },
              (_, i) => ({
                id: `attendance-${i + 1}`,
                enrollmentId: `enrollment-${i + 1}`,
                makeupPlacementId: i === 2 ? 'makeup-1' : null,
                entryType: i === 2 ? 'MAKEUP' : 'REGULAR',
                name:
                  i === 0
                    ? 'Ngô Bảo Ngọc'
                    : i === 1
                      ? 'Trần Hà'
                      : i === 2
                        ? 'Châu Minh Khoa'
                        : `Học viên ${i + 1}`,
                status:
                  i % 3 === 0 ? 'PRESENT' : i % 3 === 1 ? 'ABSENT' : 'UNMARKED',
                checkedInAt: i === 0 ? `${today}T18:35:00+07:00` : null,
              })
            )
      );
    return rosters.get(session.id) ?? [];
  };
  const dataFor = (id: string, role: TeachingRole): AttendanceData => {
    const session = sessionFor(id, role),
      rows = rosterFor(session);
    const note = notes.get(id);
    return {
      ...emptyData(),
      session: copy(session),
      rows: copy(rows),
      total: rows.length,
      totals: {
        eligible: rows.length,
        present: rows.filter((r) => r.status === 'PRESENT').length,
        absent: rows.filter((r) => r.status === 'ABSENT').length,
        unmarked: rows.filter((r) => r.status === 'UNMARKED').length,
        pendingPaymentCount: 2,
      },
      note: note?.note ?? null,
      noteVersion: note?.version ?? 0,
      audits: copy(audits.get(id) ?? []),
    };
  };
  const audit = (
    id: string,
    row: AttendanceRow,
    oldStatus: Mark | null,
    action: Audit['action'],
    intent: Intent,
    evidence: Audit['recoveryEvidence'] = null
  ) => {
    const item: Audit = {
      id: `audit-${++auditId}`,
      attendanceId: row.id,
      enrollmentId: row.enrollmentId,
      makeupPlacementId: row.makeupPlacementId,
      entryType: row.entryType,
      action,
      occurredAt: sessionFor(id, intent.role).asOf,
      oldStatus,
      newStatus: row.status,
      actor: intent.role === 'MANAGER' ? 'Nguyễn Minh An' : 'Trần Thị Linh',
      reason: intent.reason ?? null,
      recoveryEvidence: evidence,
    };
    audits.set(id, [item, ...(audits.get(id) ?? [])]);
  };
  const read = async (request: ReadRequest) => {
    const scenario = getScenario();
    if (scenario === 'loading') return new Promise<never>(() => {});
    if (['offline', 'error', 'denied', 'notFound'].includes(scenario))
      return {
        kind: scenario as 'offline' | 'error' | 'denied' | 'notFound',
        requestId: 'mock-read',
      };
    const data = dataFor(request.sessionId ?? 'today-primary', request.role);
    if (scenario === 'empty') {
      data.rows = [];
      data.total = 0;
      if (data.totals)
        data.totals = {
          ...data.totals,
          eligible: 0,
          present: 0,
          absent: 0,
          unmarked: 0,
        };
    }
    const page = request.page ?? 1,
      size = request.pageSize ?? 20;
    if (request.kind === 'managerSessions') {
      const items = [
        'today-primary',
        'substitute-completed',
        'overdue-not-finalized',
        'completed-recent',
        'expired-completed',
        'cancelled-started',
        'overdue-not-started',
      ]
        .map((id) => sessionFor(id, 'MANAGER'))
        .filter(
          (session) =>
            (!request.classId || session.classId === request.classId) &&
            (!request.status || session.status === request.status) &&
            (request.mode === 'finalize'
              ? session.permissions.canFinalize
              : request.mode === 'history'
                ? session.permissions.canViewAttendanceAudits
                : session.permissions.canEditAttendance)
        )
        .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
      data.sessions =
        scenario === 'empty'
          ? []
          : copy(items.slice((page - 1) * size, page * size));
      data.total = scenario === 'empty' ? 0 : items.length;
    } else if (request.kind === 'incomplete') {
      const items = [
        'overdue-not-started',
        'overdue-not-finalized',
        'expired-in-progress',
      ]
        .map((id) => {
          const session = sessionFor(id, 'MANAGER');
          return {
            id,
            session,
            issue:
              session.status === 'SCHEDULED'
                ? ('OVERDUE_NOT_STARTED' as const)
                : ('STARTED_NOT_FINALIZED' as const),
            deadlineExpired:
              session.status === 'SCHEDULED' ? null : id.includes('expired'),
          };
        })
        .filter(
          (item) =>
            item.session.status !== 'COMPLETED' &&
            (!request.issue || request.issue === item.issue) &&
            (!request.classId || item.session.classId === request.classId)
        );
      data.incomplete =
        scenario === 'empty'
          ? []
          : copy(items.slice((page - 1) * size, page * size));
      data.total = scenario === 'empty' ? 0 : items.length;
    } else if (request.kind === 'managementStudents') {
      data.managementStudents =
        scenario === 'empty'
          ? []
          : rosterFor(sessionFor('today-primary', 'MANAGER')).map((row, i) => ({
              id: `student-${i + 1}`,
              name: row.name,
              enrollments: [
                {
                  classId: 'primary',
                  enrollmentId: row.enrollmentId,
                  ...(row.makeupPlacementId
                    ? { makeupPlacementId: row.makeupPlacementId }
                    : {}),
                },
                ...(i < 2
                  ? [{ classId: 'substitute', enrollmentId: row.enrollmentId }]
                  : []),
              ],
            }));
      data.total = data.managementStudents.length;
      data.managementStudents = data.managementStudents.slice(
        (page - 1) * size,
        page * size
      );
    } else if (request.kind === 'classes') {
      data.classes = [
        {
          id: 'primary',
          name: 'IELTS Foundation K12',
          code: 'IF-K12',
          status: 'IN_PROGRESS',
          mentor: 'Trần Thị Linh',
          startDate: '2026-10-01',
          endDate: '2027-01-30',
          deliveryMode: 'OFFLINE',
          availableSeats: 4,
          maxStudents: 20,
        },
        {
          id: 'substitute',
          name: 'Giao tiếp B1 · Lớp 07',
          code: 'GTB1-07',
          status: 'OPEN',
          mentor: 'Lê Văn Phúc',
          startDate: '2026-10-01',
          endDate: '2027-01-30',
          deliveryMode: 'ONLINE',
          availableSeats: 4,
          maxStudents: 20,
        },
      ];
      if (
        request.studentId &&
        !['student-1', 'student-2'].includes(request.studentId)
      )
        data.classes = data.classes.filter((item) => item.id === 'primary');
      data.total = data.classes.length;
      if (scenario === 'empty') {
        data.classes = [];
        data.total = 0;
      } else data.classes = data.classes.slice((page - 1) * size, page * size);
    } else if (request.kind === 'recoveryStudents') {
      data.students = Array.from({ length: 8 }, (_, i) => ({
        id: `recovery-${i + 1}`,
        name: i === 0 ? 'Ngô Bảo Ngọc' : `Học viên khôi phục ${i + 1}`,
        enrollmentStatus: i === 5 ? 'PENDING_PAYMENT' : 'ACTIVE',
        paymentType: i % 2 ? 'CASH' : 'PAYOS',
        paidAt:
          i === 6 ? null : `${addDays(today, i < 3 ? -5 : -1)}T19:00:00+07:00`,
      }));
      data.students.push(
        ...Array.from({ length: 18 }, (_, i) => ({
          id: `enrollment-${i + 1}`,
          name: `Học viên ${i + 1}`,
          enrollmentStatus: 'ACTIVE' as const,
          paymentType: 'PAYOS' as const,
          paidAt: `${addDays(today, -5)}T19:00:00+07:00`,
        }))
      );
      data.total = data.students.length;
    } else if (request.kind === 'audits') {
      const items = data.audits.filter(
        (r) =>
          (!request.enrollmentId || r.enrollmentId === request.enrollmentId) &&
          (!request.makeupPlacementId ||
            r.makeupPlacementId === request.makeupPlacementId)
      );
      data.total = items.length;
      data.audits = items.slice((page - 1) * size, page * size);
    } else if (request.kind === 'candidates') {
      data.rows =
        data.session?.status === 'SCHEDULED' && scenario !== 'empty'
          ? Array.from({ length: 18 }, (_, i) => ({
              id: `candidate-${i + 1}`,
              enrollmentId: `enrollment-${i + 1}`,
              makeupPlacementId: i === 2 ? 'makeup-1' : null,
              entryType: i === 2 ? 'MAKEUP' : 'REGULAR',
              name: `Học viên ${i + 1}`,
              status: 'UNMARKED',
              checkedInAt: null,
            }))
          : [];
      data.total = data.rows.length;
      if (data.session?.status !== 'SCHEDULED')
        return { kind: 'unavailable' as const, code: 'CANDIDATES_CLOSED' };
      data.rows = data.rows.slice((page - 1) * size, page * size);
    } else data.rows = data.rows.slice((page - 1) * size, page * size);
    return { kind: 'success' as const, data: copy(data) };
  };
  const write = async (intent: Intent): Promise<WriteResult> => {
    const cached = results.get(intent.key),
      body = JSON.stringify(intent);
    if (cached)
      return cached.body === body
        ? copy(cached.result)
        : { kind: 'error', code: 'IDEMPOTENCY_KEY_REUSED' };
    const scenario = getScenario(),
      id = intent.sessionId,
      session = sessionFor(id, intent.role),
      rows = rosterFor(session);
    const error = (code: string): WriteResult => ({
      kind: 'error',
      code,
      requestId: 'mock-write',
    });
    if (scenario === 'denied') return { kind: 'denied' };
    if (scenario === 'notFound') return { kind: 'notFound' };
    if (scenario === 'offline') return error('OFFLINE');
    if (scenario === 'error') return error('SERVER');
    if (scenario === 'expired')
      return error(
        intent.kind === 'note'
          ? 'TEACHING_NOTE_WINDOW_CLOSED'
          : 'ATTENDANCE_EDIT_WINDOW_EXPIRED'
      );
    if (scenario === 'stateConflict')
      return error(
        intent.kind === 'note'
          ? 'TEACHING_NOTE_STATE_CONFLICT'
          : 'SESSION_STATE_CONFLICT'
      );
    if (scenario === 'recordExists')
      return error('ATTENDANCE_RECOVERY_RECORD_EXISTS');
    if (scenario === 'clockConflict')
      return error('ATTENDANCE_RECOVERY_CLOCK_CONFLICT');
    if (scenario === 'evidenceInvalid')
      return error('ATTENDANCE_RECOVERY_EVIDENCE_INVALID');
    if (
      intent.role === 'MANAGER' &&
      ['save', 'bulk', 'finalize', 'recover'].includes(intent.kind) &&
      !intent.reason?.trim()
    )
      return error('REASON_REQUIRED');
    if (
      intent.role === 'MANAGER' &&
      intent.kind === 'finalize' &&
      !intent.actualEndedAt
    )
      return error('END_REQUIRED');
    const currentVersion =
      intent.kind === 'note' ? (notes.get(id)?.version ?? 0) : session.version;
    if (scenario === 'conflict' && !consumedConflicts.has(id + intent.kind)) {
      consumedConflicts.add(id + intent.kind);
      if (intent.kind === 'note') {
        notes.set(id, {
          version: currentVersion + 1,
          note: {
            content: 'Bản mới từ phiên khác',
            nextSteps: '',
            updatedAt: session.asOf,
          },
        });
      } else {
        const first = rows[0];
        if (first)
          first.status = first.status === 'PRESENT' ? 'ABSENT' : 'PRESENT';
        sessions.set(id, { ...session, version: session.version + 1 });
      }
      return error(
        intent.kind === 'note'
          ? 'TEACHING_VERSION_CONFLICT'
          : 'SESSION_VERSION_CONFLICT'
      );
    }
    if (intent.expectedVersion !== currentVersion)
      return error(
        intent.kind === 'note'
          ? 'TEACHING_VERSION_CONFLICT'
          : 'SESSION_VERSION_CONFLICT'
      );
    let changed = 0;
    if (intent.kind === 'updateSession') {
      if (intent.role !== 'MANAGER') return { kind: 'denied' };
      if (session.status === 'CANCELLED') return { kind: 'denied' };
      if (
        !intent.title?.trim() ||
        !intent.startsAt ||
        !intent.endsAt ||
        !Number.isFinite(Date.parse(intent.startsAt)) ||
        !Number.isFinite(Date.parse(intent.endsAt)) ||
        Date.parse(intent.endsAt) <= Date.parse(intent.startsAt)
      )
        return error('SESSION_TIME_INVALID');
      sessions.set(id, {
        ...session,
        title: intent.title.trim(),
        startsAt: intent.startsAt,
        endsAt: intent.endsAt,
        version: session.version + 1,
      });
      changed = 1;
    } else if (intent.kind === 'note')
      notes.set(id, {
        version: currentVersion + 1,
        note: {
          content: intent.content ?? '',
          nextSteps: intent.nextSteps ?? '',
          updatedAt: session.asOf,
        },
      });
    else if (intent.kind === 'recover') {
      if (
        intent.recoveryRecords?.some((record) =>
          rows.some((row) => row.enrollmentId === record.enrollmentId)
        )
      )
        return error('ATTENDANCE_RECOVERY_RECORD_EXISTS');
      const oldStatus = session.status,
        oldStart = session.actualStartedAt,
        oldEnd = session.actualEndedAt;
      for (const record of intent.recoveryRecords ?? []) {
        const row: AttendanceRow = {
          id: `recovered-${record.enrollmentId}`,
          enrollmentId: record.enrollmentId,
          makeupPlacementId: null,
          entryType: 'REGULAR',
          name: 'Ngô Bảo Ngọc',
          status: record.status,
          checkedInAt: null,
        };
        rows.push(row);
        changed++;
        audit(id, row, null, 'RECOVER', intent, {
          evidenceNote: intent.evidenceNote ?? '',
          admissionBasis: record.admissionBasis,
          paidAt: `${addDays(today, -5)}T10:00:00+07:00`,
          oldSessionStatus: oldStatus,
          newSessionStatus: 'COMPLETED',
          oldActualStartedAt: oldStart,
          newActualStartedAt: intent.actualStartedAt ?? '',
          oldActualEndedAt: oldEnd,
          newActualEndedAt: intent.actualEndedAt ?? '',
        });
      }
      sessions.set(id, {
        ...session,
        status: 'COMPLETED',
        actualStartedAt: intent.actualStartedAt ?? session.actualStartedAt,
        actualEndedAt: intent.actualEndedAt ?? session.actualEndedAt,
        version: session.version + 1,
      });
    } else if (intent.kind === 'start') {
      if (!session.permissions.canStart)
        return error('ATTENDANCE_START_DAY_CLOSED');
      const started = {
        ...session,
        status: 'IN_PROGRESS' as const,
        actualStartedAt: session.asOf,
        effectiveMentor: 'Trần Thị Linh',
        version: session.version + 1,
      };
      sessions.set(id, started);
      const preview = await read({
        kind: 'candidates',
        sessionId: 'scheduled-preview',
        role: intent.role,
        pageSize: 100,
      });
      rosters.set(
        id,
        preview.kind === 'success'
          ? preview.data.rows.map((row, i) => ({
              ...row,
              id: `attendance-${i + 1}`,
              status: 'ABSENT' as const,
            }))
          : []
      );
    } else if (intent.kind === 'sync') {
      const additional: AttendanceRow = {
        id: 'synced-1',
        enrollmentId: 'cash-new',
        makeupPlacementId: null,
        entryType: 'REGULAR',
        name: 'Học viên mới đủ điều kiện',
        status: 'ABSENT',
        checkedInAt: null,
      };
      if (!rows.some((r) => r.id === additional.id)) {
        rows.push(additional);
        changed = 1;
      }
      if (changed)
        sessions.set(id, { ...session, version: session.version + 1 });
    } else {
      for (const row of rows) {
        let status: Mark | undefined;
        if (intent.kind === 'bulk')
          status = intent.checked ? 'PRESENT' : 'ABSENT';
        else if (intent.kind === 'finalize' && row.status === 'UNMARKED')
          status = 'ABSENT';
        else if (intent.kind === 'save')
          status =
            row.entryType === 'MAKEUP'
              ? intent.guestRecords?.find(
                  (r) => r.makeupPlacementId === row.makeupPlacementId
                )?.status
              : intent.records?.find((r) => r.enrollmentId === row.enrollmentId)
                  ?.status;
        if (status && status !== row.status) {
          const old = row.status;
          row.status = status;
          if (status !== 'PRESENT') row.checkedInAt = null;
          changed++;
          audit(
            id,
            row,
            old,
            intent.kind === 'finalize'
              ? 'FINALIZE'
              : intent.role === 'MANAGER'
                ? 'CORRECT'
                : 'MARK',
            intent
          );
        }
      }
      if (changed || intent.kind === 'finalize')
        sessions.set(id, {
          ...session,
          version: session.version + 1,
          ...(intent.kind === 'finalize'
            ? {
                status: 'COMPLETED' as const,
                actualEndedAt: intent.actualEndedAt ?? session.asOf,
              }
            : {}),
        });
    }
    const result: WriteResult = {
      kind: 'success',
      data: dataFor(id, intent.role),
      changed,
    };
    results.set(intent.key, { body, result: copy(result) });
    return scenario === 'uncertain' ? { kind: 'uncertain' } : copy(result);
  };
  return { read, write };
}
