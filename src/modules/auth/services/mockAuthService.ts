import type { AuthErrorCode, AuthService, SessionResult } from '../types';

export const loginErrors = [
  'invalidCredentials',
  'offline',
  'timeout',
  'server',
  'invalidResponse',
  'config',
] as const;
export type ReviewScenario =
  | 'signedOut'
  | 'MENTOR'
  | 'MANAGER'
  | 'accessDenied'
  | 'sessionExpired'
  | 'accountInactive'
  | 'offline'
  | 'timeout'
  | 'server'
  | 'invalidResponse'
  | 'config'
  | `login-${(typeof loginErrors)[number]}`;
export type MockLogoutOutcome =
  | 'ok'
  | 'expired'
  | 'offline'
  | 'timeout'
  | 'server';
const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 900));
const errorResult = (code: AuthErrorCode): SessionResult => ({
  kind: 'error',
  error: { code, ...(code === 'server' ? { requestId: 'mock-req-123' } : {}) },
});

// UI review only. No HTTP, persisted identity, real credentials or network fallback.
export function createMockAuthService() {
  let scenario: ReviewScenario = 'signedOut';
  let session: SessionResult = { kind: 'signedOut' };
  let logoutOutcome: MockLogoutOutcome = 'ok';
  const restoreResult = (): SessionResult => {
    if (scenario.startsWith('login-')) return { kind: 'signedOut' };
    if (scenario === 'sessionExpired' || scenario === 'accountInactive')
      return { kind: 'signedOut', notice: scenario };
    if (
      scenario === 'offline' ||
      scenario === 'timeout' ||
      scenario === 'server' ||
      scenario === 'invalidResponse' ||
      scenario === 'config'
    )
      return errorResult(scenario);
    if (scenario === 'signedOut') return session;
    return {
      kind: 'user',
      user: {
        email: `${scenario.toLowerCase()}@mindy.vn`,
        displayName:
          scenario === 'MANAGER' ? 'Nguyễn Minh An' : 'Trần Thị Linh',
        // Invalid session fixture, not an additional application role.
        role: scenario === 'accessDenied' ? '' : scenario,
      },
    };
  };
  const service: AuthService = {
    restore: async () => {
      await pause();
      return restoreResult();
    },
    login: async ({ email }) => {
      await pause();
      const selectedError = loginErrors.find(
        (code) => scenario === `login-${code}`
      );
      if (selectedError) return errorResult(selectedError);
      const name = (email.split('@')[0] ?? '').toUpperCase();
      if (name !== 'MENTOR' && name !== 'MANAGER')
        return errorResult('invalidCredentials');
      const role = name;
      session = {
        kind: 'user',
        user: {
          email,
          displayName: role === 'MANAGER' ? 'Nguyễn Minh An' : 'Trần Thị Linh',
          role,
        },
      };
      return session;
    },
    logout: async () => {
      await pause();
      if (logoutOutcome !== 'ok' && logoutOutcome !== 'expired')
        return {
          kind: 'error',
          error: {
            code: logoutOutcome,
            ...(logoutOutcome === 'server' ? { requestId: 'mock-req-5' } : {}),
          },
        };
      const kind = logoutOutcome;
      session = { kind: 'signedOut' };
      scenario = 'signedOut';
      return { kind };
    },
  };
  return {
    service,
    select: (value: ReviewScenario) => {
      scenario = value;
      session = { kind: 'signedOut' };
    },
    setLogoutOutcome: (value: MockLogoutOutcome) => {
      logoutOutcome = value;
    },
  };
}
// Release stays closed until a real implementation is approved and integrated.
export const unavailableAuthService: AuthService = {
  restore: async () => ({ kind: 'error', error: { code: 'config' } }),
  login: async () => ({ kind: 'error', error: { code: 'config' } }),
  logout: async () => ({ kind: 'error', error: { code: 'config' } }),
};
