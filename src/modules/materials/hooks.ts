import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialError } from './service';
export function useRead<T>(
  key: string,
  read: () => Promise<T>,
  enabled = true
) {
  const current = useRef(read);
  current.current = read;
  const generation = useRef(0);
  const connected = useRef(true);
  const [state, set] = useState<{
    key: string;
    data?: T;
    error?: MaterialError;
    busy: boolean;
  }>({ key, busy: enabled });
  const [online, setOnline] = useState(true);
  const refresh = useCallback(async () => {
    if (!enabled) return;
    const token = ++generation.current;
    set((s) => ({
      key,
      ...(s.key === key && s.data !== undefined ? { data: s.data } : {}),
      busy: true,
    }));
    try {
      const data = await current.current();
      if (token === generation.current) set({ key, data, busy: false });
      return data;
    } catch (e) {
      if (token === generation.current) {
        const error =
          e instanceof MaterialError ? e : new MaterialError('error');
        set((s) => ({
          key,
          ...(!['denied', 'notFound', 'conflict'].includes(error.kind) &&
          s.key === key &&
          s.data !== undefined
            ? { data: s.data }
            : {}),
          error,
          busy: false,
        }));
      }
      return undefined;
    }
  }, [enabled, key]);
  useFocusEffect(
    useCallback(() => {
      refresh();
      const subscription = AppState.addEventListener('change', (value) => {
        if (value === 'active') refresh();
      });
      return () => {
        generation.current++;
        subscription.remove();
      };
    }, [refresh])
  );
  useEffect(
    () =>
      NetInfo.addEventListener((s) => {
        const next = s.isConnected !== false && s.isInternetReachable !== false;
        if (!connected.current && next) refresh();
        connected.current = next;
        setOnline(next);
      }),
    [refresh]
  );
  return {
    ...(state.key === key ? state : { key, busy: enabled }),
    online,
    refresh,
  };
}
