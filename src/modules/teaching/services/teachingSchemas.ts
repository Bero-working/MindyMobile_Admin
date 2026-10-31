import { z } from 'zod';

const id = z.string().uuid();
const count = z.number().int().nonnegative();
const instant = z.string().datetime({ offset: true });
export const classStatus = z.enum([
  'DRAFT',
  'OPEN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);
const mentor = z.object({ id, displayName: z.string().nullable() });
const assignment = z.enum(['PRIMARY', 'SUBSTITUTE', 'BOTH']);
export const classSummary = z.object({
  id,
  code: z.string(),
  name: z.string(),
  status: classStatus,
  startDate: z.string().date(),
  endDate: z.string().date(),
  deliveryMode: z.enum(['ONLINE', 'OFFLINE']),
  maxStudents: count,
  availableSeats: count,
  mentor,
  assignmentType: assignment,
  accessScope: z.enum(['CLASS', 'SESSION']),
});
export const workspace = z.object({
  id,
  classId: id,
  code: z.string(),
  name: z.string(),
  status: classStatus,
  course: z.object({ id, title: z.string() }),
  accessScope: z.enum(['CLASS', 'SESSION']),
  assignmentType: assignment,
  capabilities: z.object({
    readClass: z.boolean(),
    readClassRoster: z.boolean(),
  }),
  visibleUnitCount: count,
  visibleSessionCount: count,
});
export const enrollmentCounts = z.object({
  ACTIVE: count,
  PENDING_PAYMENT: count,
  COMPLETED: count,
  CANCELLED: count,
});
export const managerDetail = classSummary.extend({
  course: z.object({ id, code: z.string(), title: z.string() }),
  roomName: z.string().nullable(),
  unitCount: count,
  sessionCount: count,
  enrollmentCounts,
});
export const session = z.object({
  sessionId: id,
  classId: id,
  classUnitId: id,
  title: z.string(),
  startsAt: instant,
  endsAt: instant,
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  assignmentType: z.enum(['PRIMARY', 'SUBSTITUTE']),
  primaryMentor: mentor,
  effectiveMentor: mentor.nullable(),
  version: z.number().int().positive(),
  makeupForSessionId: id.nullable(),
  makeupRootSessionId: id.nullable(),
  actualStartedAt: instant.nullable(),
  actualEndedAt: instant.nullable(),
  capabilities: z.object({ readSessionContext: z.boolean() }).optional(),
});
export const context = z.object({
  session,
  accessScope: z.literal('SESSION'),
  roomName: z.string().nullable(),
  meetingUrl: z.string().nullable(),
});
export const unit = z.object({
  id,
  title: z.string(),
  position: z.number().int().positive(),
});
export const rosterStudent = z.object({
  enrollmentId: id,
  studentName: z.string().nullable(),
  enrollmentStatus: z.enum([
    'ACTIVE',
    'PENDING_PAYMENT',
    'COMPLETED',
    'CANCELLED',
  ]),
  orderStatus: z.enum(['PAID', 'PENDING', 'EXPIRED', 'CANCELLED']),
  paymentType: z.enum(['CASH', 'PAYOS']),
  paidAt: instant.nullable(),
  expiresAt: instant,
});
export const managerStudent = rosterStudent.extend({
  email: z.string().email(),
  phone: z.string().nullable(),
  studentStatus: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']),
});
export const sessionStudent = z.object({
  enrollmentId: id,
  student: mentor,
  entryType: z.enum(['REGULAR', 'MAKEUP']),
  makeupPlacementId: id.nullable(),
});
export const pageOf = <T extends z.ZodTypeAny>(item: T) =>
  z
    .object({
      items: z.array(item),
      page: z.number().int().positive(),
      pageSize: z.number().int().min(1).max(100),
      total: count,
    })
    .refine(
      (value) =>
        value.items.length <= value.pageSize &&
        value.items.length <= value.total
    );
