import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { z } from 'zod';
import { env } from '@/config/env';
import { appConfig } from '@/config/app';
import type { AuthService } from '@/modules/auth/types';
import type {
  LeaveData,
  LeaveRequest,
  LeaveSource,
  Outcome,
  SourceSession,
  Role,
} from '../types';
import * as wire from './schemas';
type Failure = Exclude<Outcome, { kind: 'success' }>;
class RequestFailure extends Error {
  constructor(readonly result: Failure) {
    super('Leave request failed');
  }
}
type Options = {
  baseURL?: string;
  client?: AxiosInstance;
  restore?: AuthService['restore'];
  onExpired?: () => void;
  isActive?: () => boolean;
  getRole?: () => Role | undefined;
};
export function createLeaveService({
  baseURL = env.API_URL,
  client = axios.create(),
  restore,
  onExpired,
  isActive = () => true,
  getRole,
}: Options = {}): LeaveSource {
  let renewing: ReturnType<AuthService['restore']> | undefined;
  const request = async (
    url: string,
    method: 'GET' | 'POST' = 'GET',
    params: Record<string, string | number> = {},
    data?: object,
    key?: string,
    mutation = false,
    role: Role = 'MENTOR'
  ) => {
    if (!isActive() || (getRole && getRole() !== role))
      throw new RequestFailure({ kind: 'denied' });
    if (!baseURL) throw new RequestFailure({ kind: 'error', code: 'CONFIG' });
    const network = await NetInfo.fetch();
    if (network.isConnected === false || network.isInternetReachable === false)
      throw new RequestFailure({ kind: 'offline' });
    const config: AxiosRequestConfig = {
      baseURL: baseURL.replace(/\/+$/, ''),
      url,
      method,
      params,
      withCredentials: true,
      timeout: appConfig.api.timeout,
      validateStatus: () => true,
      ...(data ? { data } : {}),
      ...(key ? { headers: { 'Idempotency-Key': key } } : {}),
    };
    const send = async () => {
      if (!isActive() || (getRole && getRole() !== role))
        throw new RequestFailure({ kind: 'denied' });
      try {
        return await client.request<object | string | null>(config);
      } catch {
        throw new RequestFailure({
          kind: mutation ? 'uncertain' : 'error',
          code: 'NETWORK',
        });
      }
    };
    let response = await send();
    if (!isActive() || (getRole && getRole() !== role))
      throw new RequestFailure({ kind: 'denied' });
    if (response.status === 401 && restore) {
      renewing ??= restore().finally(() => {
        renewing = undefined;
      });
      const renewed = await renewing;
      if (!isActive() || (getRole && getRole() !== role))
        throw new RequestFailure({ kind: 'denied' });
      if (renewed.kind !== 'user' || renewed.user.role !== role) {
        if (renewed.kind !== 'error') onExpired?.();
        throw new RequestFailure({
          kind: renewed.kind === 'error' ? 'error' : 'denied',
          code: 'AUTH_REFRESH',
        });
      }
      response = await send();
    }
    if (!isActive() || (getRole && getRole() !== role))
      throw new RequestFailure({ kind: 'denied' });
    if (response.status === 401) onExpired?.();
    if (response.status < 200 || response.status >= 300) {
      const problem = wire.error.safeParse(response.data);
      throw new RequestFailure({
        kind: [401, 403].includes(response.status)
          ? 'denied'
          : response.status === 404
            ? 'notFound'
            : mutation && (response.status >= 500 || response.status === 408)
              ? 'uncertain'
              : 'error',
        code: problem.success ? (problem.data.code ?? 'SERVER') : 'SERVER',
        ...(problem.success && problem.data.requestId
          ? { requestId: problem.data.requestId }
          : {}),
      });
    }
    return { body: response.data };
  };
  const resource = (value: string | undefined) =>
    encodeURIComponent(wire.id.parse(value));
  const mapSession = (s: z.infer<typeof wire.session>): SourceSession => ({
    id: s.sessionId,
    classId: s.classId,
    title: s.title,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    version: s.version,
    assignment: s.assignmentType,
  });
  const mapLeave = (r: z.infer<typeof wire.leave>): LeaveRequest => ({
    ...r,
    items: r.items.map((i) => ({ ...i, id: i.sourceSessionId })),
    // Only the manager detail endpoint supplies these authorization prerequisites.
    sourcesCurrent: false,
    studentConflicts: [],
  });
  const failure = (e: object | string | null): Failure =>
    e instanceof RequestFailure
      ? e.result
      : { kind: 'error', code: 'INVALID_RESPONSE' };
  const leavePrefix = (role: Role) =>
    role === 'MENTOR'
      ? '/mentor/leave-requests'
      : '/management/mentor-leave-requests';
  return {
    async read(r) {
      try {
        const paging = { page: r.page ?? 1, pageSize: r.pageSize ?? 20 };
        z.object({
          page: z.number().int().positive(),
          pageSize: z.number().int().min(1).max(100),
        }).parse(paging);
        if (
          (['preview', 'slots'].includes(r.kind) && r.role !== 'MENTOR') ||
          (['conflicts', 'candidates', 'mentors'].includes(r.kind) &&
            r.role !== 'MANAGER')
        )
          return { kind: 'denied' };
        const read = async (
          url: string,
          params: Record<string, string | number> = {},
          body?: object
        ) =>
          (
            await request(
              url,
              body ? 'POST' : 'GET',
              params,
              body,
              undefined,
              false,
              r.role
            )
          ).body;
        let data: LeaveData;
        if (r.kind === 'list') {
          const body = wire.pageOf(wire.leave).parse(
            await read(leavePrefix(r.role), {
              ...paging,
              ...(r.status ? { status: wire.status.parse(r.status) } : {}),
              ...(r.role === 'MANAGER' && r.mentorId
                ? { mentorId: wire.id.parse(r.mentorId) }
                : {}),
            })
          );
          data = { total: body.total, requests: body.items.map(mapLeave) };
        } else if (r.kind === 'detail') {
          const raw = await read(
            `${leavePrefix(r.role)}/${resource(r.id)}`,
            paging
          );
          const body = (
            r.role === 'MANAGER' ? wire.managerDetail : wire.leave
          ).parse(raw);
          if (body.id !== r.id)
            return { kind: 'error', code: 'RESOURCE_MISMATCH' };
          const mapped = mapLeave(body);
          if (r.role === 'MANAGER') {
            const detail = wire.managerDetail.parse(raw);
            mapped.sourcesCurrent = detail.sourcesCurrent;
            mapped.studentConflicts = detail.studentConflicts.map((c) => ({
              ...c,
              id: `${c.sourceSessionId}:${c.studentId}:${c.conflictingSessionId}`,
            }));
          }
          data = { total: body.itemCount, request: mapped };
        } else if (r.kind === 'preview') {
          const body = wire.preview.parse(
            await read(
              '/mentor/leave-requests/preview',
              {},
              wire.range.parse(r)
            )
          );
          if (
            body.affectedSessions.length !== body.sourceVersions.length ||
            body.affectedSessions.some(
              (s) =>
                !body.sourceVersions.some(
                  (v) => v.sessionId === s.sessionId && v.version === s.version
                )
            )
          )
            return { kind: 'error', code: 'INVALID_RESPONSE' };
          data = {
            total: body.affectedSessions.length,
            preview: {
              sources: body.affectedSessions.map(mapSession),
              sourceVersions: body.sourceVersions,
              noticeEligible: body.noticeEligible,
              noticeDeadline: body.noticeDeadline,
              asOf: body.asOf,
            },
          };
        } else if (r.kind === 'slots') {
          const body = wire.slots.parse(
            await read(
              '/mentor/leave-requests/makeup-slots',
              {},
              wire.slotsInput.parse({
                sourceSessionId: r.id,
                targetDate: r.targetDate,
                targetPeriod: r.targetPeriod,
              })
            )
          );
          data = {
            total: body.slots.length,
            slots: body.slots,
            sessionVersion: body.sessionVersion,
          };
        } else if (r.kind === 'conflicts') {
          const body = wire.pageOf(wire.conflict).parse(
            await read('/management/student-schedule-conflicts', {
              ...paging,
              ...(r.status
                ? { status: wire.conflictStatus.parse(r.status) }
                : {}),
              ...(r.classId ? { classId: wire.id.parse(r.classId) } : {}),
            })
          );
          data = {
            total: body.total,
            conflicts: body.items.map((c) => ({
              id: c.id,
              version: c.version,
              status: c.status,
              placementId: c.makeupPlacementId,
              placementVersion: c.makeupPlacementVersion,
              studentName: c.student.displayName,
              source: mapSession(c.sourceSession),
              intervals: c.conflictingIntervals,
            })),
          };
        } else if (r.kind === 'candidates') {
          const body = wire
            .pageOf(wire.candidate)
            .parse(
              await read(
                `/management/student-schedule-conflicts/${resource(r.id)}/makeup-candidates`,
                paging
              )
            );
          data = {
            total: body.total,
            candidates: body.items.map((c) => ({
              session: mapSession(c.session),
              remainingCapacity: c.remainingCapacity,
              mentorName: c.session.effectiveMentor?.displayName ?? null,
            })),
          };
        } else if (r.kind === 'classes') {
          const body = wire
            .pageOf(wire.classOption)
            .parse(
              await read(
                r.role === 'MENTOR' ? '/mentor/classes' : '/manager/classes',
                paging
              )
            );
          data = { total: body.total, options: body.items };
        } else if (r.id) {
          const body = wire.person.parse(
            await read(`/manager/mentors/${resource(r.id)}`)
          );
          if (body.id !== r.id)
            return { kind: 'error', code: 'RESOURCE_MISMATCH' };
          data = {
            total: 1,
            options: [{ id: body.id, name: body.displayName ?? '' }],
          };
        } else {
          const body = wire
            .pageOf(wire.person)
            .parse(await read('/manager/mentors', paging));
          data = {
            total: body.total,
            options: body.items.map((p) => ({
              id: p.id,
              name: p.displayName ?? '',
            })),
          };
        }
        return { kind: 'success', data };
      } catch (e) {
        return failure(e as object);
      }
    },
    async write(intent) {
      let dispatched = false;
      try {
        if (
          (['create', 'withdraw'].includes(intent.kind)
            ? 'MENTOR'
            : 'MANAGER') !== intent.role
        )
          return { kind: 'denied' };
        const body = wire.bodies[intent.kind].parse(intent.body);
        const key = wire.id.parse(intent.key);
        const target =
          intent.kind === 'create'
            ? '/mentor/leave-requests'
            : intent.kind === 'place'
              ? `/management/student-schedule-conflicts/${resource(intent.id)}/makeup-placement`
              : intent.kind === 'cancel'
                ? `/management/makeup-placements/${resource(intent.id)}/cancel`
                : `${leavePrefix(intent.role)}/${resource(intent.id)}/${intent.kind}`;
        dispatched = true;
        const response = await request(
          target,
          'POST',
          {},
          body,
          key,
          true,
          intent.role
        );
        let data: LeaveData;
        if (intent.kind === 'place') {
          const result = wire.createdPlacement.parse(response.body);
          if (
            result.placement.conflictId !== intent.id ||
            result.placement.targetSession.sessionId !==
              intent.body.targetSessionId ||
            result.placement.status !== 'ASSIGNED'
          )
            return { kind: 'uncertain' };
          data = {
            total: 0,
            placedSession: mapSession(result.placement.targetSession),
          };
        } else if (intent.kind === 'cancel') {
          const result = wire.placement.parse(response.body);
          if (result.id !== intent.id || result.status !== 'CANCELLED')
            return { kind: 'uncertain' };
          data = { total: 0 };
        } else {
          const approval =
            intent.kind === 'approve'
              ? wire.approval.parse(response.body)
              : undefined;
          const result = approval?.request ?? wire.leave.parse(response.body);
          const expectedStatus = {
            create: 'PENDING',
            withdraw: 'WITHDRAWN',
            approve: 'APPROVED',
            reject: 'REJECTED',
          }[intent.kind];
          if (
            (intent.id && result.id !== intent.id) ||
            result.status !== expectedStatus
          )
            return { kind: 'uncertain' };
          data = {
            total: result.itemCount,
            request: mapLeave(result),
            ...(approval
              ? { replacements: approval.replacements.map(mapSession) }
              : {}),
          };
        }
        return { kind: 'success', data };
      } catch (e) {
        return e instanceof RequestFailure
          ? e.result
          : {
              kind: dispatched ? 'uncertain' : 'error',
              code: dispatched ? 'INVALID_RESPONSE' : 'INVALID_INPUT',
            };
      }
    },
  };
}
