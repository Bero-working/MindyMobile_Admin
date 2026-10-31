export type TeachingRole = 'MENTOR' | 'MANAGER';
export type ClassStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';
export type SessionStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';
export type OrderStatus = 'PAID' | 'PENDING' | 'EXPIRED' | 'CANCELLED';
export type Scenario =
  | 'success'
  | 'loading'
  | 'empty'
  | 'offline'
  | 'error'
  | 'denied'
  | 'notFound'
  | 'refreshError'
  | 'noRoster'
  | 'studentsError'
  | 'unitError'
  | 'unavailable';
// UI models. Wire DTOs are validated and mapped by teachingService.
export type TeachingClass = {
  id: string;
  name: string;
  code: string;
  status: ClassStatus;
  scope: 'CLASS' | 'SESSION';
  assignment: 'PRIMARY' | 'SUBSTITUTE' | 'BOTH';
  mentor: string | null;
  startDate: string | null;
  endDate: string | null;
  deliveryMode: 'ONLINE' | 'OFFLINE' | null;
  availableSeats: number | null;
  maxStudents: number | null;
  course: string;
  readClassRoster: boolean;
  unitCount: number | null;
  sessionCount: number | null;
  currentUnit: number | null;
  elapsedSessions?: number | null;
  meetingUrl?: string | null;
  // Weekday indexes, 0 = Monday.
  scheduleDays: number[];
  scheduleTime: string | null;
  room: string | null;
  nextSessionAt: string | null;
  enrollmentCounts: Record<
    'ACTIVE' | 'PENDING_PAYMENT' | 'COMPLETED' | 'CANCELLED',
    number | null
  >;
};
export type TeachingSession = {
  id: string;
  classId: string;
  unitId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: SessionStatus;
  assignment: 'PRIMARY' | 'SUBSTITUTE';
  readSessionContext: boolean;
  effectiveMentor: string | null;
  effectiveMentorId: string | null;
  primaryMentor: string | null;
  room: string | null;
  meetingUrl: string | null;
  version: number;
  makeup: boolean;
  actualStart: string | null;
  actualEnd: string | null;
};
export type TeachingStudent = {
  id: string;
  name: string | null;
  enrollment: 'ACTIVE' | 'PENDING_PAYMENT' | 'COMPLETED' | 'CANCELLED' | null;
  order: OrderStatus | null;
  method: 'CASH' | 'PAYOS' | null;
  paidAt: string | null;
  expiresAt: string | null;
  email: string | null;
  phone: string | null;
  studentStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | null;
  admission: 'REGULAR' | 'MAKEUP';
};
export type TeachingUnit = { id: string; position: number; title: string };
export type TeachingData = {
  classes: TeachingClass[];
  sessions: TeachingSession[];
  students: TeachingStudent[];
  units: TeachingUnit[];
  total: number;
  classInfo?: TeachingClass;
  session?: TeachingSession;
};
export type TeachingRequest = {
  kind:
    | 'classes'
    | 'class'
    | 'schedule'
    | 'context'
    | 'students'
    | 'sessionStudents'
    | 'units'
    | 'sessions';
  role: TeachingRole;
  classId?: string;
  sessionId?: string;
  unitId?: string;
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  includeCardDetails?: boolean;
};
export type TeachingResult =
  | { kind: 'success'; data: TeachingData }
  | {
      kind: 'offline' | 'error' | 'denied' | 'notFound' | 'unavailable';
      requestId?: string;
    };
export interface TeachingSource {
  read(request: TeachingRequest): Promise<TeachingResult>;
}
export type TeachingStackParams = {
  TeachingSchedule: undefined;
  MentorClasses: undefined;
  MentorClassDetail: { classId: string };
  MentorStudents: { classId: string };
  SessionContext: { sessionId: string; classTitle?: string };
  ManagerClasses: undefined;
  ManagerClassDetail: { classId: string };
};
