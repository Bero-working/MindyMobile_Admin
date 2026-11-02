import { vietnamDay } from '../model';
import type {
  Conflict,
  LeaveData,
  LeaveIntent,
  LeaveRequest,
  LeaveSource,
  Outcome,
  ReadRequest,
  Scenario,
  SourceSession,
} from '../types';

export function createLeaveMock(
  scenario: () => Scenario = () => 'success'
): LeaveSource {
  const at = (offset: number, hour = 18) => {
    const date = new Date(
      Date.parse(`${vietnamDay()}T00:00:00Z`) + offset * 86400000
    )
      .toISOString()
      .slice(0, 10);
    return `${date}T${String(hour).padStart(2, '0')}:00:00+07:00`;
  };
  const session = (id: string, offset = 5): SourceSession => ({
    id,
    classId: 'class-a',
    className: 'IELTS 6.5 Intensive K08',
    title: 'Buổi 19: Unit 10',
    startsAt: at(offset),
    endsAt: at(offset, 20),
    version: 1,
    assignment: 'PRIMARY',
  });
  const source = session('source-a');
  const requests: LeaveRequest[] = Array.from({ length: 30 }, (_, i) => {
    const status =
      i < 25
        ? 'PENDING'
        : (['APPROVED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'] as const)[
            (i - 25) % 4
          ]!;
    return {
      id: `leave-${i + 1}`,
      mentorId: i === 24 ? 'mentor-b' : 'mentor-a',
      fromDate: vietnamDay(at(5)),
      toDate: vietnamDay(at(5)),
      period: 'FULL_DAY',
      reason: 'Việc gia đình',
      status,
      version: 1,
      submittedAt: at(-1, 9),
      expiresAt: at(5),
      itemCount: 1,
      items: [
        {
          id: `item-${i}`,
          classId: 'class-a',
          sourceSessionId: 'source-a',
          sourceStartsAt: source.startsAt,
          sourceEndsAt: source.endsAt,
          startsAt: at(8),
          endsAt: at(8, 20),
          replacementSessionId: status === 'APPROVED' ? 'makeup-a' : null,
        },
      ],
      sourcesCurrent: true,
      studentConflictCount: 0,
      studentConflicts: [],
      review:
        status === 'PENDING'
          ? null
          : {
              reason:
                status === 'EXPIRED'
                  ? 'Source start reached'
                  : 'Đồng ý theo lịch đề xuất',
              reviewedAt: at(-1, 10),
            },
      classExtensions: [{ classId: 'class-a', endDate: vietnamDay(at(45)) }],
    };
  });
  const conflicts: Conflict[] = [
    {
      id: 'conflict-open',
      status: 'OPEN',
      placementId: null,
      placementVersion: null,
      version: 1,
      studentName: 'Nguyễn Minh Anh',
      source,
      intervals: [{ startsAt: at(5, 18), endsAt: at(5, 19) }],
    },
    {
      id: 'conflict-reassign',
      status: 'OPEN',
      placementId: 'placement-old',
      placementVersion: 3,
      version: 2,
      studentName: 'Lê Gia Hân',
      source,
      intervals: [],
    },
    {
      id: 'conflict-assigned',
      status: 'MAKEUP_ASSIGNED',
      placementId: 'placement-assigned',
      placementVersion: 1,
      version: 2,
      studentName: 'Trần Bảo An',
      source,
      intervals: [],
    },
    {
      id: 'conflict-resolved',
      status: 'RESOLVED',
      placementId: 'placement-done',
      placementVersion: 2,
      version: 3,
      studentName: 'Phạm Khánh Linh',
      source,
      intervals: [],
    },
  ];
  const candidate = {
    session: {
      ...session('target-a', 9),
      classId: 'class-b',
      className: 'IELTS 6.5 Intensive K09',
    },
    remainingCapacity: 3,
    mentorName: 'Trần Thị Linh',
  };
  const replay = new Map<string, { intent: string; result: Outcome }>();
  const copy = (data: LeaveData): Outcome => ({
    kind: 'success',
    data: JSON.parse(JSON.stringify(data)) as LeaveData,
  });
  function read(request: ReadRequest): Outcome {
    const mode = scenario();
    if (mode === 'offline' || mode === 'denied' || mode === 'notFound')
      return { kind: mode };
    if (mode === 'error' || mode === 'refreshError')
      return { kind: 'error', code: 'SERVER', requestId: 'mock-p4-read' };
    const page = request.page ?? 1,
      size = request.pageSize ?? 20;
    const pageOf = <T>(values: T[]) =>
      values.slice((page - 1) * size, page * size);
    if (request.kind === 'classes')
      return copy({
        total: 2,
        options: [
          { id: 'class-a', name: 'IELTS 6.5 Intensive K08' },
          { id: 'class-b', name: 'IELTS 6.5 Intensive K09' },
        ],
      });
    if (request.kind === 'mentors')
      return copy({
        total: 2,
        options: [
          { id: 'mentor-a', name: 'Nguyễn Hoàng Long' },
          { id: 'mentor-b', name: 'Trần Thị Linh' },
        ],
      });
    if (request.kind === 'list') {
      const values =
        mode === 'empty'
          ? []
          : requests.filter(
              (item) =>
                (!request.status || item.status === request.status) &&
                (!request.mentorId || item.mentorId === request.mentorId) &&
                (request.role !== 'MENTOR' || item.mentorId === 'mentor-a')
            );
      return copy({
        total: values.length,
        requests: pageOf(values).map((item) => ({
          ...item,
          items: [],
          studentConflictCount: null,
        })),
      });
    }
    if (request.kind === 'detail') {
      const item = requests.find((value) => value.id === request.id);
      if (!item || (request.role === 'MENTOR' && item.mentorId !== 'mentor-a'))
        return { kind: 'notFound' };
      return copy({
        total: item.itemCount,
        request: {
          ...item,
          sourcesCurrent: mode !== 'stale',
          studentConflictCount:
            mode === 'studentConflict' ? 2 : item.studentConflictCount,
          items: pageOf(item.items),
          studentConflicts:
            mode === 'studentConflict'
              ? [
                  { id: 'clash-a', sourceSessionId: 'source-a' },
                  { id: 'clash-b', sourceSessionId: 'source-a' },
                ]
              : [],
        },
      });
    }
    if (request.kind === 'preview') {
      const fromDate = request.fromDate ?? vietnamDay(at(5));
      const startsAt = `${fromDate}T18:00:00+07:00`;
      const deadline = new Date(
        Date.parse(`${fromDate}T00:00:00+07:00`) - 86400000
      ).toISOString();
      return copy({
        total: mode === 'empty' ? 0 : 1,
        preview: {
          sources:
            mode === 'empty'
              ? []
              : [
                  {
                    ...source,
                    startsAt,
                    endsAt: `${fromDate}T20:00:00+07:00`,
                    version: mode === 'stale' ? 2 : 1,
                  },
                ],
          sourceVersions:
            mode === 'empty'
              ? []
              : [{ sessionId: source.id, version: mode === 'stale' ? 2 : 1 }],
          noticeEligible: mode !== 'late' && Date.parse(deadline) > Date.now(),
          noticeDeadline: mode === 'empty' ? null : deadline,
          asOf: new Date().toISOString(),
        },
      });
    }
    if (request.kind === 'slots') {
      const hour =
        request.targetPeriod === 'MORNING'
          ? 0
          : request.targetPeriod === 'AFTERNOON'
            ? 12
            : 18;
      const start = Date.parse(
        `${request.targetDate}T${String(hour).padStart(2, '0')}:00:00+07:00`
      );
      const end = request.targetPeriod === 'MORNING' ? 12 : 6;
      const slots = Array.from({ length: (end - 2) * 4 + 1 }, (_, index) => ({
        startsAt: new Date(start + index * 900000).toISOString(),
        endsAt: new Date(start + index * 900000 + 7200000).toISOString(),
      }));
      return copy({
        total: mode === 'empty' ? 0 : slots.length,
        slots: mode === 'empty' ? [] : slots,
        sessionVersion: mode === 'stale' ? 2 : 1,
      });
    }
    if (request.kind === 'conflicts') {
      const values =
        mode === 'empty'
          ? []
          : conflicts.filter(
              (item) =>
                (!request.classId || item.source.classId === request.classId) &&
                (request.status
                  ? item.status === request.status
                  : item.status !== 'RESOLVED')
            );
      return copy({ total: values.length, conflicts: pageOf(values) });
    }
    if (mode === 'notEligible')
      return { kind: 'error', code: 'MAKEUP_NOT_ELIGIBLE' };
    const conflict = conflicts.find((item) => item.id === request.id);
    if (conflict?.placementId)
      return { kind: 'error', code: 'MAKEUP_ALREADY_ASSIGNED' };
    return copy({
      total: mode === 'empty' ? 0 : 1,
      candidates: mode === 'empty' ? [] : [candidate],
    });
  }
  function write(intent: LeaveIntent): Outcome {
    const mode = scenario();
    if (mode === 'offline' || mode === 'denied') return { kind: mode };
    const previous = replay.get(intent.key);
    if (previous)
      return previous.intent === JSON.stringify(intent)
        ? previous.result
        : { kind: 'error', code: 'KEY_REUSED' };
    if (mode === 'conflict')
      return {
        kind: 'error',
        code:
          intent.kind === 'place' || intent.kind === 'cancel'
            ? 'MAKEUP_VERSION_CONFLICT'
            : 'LEAVE_VERSION_CONFLICT',
      };
    if (mode === 'full' && intent.kind === 'place')
      return { kind: 'error', code: 'MAKEUP_TARGET_FULL' };
    let result: Outcome;
    if (intent.kind === 'create') {
      const template = requests[0]!;
      const body = intent.body;
      const item: LeaveRequest = {
        ...template,
        id: `leave-new-${requests.length}`,
        fromDate: body.fromDate!,
        toDate: body.toDate!,
        period: body.period!,
        reason: body.reason,
        status: 'PENDING',
        version: 1,
        submittedAt: new Date().toISOString(),
        items: (body.sessionMappings ?? []).map((mapping, i) => ({
          ...template.items[0]!,
          id: `new-item-${i}`,
          ...mapping,
          replacementSessionId: null,
        })),
        itemCount: body.sessionMappings?.length ?? 0,
        review: null,
      };
      requests.unshift(item);
      result = copy({ total: item.itemCount, request: item });
    } else if (intent.kind === 'place' || intent.kind === 'cancel') {
      const conflict = conflicts.find((item) =>
        intent.kind === 'place'
          ? item.id === intent.id
          : item.placementId === intent.id
      );
      if (!conflict) return { kind: 'notFound' };
      if (
        intent.body.expectedVersion !==
        (intent.kind === 'place' ? conflict.version : conflict.placementVersion)
      )
        return { kind: 'error', code: 'MAKEUP_VERSION_CONFLICT' };
      if (intent.kind === 'place') {
        if (conflict.placementId)
          return { kind: 'error', code: 'MAKEUP_ALREADY_ASSIGNED' };
        conflict.status = 'MAKEUP_ASSIGNED';
        conflict.placementId = `placement-${conflict.id}`;
        conflict.placementVersion = 1;
      } else {
        conflict.status = 'OPEN';
        conflict.placementId = null;
        conflict.placementVersion = null;
      }
      conflict.version++;
      result = copy({
        total: 1,
        conflicts: [conflict],
        ...(intent.kind === 'place'
          ? { placedSession: candidate.session }
          : {}),
      });
    } else {
      const item = requests.find((value) => value.id === intent.id);
      if (!item) return { kind: 'notFound' };
      if (item.status !== 'PENDING')
        return { kind: 'error', code: 'LEAVE_STATE_CONFLICT' };
      if (item.version !== intent.body.expectedVersion)
        return { kind: 'error', code: 'LEAVE_VERSION_CONFLICT' };
      if (intent.kind === 'approve' && mode === 'studentConflict')
        return { kind: 'error', code: 'LEAVE_STUDENT_CONFLICT' };
      if (intent.kind === 'approve' && mode === 'stale')
        return { kind: 'error', code: 'LEAVE_REQUEST_STALE' };
      item.status =
        intent.kind === 'approve'
          ? 'APPROVED'
          : intent.kind === 'withdraw'
            ? 'WITHDRAWN'
            : 'REJECTED';
      item.version++;
      item.review = {
        reason: intent.body.reason,
        reviewedAt: new Date().toISOString(),
      };
      if (item.status === 'APPROVED')
        item.items = item.items.map((row) => ({
          ...row,
          replacementSessionId: 'makeup-a',
        }));
      result = copy({
        total: item.itemCount,
        request: item,
        ...(item.status === 'APPROVED'
          ? {
              replacements: [
                {
                  ...session('makeup-a'),
                  startsAt: item.items[0]!.startsAt,
                  endsAt: item.items[0]!.endsAt,
                },
              ],
            }
          : {}),
      });
    }
    replay.set(intent.key, { intent: JSON.stringify(intent), result });
    return mode === 'uncertain' ? { kind: 'uncertain' } : result;
  }
  return {
    read: async (request) => {
      if (scenario() === 'loading') return new Promise(() => {});
      return read(request);
    },
    write: async (intent) => write(intent),
  };
}
