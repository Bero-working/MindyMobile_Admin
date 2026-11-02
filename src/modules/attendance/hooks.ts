import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import {
  FatalContext,
  RefreshContext,
} from '@/modules/teaching/TeachingProvider';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useAttendance } from './AttendanceProvider';
import type {
  AttendanceData,
  Intent,
  ReadRequest,
  ReadResult,
  WriteResult,
} from './types';

// Advance the last server timestamp locally while a form remains open.
// The backend still authorizes the actual clock/version on every mutation.
export function useServerNow(asOf: string | undefined) {
  const anchor = useMemo(
    () => ({ time: Date.parse(asOf ?? ''), receivedAt: Date.now() }),
    [asOf]
  );
  const [, tick] = useState(0);
  useEffect(() => {
    if (!asOf) return undefined;
    const timer = setInterval(() => tick((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [asOf]);
  return anchor.time + Math.max(0, Date.now() - anchor.receivedAt);
}

export function useAttendanceQuery(
  request: ReadRequest,
  enabled = true,
  all = false
) {
  const { source, scenario, cache, subscribe } = useAttendance();
  const { state } = useAuth();
  const identity = JSON.stringify({ ...request, account: state.user?.email });
  const current = useRef(identity);
  current.current = identity;
  const initial = cache.get(identity);
  const [snapshot, setSnapshot] = useState<{
    identity: string;
    data: AttendanceData | undefined;
  }>({ identity, data: initial });
  const [result, setResult] = useState<ReadResult>();
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [footerError, setFooterError] = useState(false);
  const failed = useRef(1),
    page = useRef(1),
    sequence = useRef(0),
    pending = useRef(false),
    opened = useRef(1);
  const fatal = useContext(FatalContext);
  const register = useContext(RefreshContext),
    queryId = useId();
  const offline =
    !online || scenario === 'offline' || result?.kind === 'offline';
  const load = useCallback(
    async (next = 1, preserve = true) => {
      if (!source || pending.current) return undefined;
      pending.current = true;
      const id = ++sequence.current;
      setBusy(true);
      setFooterError(false);
      let value: ReadResult;
      let loadedPage = next;
      try {
        value =
          !online || scenario === 'offline'
            ? { kind: 'offline' }
            : scenario === 'refreshError' && cache.has(identity)
              ? { kind: 'error', requestId: 'mock-refresh' }
              : await source.read({ ...request, page: next });
        if (
          value.kind === 'success' &&
          (all || (preserve && next === 1 && opened.current > 1))
        ) {
          const key =
            request.kind === 'managerSessions'
              ? 'sessions'
              : request.kind === 'audits'
                ? 'audits'
                : request.kind === 'incomplete'
                  ? 'incomplete'
                  : request.kind === 'recoveryStudents'
                    ? 'students'
                    : request.kind === 'managementStudents'
                      ? 'managementStudents'
                      : request.kind === 'classes'
                        ? 'classes'
                        : 'rows';
          let p = next;
          while (
            all ? value.data[key].length < value.data.total : p < opened.current
          ) {
            const extra = await source.read({ ...request, page: ++p });
            if (id !== sequence.current || current.current !== identity)
              return undefined;
            if (extra.kind !== 'success') {
              value = extra;
              break;
            }
            const old: { id: string }[] = value.data[key];
            const merged: { id: string }[] = [
              ...new Map(
                [...old, ...extra.data[key]].map((item) => [item.id, item])
              ).values(),
            ];
            if (merged.length === old.length) {
              value = { kind: 'error', requestId: 'mock-pagination' };
              break;
            }
            value = { kind: 'success', data: { ...value.data, [key]: merged } };
          }
          loadedPage = p;
        }
      } catch {
        value = { kind: 'error' };
      }
      if (id !== sequence.current || current.current !== identity)
        return undefined;
      if (value.kind === 'success') {
        let data = value.data;
        if (next > 1) {
          const previous = cache.get(identity);
          if (previous) {
            const merge = <T extends { id: string }>(a: T[], b: T[]) =>
              Array.from(
                new Map([...a, ...b].map((item) => [item.id, item])).values()
              );
            data = {
              ...data,
              sessions: merge(previous.sessions, data.sessions),
              rows: merge(previous.rows, data.rows),
              audits: merge(previous.audits, data.audits),
              incomplete: merge(previous.incomplete, data.incomplete),
              students: merge(previous.students, data.students),
              classes: merge(previous.classes, data.classes),
              managementStudents: merge(
                previous.managementStudents,
                data.managementStudents
              ).map((student) => {
                const old = previous.managementStudents.find(
                  (item) => item.id === student.id
                );
                return {
                  ...student,
                  enrollments: Array.from(
                    new Map(
                      [...(old?.enrollments ?? []), ...student.enrollments].map(
                        (item) => [item.enrollmentId, item]
                      )
                    ).values()
                  ),
                };
              }),
            };
          }
        }
        page.current = loadedPage;
        opened.current = Math.max(opened.current, loadedPage);
        cache.set(identity, data);
        setSnapshot({ identity, data });
        value = { kind: 'success', data };
      } else if (value.kind === 'denied' || value.kind === 'notFound') {
        cache.delete(identity);
        setSnapshot({ identity, data: undefined });
        fatal(value.kind);
      } else if (next > 1) {
        failed.current = next;
        setFooterError(true);
      } else if (!preserve) {
        cache.delete(identity);
        setSnapshot({ identity, data: undefined });
      }
      setResult(value);
      pending.current = false;
      setBusy(false);
      return value;
    },
    [identity, source, enabled, scenario, online, all]
  );
  useEffect(() => {
    page.current = 1;
    opened.current = 1;
    setResult(undefined);
    setSnapshot({ identity, data: cache.get(identity) });
  }, [identity, cache]);
  useFocusEffect(
    useCallback(() => {
      if (enabled) load();
      return () => {
        sequence.current++;
        pending.current = false;
      };
    }, [load])
  );
  useEffect(
    () =>
      subscribe((event) => {
        if (!enabled) return;
        const broad =
          ['finalize', 'recover', 'updateSession'].includes(event.kind) ||
          (event.role === 'MANAGER' && ['save', 'bulk'].includes(event.kind));
        if (
          event.note
            ? request.kind === 'note' && request.sessionId === event.sessionId
            : (request.sessionId === event.sessionId &&
                ['attendance', 'context', 'candidates'].includes(
                  request.kind
                )) ||
              (broad &&
                (request.kind === 'incomplete' ||
                  request.kind === 'managerSessions' ||
                  (request.sessionId === event.sessionId &&
                    request.kind === 'audits')))
        )
          load();
      }),
    [subscribe, load, enabled]
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (value) => {
      if (value === 'active' && enabled) load();
    });
    const stop = NetInfo.addEventListener((value) =>
      setOnline(
        value.isConnected !== false && value.isInternetReachable !== false
      )
    );
    return () => {
      sub.remove();
      stop();
    };
  }, [load]);
  useEffect(() => {
    if (enabled)
      register(queryId, async () => {
        await load();
      });
    return () => register(queryId, null);
  }, [register, queryId, enabled, load]);
  const data = snapshot.identity === identity ? snapshot.data : undefined;
  return {
    data,
    result,
    busy,
    offline,
    footerError,
    enabled,
    refresh: () => load(),
    retry: () => load(footerError ? failed.current : 1),
    more: () => load(page.current + 1),
    load,
  };
}
export type AttendanceQuery = ReturnType<typeof useAttendanceQuery>;
export function useAttendanceMutation() {
  const { send, nextKey, publish, abandon } = useAttendance();
  const [busy, setBusy] = useState(false),
    [intent, setIntent] = useState<Intent>(),
    [result, setResult] = useState<WriteResult>();
  const lock = useRef(false),
    mounted = useRef(true);
  const currentIntent = useRef<Intent | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (currentIntent.current) abandon(currentIntent.current);
    };
  }, []);
  const submit = async (value: Omit<Intent, 'key'>, retry = false) => {
    if (lock.current) return undefined;
    lock.current = true;
    setBusy(true);
    const next =
      retry && intent
        ? intent
        : {
            ...value,
            key: nextKey(),
            ...(value.records
              ? { records: value.records.map((item) => ({ ...item })) }
              : {}),
            ...(value.guestRecords
              ? {
                  guestRecords: value.guestRecords.map((item) => ({ ...item })),
                }
              : {}),
            ...(value.recoveryRecords
              ? {
                  recoveryRecords: value.recoveryRecords.map((item) => ({
                    ...item,
                  })),
                }
              : {}),
          };
    currentIntent.current = next;
    setIntent(next);
    const response = await send(next);
    if (!mounted.current) return response;
    setResult(response);
    setBusy(false);
    lock.current = false;
    if (response.kind === 'success') {
      currentIntent.current = undefined;
      setIntent(undefined);
      publish({
        sessionId: next.sessionId,
        note: next.kind === 'note',
        kind: next.kind,
        role: next.role,
      });
    } else if (
      response.kind !== 'uncertain' &&
      !(response.kind === 'error' && response.code === 'SERVER')
    )
      setIntent(undefined);
    return response;
  };
  return {
    busy,
    intent,
    result,
    submit,
    uncertain:
      result?.kind === 'uncertain' ||
      (result?.kind === 'error' && result.code === 'SERVER'),
    clear: () => {
      setResult(undefined);
      setIntent(undefined);
    },
  };
}
