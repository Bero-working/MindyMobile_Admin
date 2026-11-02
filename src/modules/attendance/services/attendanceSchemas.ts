import { z } from 'zod';
import {
  session as teachingSession,
  pageOf,
  rosterStudent,
  classSummary,
} from '@/modules/teaching/services/teachingSchemas';
export { pageOf, rosterStudent, classSummary };
export const id = z.string().uuid();
export const instant = z.string().datetime({ offset: true });
export const count = z.number().int().nonnegative();
export const mark = z.enum(['UNMARKED', 'PRESENT', 'ABSENT']);
export const person = z.object({ id, displayName: z.string().nullable() });
export const permissions = z.object({
  canStart: z.boolean(),
  canEditAttendance: z.boolean(),
  canFinalize: z.boolean(),
  canSyncRoster: z.boolean(),
  canRecover: z.boolean(),
  canViewAttendanceAudits: z.boolean(),
});
export const session = teachingSession.extend({
  editableUntil: instant.nullable(),
  asOf: instant,
  timeZone: z.string(),
});
export const attendanceSession = session.extend({ permissions });
export const totals = z
  .object({ eligible: count, present: count, absent: count, unmarked: count })
  .refine((t) => t.eligible === t.present + t.absent + t.unmarked);
const identity = z.object({
  enrollmentId: id,
  entryType: z.enum(['REGULAR', 'MAKEUP']),
  makeupPlacementId: id.nullable(),
  student: person,
});
export const candidate = identity.refine((i) =>
  i.entryType === 'MAKEUP'
    ? i.makeupPlacementId !== null
    : i.makeupPlacementId === null
);
export const row = identity
  .extend({
    attendanceId: id,
    status: mark,
    checkedInAt: instant.nullable(),
    admittedAt: instant,
  })
  .refine((i) =>
    i.entryType === 'MAKEUP'
      ? i.makeupPlacementId !== null
      : i.makeupPlacementId === null
  );
export const roster = pageOf(row).and(
  z.object({ session: attendanceSession, totals, pendingPaymentCount: count })
);
export const candidates = pageOf(candidate).and(
  z.object({ provisional: z.literal(true), asOf: instant })
);
export const written = z.object({
  session: attendanceSession,
  totals,
  changedEnrollmentIds: z.array(id),
  changedMakeupPlacementIds: z.array(id),
});
export const note = z
  .object({
    sessionId: id,
    version: count,
    note: z
      .object({
        content: z.string(),
        nextSteps: z.string(),
        version: count,
        updatedAt: instant,
      })
      .nullable(),
  })
  .refine((n) => (n.note ? n.version === n.note.version : n.version === 0));
export const incomplete = pageOf(
  z.object({
    session,
    issue: z.enum(['OVERDUE_NOT_STARTED', 'STARTED_NOT_FINALIZED']),
    deadlineExpired: z.boolean().nullable(),
  })
).and(z.object({ asOf: instant, timeZone: z.string() }));
export const evidence = z.object({
  evidenceNote: z.string(),
  admissionBasis: z.enum(['PAID_BEFORE_START', 'CASH_LATE_ADMISSION']),
  paidAt: instant,
  oldSessionStatus: session.shape.status,
  newSessionStatus: session.shape.status,
  oldActualStartedAt: instant.nullable(),
  newActualStartedAt: instant,
  oldActualEndedAt: instant.nullable(),
  newActualEndedAt: instant,
});
export const audit = z.object({
  id,
  attendanceId: id,
  enrollmentId: id,
  entryType: z.enum(['REGULAR', 'MAKEUP']),
  makeupPlacementId: id.nullable(),
  actor: person,
  oldStatus: mark.nullable(),
  newStatus: mark,
  reason: z.string().nullable(),
  occurredAt: instant,
  action: z.enum(['ADMIT', 'MARK', 'FINALIZE', 'CORRECT', 'RECOVER']),
  version: count,
  recoveryAuditId: id.nullable(),
  recoveryEvidence: evidence.nullable(),
});
export const studentEnrollment = z.object({
  enrollmentId: id,
  class: z.object({
    id,
    name: z.string(),
    code: z.string(),
    status: classSummary.shape.status,
  }),
});
export const classSessions = z.object({
  class: z.object({
    id,
    name: z.string(),
    code: z.string(),
    status: classSummary.shape.status,
  }),
  sessions: pageOf(session),
});
export const error = z.object({
  code: z.string().optional(),
  requestId: z.string().max(200).optional(),
});
const withinCharacters = (value: string, max: number) =>
  Array.from(value).length <= max;
const reason = z
  .string()
  .trim()
  .min(1)
  .refine((value) => withinCharacters(value, 1000));
const base = z.object({
  expectedVersion: z.number().int().positive(),
  reason: reason.optional(),
});
export const mutation = {
  start: base.extend({ actualStartedAt: instant.optional() }),
  sync: base,
  bulk: base.extend({ checked: z.boolean() }),
  finalize: base.extend({ actualEndedAt: instant.optional() }),
  save: base
    .extend({
      records: z.array(z.object({ enrollmentId: id, status: mark })).max(100),
      guestRecords: z
        .array(z.object({ makeupPlacementId: id, status: mark }))
        .max(100)
        .optional(),
    })
    .refine((v) => v.records.length + (v.guestRecords?.length ?? 0) > 0),
  note: z.object({
    expectedVersion: count.max(2147483646),
    content: z.string().refine((value) => withinCharacters(value, 10000)),
    nextSteps: z.string().refine((value) => withinCharacters(value, 5000)),
  }),
  recover: base.extend({
    reason,
    evidenceNote: z
      .string()
      .trim()
      .min(1)
      .refine((value) => withinCharacters(value, 2000)),
    actualStartedAt: instant,
    actualEndedAt: instant,
    records: z
      .array(
        z.object({
          enrollmentId: id,
          status: z.enum(['PRESENT', 'ABSENT']),
          admissionBasis: z.enum(['PAID_BEFORE_START', 'CASH_LATE_ADMISSION']),
        })
      )
      .min(1)
      .max(1000),
  }),
};
