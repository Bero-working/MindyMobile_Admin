import axios, { type AxiosInstance } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { z } from 'zod';
import { appConfig } from '@/config/app';
import { env } from '@/config/env';
import type { AuthError, AuthService, SessionResult } from '../types';

// Preserve wire roles, including roles this mobile workspace cannot admit.
const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  phone: z.string().nullable(),
  role: z.string().min(1),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']),
});
const sessionSchema = z.object({
  user: userSchema,
  accessTokenExpiresAt: z.string().datetime({ offset: true }),
});
const errorSchema = z.object({
  code: z.string().optional(),
  requestId: z.string().max(200).optional(),
});
type WireResponse = { status: number; data: object | string | null };
type Reply =
  | { kind: 'response'; response: WireResponse }
  | { kind: 'error'; error: AuthError };

export function createAuthService(
  baseURL = env.API_URL,
  client: AxiosInstance = axios.create({
    timeout: appConfig.api.timeout,
    withCredentials: true,
  })
): AuthService {
  // Native networking owns HttpOnly cookies, including the refresh path scope.
  // No token extraction, Authorization header, plaintext persistence or logs.
  const request = async (
    path: string,
    data?: { email: string; password: string }
  ): Promise<Reply> => {
    if (!baseURL) return { kind: 'error', error: { code: 'config' } };
    try {
      const network = await NetInfo.fetch();
      if (
        network.isConnected === false ||
        network.isInternetReachable === false
      )
        return { kind: 'error', error: { code: 'offline' } };
      const response = await client.request<WireResponse['data']>({
        baseURL: baseURL.replace(/\/+$/, ''),
        url: `/auth/${path}`,
        method: path === 'me' ? 'GET' : 'POST',
        ...(data ? { data } : {}),
        withCredentials: true,
        timeout: appConfig.api.timeout,
        validateStatus: () => true,
      });
      return { kind: 'response', response };
    } catch (error) {
      return {
        kind: 'error',
        error: {
          code:
            axios.isAxiosError(error) &&
            ['ECONNABORTED', 'ETIMEDOUT'].includes(error.code ?? '')
              ? 'timeout'
              : 'server',
        },
      };
    }
  };
  const failure = (response: WireResponse): AuthError => {
    const parsed = errorSchema.safeParse(response.data);
    return {
      code: response.status === 429 ? 'tooManyAttempts' : 'server',
      ...(parsed.success && parsed.data.requestId
        ? { requestId: parsed.data.requestId }
        : {}),
    };
  };
  const session = (reply: Reply, nested: boolean): SessionResult => {
    if (reply.kind === 'error') return reply;
    const { response } = reply;
    if (response.status === 401)
      return { kind: 'signedOut', notice: 'sessionExpired' };
    const problem = errorSchema.safeParse(response.data);
    if (
      response.status === 404 &&
      problem.success &&
      problem.data.code === 'USER_NOT_FOUND'
    )
      return { kind: 'signedOut', notice: 'accountInactive' };
    if (response.status !== 200)
      return { kind: 'error', error: failure(response) };
    const parsed = nested
      ? sessionSchema.safeParse(response.data)
      : userSchema.safeParse(response.data);
    if (!parsed.success)
      return { kind: 'error', error: { code: 'invalidResponse' } };
    const user = 'user' in parsed.data ? parsed.data.user : parsed.data;
    if (user.status !== 'ACTIVE')
      return { kind: 'signedOut', notice: 'accountInactive' };
    return {
      kind: 'user',
      user: {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        phone: user.phone ?? null,
      },
    };
  };
  let refreshing: Promise<SessionResult> | undefined;
  const refresh = () => {
    if (!refreshing)
      refreshing = request('refresh')
        .then((reply) => session(reply, true))
        .finally(() => {
          refreshing = undefined;
        });
    return refreshing;
  };
  return {
    async restore() {
      const reply = await request('me');
      if (reply.kind === 'response' && reply.response.status === 401)
        return refresh();
      return session(reply, false);
    },
    async login(input) {
      const reply = await request('login', input);
      if (reply.kind === 'response' && reply.response.status === 401)
        return {
          kind: 'error',
          error: { ...failure(reply.response), code: 'invalidCredentials' },
        };
      if (reply.kind === 'error' || reply.response.status !== 200)
        return session(reply, true);
      const result = session(reply, true);
      if (result.kind !== 'user') return result;
      // Prove that native networking saved/sent the access cookie before admission.
      const verified = await request('me');
      if (verified.kind === 'response' && verified.response.status === 401)
        return { kind: 'error', error: { code: 'invalidResponse' } };
      const signedIn = sessionSchema.safeParse(reply.response.data);
      if (verified.kind === 'response' && verified.response.status === 200) {
        const current = userSchema.safeParse(verified.response.data);
        if (
          signedIn.success &&
          current.success &&
          signedIn.data.user.id !== current.data.id
        )
          return { kind: 'error', error: { code: 'invalidResponse' } };
      }
      return session(verified, false);
    },
    async logout(all) {
      const path = all ? 'logout-all' : 'logout';
      let reply = await request(path);
      if (reply.kind === 'response' && reply.response.status === 401) {
        const renewed = await refresh();
        if (renewed.kind === 'error') return renewed;
        if (renewed.kind === 'signedOut') return { kind: 'expired' };
        reply = await request(path);
      }
      if (reply.kind === 'error') return reply;
      if (reply.response.status === 204) return { kind: 'ok' };
      // A second 401 may be a concurrent revocation; do not refresh in a loop.
      if (reply.response.status === 401) return { kind: 'expired' };
      return { kind: 'error', error: failure(reply.response) };
    },
  };
}
