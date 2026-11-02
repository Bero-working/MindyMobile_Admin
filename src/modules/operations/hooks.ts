import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useOperations } from './provider';
import type { Data, Mutation, Read, Result } from './types';

export function useOperationsQuery(request: Read, enabled = true) {
  const { source, cache, scenario, revision } = useOperations();
  const { state } = useAuth();
  const identity = JSON.stringify({ ...request, account: state.user?.email });
  const current = useRef(identity);
  current.current = identity;
  const [snapshot, setSnapshot] = useState<{
    identity: string;
    data?: Data | undefined;
    result?: Result | undefined;
  }>({ identity });
  const [busy, setBusy] = useState(false),
    [online, setOnline] = useState(true),
    [footerError, setFooterError] = useState(false);
  const sequence = useRef(0),
    page = useRef(1),
    failedPage = useRef(1),
    inFlight = useRef(false);
  const offline = !online || scenario === 'offline';
  const load = useCallback(
    async (next = 1): Promise<Result | undefined> => {
      if (!enabled || inFlight.current) return undefined;
      const seq = ++sequence.current;
      inFlight.current = true;
      setBusy(true);
      setFooterError(false);
      let result: Result;
      try {
        result = offline
          ? { kind: 'offline' }
          : source
            ? await source.read({
                ...request,
                page: next,
                pageSize: request.pageSize ?? 20,
              })
            : { kind: 'error', code: 'UNAVAILABLE' };
      } catch {
        result = { kind: 'error' };
      }
      if (seq !== sequence.current || current.current !== identity)
        return undefined;
      if (result.kind === 'success') {
        let data = result.data;
        const old = cache.get(identity);
        if (next > 1 && old) {
          const unique = <T extends { id: string }>(
            a: T[] = [],
            b: T[] = []
          ) => [...new Map([...a, ...b].map((i) => [i.id, i])).values()];
          data = {
            ...data,
            ...(data.orders ? { orders: unique(old.orders, data.orders) } : {}),
            ...(data.candidates
              ? { candidates: unique(old.candidates, data.candidates) }
              : {}),
            ...(data.classes
              ? { classes: unique(old.classes, data.classes) }
              : {}),
          };
        }
        cache.set(identity, data);
        page.current = next;
        setSnapshot({ identity, data, result });
      } else {
        if (result.kind === 'denied' || result.kind === 'notFound')
          cache.delete(identity);
        failedPage.current = next;
        setFooterError(next > 1);
        setSnapshot({ identity, data: cache.get(identity), result });
      }
      inFlight.current = false;
      setBusy(false);
      return result;
    },
    [identity, source, offline, scenario, enabled, revision]
  );
  useFocusEffect(
    useCallback(() => {
      inFlight.current = false;
      if (enabled) load();
      return () => {
        sequence.current++;
        inFlight.current = false;
      };
    }, [load, enabled])
  );
  useEffect(
    () =>
      NetInfo.addEventListener((network) =>
        setOnline(
          network.isConnected !== false && network.isInternetReachable !== false
        )
      ),
    []
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (value) => {
      if (value === 'active' && enabled && !offline) load();
    });
    return () => sub.remove();
  }, [load, offline, enabled]);
  const data =
    snapshot.identity === identity ? snapshot.data : cache.get(identity);
  const result = snapshot.identity === identity ? snapshot.result : undefined;
  return {
    data,
    result,
    busy,
    offline: offline || result?.kind === 'offline',
    footerError,
    refresh: () => load(),
    retry: () => load(failedPage.current),
    more: () => load(page.current + 1),
    hasMore:
      !!data &&
      (data.orders ?? data.candidates ?? data.classes ?? []).length <
        data.total,
  };
}
export type OperationsQuery = ReturnType<typeof useOperationsQuery>;
export function useOperationsMutation() {
  const { send } = useOperations();
  const [result, setResult] = useState<Result>(),
    [busy, setBusy] = useState(false);
  const pending = useRef<Mutation | null>(null),
    locked = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const submit = async (intent: Mutation, retry = false) => {
    if (locked.current) return undefined;
    locked.current = true;
    setBusy(true);
    if (!retry || !pending.current)
      pending.current = JSON.parse(JSON.stringify(intent)) as Mutation;
    const value = await send(pending.current);
    if (mounted.current) {
      setResult(value);
      setBusy(false);
    }
    locked.current = false;
    if (value.kind !== 'uncertain') pending.current = null;
    return value;
  };
  return {
    result,
    busy,
    submit,
    uncertain: result?.kind === 'uncertain',
    reset: () => {
      pending.current = null;
      setResult(undefined);
    },
  };
}
