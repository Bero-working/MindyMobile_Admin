import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNetInfo } from '@react-native-community/netinfo';
import { ApiError } from '@/shared/http/apiClient';

const terminal = (error: ApiError) =>
  error.kind === 'denied' || error.kind === 'notFound';
const asApiError = <E>(e: E) =>
  e instanceof ApiError ? e : new ApiError('error');
export type RemoteRead<T> = {
  data?: T | undefined;
  busy: boolean;
  error?: ApiError | undefined;
  offline: boolean;
  refresh: () => Promise<T | undefined>;
};
type Slot<T> = {
  key: string;
  data?: T | undefined;
  error?: ApiError | undefined;
  busy: boolean;
};
/**
 * Loads on demand for one query key and reloads on focus, foreground and
 * reconnect. A failed reload keeps data of the same key unless access was lost;
 * responses of a superseded request are dropped.
 */
export function useRemoteRead<T>(
  key: string,
  read: () => Promise<T>,
  enabled = true
): RemoteRead<T> {
  const navigation = useNavigation();
  const network = useNetInfo();
  const current = useRef(read);
  current.current = read;
  const generation = useRef(0);
  const inFlight = useRef(false);
  const [slot, setSlot] = useState<Slot<T>>({ key, busy: enabled });
  const refresh = useCallback(async () => {
    if (!enabled) return undefined;
    const token = ++generation.current;
    inFlight.current = true;
    setSlot((previous) => ({
      key,
      ...(previous.key === key && previous.data !== undefined
        ? { data: previous.data }
        : {}),
      busy: true,
    }));
    try {
      const data = await current.current();
      if (token !== generation.current) return undefined;
      inFlight.current = false;
      setSlot({ key, data, busy: false });
      return data;
    } catch (e) {
      if (token !== generation.current) return undefined;
      inFlight.current = false;
      const error = asApiError(e);
      setSlot((previous) => ({
        key,
        ...(!terminal(error) &&
        previous.key === key &&
        previous.data !== undefined
          ? { data: previous.data }
          : {}),
        error,
        busy: false,
      }));
      return undefined;
    }
  }, [key, enabled]);
  useEffect(() => {
    refresh();
    return () => {
      generation.current++;
      inFlight.current = false;
    };
  }, [refresh]);
  useEffect(() => {
    if (!enabled) return;
    const reload = () => {
      // The first focus event arrives while the initial request is running.
      if (!inFlight.current) refresh();
    };
    const unsubscribe = navigation.addListener?.('focus', reload);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') reload();
    });
    return () => {
      unsubscribe?.();
      subscription.remove();
    };
  }, [enabled, navigation, refresh]);
  const offline =
    network.isConnected === false || network.isInternetReachable === false;
  const wasOffline = useRef(offline);
  useEffect(() => {
    if (wasOffline.current && !offline) refresh();
    wasOffline.current = offline;
  }, [offline, refresh]);
  return {
    ...(slot.key === key ? slot : { busy: enabled }),
    offline,
    refresh,
  };
}
type PageResult<T> = {
  items: T[];
  hasMore: boolean;
  next?: number | string | null | undefined;
};
const distinct = <T>(rows: T[], rowKey: (row: T) => string) => {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const id = rowKey(row);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};
/**
 * Accumulates pages of one query. Further pages load only on demand and a
 * failed page stays retryable. A background reload updates the first page and
 * keeps appended rows so returning to the list keeps its scroll position; the
 * returned `refresh` is the explicit restart from page one.
 */
export function useAppendedList<T, P extends PageResult<T>>(
  key: string,
  fetchPage: (next?: number | string | null) => Promise<P>,
  rowKey: (row: T) => string,
  enabled = true
) {
  const first = useRemoteRead<P>(key, () => fetchPage(), enabled);
  const [extra, setExtra] = useState<{ key: string; items: T[]; last: P }>();
  const [footer, setFooter] = useState<{ key: string; error: ApiError }>();
  const [loadingMore, setLoadingMore] = useState(false);
  const lock = useRef(false);
  const active = useRef(key);
  active.current = key;
  const current = extra?.key === key ? extra : undefined;
  const last = current?.last ?? first.data;
  const merged = first.data
    ? distinct([...first.data.items, ...(current?.items ?? [])], rowKey)
    : undefined;
  const footerError = footer?.key === key ? footer.error : undefined;
  const more = async () => {
    if (!first.data || !last?.hasMore || lock.current) return;
    lock.current = true;
    setLoadingMore(true);
    setFooter(undefined);
    const owner = key;
    try {
      const page = await fetchPage(last.next);
      if (active.current !== owner) return;
      setExtra({
        key: owner,
        items: distinct([...(merged ?? []), ...page.items], rowKey),
        last: page,
      });
    } catch (e) {
      if (active.current === owner)
        setFooter({ key: owner, error: asApiError(e) });
    } finally {
      lock.current = false;
      setLoadingMore(false);
    }
  };
  const refresh = async () => {
    const data = await first.refresh();
    if (data && active.current === key) {
      setExtra(undefined);
      setFooter(undefined);
    }
    return data;
  };
  const lost = !!footerError && terminal(footerError);
  return {
    ...first,
    refresh,
    data: lost ? undefined : first.data,
    error: lost ? footerError : first.error,
    items: lost ? undefined : merged,
    hasMore: !lost && !!last?.hasMore,
    loadingMore,
    footerError: lost ? undefined : footerError,
    more,
  };
}
