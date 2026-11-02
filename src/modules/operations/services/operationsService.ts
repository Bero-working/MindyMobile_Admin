import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { z } from 'zod';
import { env } from '@/config/env';
import { appConfig } from '@/config/app';
import type { AuthService } from '@/modules/auth/types';
import type { Data, Failure, OperationsSource, Session, Order } from '../types';
import * as wire from './schemas';

class RequestFailure extends Error {
  constructor(readonly result: Failure) {
    super('Operations request failed');
  }
}
type Options = {
  baseURL?: string;
  client?: AxiosInstance;
  restore?: AuthService['restore'];
  onExpired?: () => void;
  isActive?: () => boolean;
};
export function createOperationsService({
  baseURL = env.API_URL,
  client = axios.create(),
  restore,
  onExpired,
  isActive = () => true,
}: Options = {}): OperationsSource {
  let renewing: ReturnType<AuthService['restore']> | undefined;
  const request = async (
    url: string,
    method: 'GET' | 'POST' | 'PATCH' = 'GET',
    params: Record<string, string | number> = {},
    data?: object,
    key?: string
  ) => {
    if (!isActive()) throw new RequestFailure({ kind: 'denied' });
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
      try {
        return await client.request<object | string | null>(config);
      } catch {
        throw new RequestFailure({
          kind: method === 'GET' ? 'error' : 'uncertain',
          code: 'NETWORK',
        });
      }
    };
    let response = await send();
    if (!isActive()) throw new RequestFailure({ kind: 'denied' });
    if (response.status === 401 && restore) {
      renewing ??= restore().finally(() => {
        renewing = undefined;
      });
      const renewed = await renewing;
      if (!isActive()) throw new RequestFailure({ kind: 'denied' });
      if (renewed.kind !== 'user' || renewed.user.role !== 'MANAGER') {
        if (renewed.kind !== 'error') onExpired?.();
        throw new RequestFailure({
          kind: renewed.kind === 'error' ? 'error' : 'denied',
          code: 'AUTH_REFRESH',
        });
      }
      response = await send();
    }
    if (!isActive()) throw new RequestFailure({ kind: 'denied' });
    if (response.status === 401) onExpired?.();
    if (response.status < 200 || response.status >= 300) {
      const problem = wire.error.safeParse(response.data);
      throw new RequestFailure({
        kind: [401, 403].includes(response.status)
          ? 'denied'
          : response.status === 404
            ? 'notFound'
            : method !== 'GET' &&
                (response.status >= 500 || response.status === 408)
              ? 'uncertain'
              : 'error',
        ...(problem.success ? problem.data : {}),
      });
    }
    const header = response.headers.date;
    const asOf =
      typeof header === 'string' && Number.isFinite(Date.parse(header))
        ? new Date(header).toISOString()
        : new Date().toISOString();
    return { body: response.data, asOf };
  };
  const resource = (value: string | undefined) =>
    encodeURIComponent(wire.id.parse(value));
  const mapSession = (s: z.infer<typeof wire.session>): Session => ({
    id: s.sessionId,
    classId: s.classId,
    unitId: s.classUnitId,
    classTitle: '',
    title: s.title,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    status: s.status,
    assignment: s.assignmentType,
    effectiveMentor: s.effectiveMentor?.displayName ?? null,
    effectiveMentorId: s.effectiveMentor?.id ?? null,
    primaryMentor: s.primaryMentor.displayName,
    version: s.version,
    asOf: s.asOf,
    readSessionContext: true,
    makeup: !!s.makeupForSessionId,
    makeupForSessionId: s.makeupForSessionId,
    room: null,
    meetingUrl: null,
    actualStart: s.actualStartedAt,
    actualEnd: s.actualEndedAt,
  });
  const mapOrder = (o: z.infer<typeof wire.order>): Order => ({
    ...o,
    details: o.details ?? [],
    confirmedBy: o.payment?.confirmedBy ?? null,
  });
  const failure = (error: object | string | null): Failure =>
    error instanceof RequestFailure
      ? error.result
      : { kind: 'error', code: 'INVALID_RESPONSE' };
  return {
    async read(r) {
      try {
        const paging = { page: r.page ?? 1, pageSize: r.pageSize ?? 20 };
        if (
          !Number.isInteger(paging.page) ||
          paging.page < 1 ||
          !Number.isInteger(paging.pageSize) ||
          paging.pageSize < 1 ||
          paging.pageSize > 100
        )
          return { kind: 'error', code: 'INVALID_INPUT' };
        let data: Data;
        if (r.kind === 'context') {
          const response = await request(
            `/class-sessions/${resource(r.id)}/context`
          );
          const body = wire.context.parse(response.body);
          if (body.session.sessionId !== r.id)
            return { kind: 'error', code: 'RESOURCE_MISMATCH' };
          data = {
            session: {
              ...mapSession(body.session),
              room: body.roomName,
              meetingUrl: body.meetingUrl,
            },
            total: 0,
            asOf: body.session.asOf,
          };
        } else if (r.kind === 'class') {
          const response = await request(`/manager/classes/${resource(r.id)}`);
          const body = wire.classInfo.parse(response.body);
          if (body.id !== r.id)
            return { kind: 'error', code: 'RESOURCE_MISMATCH' };
          data = { classInfo: body, total: 0, asOf: response.asOf };
        } else if (r.kind === 'candidates') {
          const response = await request(
            `/management/class-sessions/${resource(r.id)}/available-mentors`,
            'GET',
            {
              ...paging,
              ...(r.search?.trim()
                ? { search: r.search.trim().slice(0, 100) }
                : {}),
            }
          );
          const body = wire.candidates.parse(response.body);
          if (body.sessionId !== r.id)
            return { kind: 'error', code: 'RESOURCE_MISMATCH' };
          data = {
            candidates: body.items.map((m) => ({
              id: m.id,
              name: m.displayName,
              isCurrent: m.isCurrent,
            })),
            sessionVersion: body.sessionVersion,
            total: body.total,
            asOf: body.asOf,
          };
        } else if (r.kind === 'orders') {
          const response = await request('/manager/orders', 'GET', {
            ...paging,
            paymentType: 'CASH',
            ...(r.orderCode
              ? { orderCode: r.orderCode.trim().toUpperCase() }
              : {
                  ...(r.status
                    ? {
                        status: z
                          .enum(['PENDING', 'PAID', 'EXPIRED', 'CANCELLED'])
                          .parse(r.status),
                      }
                    : {}),
                  ...(r.classId ? { classId: wire.id.parse(r.classId) } : {}),
                }),
          });
          const body = wire.pageOf(wire.order).parse(response.body);
          if (body.items.some((o) => o.paymentType !== 'CASH'))
            return { kind: 'error', code: 'INVALID_RESPONSE' };
          data = {
            orders: body.items.map(mapOrder),
            total: body.total,
            asOf: response.asOf,
          };
        } else if (r.kind === 'order') {
          const response = await request(`/manager/orders/${resource(r.id)}`);
          const body = wire.order
            .extend({ details: z.array(wire.detail) })
            .parse(response.body);
          if (body.id !== r.id)
            return { kind: 'error', code: 'RESOURCE_MISMATCH' };
          data = { order: mapOrder(body), total: 0, asOf: response.asOf };
        } else if (r.kind === 'classes') {
          const response = await request('/manager/classes', 'GET', {
            ...paging,
            ...(r.search ? { q: r.search } : {}),
          });
          const body = wire.pageOf(wire.classInfo).parse(response.body);
          data = {
            classes: body.items,
            total: body.total,
            asOf: response.asOf,
          };
        } else {
          const response = await request(
            `/class-sessions/${resource(r.id)}/${r.status === 'IN_PROGRESS' ? 'attendance' : 'attendance-candidates'}`,
            'GET',
            { page: 1, pageSize: 1 }
          );
          const body = z
            .object({
              total: z.number().int().nonnegative().optional(),
              totals: z
                .object({
                  eligible: z.number().int().nonnegative(),
                  present: z.number().int().nonnegative(),
                  absent: z.number().int().nonnegative(),
                })
                .optional(),
            })
            .parse(response.body);
          data = {
            total: 0,
            asOf: response.asOf,
            ...(body.totals
              ? {
                  impact: {
                    total: body.totals.eligible,
                    present: body.totals.present,
                    absent: body.totals.absent,
                  },
                }
              : body.total !== undefined
                ? { impact: { total: body.total } }
                : {}),
          };
        }
        return { kind: 'success', data };
      } catch (error) {
        return failure(error as object);
      }
    },
    async write(intent) {
      let dispatched = false;
      try {
        const body = wire.bodies[intent.kind].parse(intent);
        const id = resource(intent.id);
        const cash = intent.kind === 'collect';
        const key = cash ? undefined : wire.id.parse(intent.key);
        const suffix = cash
          ? ''
          : intent.kind === 'assign'
            ? 'mentor'
            : intent.kind === 'reschedule'
              ? 'schedule'
              : intent.kind === 'replace'
                ? 'makeups'
                : 'cancel';
        dispatched = true;
        const response = await request(
          cash
            ? `/manager/cash-orders/${id}/confirm`
            : `/management/class-sessions/${id}/${suffix}`,
          cash || ['cancel', 'replace'].includes(intent.kind)
            ? 'POST'
            : 'PATCH',
          {},
          body,
          key
        );
        if (cash) {
          const result = wire.confirmation.parse(response.body);
          if (
            result.id !== intent.id ||
            result.paymentType !== 'CASH' ||
            result.status !== 'PAID'
          )
            return { kind: 'uncertain', code: 'INVALID_RESPONSE' };
          // Collector identity is intentionally absent: the caller must GET detail.
          return {
            kind: 'success',
            data: {
              total: 0,
              asOf: response.asOf,
              order: {
                ...result,
                student: { id: '', displayName: null },
                confirmedBy: null,
              },
            },
          };
        }
        const replacement =
          intent.kind === 'replace'
            ? z
                .object({
                  originalSessionId: wire.id,
                  originalVersion: z.number().int().positive(),
                  classEndDate: z.string().date(),
                  session: wire.session,
                })
                .parse(response.body)
            : undefined;
        const result =
          replacement?.session ?? wire.session.parse(response.body);
        if (
          replacement
            ? replacement.originalSessionId !== intent.id ||
              result.makeupForSessionId !== intent.id
            : result.sessionId !== intent.id
        )
          return { kind: 'uncertain', code: 'RESOURCE_MISMATCH' };
        return {
          kind: 'success',
          data: {
            session: mapSession(result),
            total: 0,
            asOf: result.asOf,
            ...(replacement ? { classEndDate: replacement.classEndDate } : {}),
          },
        };
      } catch (error) {
        return error instanceof RequestFailure
          ? error.result
          : {
              kind: dispatched ? 'uncertain' : 'error',
              code: dispatched ? 'INVALID_RESPONSE' : 'INVALID_INPUT',
            };
      }
    },
  };
}
