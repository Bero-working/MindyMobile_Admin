import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useQuiz } from './QuizProvider';
import { QuizError, type ListQuery, type QuizPageData } from './service';
import type { Quiz } from './types';
export type ReadState<T> = {
  data?: T | undefined;
  busy: boolean;
  error?: QuizError | undefined;
  refresh: () => Promise<T | undefined>;
};
function useRead<T>(
  key: string,
  read: () => Promise<T>,
  enabled: boolean
): ReadState<T> {
  const navigation = useNavigation();
  const network = useNetInfo();
  const current = useRef(read);
  current.current = read;
  const generation = useRef(0);
  const [value, setValue] = useState<{
    key: string;
    data?: T | undefined;
    error?: QuizError | undefined;
    busy: boolean;
  }>({ key, busy: enabled });
  const refresh = useCallback(async () => {
    if (!enabled) return undefined;
    const token = ++generation.current;
    setValue((previous) => ({
      key,
      ...(previous.key === key && previous.data !== undefined
        ? { data: previous.data }
        : {}),
      busy: true,
    }));
    try {
      const data = await current.current();
      if (token === generation.current) setValue({ key, data, busy: false });
      return token === generation.current ? data : undefined;
    } catch (e) {
      const error = e instanceof QuizError ? e : new QuizError('error');
      if (token === generation.current)
        setValue((previous) => ({
          key,
          ...(!['denied', 'notFound'].includes(error.kind) &&
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
    };
  }, [refresh]);
  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = navigation.addListener?.('focus', () => {
      refresh();
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
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
  return { ...(value.key === key ? value : { busy: enabled }), refresh };
}
export function useQuizDetail(id: string | undefined) {
  const store = useQuiz();
  return useRead<Quiz>(
    `detail:${id ?? ''}`,
    () => store.fetchDetail(id!),
    !store.mock && !!id
  );
}
export function useQuizList(query: ListQuery) {
  const store = useQuiz();
  const identity = JSON.stringify({ ...query, revision: store.revision });
  const [extra, setExtra] = useState<{ key: string; data: QuizPageData }>();
  const [loadingMore, setLoadingMore] = useState(false),
    [footerProblem, setFooterProblem] = useState<{
      key: string;
      error: QuizError;
      base: QuizPageData | undefined;
    }>();
  const lock = useRef(false),
    active = useRef(identity);
  active.current = identity;
  const first = useRead<QuizPageData>(
    identity,
    () => store.fetchList({ ...query, page: 1 }),
    !store.mock
  );
  const footerError =
    footerProblem?.key === identity && footerProblem.base === first.data
      ? footerProblem.error
      : undefined;
  // Accumulated rows belong to exactly one first-page generation.
  const base = useRef<QuizPageData | undefined>(undefined);
  const accumulated =
    extra?.key === identity && base.current === first.data
      ? extra.data
      : first.data;
  const more = async () => {
    if (
      !accumulated ||
      lock.current ||
      accumulated.items.length >= accumulated.total ||
      store.mock
    )
      return;
    const key = identity;
    lock.current = true;
    setLoadingMore(true);
    setFooterProblem(undefined);
    try {
      const page = await store.fetchList({
        ...query,
        page: accumulated.page + 1,
      });
      if (active.current !== key) return;
      const rows = [...accumulated.items];
      for (const row of page.items)
        if (!rows.some((q) => q.id === row.id)) rows.push(row);
      if (!page.items.length && rows.length < page.total)
        throw new QuizError('error', 'INVALID_PAGE');
      base.current = first.data;
      setExtra({ key, data: { ...page, items: rows } });
    } catch (e) {
      if (active.current === key)
        setFooterProblem({
          key,
          base: first.data,
          error: e instanceof QuizError ? e : new QuizError('error'),
        });
    } finally {
      lock.current = false;
      setLoadingMore(false);
    }
  };
  const terminal =
    footerError && ['denied', 'notFound'].includes(footerError.kind);
  return {
    ...first,
    data: terminal ? undefined : accumulated,
    error: terminal ? footerError : first.error,
    more,
    loadingMore,
    footerError,
  };
}
