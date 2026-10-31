import axios, { type AxiosInstance } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { z } from 'zod';
import { env } from '@/config/env';
import { appConfig } from '@/config/app';
import type { AuthService } from '@/modules/auth/types';
import type {
  TeachingClass,
  TeachingData,
  TeachingRequest,
  TeachingResult,
  TeachingSession,
  TeachingSource,
  TeachingStudent,
} from '../types';
import * as wire from './teachingSchemas';
import { classSessionSummary } from './classSessionSummary';

const empty = (): TeachingData => ({
  classes: [],
  sessions: [],
  students: [],
  units: [],
  total: 0,
});
const unknownClass = (): TeachingClass => ({
  id: '',
  code: '',
  name: '',
  status: 'DRAFT',
  scope: 'SESSION',
  assignment: 'SUBSTITUTE',
  mentor: null,
  startDate: null,
  endDate: null,
  deliveryMode: null,
  availableSeats: null,
  maxStudents: null,
  course: '',
  readClassRoster: false,
  unitCount: null,
  sessionCount: null,
  currentUnit: null,
  scheduleDays: [],
  scheduleTime: null,
  room: null,
  nextSessionAt: null,
  enrollmentCounts: {
    ACTIVE: null,
    PENDING_PAYMENT: null,
    COMPLETED: null,
    CANCELLED: null,
  },
});
const mapClass = (item: z.infer<typeof wire.classSummary>): TeachingClass => ({
  ...unknownClass(),
  ...item,
  scope: item.accessScope,
  assignment: item.assignmentType,
  mentor: item.mentor.displayName,
  readClassRoster: item.accessScope === 'CLASS',
});
const mapSession = (
  item: z.infer<typeof wire.session>,
  allowed = false
): TeachingSession => ({
  id: item.sessionId,
  classId: item.classId,
  unitId: item.classUnitId,
  title: item.title,
  startsAt: item.startsAt,
  endsAt: item.endsAt,
  status: item.status,
  assignment: item.assignmentType,
  readSessionContext: item.capabilities?.readSessionContext ?? allowed,
  effectiveMentor: item.effectiveMentor?.displayName ?? null,
  effectiveMentorId: item.effectiveMentor?.id ?? null,
  primaryMentor: item.primaryMentor.displayName,
  room: null,
  meetingUrl: null,
  version: item.version,
  makeup: !!(item.makeupForSessionId || item.makeupRootSessionId),
  actualStart: item.actualStartedAt,
  actualEnd: item.actualEndedAt,
});
const mapStudent = (
  item: z.infer<typeof wire.rosterStudent>
): TeachingStudent => ({
  id: item.enrollmentId,
  name: item.studentName,
  enrollment: item.enrollmentStatus,
  order: item.orderStatus,
  method: item.paymentType,
  paidAt: item.paidAt,
  expiresAt: item.expiresAt,
  email: null,
  phone: null,
  studentStatus: null,
  admission: 'REGULAR',
});
class ReadFailure extends Error {
  constructor(readonly result: TeachingResult) {
    super('Teaching request failed');
  }
}
type Options = {
  baseURL?: string;
  client?: AxiosInstance;
  restore?: AuthService['restore'];
  onExpired?: () => void;
  isActive?: () => boolean;
};
export function createTeachingService({
  baseURL = env.API_URL,
  client = axios.create(),
  restore,
  onExpired,
  isActive = () => true,
}: Options = {}): TeachingSource {
  let renewing: ReturnType<AuthService['restore']> | undefined;
  const get = async (
    url: string,
    params: Record<string, string | number> = {}
  ): Promise<object | string | null> => {
    if (!isActive()) throw new ReadFailure({ kind: 'denied' });
    if (!baseURL) throw new ReadFailure({ kind: 'error' });
    const network = await NetInfo.fetch();
    if (network.isConnected === false || network.isInternetReachable === false)
      throw new ReadFailure({ kind: 'offline' });
    const send = () =>
      client.request<object | string | null>({
        baseURL: baseURL.replace(/\/+$/, ''),
        url,
        method: 'GET',
        params,
        withCredentials: true,
        timeout: appConfig.api.timeout,
        validateStatus: () => true,
      });
    let response = await send();
    if (!isActive()) throw new ReadFailure({ kind: 'denied' });
    if (response.status === 401 && restore) {
      if (!renewing)
        renewing = restore().finally(() => {
          renewing = undefined;
        });
      const renewed = await renewing;
      if (!isActive()) throw new ReadFailure({ kind: 'denied' });
      if (renewed.kind === 'error')
        throw new ReadFailure({
          kind: renewed.error.code === 'offline' ? 'offline' : 'error',
        });
      if (renewed.kind === 'signedOut') {
        onExpired?.();
        throw new ReadFailure({ kind: 'denied' });
      }
      response = await send();
    }
    if (!isActive()) throw new ReadFailure({ kind: 'denied' });
    if (response.status === 401) onExpired?.();
    if (response.status !== 200) {
      const error = z
        .object({ requestId: z.string().max(200).optional() })
        .safeParse(response.data);
      throw new ReadFailure({
        kind:
          response.status === 401 || response.status === 403
            ? 'denied'
            : response.status === 404
              ? 'notFound'
              : 'error',
        ...(error.success && error.data.requestId
          ? { requestId: error.data.requestId }
          : {}),
      });
    }
    return response.data;
  };
  const resource = (value: string | undefined) => {
    if (!value || !z.string().uuid().safeParse(value).success)
      throw new ReadFailure({ kind: 'error' });
    return encodeURIComponent(value);
  };
  const enrichMentorCard = async (summary: TeachingClass) => {
    const url = `/mentor/classes/${resource(summary.id)}`;
    const item = { ...summary };
    try {
      // Fetch every page before computing progress; a partial page is misleading.
      const sessions: TeachingSession[] = [];
      for (let page = 1; ; page++) {
        const result = wire
          .pageOf(wire.session)
          .parse(await get(`${url}/sessions`, { page, pageSize: 100 }));
        if (result.items.some((session) => session.classId !== item.id))
          throw new ReadFailure({ kind: 'error' });
        const previous = sessions.length;
        const mapped = result.items.map((session) => mapSession(session));
        const unique = new Map([...sessions, ...mapped].map((s) => [s.id, s]));
        sessions.splice(0, sessions.length, ...unique.values());
        if (sessions.length >= result.total) break;
        if (sessions.length === previous)
          throw new ReadFailure({ kind: 'error' });
      }
      Object.assign(item, classSessionSummary(sessions));
    } catch (error) {
      // Optional details must not hide the list; revoked access still propagates.
      if (error instanceof ReadFailure && error.result.kind === 'denied')
        throw error;
    }
    return item;
  };
  return {
    async read(request: TeachingRequest): Promise<TeachingResult> {
      try {
        const data = empty();
        const paging = {
          page: request.page ?? 1,
          pageSize: request.pageSize ?? 20,
        };
        if (
          !Number.isInteger(paging.page) ||
          paging.page < 1 ||
          !Number.isInteger(paging.pageSize) ||
          paging.pageSize < 1 ||
          paging.pageSize > 100
        )
          return { kind: 'error' };
        const root =
          request.role === 'MENTOR' ? '/mentor/classes' : '/manager/classes';
        switch (request.kind) {
          case 'classes': {
            const params = {
              ...paging,
              ...(request.status
                ? { status: wire.classStatus.parse(request.status) }
                : {}),
              ...(request.role === 'MANAGER' && request.q?.trim()
                ? { q: request.q.trim() }
                : {}),
            };
            const result = wire
              .pageOf(wire.classSummary)
              .parse(await get(root, params));
            data.classes = result.items.map(mapClass);
            if (request.role === 'MENTOR' && request.includeCardDetails) {
              // Bound concurrency to avoid a burst of requests for large pages.
              for (let offset = 0; offset < data.classes.length; offset += 3) {
                const batch = await Promise.all(
                  data.classes
                    .slice(offset, offset + 3)
                    .map((item) => enrichMentorCard(item))
                );
                data.classes.splice(offset, batch.length, ...batch);
              }
            }
            data.total = result.total;
            break;
          }
          case 'class': {
            const body = await get(`${root}/${resource(request.classId)}`);
            if (request.role === 'MENTOR') {
              const item = wire.workspace.parse(body);
              if (
                item.id !== request.classId ||
                item.classId !== request.classId
              )
                return { kind: 'error' };
              if (!item.capabilities.readClass) return { kind: 'denied' };
              data.classInfo = {
                ...unknownClass(),
                id: item.id,
                name: item.name,
                code: item.code,
                status: item.status,
                course: item.course.title,
                scope: item.accessScope,
                assignment: item.assignmentType,
                readClassRoster:
                  item.accessScope === 'CLASS' &&
                  item.capabilities.readClassRoster,
                unitCount: item.visibleUnitCount,
                sessionCount: item.visibleSessionCount,
              };
            } else {
              const item = wire.managerDetail.parse(body);
              if (item.id !== request.classId) return { kind: 'error' };
              data.classInfo = {
                ...mapClass(item),
                course: `${item.course.code} · ${item.course.title}`,
                room: item.roomName,
                unitCount: item.unitCount,
                sessionCount: item.sessionCount,
                enrollmentCounts: item.enrollmentCounts,
              };
            }
            break;
          }
          case 'schedule':
          case 'sessions': {
            const schedule = request.kind === 'schedule';
            if (schedule && request.role !== 'MENTOR')
              return { kind: 'denied' };
            const params = {
              ...paging,
              ...(request.from ? { from: request.from } : {}),
              ...(request.to ? { to: request.to } : {}),
              ...(!schedule && request.unitId
                ? { unitId: request.unitId }
                : {}),
            };
            if (schedule && (!request.from || !request.to))
              return { kind: 'error' };
            const url = schedule
              ? '/mentor/schedule'
              : request.role === 'MENTOR'
                ? `${root}/${resource(request.classId)}/sessions`
                : `/management/classes/${resource(request.classId)}`;
            const body = await get(
              url,
              request.role === 'MANAGER' ? paging : params
            );
            const result =
              request.role === 'MANAGER'
                ? z
                    .object({
                      class: z.object({ id: z.literal(request.classId!) }),
                      sessions: wire.pageOf(wire.session),
                    })
                    .parse(body).sessions
                : wire.pageOf(wire.session).parse(body);
            if (
              !schedule &&
              result.items.some((item) => item.classId !== request.classId)
            )
              return { kind: 'error' };
            data.sessions = result.items.map((item) =>
              mapSession(item, schedule || request.role === 'MANAGER')
            );
            data.total = result.total;
            break;
          }
          case 'context': {
            const item = wire.context.parse(
              await get(
                `/class-sessions/${resource(request.sessionId)}/context`
              )
            );
            if (item.session.sessionId !== request.sessionId)
              return { kind: 'error' };
            data.session = {
              ...mapSession(item.session, true),
              room: item.roomName,
              meetingUrl: item.meetingUrl,
            };
            break;
          }
          case 'units': {
            const result = wire
              .pageOf(wire.unit)
              .parse(
                await get(`${root}/${resource(request.classId)}/units`, paging)
              );
            data.units = result.items;
            data.total = result.total;
            break;
          }
          case 'students': {
            const classId = resource(request.classId);
            // Check current server scope even for a direct/deep-linked roster request.
            if (request.role === 'MENTOR') {
              const shell = wire.workspace.parse(
                await get(`${root}/${classId}`)
              );
              if (
                shell.id !== request.classId ||
                shell.classId !== request.classId ||
                !shell.capabilities.readClass ||
                shell.accessScope !== 'CLASS' ||
                !shell.capabilities.readClassRoster
              )
                return { kind: 'denied' };
              // Reuse the authorized shell for the roster heading; the UI
              // does not need another class request before this scope check.
              data.classInfo = {
                ...unknownClass(),
                id: shell.id,
                name: shell.name,
                code: shell.code,
                status: shell.status,
                course: shell.course.title,
                scope: shell.accessScope,
                assignment: shell.assignmentType,
                readClassRoster: true,
                unitCount: shell.visibleUnitCount,
                sessionCount: shell.visibleSessionCount,
              };
            }
            const body = await get(`${root}/${classId}/students`, {
              ...paging,
              ...(request.status ? { orderStatus: request.status } : {}),
            });
            if (request.role === 'MANAGER') {
              const result = wire.pageOf(wire.managerStudent).parse(body);
              data.students = result.items.map((item) => ({
                ...mapStudent(item),
                email: item.email,
                phone: item.phone,
                studentStatus: item.studentStatus,
              }));
              data.total = result.total;
            } else {
              const result = wire.pageOf(wire.rosterStudent).parse(body);
              data.students = result.items.map(mapStudent);
              data.total = result.total;
            }
            break;
          }
          case 'sessionStudents': {
            const id = resource(request.sessionId);
            const current = wire.context.parse(
              await get(`/class-sessions/${id}/context`)
            );
            if (current.session.sessionId !== request.sessionId)
              return { kind: 'error' };
            if (current.session.status === 'CANCELLED')
              return { kind: 'unavailable' };
            const suffix =
              current.session.status === 'SCHEDULED'
                ? 'attendance-candidates'
                : 'attendance';
            const result = wire
              .pageOf(wire.sessionStudent)
              .parse(await get(`/class-sessions/${id}/${suffix}`, paging));
            data.students = result.items.map((item) => ({
              id: `${item.enrollmentId}:${item.makeupPlacementId ?? 'regular'}`,
              name: item.student.displayName,
              enrollment: null,
              order: null,
              method: null,
              paidAt: null,
              expiresAt: null,
              email: null,
              phone: null,
              studentStatus: null,
              admission: item.entryType,
            }));
            data.total = result.total;
            break;
          }
        }
        return { kind: 'success', data };
      } catch (error) {
        return error instanceof ReadFailure ? error.result : { kind: 'error' };
      }
    },
  };
}
