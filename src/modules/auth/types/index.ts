import type { LoginInput } from '../schemas/login.schema';
export type AuthUser = {
  email: string;
  displayName: string;
  role: string;
  phone?: string | null;
};
export type AuthErrorCode =
  | 'offline'
  | 'timeout'
  | 'server'
  | 'invalidResponse'
  | 'config'
  | 'invalidCredentials'
  | 'tooManyAttempts';
export type AuthError = { code: AuthErrorCode; requestId?: string };
export type LoginNotice = 'sessionExpired' | 'accountInactive';
export type SessionResult =
  | { kind: 'user'; user: AuthUser }
  | { kind: 'signedOut'; notice?: LoginNotice }
  | { kind: 'error'; error: AuthError };
export type LogoutResult =
  | { kind: 'ok' | 'expired' }
  | { kind: 'error'; error: AuthError };
// Shared UI/service boundary; the application uses the real cookie API service.
export interface AuthService {
  restore(): Promise<SessionResult>;
  login(input: LoginInput): Promise<SessionResult>;
  logout(all: boolean): Promise<LogoutResult>;
}
