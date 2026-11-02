import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLeave } from './LeaveProvider';
import { newIntentKey } from '@/modules/attendance/services/intentKey';
import type { LeaveData, LeaveIntent, Outcome, ReadRequest } from './types';

function mergeData(previous: LeaveData, next: LeaveData): LeaveData {
  const unique = <T extends { id: string }>(a: T[] = [], b: T[] = []) => [
    ...new Map([...a, ...b].map((item) => [item.id, item])).values(),
  ];
  return {
    ...next,
    ...(next.requests
      ? { requests: unique(previous.requests, next.requests) }
      : {}),
    ...(next.conflicts
      ? { conflicts: unique(previous.conflicts, next.conflicts) }
      : {}),
    ...(next.candidates
      ? {
          candidates: [
            ...new Map(
              [...(previous.candidates ?? []), ...next.candidates].map(
                (item) => [item.session.id, item]
              )
            ).values(),
          ],
        }
      : {}),
    ...(next.options
      ? { options: unique(previous.options, next.options) }
      : {}),
    ...(next.request
      ? {
          request: {
            ...next.request,
            items: unique(previous.request?.items, next.request.items),
            studentConflicts: unique(
              previous.request?.studentConflicts,
              next.request.studentConflicts
            ),
          },
        }
      : {}),
  };
}
export function useLeaveQuery(request: ReadRequest, enabled = true) {
  const { source, memory, scenario, offline } = useLeave();
  const key = JSON.stringify(request);
  const [view, setView] = useState<{
    key: string;
    data?: LeaveData;
    result?: Outcome;
    busy: boolean;
    footerError: boolean;
  }>({ key, busy: true, footerError: false });
  const ref = useRef(view);
  ref.current = view;
  const identity = useRef(key);
  identity.current = key;
  const generation = useRef(0),
    page = useRef(0),
    busy = useRef(false),
    mounted = useRef(true);
  const load = useCallback(
    async (target = 1) => {
      if (!source || !enabled || (busy.current && target > 1)) return undefined;
      const ticket = ++generation.current;
      busy.current = true;
      const cached =
        ref.current.key === key
          ? (ref.current.data ?? memory.cache.get(key))
          : memory.cache.get(key);
      setView({
        key,
        ...(cached ? { data: cached } : {}),
        busy: true,
        footerError: false,
      });
      let result: Outcome;
      try {
        result = offline
          ? { kind: 'offline' }
          : await source.read({ ...request, page: target });
      } catch {
        result = { kind: 'error', code: 'SERVER' };
      }
      if (
        !mounted.current ||
        identity.current !== key ||
        ticket !== generation.current
      )
        return undefined;
      busy.current = false;
      if (result.kind === 'success') {
        const data =
          target > 1 && cached ? mergeData(cached, result.data) : result.data;
        page.current = target;
        memory.cache.set(key, data);
        setView({ key, data, result, busy: false, footerError: false });
        return data;
      }
      const forbidden = result.kind === 'denied' || result.kind === 'notFound';
      if (forbidden) memory.cache.delete(key);
      setView({
        key,
        ...(!forbidden && cached ? { data: cached } : {}),
        result,
        busy: false,
        footerError: target > 1,
      });
      return undefined;
    },
    [key, source, enabled, offline, memory, scenario]
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current++;
    };
  }, []);
  useFocusEffect(
    useCallback(() => {
      if (enabled) load();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active' && enabled) load();
      });
      const listener = () => {
        if (enabled) load();
      };
      memory.listeners.add(listener);
      return () => {
        memory.listeners.delete(listener);
        subscription.remove();
        generation.current++;
        busy.current = false;
      };
    }, [load, enabled, memory])
  );
  const current =
    view.key === key
      ? view
      : {
          key,
          busy: true,
          footerError: false,
          data: memory.cache.get(key),
          result: undefined,
        };
  const count =
    current.data?.requests?.length ??
    current.data?.conflicts?.length ??
    current.data?.candidates?.length ??
    current.data?.options?.length ??
    current.data?.request?.items.length ??
    0;
  const more = () => {
    if (!busy.current && !offline && count < (current.data?.total ?? 0))
      return load(page.current + 1);
    return Promise.resolve(undefined);
  };
  return {
    ...current,
    offline: offline || current.result?.kind === 'offline',
    refresh: () => load(1),
    more,
    retry: () => load(current.footerError ? page.current + 1 : 1),
    load,
    count,
  };
}
export type LeaveQuery = ReturnType<typeof useLeaveQuery>;
export function useLeaveMutation() {
  const { source, memory, publish, offline, mock } = useLeave();
  const [busy, setBusy] = useState(false),
    [result, setResult] = useState<Outcome>();
  const current = useRef<LeaveIntent | undefined>(undefined),
    lock = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const submit = async (input: Omit<LeaveIntent, 'key'>) => {
    if (lock.current || offline || !source) return undefined;
    const previous = current.current;
    const intent = previous ?? {
      ...(JSON.parse(JSON.stringify(input)) as Omit<LeaveIntent, 'key'>),
      key: mock
        ? `00000000-0000-4000-8000-${String(++memory.counter).padStart(12, '0')}`
        : newIntentKey(),
    };
    const resource = `${intent.kind === 'create' ? 'create' : intent.id}`;
    const active = memory.locks.get(resource);
    if (active && active !== intent.key) return undefined;
    memory.locks.set(resource, intent.key);
    current.current = intent;
    lock.current = true;
    setBusy(true);
    let response: Outcome;
    try {
      response = await source.write(intent);
    } catch {
      response = { kind: 'uncertain' };
    }
    lock.current = false;
    if (response.kind !== 'uncertain') {
      current.current = undefined;
      memory.locks.delete(resource);
    }
    if (response.kind === 'success') publish();
    if (response.kind === 'denied') {
      memory.cache.clear();
      memory.listeners.forEach((listener) => listener());
    }
    if (mounted.current) {
      setResult(response);
      setBusy(false);
    }
    return response;
  };
  return {
    busy,
    result,
    submit,
    uncertain: result?.kind === 'uncertain',
    intent: current.current,
    clear: () => {
      if (!current.current) setResult(undefined);
    },
  };
}
