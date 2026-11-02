import type {
  OperationsSource,
  Scenario,
  Order,
  Session,
  ClassInfo,
  Data,
} from '../types';
import type { TeachingSource } from '@/modules/teaching/types';

const clone = <T extends object>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;
export function createOperationsMock(
  teaching: TeachingSource,
  getScenario: () => Scenario = () => 'success',
  actorId = 'mock-manager'
): OperationsSource {
  const sessions = new Map<string, Session>(),
    replay = new Map<string, Data>();
  const now = () => new Date().toISOString();
  const classInfo: ClassInfo = {
    id: 'primary',
    name: 'IELTS 6.5 Intensive K08',
    status: 'OPEN',
    startDate: '2026-01-01',
    endDate: '2027-03-01',
  };
  const orders: Order[] = Array.from({ length: 48 }, (_, index) => ({
    id: `order-${index + 1}`,
    orderCode: `MD${String(index + 1).padStart(12, '0')}`,
    paymentType: 'CASH',
    status:
      index < 25
        ? 'PENDING'
        : index < 35
          ? 'PAID'
          : index < 42
            ? 'EXPIRED'
            : 'CANCELLED',
    totalAmount: 6500000,
    expiresAt: new Date(
      Date.now() + (index === 2 ? -1 : 1) * 86400000
    ).toISOString(),
    createdAt: new Date(Date.now() - index * 3600000).toISOString(),
    paidAt: index >= 25 && index < 35 ? now() : null,
    student: {
      id: `student-${index}`,
      displayName:
        index === 1 ? null : ['Ngô Bảo Ngọc', 'Châu Minh Khoa'][index % 2]!,
    },
    confirmedBy:
      index >= 25 && index < 35
        ? { id: actorId, displayName: 'Quản lý', source: 'MANAGER' }
        : null,
    details: [
      {
        id: `detail-${index}`,
        classId: classInfo.id,
        className: classInfo.name,
        courseTitle: 'IELTS Foundation',
        quantity: 1,
        priceAmount: 6500000,
        totalAmount: 6500000,
      },
    ],
  }));
  const source: OperationsSource = {
    async read(r) {
      const scenario = getScenario();
      if (scenario === 'loading') return new Promise(() => {});
      if (['denied', 'notFound', 'offline', 'error'].includes(scenario))
        return {
          kind: scenario as 'denied' | 'notFound' | 'offline' | 'error',
        };
      const data: Data = { total: 0, asOf: now() };
      const page = r.page ?? 1,
        size = r.pageSize ?? 20;
      if (r.kind === 'context') {
        const original = await teaching.read({
          kind: 'context',
          role: 'MANAGER',
          sessionId: r.id!,
        });
        if (original.kind !== 'success' || !original.data.session)
          return { kind: 'notFound' };
        data.session = sessions.get(r.id!) ?? {
          ...original.data.session,
          asOf: now(),
          classTitle: classInfo.name,
          makeupForSessionId: null,
        };
        sessions.set(data.session.id, data.session);
      } else if (r.kind === 'class')
        data.classInfo = { ...classInfo, id: r.id! };
      else if (r.kind === 'candidates') {
        const session = sessions.get(r.id!);
        let rows = Array.from({ length: 25 }, (_, i) => ({
          id: `mentor-${i}`,
          name: i === 0 ? 'Trần Mai' : i === 1 ? 'Ngô An' : `Phạm Bình ${i}`,
          isCurrent: session?.effectiveMentorId === `mentor-${i}`,
        }));
        if (r.search)
          rows = rows.filter((m) =>
            m.name.toLocaleLowerCase().includes(r.search!.toLocaleLowerCase())
          );
        if (scenario === 'empty') rows = [];
        data.total = rows.length;
        data.candidates = rows.slice((page - 1) * size, page * size);
        data.sessionVersion = session?.version ?? 1;
      } else if (r.kind === 'orders') {
        const filtered =
          scenario === 'empty'
            ? []
            : orders.filter((o) =>
                r.orderCode
                  ? o.orderCode === r.orderCode
                  : (!r.status || o.status === r.status) &&
                    (!r.classId ||
                      o.details.some((d) => d.classId === r.classId))
              );
        data.total = filtered.length;
        data.orders = clone(filtered.slice((page - 1) * size, page * size));
      } else if (r.kind === 'order') {
        const order = orders.find((o) => o.id === r.id);
        if (!order) return { kind: 'notFound' };
        data.order = clone(order);
      } else if (r.kind === 'classes') {
        data.classes = [classInfo].filter(
          (c) =>
            !r.search || c.name.toLowerCase().includes(r.search.toLowerCase())
        );
        data.total = data.classes.length;
      } else
        data.impact = {
          total: 18,
          ...(r.status === 'IN_PROGRESS' ? { present: 10, absent: 2 } : {}),
        };
      return { kind: 'success', data };
    },
    async write(intent) {
      const scenario = getScenario();
      if (scenario === 'denied') return { kind: 'denied' };
      if (scenario === 'offline') return { kind: 'offline' };
      const code = {
        conflict: 'SESSION_VERSION_CONFLICT',
        stateConflict: 'SESSION_STATE_CONFLICT',
        mentorBusy: 'CLASS_MENTOR_SCHEDULE_CONFLICT',
        placements: 'SESSION_HAS_MAKEUP_PLACEMENTS',
        alreadyExists: 'MAKEUP_ALREADY_EXISTS',
        holdInvalid: 'CASH_HOLD_INVALID',
      }[scenario as 'conflict'];
      if (code) return { kind: 'error', code, requestId: 'mock-p5' };
      if (intent.kind === 'collect') {
        const order = orders.find((o) => o.id === intent.id);
        if (!order) return { kind: 'notFound' };
        if (order.status !== 'PAID') {
          if (
            order.status !== 'PENDING' ||
            Date.parse(order.expiresAt) <= Date.now()
          )
            return { kind: 'error', code: 'CASH_ORDER_CLOSED' };
          if (intent.receivedAmount !== order.totalAmount)
            return { kind: 'error', code: 'CASH_CONFIRMATION_INVALID' };
          order.status = 'PAID';
          order.paidAt = now();
          order.confirmedBy = {
            id: scenario === 'otherCollector' ? 'another-manager' : actorId,
            displayName:
              scenario === 'otherCollector' ? 'Nguyễn Minh' : 'Quản lý',
            source: 'MANAGER',
          };
        }
        if (scenario === 'uncertain') return { kind: 'uncertain' };
        return {
          kind: 'success',
          data: { order: clone(order), total: 0, asOf: now() },
        };
      }
      if (replay.has(intent.key))
        return { kind: 'success', data: replay.get(intent.key)! };
      const old = sessions.get(intent.id);
      if (!old) return { kind: 'notFound' };
      if (intent.expectedVersion !== old.version)
        return { kind: 'error', code: 'SESSION_VERSION_CONFLICT' };
      const updated: Session = {
        ...old,
        version: old.version + 1,
        asOf: now(),
      };
      if (intent.kind === 'assign') {
        updated.assignment = intent.mentorId ? 'SUBSTITUTE' : 'PRIMARY';
        updated.effectiveMentorId = intent.mentorId ?? 'mentor-0';
        updated.effectiveMentor =
          intent.mentorId === 'mentor-1'
            ? 'Ngô An'
            : intent.mentorId
              ? `Phạm Bình ${intent.mentorId.split('-').pop()}`
              : old.primaryMentor;
      }
      if (intent.kind === 'reschedule' || intent.kind === 'replace') {
        updated.startsAt = intent.startsAt!;
        updated.endsAt = intent.endsAt!;
      }
      if (intent.kind === 'cancel') updated.status = 'CANCELLED';
      if (intent.kind === 'replace') {
        updated.id = `${old.id}-replacement`;
        updated.title = intent.title!;
        updated.status = 'SCHEDULED';
        updated.makeup = true;
        updated.makeupForSessionId = old.id;
        updated.assignment = 'PRIMARY';
        updated.effectiveMentor = old.primaryMentor;
        updated.actualStart = null;
        updated.actualEnd = null;
      }
      sessions.set(updated.id, updated);
      teaching.updateSession?.(updated);
      const data: Data = { session: updated, total: 0, asOf: now() };
      replay.set(intent.key, data);
      return scenario === 'uncertain'
        ? { kind: 'uncertain' }
        : { kind: 'success', data };
    },
  };
  return source;
}
