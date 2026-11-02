import axios, { type AxiosInstance } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { z } from 'zod';
import { env } from '@/config/env';
import { appConfig } from '@/config/app';
import type { AuthService } from '@/modules/auth/types';

export type ApiErrorKind =
  | 'error'
  | 'offline'
  | 'denied'
  | 'notFound'
  | 'invalid'
  | 'rateLimited'
  | 'gone'
  | 'unavailable'
  | 'uncertain';
export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    readonly code = '',
    readonly requestId = '',
    readonly retryAfterMs?: number
  ) {
    super(code || kind);
  }
}
export type ApiClientOptions = {
  baseURL?: string | undefined;
  origin?: string | undefined;
  client?: AxiosInstance;
  restore?: AuthService['restore'];
  onExpired?: () => void;
  isActive?: () => boolean;
  timeout?: number;
};
const failure = z.object({
  code: z.string().optional(),
  requestId: z.string().optional(),
  retryAfterMs: z.number().optional(),
});
export const safeSegment = (value: string) => {
  if (!z.string().uuid().safeParse(value).success)
    throw new ApiError('error', 'INVALID_RESOURCE');
  return encodeURIComponent(value);
};
/** Cookie-authenticated JSON client: one shared refresh, typed failures, no retries. */
export function createApiClient({
  baseURL = env.API_URL,
  origin = env.API_ORIGIN,
  client = axios.create(),
  restore,
  onExpired,
  isActive = () => true,
  timeout = appConfig.api.timeout,
}: ApiClientOptions = {}) {
  let renewing: ReturnType<AuthService['restore']> | undefined;
  const renew = async () => {
    if (!restore) return false;
    renewing ??= restore().finally(() => {
      renewing = undefined;
    });
    const result = await renewing;
    if (!isActive()) throw new ApiError('denied');
    if (result.kind === 'user') return true;
    if (result.kind === 'signedOut') {
      onExpired?.();
      throw new ApiError('denied');
    }
    throw new ApiError(
      result.error.code === 'offline' ? 'offline' : 'error',
      'AUTH_REFRESH'
    );
  };
  async function request(
    url: string,
    {
      method = 'GET',
      params = {},
      data,
    }: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
      params?: Record<string, string | number | boolean>;
      data?: object;
    } = {}
  ) {
    if (!isActive()) throw new ApiError('denied');
    if (!baseURL) throw new ApiError('error', 'CONFIG');
    const write = method !== 'GET';
    if (write && !origin) throw new ApiError('error', 'ORIGIN_NOT_CONFIGURED');
    const network = await NetInfo.fetch();
    if (network.isConnected === false || network.isInternetReachable === false)
      throw new ApiError('offline');
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
      if (!isActive()) throw new ApiError('denied');
      try {
        return await client.request<object | string | null>(config);
      } catch {
        if (!isActive()) throw new ApiError('denied');
        throw new ApiError(write ? 'uncertain' : 'error', 'NETWORK');
      }
    };
    let response = await send();
    if (!isActive()) throw new ApiError('denied');
    if (response.status === 401 && (await renew())) response = await send();
    if (!isActive()) throw new ApiError('denied');
    if (response.status === 401) onExpired?.();
    if (response.status >= 200 && response.status < 300) return response.data;
    const parsed = failure.safeParse(response.data);
    const {
      code = '',
      requestId = '',
      retryAfterMs,
    } = parsed.success ? parsed.data : {};
    const { status } = response;
    throw new ApiError(
      status === 401 || (status === 403 && code !== 'ORIGIN_NOT_ALLOWED')
        ? 'denied'
        : status === 404
          ? 'notFound'
          : status === 410
            ? 'gone'
            : status === 422
              ? 'invalid'
              : status === 429
                ? 'rateLimited'
                : code === 'CHAT_DISABLED'
                  ? 'unavailable'
                  : write && (status >= 500 || status === 408)
                    ? 'uncertain'
                    : 'error',
      code,
      requestId,
      retryAfterMs
    );
  }
  return {
    request,
    renew,
    async read<T>(
      schema: z.ZodType<T>,
      url: string,
      options?: Parameters<typeof request>[1]
    ): Promise<T> {
      const body = await request(url, options);
      const result = schema.safeParse(body);
      if (!result.success)
        throw new ApiError(
          options?.method && options.method !== 'GET' ? 'uncertain' : 'error',
          'INVALID_RESPONSE'
        );
      return result.data;
    },
  };
}
export type ApiClient = ReturnType<typeof createApiClient>;
