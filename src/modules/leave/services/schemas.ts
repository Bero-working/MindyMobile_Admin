import { z } from 'zod';
import { session, pageOf } from '@/modules/teaching/services/teachingSchemas';
export { session, pageOf };
export const id = z.string().uuid();
export const instant = z.string().datetime({ offset: true });
const count = z.number().int().nonnegative();
const version = z.number().int().positive();
export const period = z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'FULL_DAY']);
export const status = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'EXPIRED',
]);
export const conflictStatus = z.enum(['OPEN', 'MAKEUP_ASSIGNED', 'RESOLVED']);
export const slot = z.object({ startsAt: instant, endsAt: instant });
const extension = z.object({ classId: id, endDate: z.string().date() });
export const leave = z.object({
  id,
  mentorId: id,
  fromDate: z.string().date(),
  toDate: z.string().date(),
  period,
  reason: z.string(),
  status,
  version,
  submittedAt: instant,
  expiresAt: instant,
  itemCount: count,
  page: version,
  pageSize: version.max(100),
  items: z.array(
    slot.extend({
      classId: id,
      sourceSessionId: id,
      sourceVersion: version,
      sourceStartsAt: instant,
      sourceEndsAt: instant,
      replacementSessionId: id.nullable(),
    })
  ),
  classExtensions: z.array(extension),
  review: z
    .object({ reviewerId: id, reason: z.string(), reviewedAt: instant })
    .nullable(),
  studentConflictCount: count.nullable(),
  asOf: instant,
  timeZone: z.string(),
});
export const managerDetail = leave.extend({
  sourcesCurrent: z.boolean(),
  studentConflictCount: count,
  studentConflicts: z.array(
    z.object({ sourceSessionId: id, studentId: id, conflictingSessionId: id })
  ),
});
export const sourceVersion = z.object({ sessionId: id, version });
export const preview = z.object({
  affectedSessions: z.array(session).max(500),
  sourceVersions: z.array(sourceVersion).max(500),
  noticeEligible: z.boolean(),
  noticeDeadline: instant.nullable(),
  asOf: instant,
  timeZone: z.string(),
});
export const slots = z.object({
  slots: z.array(slot),
  sessionVersion: version,
  asOf: instant,
  timeZone: z.string(),
});
export const approval = z.object({
  request: leave,
  replacements: z.array(session),
  classExtensions: z.array(extension),
  studentConflictCount: count,
});
export const conflict = z.object({
  id,
  version,
  status: conflictStatus,
  makeupPlacementId: id.nullable(),
  makeupPlacementVersion: version.nullable(),
  student: z.object({ id, displayName: z.string().nullable() }),
  sourceSession: session,
  conflictingIntervals: z.array(slot.extend({ sessionId: id })),
});
export const candidate = z.object({ session, remainingCapacity: count });
export const placement = z.object({
  id,
  conflictId: id,
  targetSession: session,
  status: z.enum(['ASSIGNED', 'COMPLETED', 'CANCELLED', 'NEEDS_REASSIGNMENT']),
  version,
});
export const createdPlacement = z.object({
  placement,
  conflictVersion: version,
  targetSessionVersion: version,
});
export const person = z.object({ id, displayName: z.string().nullable() });
export const classOption = z.object({ id, name: z.string() });
export const range = z
  .object({ fromDate: z.string().date(), toDate: z.string().date(), period })
  .refine((v) => v.fromDate <= v.toDate);
export const slotsInput = z.object({
  sourceSessionId: id,
  targetDate: z.string().date(),
  targetPeriod: period,
});
const mutation = z.object({
  expectedVersion: version,
  reason: z.string().trim().min(1).max(1000),
});
export const bodies = {
  create: z
    .object({
      fromDate: z.string().date(),
      toDate: z.string().date(),
      period,
      reason: z.string().trim().min(1).max(1000),
      sourceVersions: z.array(sourceVersion).min(1).max(500),
      sessionMappings: z
        .array(
          slot.extend({
            sourceSessionId: id,
            targetDate: z.string().date(),
            targetPeriod: period,
          })
        )
        .min(1)
        .max(500),
    })
    .refine(
      (v) =>
        v.fromDate <= v.toDate &&
        v.sourceVersions.length === v.sessionMappings.length &&
        new Set(v.sourceVersions.map((s) => s.sessionId)).size ===
          v.sourceVersions.length &&
        new Set(v.sessionMappings.map((s) => s.sourceSessionId)).size ===
          v.sessionMappings.length &&
        v.sessionMappings.every(
          (s) =>
            Date.parse(s.startsAt) < Date.parse(s.endsAt) &&
            v.sourceVersions.some(
              (source) => source.sessionId === s.sourceSessionId
            )
        )
    ),
  withdraw: mutation,
  reject: mutation,
  approve: mutation.extend({ acknowledgeStudentConflicts: z.literal(false) }),
  cancel: mutation,
  place: mutation.extend({
    targetSessionId: id,
    expectedTargetVersion: version,
    contentMatchConfirmed: z.literal(true),
  }),
};
export const error = z.object({
  code: z.string().optional(),
  requestId: z.string().optional(),
});
