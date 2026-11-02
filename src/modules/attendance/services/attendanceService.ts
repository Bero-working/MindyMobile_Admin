import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { z } from 'zod';
import { env } from '@/config/env';
import { appConfig } from '@/config/app';
import type { AuthService } from '@/modules/auth/types';
import type {
  AttendanceSource,
  AttendanceData,
  AttendanceSession,
  Intent,
  ReadRequest,
  ReadResult,
  WriteResult,
} from '../types';
import { requestBytes } from '../model';
import * as wire from './attendanceSchemas';
const empty = (): AttendanceData => ({
  managementStudents: [],
  sessions: [],
  rows: [],
  total: 0,
  note: null,
  noteVersion: 0,
  incomplete: [],
  audits: [],
  students: [],
  classes: [],
});
const noPermissions = {
  canStart: false,
  canEditAttendance: false,
  canFinalize: false,
  canSyncRoster: false,
  canRecover: false,
  canViewAttendanceAudits: false,
};
class Failure extends Error {
  constructor(
    readonly kind: 'error' | 'offline' | 'denied' | 'notFound' | 'uncertain',
    readonly code?: string,
    readonly requestId?: string
  ) {
    super('Attendance request failed');
  }
}
type Options = {
  baseURL?: string | undefined;
  client?: AxiosInstance;
  restore?: AuthService['restore'];
  onExpired?: () => void;
  isActive?: () => boolean;
  userId?: string | undefined;
  noteOrigin?: string | undefined;
};
export function createAttendanceService({
  baseURL = env.API_URL,
  client = axios.create(),
  restore,
  onExpired,
  isActive = () => true,
  userId,
  noteOrigin = env.API_ORIGIN,
}: Options = {}): AttendanceSource {
  let renewing: ReturnType<AuthService['restore']> | undefined;
  const mapSession = (
    s: z.infer<typeof wire.session>,
    permissions = noPermissions,
    classTitle = ''
  ): AttendanceSession => ({
    id: s.sessionId,
    classId: s.classId,
    classTitle,
    title: s.title,
    status: s.status,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    actualStartedAt: s.actualStartedAt,
    actualEndedAt: s.actualEndedAt,
    effectiveMentor: s.effectiveMentor?.displayName ?? null,
    isEffectiveMentor: !!userId && s.effectiveMentor?.id === userId,
    editableUntil: s.editableUntil ?? '',
    asOf: s.asOf,
    version: s.version,
    permissions,
  });
  const resource = (value: string | undefined) => {
    if (!wire.id.safeParse(value).success)
      throw new Failure('error', 'INVALID_RESOURCE');
    return encodeURIComponent(value!);
  };
  const request = async (
    url: string,
    method: 'GET' | 'PUT' | 'POST' = 'GET',
    params: Record<string, string | number> = {},
    data?: object,
    key?: string,
    isNote = false
  ): Promise<object | string | null> => {
    if (!isActive()) throw new Failure('denied');
    if (!baseURL) throw new Failure('error', 'CONFIG');
    if (isNote && method !== 'GET' && !noteOrigin)
      throw new Failure('error', 'ORIGIN_NOT_CONFIGURED');
    const network = await NetInfo.fetch();
    if (network.isConnected === false || network.isInternetReachable === false)
      throw new Failure('offline', 'OFFLINE');
    const config: AxiosRequestConfig = {
      baseURL: baseURL.replace(/\/+$/, ''),
      url,
      method,
      params,
      withCredentials: true,
      timeout: appConfig.api.timeout,
      validateStatus: () => true,
      ...(data ? { data } : {}),
      ...(key
        ? {
            headers: {
              'Idempotency-Key': key,
              ...(isNote ? { Origin: noteOrigin! } : {}),
            },
          }
        : {}),
    };
    const send = async () => {
      if (!isActive()) throw new Failure('denied');
      try {
        return await client.request<object | string | null>(config);
      } catch {
        throw new Failure(method === 'GET' ? 'error' : 'uncertain', 'NETWORK');
      }
    };
    let response = await send();
    if (!isActive()) throw new Failure('denied');
    if (response.status === 401 && restore) {
      if (!renewing)
        renewing = restore().finally(() => {
          renewing = undefined;
        });
      const renewed = await renewing;
      if (!isActive()) throw new Failure('denied');
      if (renewed.kind === 'error')
        throw new Failure(
          renewed.error.code === 'offline' ? 'offline' : 'error',
          'AUTH_REFRESH'
        );
      if (renewed.kind === 'signedOut') {
        onExpired?.();
        throw new Failure('denied');
      }
      response = await send();
    }
    if (!isActive()) throw new Failure('denied');
    if (response.status === 401) onExpired?.();
    if (response.status !== 200) {
      const problem = wire.error.safeParse(response.data);
      throw new Failure(
        response.status === 401 || response.status === 403
          ? 'denied'
          : response.status === 404
            ? 'notFound'
            : method !== 'GET' && response.status >= 500
              ? 'uncertain'
              : 'error',
        problem.success ? problem.data.code : undefined,
        problem.success ? problem.data.requestId : undefined
      );
    }
    return response.data;
  };
  const get = (url: string, params: Record<string, string | number> = {}) =>
    request(url, 'GET', params);
  const classTimetable = async (
    classId: string
  ): Promise<AttendanceSession[]> => {
    const result = new Map<string, AttendanceSession>();
    for (let page = 1; ; page++) {
      const body = wire.classSessions.parse(
        await get(`/management/classes/${resource(classId)}`, {
          page,
          pageSize: 100,
        })
      );
      if (
        body.class.id !== classId ||
        body.sessions.items.some((item) => item.classId !== classId)
      )
        throw new Failure('error', 'RESOURCE_MISMATCH');
      if (body.sessions.page !== page)
        throw new Failure('error', 'INVALID_PAGE');
      const previous = result.size;
      body.sessions.items.forEach((item) =>
        result.set(
          item.sessionId,
          mapSession(item, noPermissions, body.class.name)
        )
      );
      if (result.size >= body.sessions.total) return [...result.values()];
      if (result.size === previous) throw new Failure('error', 'INVALID_PAGE');
    }
  };
  const read = async (r: ReadRequest): Promise<ReadResult> => {
    try {
      const data = empty();
      const paging = { page: r.page ?? 1, pageSize: r.pageSize ?? 20 };
      if (
        !Number.isInteger(paging.page) ||
        paging.page < 1 ||
        !Number.isInteger(paging.pageSize) ||
        paging.pageSize < 1 ||
        paging.pageSize > 100
      )
        return { kind: 'error', code: 'INVALID_PAGE' };
      if (
        r.role !== 'MANAGER' &&
        [
          'incomplete',
          'audits',
          'classes',
          'managerSessions',
          'managementStudents',
          'recoveryStudents',
        ].includes(r.kind)
      )
        return { kind: 'denied' };
      if (r.kind === 'attendance' || r.kind === 'context') {
        const body = wire.roster.parse(
          await get(
            `/class-sessions/${resource(r.sessionId)}/attendance`,
            r.kind === 'context' ? { page: 1, pageSize: 1 } : paging
          )
        );
        if (body.session.sessionId !== r.sessionId)
          throw new Failure('error', 'RESOURCE_MISMATCH');
        data.session = mapSession(body.session, body.session.permissions);
        data.totals = {
          ...body.totals,
          pendingPaymentCount: body.pendingPaymentCount,
        };
        data.total = body.total;
        data.rows = body.items.map((i) => ({
          id: i.attendanceId,
          enrollmentId: i.enrollmentId,
          makeupPlacementId: i.makeupPlacementId,
          entryType: i.entryType,
          name: i.student.displayName,
          status: i.status,
          checkedInAt: i.checkedInAt,
        }));
      } else if (r.kind === 'candidates') {
        const body = wire.candidates.parse(
          await get(
            `/class-sessions/${resource(r.sessionId)}/attendance-candidates`,
            paging
          )
        );
        data.total = body.total;
        data.rows = body.items.map((i) => ({
          id: i.makeupPlacementId ?? i.enrollmentId,
          enrollmentId: i.enrollmentId,
          makeupPlacementId: i.makeupPlacementId,
          entryType: i.entryType,
          name: i.student.displayName,
          status: 'UNMARKED',
          checkedInAt: null,
        }));
      } else if (r.kind === 'note') {
        if (r.role !== 'MENTOR') return { kind: 'denied' };
        const body = wire.note.parse(
          await get(`/class-sessions/${resource(r.sessionId)}/teaching-notes`)
        );
        if (body.sessionId !== r.sessionId)
          throw new Failure('error', 'RESOURCE_MISMATCH');
        data.note = body.note;
        data.noteVersion = body.version;
      } else if (r.kind === 'incomplete') {
        const body = wire.incomplete.parse(
          await get('/management/class-sessions/incomplete', {
            ...paging,
            ...(r.classId ? { classId: resource(r.classId) } : {}),
            ...(r.issue ? { issue: r.issue } : {}),
          })
        );
        data.incomplete = body.items.map((i) => ({
          id: i.session.sessionId,
          session: mapSession(i.session),
          issue: i.issue,
          deadlineExpired: i.deadlineExpired,
        }));
        data.total = body.total;
        data.sessions = data.incomplete.map((i) => i.session);
      } else if (r.kind === 'audits') {
        const body = wire.pageOf(wire.audit).parse(
          await get(
            `/management/class-sessions/${resource(r.sessionId)}/attendance-audits`,
            {
              ...paging,
              ...(r.enrollmentId
                ? { enrollmentId: resource(r.enrollmentId) }
                : {}),
              ...(r.makeupPlacementId
                ? { makeupPlacementId: resource(r.makeupPlacementId) }
                : {}),
            }
          )
        );
        data.audits = body.items.map((i) => ({
          ...i,
          actor: i.actor.displayName,
        }));
        data.total = body.total;
      } else if (r.kind === 'recoveryStudents') {
        const body = wire
          .pageOf(wire.rosterStudent)
          .parse(
            await get(
              `/manager/classes/${resource(r.classId)}/students`,
              paging
            )
          );
        data.students = body.items.map((i) => ({
          id: i.enrollmentId,
          name: i.studentName,
          enrollmentStatus: i.enrollmentStatus,
          paymentType: i.paymentType,
          paidAt: i.paidAt,
        }));
        data.total = body.total;
      } else if (r.kind === 'managementStudents') {
        const body = wire
          .pageOf(wire.person)
          .parse(await get('/manager/students', paging));
        data.managementStudents = body.items.map((i) => ({
          id: i.id,
          name: i.displayName,
          enrollments: [],
        }));
        data.total = body.total;
      } else if (r.kind === 'classes') {
        if (r.studentId) {
          const body = wire
            .pageOf(wire.studentEnrollment)
            .parse(
              await get(
                `/manager/students/${resource(r.studentId)}/classes`,
                paging
              )
            );
          data.classes = body.items.map((i) => ({
            id: i.class.id,
            name: i.class.name,
            code: i.class.code,
            status: i.class.status,
            mentor: null,
            startDate: null,
            endDate: null,
            deliveryMode: null,
            availableSeats: null,
            maxStudents: null,
          }));
          data.managementStudents = [
            {
              id: r.studentId,
              name: null,
              enrollments: body.items.map((i) => ({
                classId: i.class.id,
                enrollmentId: i.enrollmentId,
              })),
            },
          ];
          data.total = body.total;
        } else {
          const body = wire
            .pageOf(wire.classSummary)
            .parse(await get('/manager/classes', paging));
          data.classes = body.items.map((i) => ({
            ...i,
            mentor: i.mentor.displayName,
          }));
          data.total = body.total;
        }
      } else if (r.kind === 'managerSessions') {
        const items: AttendanceSession[] = [];
        if (r.classId) items.push(...(await classTimetable(r.classId)));
        else {
          // The global utility needs all in-progress sessions, including sessions not yet overdue.
          // Fetch class timetables only when that utility opens; never preload them on Home.
          const seen = new Set<string>();
          for (let page = 1; ; page++) {
            const index = wire
              .pageOf(wire.classSessions.shape.class)
              .parse(await get('/management/classes', { page, pageSize: 100 }));
            const previous = seen.size;
            for (const item of index.items) {
              if (seen.has(item.id)) continue;
              seen.add(item.id);
              items.push(...(await classTimetable(item.id)));
            }
            if (seen.size >= index.total) break;
            if (seen.size === previous)
              throw new Failure('error', 'INVALID_PAGE');
          }
        }
        const filtered = items
          .filter(
            (item) =>
              (!r.status || item.status === r.status) &&
              (r.mode === 'finalize'
                ? item.status === 'IN_PROGRESS'
                : r.mode === 'history'
                  ? true
                  : !!item.actualStartedAt)
          )
          .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));
        data.total = filtered.length;
        data.sessions = filtered.slice(
          (paging.page - 1) * paging.pageSize,
          paging.page * paging.pageSize
        );
      }
      if (!isActive()) return { kind: 'denied' };
      return { kind: 'success', data };
    } catch (error) {
      if (error instanceof Failure)
        return {
          kind: error.kind === 'uncertain' ? 'error' : error.kind,
          ...(error.code ? { code: error.code } : {}),
          ...(error.requestId ? { requestId: error.requestId } : {}),
        };
      return { kind: 'error', code: 'INVALID_RESPONSE' };
    }
  };
  return {
    read,
    async write(intent: Intent): Promise<WriteResult> {
      try {
        resource(intent.sessionId);
        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            intent.key
          )
        )
          return { kind: 'error', code: 'INVALID_KEY' };
        if (intent.kind === 'updateSession')
          return { kind: 'error', code: 'UNAVAILABLE' };
        if (intent.kind === 'note' && intent.role !== 'MENTOR')
          return { kind: 'denied' };
        if (intent.kind === 'recover' && intent.role !== 'MANAGER')
          return { kind: 'denied' };
        if (intent.role === 'MANAGER' && !intent.reason?.trim())
          return { kind: 'error', code: 'REASON_REQUIRED' };
        const raw = {
          expectedVersion: intent.expectedVersion,
          ...(intent.reason ? { reason: intent.reason } : {}),
          ...(intent.kind === 'start' && intent.actualStartedAt
            ? { actualStartedAt: intent.actualStartedAt }
            : {}),
          ...(intent.kind === 'finalize' && intent.actualEndedAt
            ? { actualEndedAt: intent.actualEndedAt }
            : {}),
          ...(intent.kind === 'bulk' ? { checked: intent.checked } : {}),
          ...(intent.kind === 'save'
            ? {
                records: intent.records ?? [],
                ...(intent.guestRecords
                  ? { guestRecords: intent.guestRecords }
                  : {}),
              }
            : {}),
          ...(intent.kind === 'note'
            ? { content: intent.content, nextSteps: intent.nextSteps }
            : {}),
          ...(intent.kind === 'recover'
            ? {
                records: intent.recoveryRecords,
                evidenceNote: intent.evidenceNote,
                actualStartedAt: intent.actualStartedAt,
                actualEndedAt: intent.actualEndedAt,
              }
            : {}),
        };
        if (intent.kind === 'recover' && requestBytes(raw) > 256 * 1024)
          return { kind: 'error', code: 'PAYLOAD_TOO_LARGE' };
        const parsed = wire.mutation[intent.kind].safeParse(raw);
        if (!parsed.success) return { kind: 'error', code: 'INVALID_INPUT' };
        if (
          intent.role === 'MANAGER' &&
          intent.kind === 'finalize' &&
          !intent.actualEndedAt
        )
          return { kind: 'error', code: 'INVALID_INPUT' };
        const suffix = {
          start: 'start',
          save: 'attendance',
          bulk: 'attendance/bulk',
          sync: 'attendance/sync-roster',
          finalize: 'finalize',
          note: 'teaching-notes',
          recover: 'attendance/recover',
        }[intent.kind];
        const url = `${intent.kind === 'recover' ? '/management' : ''}/class-sessions/${resource(intent.sessionId)}/${suffix}`;
        const body = await request(
          url,
          ['save', 'bulk', 'note'].includes(intent.kind) ? 'PUT' : 'POST',
          {},
          parsed.data,
          intent.key,
          intent.kind === 'note'
        );
        const data = empty();
        let changed = 0;
        if (intent.kind === 'note') {
          const result = wire.note.parse(body);
          if (result.sessionId !== intent.sessionId)
            throw new Failure('uncertain', 'INVALID_RESPONSE');
          data.note = result.note;
          data.noteVersion = result.version;
        } else {
          const result = wire.written.parse(body);
          if (result.session.sessionId !== intent.sessionId)
            throw new Failure('uncertain', 'INVALID_RESPONSE');
          data.session = mapSession(result.session, result.session.permissions);
          data.totals = { ...result.totals, pendingPaymentCount: 0 };
          changed =
            result.changedEnrollmentIds.length +
            result.changedMakeupPlacementIds.length;
        }
        return { kind: 'success', data, changed };
      } catch (error) {
        if (error instanceof Failure)
          return {
            kind: error.kind === 'offline' ? 'error' : error.kind,
            ...(error.code ? { code: error.code } : {}),
            ...(error.requestId ? { requestId: error.requestId } : {}),
          };
        return { kind: 'uncertain', code: 'INVALID_RESPONSE' };
      }
    },
  };
}
