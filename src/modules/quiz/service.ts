import axios, { type AxiosInstance } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { z } from 'zod';
import { env } from '@/config/env';
import { appConfig } from '@/config/app';
import type { AuthService } from '@/modules/auth/types';
import { detailSchema, fromWire, pageSchema, quizSchema, uuid } from './schema';
import { validateMetadata, validateQuestions } from './model';
import type { MockCommand } from './QuizProvider';
import type { Quiz, QuizStatus } from './types';
export class QuizError extends Error {
  constructor(
    readonly kind:
      | 'error'
      | 'offline'
      | 'denied'
      | 'notFound'
      | 'conflict'
      | 'uncertain',
    readonly code = '',
    readonly requestId = ''
  ) {
    super(code || kind);
  }
}
export type ListQuery = {
  classId: string;
  sessionId?: string;
  filterSession?: string;
  status?: QuizStatus | '';
  page?: number;
  pageSize?: number;
};
export type QuizPageData = {
  items: Quiz[];
  total: number;
  page: number;
  pageSize: number;
};
type Options = {
  baseURL?: string | undefined;
  origin?: string | undefined;
  client?: AxiosInstance;
  restore?: AuthService['restore'];
  onExpired?: () => void;
  isActive?: () => boolean;
  timeout?: number;
};
export function createQuizService({
  baseURL = env.API_URL,
  origin = env.API_ORIGIN,
  client = axios.create(),
  restore,
  onExpired,
  isActive = () => true,
  timeout = appConfig.api.timeout,
}: Options = {}) {
  let renewing: ReturnType<AuthService['restore']> | undefined;
  let serverDate: number | undefined;
  let receivedAt = 0;
  const resource = (id: string) => {
    if (!uuid.safeParse(id).success)
      throw new QuizError('error', 'INVALID_RESOURCE');
    return encodeURIComponent(id);
  };
  async function request(
    url: string,
    method = 'GET',
    params: Record<string, string | number> = {},
    data?: object,
    expectedStatus?: number
  ) {
    if (!isActive()) throw new QuizError('denied');
    if (!baseURL) throw new QuizError('error', 'CONFIG');
    const write = method !== 'GET';
    if (write && !origin) throw new QuizError('error', 'ORIGIN_NOT_CONFIGURED');
    const network = await NetInfo.fetch();
    if (network.isConnected === false || network.isInternetReachable === false)
      throw new QuizError('offline');
    const config = {
      baseURL: baseURL.replace(/\/+$/, ''),
      url,
      method,
      params,
      ...(data ? { data } : {}),
      headers: write ? { Origin: origin! } : {},
      withCredentials: true,
      timeout,
      validateStatus: () => true,
    };
    const send = async () => {
      if (!isActive()) throw new QuizError('denied');
      try {
        return await client.request<object | string | null>(config);
      } catch {
        if (!isActive()) throw new QuizError('denied');
        throw new QuizError(write ? 'uncertain' : 'error', 'NETWORK');
      }
    };
    let response = await send();
    if (!isActive()) throw new QuizError('denied');
    if (response.status === 401 && restore) {
      renewing ??= restore().finally(() => {
        renewing = undefined;
      });
      const result = await renewing;
      if (!isActive()) throw new QuizError('denied');
      if (result.kind === 'user') response = await send();
      else if (result.kind === 'signedOut') {
        onExpired?.();
        throw new QuizError('denied');
      } else
        throw new QuizError(
          result.error.code === 'offline' ? 'offline' : 'error',
          'AUTH_REFRESH'
        );
    }
    if (!isActive()) throw new QuizError('denied');
    const date = response.headers?.date;
    if (typeof date === 'string' && Number.isFinite(Date.parse(date))) {
      serverDate = Date.parse(date);
      receivedAt = Date.now();
    }
    if (response.status === 401) onExpired?.();
    if (response.status < 200 || response.status >= 300) {
      const parsed = z
        .object({
          code: z.string().optional(),
          requestId: z.string().optional(),
        })
        .safeParse(response.data);
      const code = parsed.success ? (parsed.data.code ?? '') : '';
      throw new QuizError(
        response.status === 401 ||
          (response.status === 403 && code !== 'ORIGIN_NOT_ALLOWED')
          ? 'denied'
          : response.status === 404
            ? 'notFound'
            : response.status === 409 && code === 'ASSIGNMENT_VERSION_CONFLICT'
              ? 'conflict'
              : write && (response.status >= 500 || response.status === 408)
                ? 'uncertain'
                : 'error',
        code,
        parsed.success ? parsed.data.requestId : undefined
      );
    }
    if (expectedStatus !== undefined && response.status !== expectedStatus)
      throw new QuizError(write ? 'uncertain' : 'error', 'INVALID_RESPONSE');
    return response.data;
  }
  const parse = async <T>(
    schema: z.ZodType<T>,
    body: Promise<object | string | null>,
    write = false
  ): Promise<T> => {
    const result = schema.safeParse(await body);
    if (!result.success)
      throw new QuizError(write ? 'uncertain' : 'error', 'INVALID_RESPONSE');
    return result.data;
  };
  return {
    now: () =>
      serverDate === undefined
        ? Date.now()
        : serverDate + Date.now() - receivedAt,
    async list(query: ListQuery): Promise<QuizPageData> {
      const page = query.page ?? 1,
        pageSize = query.pageSize ?? 20;
      if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(pageSize) ||
        pageSize < 1 ||
        pageSize > 100
      )
        throw new QuizError('error', 'INVALID_PAGE');
      const url = query.sessionId
        ? `/mentor/class-sessions/${resource(query.sessionId)}/assignments`
        : `/mentor/classes/${resource(query.classId)}/assignments`;
      const params = {
        type: 'QUIZ',
        page,
        pageSize,
        ...(query.status ? { status: query.status } : {}),
        ...(query.filterSession
          ? { sessionId: resource(query.filterSession) }
          : {}),
      };
      const data = await parse(pageSchema, request(url, 'GET', params));
      if (
        data.page !== page ||
        data.pageSize !== pageSize ||
        (query.sessionId &&
          data.items.some((q) => q.sessionId !== query.sessionId))
      )
        throw new QuizError('error', 'INVALID_RESPONSE');
      return { ...data, items: data.items.map(fromWire) };
    },
    async detail(id: string): Promise<Quiz> {
      return fromWire(
        await parse(
          detailSchema,
          request(`/mentor/assignments/${resource(id)}`)
        )
      );
    },
    async command(
      command: MockCommand,
      previous?: Quiz
    ): Promise<Quiz | undefined> {
      let url: string, method: string, body: object;
      if (command.kind === 'create') {
        if (Object.keys(validateMetadata(command.metadata, true)).length)
          throw new QuizError('error', 'INVALID_ASSIGNMENT_CONFIG');
        const m = command.metadata;
        url = `/mentor/class-sessions/${resource(command.sessionId)}/assignments`;
        method = 'POST';
        body = {
          type: 'QUIZ',
          purpose: m.purpose,
          title: m.title.trim(),
          description: m.description,
          maxScore: m.maxScore.replace(',', '.'),
          dueAt: m.dueAt || null,
          timeLimitMinutes: m.timeLimit ? Number(m.timeLimit) : null,
        };
      } else {
        if (!Number.isInteger(command.revision) || command.revision < 1)
          throw new QuizError('error', 'INVALID_REVISION');
        url = `/mentor/assignments/${resource(command.id)}`;
        const revision = { expectedRevision: command.revision };
        if (command.kind === 'metadata') {
          if (Object.keys(validateMetadata(command.metadata, false)).length)
            throw new QuizError('error', 'INVALID_ASSIGNMENT_CONFIG');
          const m = command.metadata;
          const next = {
            title: m.title.trim(),
            description: m.description,
            dueAt: m.dueAt || null,
            timeLimitMinutes: m.timeLimit ? Number(m.timeLimit) : null,
          };
          const changed = Object.fromEntries(
            Object.entries(next).filter(
              ([key, value]) =>
                !previous || previous[key as keyof typeof next] !== value
            )
          );
          method = 'PATCH';
          body = { ...revision, ...changed };
        } else if (command.kind === 'questions') {
          if (validateQuestions(command.questions))
            throw new QuizError('error', 'INVALID_QUIZ_QUESTIONS');
          url += '/questions';
          method = 'PUT';
          body = {
            ...revision,
            questions: command.questions.map((q) => ({
              ...(q.id ? { id: resource(q.id) } : {}),
              prompt: q.prompt.trim(),
              options: q.options.map((o) => ({
                label: o.label,
                text: o.text.trim(),
              })),
              correctOption: q.correctOption,
            })),
          };
        } else {
          method = command.kind === 'delete' ? 'DELETE' : 'POST';
          if (command.kind !== 'delete') url += `/${command.kind}`;
          if (
            command.kind === 'archive' &&
            (!command.reason?.trim() || command.reason.trim().length > 2000)
          )
            throw new QuizError('error', 'REASON_REQUIRED');
          body = {
            ...revision,
            ...(command.kind === 'archive'
              ? { reason: command.reason!.trim() }
              : {}),
          };
        }
      }
      if (command.kind === 'delete') {
        await request(url, method, {}, body, 204);
        return undefined;
      }
      const result = fromWire(
        await parse(
          command.kind === 'questions' ? detailSchema : quizSchema,
          request(url, method, {}, body),
          true
        )
      );
      if (
        (command.kind !== 'create' && result.id !== command.id) ||
        (command.kind === 'create' && result.sessionId !== command.sessionId)
      )
        throw new QuizError('uncertain', 'INVALID_RESPONSE');
      return result;
    },
  };
}
export type QuizService = ReturnType<typeof createQuizService>;
