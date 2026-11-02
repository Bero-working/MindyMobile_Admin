import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { useTeaching } from '@/modules/teaching/TeachingProvider';
import { env } from '@/config/env';
import type {
  AttendanceData,
  AttendanceScenario,
  AttendanceSource,
  Intent,
  WriteResult,
} from './types';
import { newIntentKey } from './services/intentKey';
import { createAttendanceMock } from './services/mockAttendance';
import './messages';

type Event = {
  sessionId: string;
  note: boolean;
  kind: Intent['kind'];
  role: Intent['role'];
};
type State = {
  enabled: boolean;
  mock: boolean;
  source: AttendanceSource | null;
  scenario: AttendanceScenario;
  setScenario: (value: AttendanceScenario) => void;
  cache: Map<string, AttendanceData>;
  subscribe: (listener: (event: Event) => void) => () => void;
  publish: (event: Event) => void;
  send: (intent: Intent) => Promise<WriteResult>;
  abandon: (intent: Intent) => void;
  nextKey: () => string;
};
const Context = createContext<State | null>(null);
export function AttendanceProvider({
  children,
  mock = false,
  source: injected,
}: PropsWithChildren<{
  mock?: boolean;
  source?: AttendanceSource | undefined;
}>) {
  const { source: teachingSource } = useTeaching();
  const [scenario, setScenario] = useState<AttendanceScenario>('success');
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;
  const enabled = !!injected || (mock && __DEV__ && env.DEBUG_MODE);
  const source = useMemo(
    () =>
      injected ??
      (enabled ? createAttendanceMock(() => scenarioRef.current) : null),
    [injected, enabled]
  );
  const memory = useMemo(
    () => ({
      cache: new Map<string, AttendanceData>(),
      listeners: new Set<(event: Event) => void>(),
      locks: new Map<string, string>(),
      counter: 0,
    }),
    [source]
  );
  const state = useMemo<State>(
    () => ({
      enabled,
      mock: mock && __DEV__ && env.DEBUG_MODE,
      source,
      scenario,
      setScenario,
      cache: memory.cache,
      subscribe: (listener) => {
        memory.listeners.add(listener);
        return () => {
          memory.listeners.delete(listener);
        };
      },
      publish: (event) => {
        for (const [key] of memory.cache) {
          const request = JSON.parse(key) as {
            sessionId?: string;
            kind: string;
          };
          const same = request.sessionId === event.sessionId;
          const broad =
            ['finalize', 'recover', 'updateSession'].includes(event.kind) ||
            (event.role === 'MANAGER' && ['save', 'bulk'].includes(event.kind));
          if (
            event.note
              ? same && request.kind === 'note'
              : (same &&
                  ['attendance', 'context', 'candidates'].includes(
                    request.kind
                  )) ||
                (broad &&
                  ((same && request.kind === 'audits') ||
                    request.kind === 'incomplete' ||
                    request.kind === 'managerSessions'))
          )
            memory.cache.delete(key);
        }
        memory.listeners.forEach((listener) => listener(event));
      },
      nextKey: () => {
        if (!mock) return newIntentKey();
        // Fixture identity is deterministic only inside explicitly injected/review sources.
        memory.counter++;
        return `00000000-0000-4000-8000-${String(memory.counter).padStart(12, '0')}`;
      },
      send: async (intent) => {
        if (!source) return { kind: 'error', code: 'UNAVAILABLE' };
        const active = memory.locks.get(intent.sessionId);
        if (active && active !== intent.key)
          return { kind: 'error', code: 'BUSY' };
        memory.locks.set(intent.sessionId, intent.key);
        try {
          const result = await source.write(intent);
          if (
            result.kind !== 'uncertain' &&
            !(result.kind === 'error' && result.code === 'SERVER')
          )
            memory.locks.delete(intent.sessionId);
          if (
            result.kind === 'success' &&
            intent.kind !== 'note' &&
            result.data.session
          ) {
            const session = result.data.session;
            teachingSource.updateSession?.({
              id: session.id,
              ...(intent.kind === 'updateSession'
                ? {
                    title: session.title,
                    startsAt: session.startsAt,
                    endsAt: session.endsAt,
                  }
                : {}),
              status: session.status,
              version: session.version,
              actualStart: session.actualStartedAt,
              actualEnd: session.actualEndedAt,
            });
          }
          return result;
        } catch {
          return { kind: 'uncertain' };
        }
      },
      abandon: (intent) => {
        if (memory.locks.get(intent.sessionId) === intent.key)
          memory.locks.delete(intent.sessionId);
      },
    }),
    [enabled, source, scenario, memory, teachingSource, mock]
  );
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useAttendance() {
  const value = useContext(Context);
  if (!value) throw new Error('AttendanceProvider is required');
  return value;
}
