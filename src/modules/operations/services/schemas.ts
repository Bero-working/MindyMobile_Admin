import { z } from 'zod';
import {
  session as baseSession,
  pageOf,
  classStatus,
} from '@/modules/teaching/services/teachingSchemas';
export const id = z.string().uuid();
export const instant = z.string().datetime({ offset: true });
export const money = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const person = z.object({ id, displayName: z.string().nullable() });
export const collector = person.extend({
  source: z.enum(['MANAGER', 'LEGACY_MENTOR']),
});
export const session = baseSession.extend({
  asOf: instant,
  timeZone: z.string(),
});
export const context = z.object({
  session,
  roomName: z.string().nullable(),
  meetingUrl: z.string().nullable(),
});
export const classInfo = z.object({
  id,
  name: z.string(),
  status: classStatus,
  startDate: z.string().date(),
  endDate: z.string().date(),
});
export const candidates = pageOf(person.extend({ isCurrent: z.boolean() })).and(
  z.object({
    sessionId: id,
    sessionVersion: z.number().int().positive(),
    asOf: instant,
  })
);
export const orderBase = z.object({
  id,
  orderCode: z.string(),
  paymentType: z.enum(['CASH', 'PAYOS']),
  status: z.enum(['PENDING', 'PAID', 'EXPIRED', 'CANCELLED']),
  totalAmount: money,
  expiresAt: instant,
  paidAt: instant.nullable(),
  createdAt: instant,
});
export const detail = z.object({
  id,
  classId: id,
  className: z.string(),
  courseTitle: z.string(),
  totalAmount: money,
  priceAmount: money,
  quantity: z.number().int().positive(),
});
export const order = orderBase.extend({
  student: person,
  payment: z.object({ confirmedBy: collector.nullable() }).nullable(),
  details: z.array(detail).optional(),
});
export const confirmation = orderBase.extend({ details: z.array(detail) });
export const error = z.object({
  code: z.string().optional(),
  requestId: z.string().optional(),
});
const intent = z.object({
  expectedVersion: z.number().int().positive(),
  reason: z.string().trim().min(1).max(1000),
});
export const bodies = {
  assign: intent.extend({ mentorId: id.nullable() }),
  reschedule: intent.extend({ startsAt: instant, endsAt: instant }),
  cancel: intent,
  replace: intent.extend({
    classUnitId: id,
    title: z.string().trim().min(1).max(250),
    startsAt: instant,
    endsAt: instant,
  }),
  collect: z.object({ receivedAmount: money.refine((n) => n > 0) }),
};
export { pageOf };
