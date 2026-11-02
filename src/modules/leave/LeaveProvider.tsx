import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import { env } from '@/config/env';
import type { LeaveData, LeaveSource, Scenario } from './types';
import { createLeaveMock } from './services/mockLeave';
import './messages';

function createMemory() {
  return {
    cache: new Map<string, LeaveData>(),
    listeners: new Set<() => void>(),
    locks: new Map<string, string>(),
    counter: 0,
  };
}
type State = {
  enabled: boolean;
  mock: boolean;
  offline: boolean;
  scenario: Scenario;
  setScenario: (scenario: Scenario) => void;
  source: LeaveSource | null;
  memory: ReturnType<typeof createMemory>;
  publish: () => void;
};
const Context = createContext<State | null>(null);
export function LeaveProvider({
  children,
  mock = false,
  source: injected,
}: PropsWithChildren<{ mock?: boolean; source?: LeaveSource | undefined }>) {
  const [scenario, setScenario] = useState<Scenario>('success');
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;
  const [networkOffline, setNetworkOffline] = useState(false);
  useEffect(
    () =>
      NetInfo.addEventListener((state) =>
        setNetworkOffline(
          state.isConnected === false || state.isInternetReachable === false
        )
      ),
    []
  );
  const allowed = mock && __DEV__ && env.DEBUG_MODE;
  const source = useMemo(
    () =>
      injected ?? (allowed ? createLeaveMock(() => scenarioRef.current) : null),
    [injected, allowed]
  );
  const memory = useMemo(createMemory, [source]);
  return (
    <Context.Provider
      value={{
        enabled: !!source,
        mock: allowed,
        source,
        memory,
        scenario,
        setScenario,
        offline: networkOffline || (allowed && scenario === 'offline'),
        publish: () => {
          memory.cache.clear();
          memory.listeners.forEach((listener) => listener());
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLeave() {
  const value = useContext(Context);
  if (!value) throw new Error('LeaveProvider is required');
  return value;
}
