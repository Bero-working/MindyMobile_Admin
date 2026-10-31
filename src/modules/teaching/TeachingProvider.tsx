import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { env } from '@/config/env';
import type { Scenario, TeachingSource } from './types';
import { createTeachingMock } from './services/mockTeaching';
import { createTeachingService } from './services/teachingService';
export const teachingMockEnabled = __DEV__ && env.DEBUG_MODE;
const Context = createContext<{
  source: TeachingSource;
  scenario: Scenario;
  setScenario: (value: Scenario) => void;
  mock: boolean;
}>({
  source: createTeachingService(),
  scenario: 'success',
  setScenario: () => {},
  mock: false,
});
export function TeachingProvider({
  children,
  source: injected,
  mock = false,
}: {
  children: React.ReactNode;
  source?: TeachingSource | undefined;
  mock?: boolean;
}) {
  const [scenario, setScenario] = useState<Scenario>('success');
  const source = useMemo(
    () =>
      injected ??
      (mock && teachingMockEnabled
        ? createTeachingMock(scenario)
        : createTeachingService()),
    [scenario, injected, mock]
  );
  return (
    <Context.Provider
      value={{
        source,
        scenario,
        setScenario,
        mock: mock && teachingMockEnabled,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useTeaching = () => useContext(Context);
export const FatalContext = createContext<
  (kind: 'denied' | 'notFound') => void
>(() => {});
export function FatalProvider({
  children,
  onFatal,
}: PropsWithChildren<{ onFatal: (kind: 'denied' | 'notFound') => void }>) {
  return (
    <FatalContext.Provider value={onFatal}>{children}</FatalContext.Provider>
  );
}

export const RefreshContext = createContext<
  (key: string, refresh: (() => Promise<void>) | null) => void
>(() => {});

export const PageHeadingContext = createContext<
  (heading: { title: string; subtitle?: string; loading?: boolean }) => void
>(() => {});

export const PageHeaderContext = createContext<
  (header: React.ReactNode) => void
>(() => {});

export const MoreContext = createContext<
  (key: string, more: (() => Promise<void>) | null) => void
>(() => {});
