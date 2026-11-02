import type {
  TeachingSession,
  ClassStatus,
  OrderStatus,
} from '@/modules/teaching/types';
export type OperationsStackParams = {
  SubstituteAssignment: { sessionId: string; classTitle?: string };
  RescheduleSession: { sessionId: string; classTitle?: string };
  ReplacementSession: { sessionId: string; classTitle?: string };
  CashOrders: undefined;
  CashOrderDetail: { orderId: string; orderCode?: string };
};
export type Session = TeachingSession & {
  asOf: string;
  classTitle: string;
  makeupForSessionId: string | null;
};
export type ClassInfo = {
  id: string;
  name: string;
  status: ClassStatus;
  startDate: string;
  endDate: string;
};
export type Candidate = { id: string; name: string | null; isCurrent: boolean };
export type Order = {
  id: string;
  orderCode: string;
  paymentType: 'CASH' | 'PAYOS';
  status: OrderStatus;
  totalAmount: number;
  expiresAt: string;
  createdAt: string;
  paidAt: string | null;
  student: { id: string; displayName: string | null };
  confirmedBy: {
    id: string;
    displayName: string | null;
    source: 'MANAGER' | 'LEGACY_MENTOR';
  } | null;
  details: {
    id: string;
    classId: string;
    className: string;
    courseTitle: string;
    totalAmount: number;
    quantity: number;
    priceAmount: number;
  }[];
};
export type Read = {
  kind:
    | 'context'
    | 'class'
    | 'candidates'
    | 'impact'
    | 'orders'
    | 'order'
    | 'classes';
  id?: string | undefined;
  status?: string | undefined;
  search?: string;
  classId?: string;
  orderCode?: string;
  page?: number;
  pageSize?: number;
};
export type Data = {
  session?: Session;
  classInfo?: ClassInfo;
  candidates?: Candidate[];
  sessionVersion?: number;
  classes?: ClassInfo[];
  orders?: Order[];
  order?: Order;
  impact?: { total: number; present?: number; absent?: number };
  classEndDate?: string;
  total: number;
  asOf: string;
};
export type Failure = {
  kind: 'error' | 'offline' | 'denied' | 'notFound' | 'uncertain';
  code?: string | undefined;
  requestId?: string | undefined;
};
export type Result = { kind: 'success'; data: Data } | Failure;
export type Mutation =
  | {
      kind: 'assign' | 'reschedule' | 'cancel' | 'replace';
      id: string;
      key: string;
      expectedVersion: number;
      reason: string;
      mentorId?: string | null | undefined;
      startsAt?: string;
      endsAt?: string;
      title?: string;
      classUnitId?: string;
    }
  | { kind: 'collect'; id: string; receivedAmount: number };
export interface OperationsSource {
  read(request: Read): Promise<Result>;
  write(intent: Mutation): Promise<Result>;
}
export type Scenario =
  | 'success'
  | 'loading'
  | 'empty'
  | 'offline'
  | 'error'
  | 'denied'
  | 'notFound'
  | 'uncertain'
  | 'conflict'
  | 'stateConflict'
  | 'mentorBusy'
  | 'placements'
  | 'alreadyExists'
  | 'holdInvalid'
  | 'otherCollector';
