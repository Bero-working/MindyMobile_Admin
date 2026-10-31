import axios, { AxiosError, type AxiosInstance } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { createAuthService } from '@/modules/auth/services/authService';

const user = {
  phone: '0901000002',
  id: '0d039db0-9e0f-455b-a080-cb99e5750476',
  email: 'mentor@mindy.vn',
  displayName: 'Mentor',
  role: 'MENTOR',
  status: 'ACTIVE',
};
const session = { user, accessTokenExpiresAt: '2026-10-30T14:00:00.000Z' };
const setup = () => {
  const client: AxiosInstance = axios.create();
  const request = jest.spyOn(client, 'request');
  return {
    request,
    service: createAuthService('https://test.mindy.vn/api/v1/', client),
  };
};
beforeEach(() => jest.clearAllMocks());

test('fails closed when API URL is missing without a network request', async () => {
  expect(await createAuthService('').restore()).toEqual({
    kind: 'error',
    error: { code: 'config' },
  });
});
test('login verifies saved cookie via me and preserves password bytes', async () => {
  const { request, service } = setup();
  request
    .mockResolvedValueOnce({ status: 200, data: session })
    .mockResolvedValueOnce({ status: 200, data: user });
  expect(
    await service.login({ email: user.email, password: ' p@ss ' })
  ).toMatchObject({
    kind: 'user',
    user: { role: 'MENTOR', phone: user.phone },
  });
  expect(request.mock.calls.map(([config]) => config.url)).toEqual([
    '/auth/login',
    '/auth/me',
  ]);
  expect(request.mock.calls[0]?.[0]).toMatchObject({
    baseURL: 'https://test.mindy.vn/api/v1',
    method: 'POST',
    withCredentials: true,
    timeout: 10000,
    data: { email: user.email, password: ' p@ss ' },
  });
});
test('does not admit user when cookie roundtrip fails', async () => {
  const { request, service } = setup();
  request
    .mockResolvedValueOnce({ status: 200, data: session })
    .mockResolvedValueOnce({ status: 401, data: {} });
  expect(await service.login({ email: user.email, password: 'test' })).toEqual({
    kind: 'error',
    error: { code: 'invalidResponse' },
  });
});
test('single flight refresh for simultaneous expired bootstrap requests', async () => {
  const { request, service } = setup();
  request.mockImplementation(async (config) =>
    config.url === '/auth/me'
      ? { status: 401, data: {} }
      : { status: 200, data: session }
  );
  const results = await Promise.all([service.restore(), service.restore()]);
  expect(results.every((result) => result.kind === 'user')).toBe(true);
  expect(
    request.mock.calls.filter(([config]) => config.url === '/auth/refresh')
  ).toHaveLength(1);
});
test('invalid refresh ends session without looping', async () => {
  const { request, service } = setup();
  request.mockResolvedValue({ status: 401, data: {} });
  expect(await service.restore()).toEqual({
    kind: 'signedOut',
    notice: 'sessionExpired',
  });
  expect(request).toHaveBeenCalledTimes(2);
});
test.each([
  null,
  '<html>bad gateway</html>',
  { ...user, status: 'NEW' },
  { email: user.email },
])('rejects malformed me response %p', async (data) => {
  const { request, service } = setup();
  request.mockResolvedValue({ status: 200, data });
  expect(await service.restore()).toEqual({
    kind: 'error',
    error: { code: 'invalidResponse' },
  });
});
test('inactive accounts never enter workspace; unsupported role is preserved for denied UI', async () => {
  const { request, service } = setup();
  request
    .mockResolvedValueOnce({
      status: 200,
      data: { ...user, status: 'SUSPENDED' },
    })
    .mockResolvedValueOnce({
      status: 200,
      data: { ...user, role: 'invalid-session-role' },
    });
  expect(await service.restore()).toEqual({
    kind: 'signedOut',
    notice: 'accountInactive',
  });
  expect(await service.restore()).toMatchObject({
    kind: 'user',
    user: { role: 'invalid-session-role' },
  });
});
test.each([401, 429, 500])(
  'maps login HTTP %s without exposing backend message',
  async (status) => {
    const { request, service } = setup();
    request.mockResolvedValue({
      status,
      data: { message: 'private server detail', requestId: 'req-123' },
    });
    expect(
      await service.login({ email: user.email, password: 'test' })
    ).toEqual({
      kind: 'error',
      error: {
        code:
          status === 401
            ? 'invalidCredentials'
            : status === 429
              ? 'tooManyAttempts'
              : 'server',
        requestId: 'req-123',
      },
    });
  }
);
test('inactive account backend error returns sign-in notice', async () => {
  const { request, service } = setup();
  request.mockResolvedValue({ status: 404, data: { code: 'USER_NOT_FOUND' } });
  expect(await service.restore()).toEqual({
    kind: 'signedOut',
    notice: 'accountInactive',
  });
});
test('login rejects a stale cookie belonging to a different account', async () => {
  const { request, service } = setup();
  request
    .mockResolvedValueOnce({ status: 200, data: session })
    .mockResolvedValueOnce({
      status: 200,
      data: { ...user, id: '7162b4df-18f3-443d-905c-03effd2d1418' },
    });
  expect(await service.login({ email: user.email, password: 'test' })).toEqual({
    kind: 'error',
    error: { code: 'invalidResponse' },
  });
});
test('refresh outage retains retryable error rather than ending session', async () => {
  const { request, service } = setup();
  request
    .mockResolvedValueOnce({ status: 401, data: {} })
    .mockResolvedValueOnce({ status: 503, data: {} });
  expect(await service.restore()).toEqual({
    kind: 'error',
    error: { code: 'server' },
  });
});
test('logout-all renews expired access, retries once and accepts 204', async () => {
  const { request, service } = setup();
  request
    .mockResolvedValueOnce({ status: 401, data: {} })
    .mockResolvedValueOnce({ status: 200, data: session })
    .mockResolvedValueOnce({ status: 204, data: '' });
  expect(await service.logout(true)).toEqual({ kind: 'ok' });
  expect(request.mock.calls.map(([config]) => config.url)).toEqual([
    '/auth/logout-all',
    '/auth/refresh',
    '/auth/logout-all',
  ]);
});
test('expired refresh does not claim all-device revocation succeeded', async () => {
  const { request, service } = setup();
  request.mockResolvedValue({ status: 401, data: {} });
  expect(await service.logout(true)).toEqual({ kind: 'expired' });
  expect(request).toHaveBeenCalledTimes(2);
});
test('logout error keeps current session available for retry', async () => {
  const { request, service } = setup();
  request.mockResolvedValue({ status: 500, data: {} });
  expect(await service.logout(false)).toEqual({
    kind: 'error',
    error: { code: 'server' },
  });
});
test('maps timeout and blocks known offline requests', async () => {
  const { request, service } = setup();
  request.mockRejectedValue(new AxiosError('timeout', 'ECONNABORTED'));
  expect(await service.restore()).toEqual({
    kind: 'error',
    error: { code: 'timeout' },
  });
  jest
    .mocked(NetInfo.fetch)
    .mockResolvedValueOnce({ isConnected: false } as Awaited<
      ReturnType<typeof NetInfo.fetch>
    >);
  expect(await service.restore()).toEqual({
    kind: 'error',
    error: { code: 'offline' },
  });
  expect(request).toHaveBeenCalledTimes(1);
});
