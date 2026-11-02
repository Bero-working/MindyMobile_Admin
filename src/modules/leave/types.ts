export type LeaveStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'EXPIRED';
export type Period = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'FULL_DAY';
export type Role = 'MENTOR' | 'MANAGER';
export type Slot = { startsAt: string; endsAt: string };
export type Mapping = Slot & {
  version: number;
  targetDate?: string;
  targetPeriod?: Period;
};
export type SourceSession = Slot & {
  id: string;
  classId: string;
  className?: string;
  title: string;
  version: number;
  assignment: 'PRIMARY' | 'SUBSTITUTE';
};
export type Preview = {
  sources: SourceSession[];
  sourceVersions: { sessionId: string; version: number }[];
  noticeEligible: boolean;
  noticeDeadline: string | null;
  asOf: string;
};
export type LeaveItem = Slot & {
  id: string;
  classId: string;
  sourceSessionId: string;
  sourceStartsAt: string;
  sourceEndsAt: string;
  replacementSessionId: string | null;
};
export type LeaveRequest = {
  id: string;
  mentorId: string;
  fromDate: string;
  toDate: string;
  period: Period;
  reason: string;
  status: LeaveStatus;
  version: number;
  submittedAt: string;
  expiresAt: string;
  itemCount: number;
  items: LeaveItem[];
  sourcesCurrent: boolean;
  studentConflictCount: number | null;
  studentConflicts: { id: string; sourceSessionId: string }[];
  review: { reason: string; reviewedAt: string } | null;
  classExtensions: { classId: string; endDate: string }[];
};
export type Conflict = {
  id: string;
  version: number;
  status: 'OPEN' | 'MAKEUP_ASSIGNED' | 'RESOLVED';
  placementId: string | null;
  placementVersion: number | null;
  studentName: string | null;
  source: SourceSession;
  intervals: Slot[];
};
export type Candidate = {
  session: SourceSession;
  mentorName: string | null;
  remainingCapacity: number;
};
export type Option = { id: string; name: string };
export type LeaveData = {
  total: number;
  requests?: LeaveRequest[];
  request?: LeaveRequest;
  preview?: Preview;
  slots?: Slot[];
  sessionVersion?: number;
  conflicts?: Conflict[];
  candidates?: Candidate[];
  options?: Option[];
  replacements?: SourceSession[];
  placedSession?: SourceSession;
};
export type ReadRequest = {
  kind:
    | 'list'
    | 'detail'
    | 'preview'
    | 'slots'
    | 'conflicts'
    | 'candidates'
    | 'classes'
    | 'mentors';
  role: Role;
  id?: string;
  status?: string;
  mentorId?: string;
  classId?: string;
  page?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  period?: Period;
  targetDate?: string;
  targetPeriod?: Period;
};
export type Outcome =
  | { kind: 'success'; data: LeaveData }
  | { kind: 'error'; code: string; requestId?: string }
  | { kind: 'offline' | 'denied' | 'notFound' | 'uncertain' };
export type LeaveIntent = {
  kind: 'create' | 'withdraw' | 'approve' | 'reject' | 'place' | 'cancel';
  role: Role;
  id?: string;
  key: string;
  body: {
    reason: string;
    expectedVersion?: number;
    acknowledgeStudentConflicts?: false;
    fromDate?: string;
    toDate?: string;
    period?: Period;
    sourceVersions?: Preview['sourceVersions'];
    sessionMappings?: (Slot & {
      sourceSessionId: string;
      targetDate: string;
      targetPeriod: Period;
    })[];
    targetSessionId?: string;
    expectedTargetVersion?: number;
    contentMatchConfirmed?: true;
  };
};
export type LeaveSource = {
  read: (request: ReadRequest) => Promise<Outcome>;
  write: (intent: LeaveIntent) => Promise<Outcome>;
};
export type Scenario =
  | 'success'
  | 'loading'
  | 'empty'
  | 'error'
  | 'offline'
  | 'denied'
  | 'notFound'
  | 'refreshError'
  | 'conflict'
  | 'uncertain'
  | 'late'
  | 'stale'
  | 'studentConflict'
  | 'full'
  | 'notEligible';
export type LeaveStackParams = {
  MentorLeaveList: undefined;
  LeavePlanEditor: undefined;
  MentorLeaveDetail: { requestId: string };
  LeaveReviewQueue: undefined;
  LeaveReviewDetail: { requestId: string };
  MakeupConflicts: undefined;
  MakeupPlacement: { conflictId: string; classId: string };
};
