import { z } from 'zod';

const id = z.string().uuid();
const count = z.number().int().nonnegative();
const instant = z.string().datetime({ offset: true });
const person = z.object({ id, displayName: z.string().nullable() });
const paging = {
  total: count,
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
};
const source = { asOf: instant, timeZone: z.string().min(1) };
const counts = z.object({
  present: count,
  absent: count,
  unmarked: count,
  excluded: count,
  makeupPending: count,
  finalizedEligibleCount: count,
  rate: z.number().min(0).max(100).nullable(),
});
export const enrollmentSummary = counts.extend({
  enrollmentId: id,
  student: person,
});
export const classSummaryPage = z.object({
  classId: id,
  items: z.array(enrollmentSummary),
  ...paging,
  ...source,
  // The management DTO has no readonly field; the mentor DTO always does.
  readonly: z.boolean().optional(),
});
export const studentSummary = counts.extend({
  classId: id,
  ...source,
  readonly: z.boolean(),
  aggregationScope: z.literal('STUDENT_CLASS_HISTORY'),
});
export const historyItem = z.object({
  sessionId: id,
  enrollmentId: id,
  title: z.string(),
  startsAt: instant,
  sessionStatus: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  attendanceStatus: z.enum(['UNMARKED', 'PRESENT', 'ABSENT']).nullable(),
  attendanceApplicability: z.enum([
    'ELIGIBLE',
    'NOT_STARTED',
    'NOT_ELIGIBLE',
    'PAYMENT_PENDING',
    'LEGACY_NO_DATA',
    'MAKEUP_PENDING',
    'MAKEUP_CREDITED',
  ]),
  assignmentType: z.enum(['PRIMARY', 'SUBSTITUTE']),
  creditedAttendanceStatus: z.enum(['PRESENT', 'ABSENT']).nullable(),
});
export const historyPage = z.object({
  classId: id,
  items: z.array(historyItem),
  ...paging,
  ...source,
  readonly: z.boolean(),
});
export const progressSummary = z.object({
  enrollmentId: id,
  studentId: id,
  displayName: z.string(),
  storedUnitCount: count,
  untrackedUnitCount: count,
  invalidStoredUnitCount: count,
});
const progressEnvelope = {
  ...paging,
  ...source,
  completionPolicy: z.literal('UNDEFINED'),
};
export const progressPage = z.object({
  items: z.array(progressSummary),
  ...progressEnvelope,
});
export const progressUnit = z.object({
  enrollmentId: id,
  classUnitId: id,
  trackingStatus: z.enum(['STORED', 'UNTRACKED']),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).nullable(),
  progressPercent: z.string().nullable(),
  completedAt: instant.nullable(),
  dataQuality: z.enum(['VALID', 'INVALID_PERCENT', 'UNTRACKED']),
});
export const progressUnitPage = z.object({
  items: z.array(progressUnit),
  ...progressEnvelope,
});
export const unitLookup = z.object({
  items: z.array(z.object({ id, title: z.string(), position: count })),
});
export type EnrollmentSummary = z.infer<typeof enrollmentSummary>;
export type ClassSummaryPage = z.infer<typeof classSummaryPage>;
export type StudentSummary = z.infer<typeof studentSummary>;
export type HistoryItem = z.infer<typeof historyItem>;
export type HistoryPage = z.infer<typeof historyPage>;
export type ProgressSummary = z.infer<typeof progressSummary>;
export type ProgressPage = z.infer<typeof progressPage>;
export type ProgressUnit = z.infer<typeof progressUnit>;
export type ProgressUnitPage = z.infer<typeof progressUnitPage>;
export type AttendanceCounts = z.infer<typeof counts>;
