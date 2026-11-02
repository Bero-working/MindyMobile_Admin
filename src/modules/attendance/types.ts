import type {
  SessionStatus,
  TeachingClass,
  TeachingRole,
} from '@/modules/teaching/types';

// UI models; HTTP DTO validation and mapping live in services/attendanceSchemas.ts.
export type Mark = 'UNMARKED' | 'PRESENT' | 'ABSENT';
export type AttendanceRow = {
  id: string;
  enrollmentId: string;
  makeupPlacementId: string | null;
  name: string | null;
  entryType: 'REGULAR' | 'MAKEUP';
  status: Mark;
  checkedInAt: string | null;
};
export type Permissions = {
  canStart: boolean;
  canEditAttendance: boolean;
  canSyncRoster: boolean;
  canFinalize: boolean;
  canRecover: boolean;
  canViewAttendanceAudits: boolean;
};
export type AttendanceSession = {
  id: string;
  classId: string;
  classTitle: string;
  title: string;
  status: SessionStatus;
  startsAt: string;
  endsAt: string;
  actualStartedAt: string | null;
  actualEndedAt: string | null;
  effectiveMentor: string | null;
  isEffectiveMentor: boolean;
  editableUntil: string;
  asOf: string;
  version: number;
  permissions: Permissions;
};
export type Totals = {
  eligible: number;
  present: number;
  absent: number;
  unmarked: number;
  pendingPaymentCount: number | null;
};
export type Note = { content: string; nextSteps: string; updatedAt: string };
export type RecoveryStudent = {
  id: string;
  name: string | null;
  enrollmentStatus: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PENDING_PAYMENT';
  paymentType: 'CASH' | 'PAYOS';
  paidAt: string | null;
};
export type Basis = 'PAID_BEFORE_START' | 'CASH_LATE_ADMISSION';
export type RecoveryRecord = {
  enrollmentId: string;
  status: Mark;
  admissionBasis: Basis;
};
export type Evidence = {
  evidenceNote: string;
  admissionBasis: Basis;
  paidAt: string;
  oldSessionStatus: SessionStatus;
  newSessionStatus: SessionStatus;
  oldActualStartedAt: string | null;
  newActualStartedAt: string;
  oldActualEndedAt: string | null;
  newActualEndedAt: string;
};
export type Audit = {
  id: string;
  attendanceId: string;
  enrollmentId: string;
  makeupPlacementId: string | null;
  entryType: 'REGULAR' | 'MAKEUP';
  action: 'ADMIT' | 'MARK' | 'FINALIZE' | 'CORRECT' | 'RECOVER';
  occurredAt: string;
  oldStatus: Mark | null;
  newStatus: Mark;
  actor: string | null;
  reason: string | null;
  recoveryEvidence: Evidence | null;
};
export type Issue = 'OVERDUE_NOT_STARTED' | 'STARTED_NOT_FINALIZED';
export type Incomplete = {
  id: string;
  session: AttendanceSession;
  issue: Issue;
  deadlineExpired: boolean | null;
};
export type ManagementStudent = {
  id: string;
  name: string | null;
  enrollments: {
    classId: string;
    enrollmentId: string;
    makeupPlacementId?: string;
  }[];
};
export type AttendanceData = {
  managementStudents: ManagementStudent[];
  sessions: AttendanceSession[];
  session?: AttendanceSession;
  rows: AttendanceRow[];
  total: number;
  totals?: Totals;
  note: Note | null;
  noteVersion: number;
  incomplete: Incomplete[];
  audits: Audit[];
  students: RecoveryStudent[];
  classes: Pick<
    TeachingClass,
    | 'id'
    | 'name'
    | 'code'
    | 'status'
    | 'mentor'
    | 'startDate'
    | 'endDate'
    | 'deliveryMode'
    | 'availableSeats'
    | 'maxStudents'
  >[];
};
export type ReadRequest = {
  kind:
    | 'context'
    | 'attendance'
    | 'candidates'
    | 'note'
    | 'incomplete'
    | 'audits'
    | 'recoveryStudents'
    | 'managerSessions'
    | 'classes'
    | 'managementStudents';
  studentId?: string;
  mode?: 'correction' | 'history' | 'finalize';
  status?: SessionStatus;
  role: TeachingRole;
  sessionId?: string;
  page?: number;
  pageSize?: number;
  issue?: Issue;
  classId?: string;
  enrollmentId?: string;
  makeupPlacementId?: string;
};
export type FailureKind =
  | 'error'
  | 'offline'
  | 'denied'
  | 'notFound'
  | 'unavailable';
export type ReadResult =
  | { kind: 'success'; data: AttendanceData }
  | { kind: FailureKind; requestId?: string; code?: string };
export type Intent = {
  key: string;
  sessionId: string;
  role: TeachingRole;
  expectedVersion: number;
  kind:
    | 'start'
    | 'save'
    | 'bulk'
    | 'sync'
    | 'finalize'
    | 'note'
    | 'recover'
    | 'updateSession';
  title?: string;
  startsAt?: string;
  endsAt?: string;
  records?: { enrollmentId: string; status: Mark }[];
  guestRecords?: { makeupPlacementId: string; status: Mark }[];
  checked?: boolean;
  reason?: string;
  actualEndedAt?: string;
  actualStartedAt?: string;
  content?: string;
  nextSteps?: string;
  evidenceNote?: string;
  recoveryRecords?: RecoveryRecord[];
};
export type WriteResult =
  | { kind: 'success'; data: AttendanceData; changed: number }
  | {
      kind: 'uncertain' | 'error' | 'denied' | 'notFound';
      code?: string;
      requestId?: string;
    };
export type AttendanceScenario =
  | 'success'
  | 'loading'
  | 'empty'
  | 'offline'
  | 'error'
  | 'denied'
  | 'notFound'
  | 'uncertain'
  | 'conflict'
  | 'expired'
  | 'stateConflict'
  | 'recordExists'
  | 'clockConflict'
  | 'evidenceInvalid'
  | 'refreshError';
export interface AttendanceSource {
  read(request: ReadRequest): Promise<ReadResult>;
  write(intent: Intent): Promise<WriteResult>;
}
export type Draft = Record<
  string,
  { baseStatus: Mark; status: Mark; entryType?: 'REGULAR' | 'MAKEUP' }
>;
export type AttendanceStackParams = {
  AttendanceManagement: undefined;
  StudentAttendanceForm: { student: ManagementStudent };
  ManagerFinalizeSessions: undefined;
  ManagerFinalize: { sessionId: string; classTitle?: string };
  AttendanceEditor: { sessionId: string; classTitle?: string };
  TeachingNoteEditor: { sessionId: string; classTitle?: string };
  IncompleteSessions: undefined;
  AttendanceCorrection: {
    enrollmentId?: string;
    makeupPlacementId?: string;
    studentName?: string;
    sessionId: string;
    classTitle?: string;
    classId?: string;
    utilityTabs?: boolean;
  };
  AttendanceRecovery: {
    sessionId: string;
    classTitle?: string;
    enrollmentId?: string;
  };
  AttendanceAudits: {
    classId?: string;
    utilityTabs?: boolean;
    sessionId: string;
    classTitle?: string;
    enrollmentId?: string;
    makeupPlacementId?: string;
    studentName?: string;
  };
};
