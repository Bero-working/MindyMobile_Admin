import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useId,
} from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FatalContext, RefreshContext, useTeaching } from '../TeachingProvider';
import type {
  TeachingData,
  TeachingRequest,
  TeachingResult,
  TeachingSession,
} from '../types';
export function useTeachingQuery(
  request: TeachingRequest,
  enabled = true,
  propagateFatal = true
) {
  const { source, scenario } = useTeaching();
  const fatal = useContext(FatalContext);
  const registerRefresh = useContext(RefreshContext);
  const queryId = useId();
  const [result, setResult] = useState<TeachingResult>();
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [footerError, setFooterError] = useState(false);
  const [footerOffline, setFooterOffline] = useState(false);
  const sequence = useRef(0);
  const inFlight = useRef(false);
  const failedPage = useRef(1);
  const previous = useRef<TeachingData | undefined>(undefined);
  const identity = JSON.stringify(request);
  const loadedIdentity = useRef(identity);
  const load = useCallback(
    async (next = 1, refresh = false) => {
      if (next > 1 && inFlight.current) return;
      const id = ++sequence.current;
      inFlight.current = true;
      setBusy(true);
      setFooterError(false);
      setFooterOffline(false);
      if (loadedIdentity.current !== identity || (next === 1 && !refresh)) {
        loadedIdentity.current = identity;
        previous.current = undefined;
        failedPage.current = 1;
        setResult(undefined);
      }
      let value: TeachingResult;
      try {
        value =
          scenario === 'refreshError' && previous.current
            ? { kind: 'error', requestId: 'mock-refresh' }
            : await source.read({ ...request, page: next });
      } catch {
        value = { kind: 'error' };
      }
      if (id !== sequence.current) return;
      if (request.kind === 'schedule' && value.kind === 'success') {
        let nextPage = 2;
        while (value.data.sessions.length < value.data.total) {
          let extra: TeachingResult;
          try {
            extra = await source.read({ ...request, page: nextPage++ });
          } catch {
            extra = { kind: 'error' };
          }
          if (id !== sequence.current) return;
          if (extra.kind !== 'success') {
            value = extra;
            break;
          }
          const merged: TeachingSession[] = Array.from(
            new Map(
              [...value.data.sessions, ...extra.data.sessions].map((item) => [
                item.id,
                item,
              ])
            ).values()
          );
          if (merged.length === value.data.sessions.length) {
            value = { kind: 'error' };
            break;
          }
          value = {
            kind: 'success',
            data: { ...value.data, sessions: merged },
          };
        }
      }
      if (id !== sequence.current) return;
      if (
        value.kind === 'denied' ||
        value.kind === 'notFound' ||
        value.kind === 'unavailable'
      ) {
        previous.current = undefined;
        setResult(value);
        if (propagateFatal && value.kind !== 'unavailable') fatal(value.kind);
      } else if (value.kind === 'success') {
        const old = next > 1 ? previous.current : undefined;
        const merge = <T extends { id: string }>(first: T[], second: T[]) =>
          Array.from(
            new Map(
              [...first, ...second].map((item) => [item.id, item])
            ).values()
          );
        const data = old
          ? {
              ...value.data,
              classes: merge(old.classes, value.data.classes),
              sessions: merge(old.sessions, value.data.sessions),
              students: merge(old.students, value.data.students),
              units: merge(old.units, value.data.units),
            }
          : value.data;
        previous.current = data;
        setResult({ kind: 'success', data });
        setPage(next);
      } else if (next > 1) {
        failedPage.current = next;
        setFooterError(true);
        setFooterOffline(value.kind === 'offline');
      } else setResult(value);
      inFlight.current = false;
      setBusy(false);
    },
    [source, identity, scenario]
  );
  useEffect(() => {
    if (enabled) registerRefresh(queryId, () => load(1, true));
    return () => registerRefresh(queryId, null);
  }, [load, enabled, registerRefresh, queryId]);
  useFocusEffect(
    useCallback(() => {
      if (enabled) load(1, !!previous.current);
      return () => {
        sequence.current++;
        inFlight.current = false;
      };
    }, [load, enabled])
  );
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active' && enabled) load(1, true);
    });
    return () => listener.remove();
  }, [load, enabled]);
  const data =
    loadedIdentity.current !== identity
      ? undefined
      : result?.kind === 'success'
        ? result.data
        : previous.current;
  return {
    data,
    result,
    busy,
    footerError,
    footerOffline,
    refresh: () => load(1, true),
    retry: () => load(footerError ? failedPage.current : 1, !!previous.current),
    more: () => load(page + 1),
    load,
  };
}
