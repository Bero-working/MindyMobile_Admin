import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useTeaching } from '@/modules/teaching/TeachingProvider';
import { useAttendance } from '@/modules/attendance';
import { env } from '@/config/env';
import type {
  Data,
  Mutation,
  OperationsSource,
  Result,
  Scenario,
} from './types';
import { createOperationsMock } from './services/mockOperations';
import { newIntentKey } from '@/modules/attendance/services/intentKey';
import './messages';
type State = {
  source: OperationsSource | null;
  mock: boolean;
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  cache: Map<string, Data>;
  revision: number;
  send: (intent: Mutation) => Promise<Result>;
  nextKey: () => string;
  settle: (id: string) => void;
};
const Context = createContext<State | null>(null);
export function OperationsProvider({
  children,
  source: injected,
  mock = false,
}: PropsWithChildren<{
  source?: OperationsSource | undefined;
  mock?: boolean;
}>) {
  const { state } = useAuth();
  const { source: teaching } = useTeaching();
  const attendance = useAttendance();
  const [scenario, setScenario] = useState<Scenario>('success'),
    [revision, revise] = useState(0);
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;
  const identity = `${state.user?.email}:${state.user?.role}`;
  const current = useRef(identity);
  current.current = identity;
  const enabledMock = mock && __DEV__ && env.DEBUG_MODE;
  const source = useMemo(
    () =>
      state.user?.role !== 'MANAGER'
        ? null
        : (injected ??
          (enabledMock
            ? createOperationsMock(
                teaching,
                () => scenarioRef.current,
                state.user.id
              )
            : null)),
    [injected, enabledMock, teaching, identity]
  );
  const memory = useMemo(
    () => ({
      cache: new Map<string, Data>(),
      locks: new Map<string, { key: string; busy: boolean }>(),
    }),
    [identity, source]
  );
  const value: State = {
    source,
    mock: enabledMock,
    scenario,
    setScenario,
    cache: memory.cache,
    revision,
    nextKey: newIntentKey,
    settle: (id) => {
      memory.locks.delete(id);
      memory.cache.clear();
      attendance.cache.clear();
      revise((v) => v + 1);
    },
    send: async (intent) => {
      if (!source || current.current !== identity) return { kind: 'denied' };
      const key = intent.kind === 'collect' ? 'cash' : intent.key;
      const lock = memory.locks.get(intent.id);
      if (lock && (lock.busy || lock.key !== key))
        return { kind: 'error', code: 'BUSY' };
      memory.locks.set(intent.id, { key, busy: true });
      try {
        const result = await source.write(intent);
        if (current.current !== identity) return { kind: 'denied' };
        if (result.kind !== 'uncertain') memory.locks.delete(intent.id);
        if (result.kind === 'success') {
          memory.cache.clear();
          if (result.data.session)
            teaching.updateSession?.(result.data.session);
          attendance.cache.clear();
          if (intent.kind !== 'collect')
            attendance.publish({
              sessionId: intent.id,
              kind: 'updateSession',
              role: 'MANAGER',
              note: false,
            });
          revise((v) => v + 1);
        }
        return result;
      } catch {
        return { kind: 'uncertain' };
      } finally {
        const retained = memory.locks.get(intent.id);
        if (retained) retained.busy = false;
      }
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useOperations() {
  const context = useContext(Context);
  if (!context) throw new Error('OperationsProvider is required');
  return context;
}
