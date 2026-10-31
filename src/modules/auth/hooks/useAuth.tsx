import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { BackHandler } from 'react-native';
import type { QueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type {
  AuthError,
  AuthService,
  AuthUser,
  LoginNotice,
  SessionResult,
} from '../types';
import '../messages';

export type AuthState = {
  screen: 'bootstrap' | 'login' | 'workspace' | 'denied';
  user?: AuthUser;
  notice?: LoginNotice | undefined;
  error?: AuthError;
};
type AuthContextValue = {
  state: AuthState;
  busy: boolean;
  toast: string | undefined;
  retry: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthError | undefined>;
  logout: (all: boolean) => Promise<AuthError | undefined>;
  notify: (text: string) => void;
  expireSession: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is required');
  return context;
};
export function AuthProvider({
  children,
  service,
  cache,
}: PropsWithChildren<{ service: AuthService; cache: QueryClient }>) {
  const { t } = useTranslation('foundation');
  const [state, setState] = useState<AuthState>({ screen: 'bootstrap' });
  const [busy, setBusy] = useState(false);
  const [toast, notify] = useState<string>();
  const locked = useRef(false);
  const mounted = useRef(true);
  const accept = useCallback(
    (result: SessionResult) => {
      if (!mounted.current) return;
      if (result.kind === 'error')
        setState({ screen: 'bootstrap', error: result.error });
      else if (result.kind === 'signedOut') {
        cache.clear();
        // A rejected restore also means "no saved session" on a fresh launch.
        // Show session notices only when an admitted user loses their session.
        setState((previous) => ({
          screen: 'login',
          notice: previous.user ? result.notice : undefined,
        }));
      } else
        setState({
          screen:
            result.user.role === 'MENTOR' || result.user.role === 'MANAGER'
              ? 'workspace'
              : 'denied',
          user: result.user,
        });
    },
    [cache]
  );
  const expireSession = useCallback(() => {
    cache.clear();
    notify(undefined);
    setState({ screen: 'login', notice: 'sessionExpired' });
  }, [cache]);
  const retry = useCallback(async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      accept(await service.restore());
    } catch {
      accept({ kind: 'error', error: { code: 'server' } });
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [service, accept]);
  useEffect(() => {
    mounted.current = true;
    retry();
    return () => {
      mounted.current = false;
    };
  }, [retry]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => notify(undefined), 2200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!busy) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => back.remove();
  }, [busy]);
  const login = async (email: string, password: string) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      const result = await service.login({ email, password });
      if (!mounted.current) return;
      if (result.kind === 'error') return result.error;
      accept(result);
      if (
        result.kind === 'user' &&
        ['MENTOR', 'MANAGER'].includes(result.user.role)
      )
        notify(t('signedIn'));
      return undefined;
    } catch {
      return { code: 'server' } as AuthError;
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const logout = async (all: boolean) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      const result = await service.logout(all);
      if (!mounted.current) return;
      if (result.kind === 'error') return result.error;
      // Erase private memory/cache before replacing the navigator.
      cache.clear();
      if (result.kind === 'expired') {
        notify(undefined);
        setState({ screen: 'login', notice: 'sessionExpired' });
        return undefined;
      }
      if (state.screen !== 'denied')
        notify(t(all ? 'signedOutAll' : 'signedOut'));
      else notify(undefined);
      setState({ screen: 'login' });
      return undefined;
    } catch {
      return { code: 'server' } as AuthError;
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <AuthContext.Provider
      value={{
        state,
        busy,
        toast,
        retry,
        login,
        logout,
        notify,
        expireSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
