import {
  useState,
  useId,
  useContext,
  useRef,
  useCallback,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BrandHeader,
  Card,
  Gradient,
  Icon,
  Text,
  Button,
  CircleIcon,
  Sheet,
  Alert,
} from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { Screen } from '@/components/ui/primitives';
import {
  FatalProvider,
  RefreshContext,
  MoreContext,
  PageHeadingContext,
  PageHeaderContext,
  useTeaching,
} from '../TeachingProvider';
import type { Scenario } from '../types';
import type { useTeachingQuery } from '../hooks/useTeachingQuery';
import '../messages';
export type QueryState = ReturnType<typeof useTeachingQuery>;
export function TeachingPage({
  children,
  prefix,
  title,
  subtitle,
  reserveSubtitle = false,
  onBack,
  header,
  deniedTitle,
  deniedBody,
  notFound,
  tabs,
  tab,
  onTab,
}: PropsWithChildren<{
  prefix: string;
  title: string;
  subtitle?: string | undefined;
  reserveSubtitle?: boolean;
  onBack: () => void;
  header?: ReactNode;
  deniedTitle?: string;
  deniedBody?: string;
  notFound?: string;
  tabs?: { value: string; label: string }[];
  tab?: string;
  onTab?: (value: string) => void;
}>) {
  const { t } = useTranslation('teaching');
  const { colors } = useMindyTheme();
  const [failure, setFailure] = useState<'denied' | 'notFound'>();
  const [review, setReview] = useState(false);
  const [extraHeader, setExtraHeader] = useState<ReactNode>(null);
  const [heading, setHeading] = useState<{
    title: string;
    subtitle?: string;
    loading?: boolean;
  }>();
  const { scenario, setScenario, mock } = useTeaching();
  const moreLoaders = useRef(new Map<string, () => Promise<void>>());
  const registerMore = useCallback(
    (key: string, load: (() => Promise<void>) | null) => {
      if (load) moreLoaders.current.set(key, load);
      else moreLoaders.current.delete(key);
    },
    []
  );
  const refreshers = useRef(new Map<string, () => Promise<void>>());
  const [refreshing, setRefreshing] = useState(false);
  const registerRefresh = useCallback(
    (key: string, refresh: (() => Promise<void>) | null) => {
      if (refresh) refreshers.current.set(key, refresh);
      else refreshers.current.delete(key);
    },
    []
  );
  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.allSettled(
      Array.from(refreshers.current.values()).map((refresh) => refresh())
    );
    setRefreshing(false);
  };
  const tabbed = !!tabs && !failure;
  return (
    <Screen
      testID={`${prefix}-screen`}
      variant="app"
      onScroll={({ nativeEvent }) => {
        if (
          nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height >=
          nativeEvent.contentSize.height - 120
        )
          Promise.allSettled(
            Array.from(moreLoaders.current.values()).map((load) => load())
          );
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshAll}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <BrandHeader
        subpage
        flush={tabbed}
      >
        <View className="flex-row items-center gap-space-8">
          <Pressable
            testID={`${prefix}-back-button`}
            accessibilityRole="button"
            accessibilityLabel={t('back')}
            onPress={onBack}
            hitSlop={{ top: 6, bottom: 6 }}
            className="min-h-space-44 px-space-20 py-space-6 items-center justify-center"
          >
            <Icon
              name="arrow_back"
              color={colors.onBrand}
            />
          </Pressable>
          <View className="flex-1">
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={1.3}
              className="text-size-18 font-bvp-semibold text-mdy-onBrand"
            >
              {failure ? title : (heading?.title ?? title)}
            </Text>
            {(reserveSubtitle || !!(heading?.subtitle ?? subtitle)) && (
              <View
                testID={`${prefix}-subtitle-slot`}
                className="min-h-[21px]"
              >
                {!failure && (heading?.loading ?? reserveSubtitle) ? (
                  <View
                    testID={`${prefix}-heading-skeleton`}
                    className="w-[80px]"
                  >
                    <Skeleton label={t('loading')}>
                      <Text
                        numberOfLines={1}
                        className="text-size-13 text-mdy-onBrandMuted"
                      >
                        000
                      </Text>
                    </Skeleton>
                  </View>
                ) : heading?.subtitle || subtitle ? (
                  <Text
                    testID={`${prefix}-count`}
                    numberOfLines={1}
                    className="text-size-13 text-mdy-onBrandMuted"
                  >
                    {heading?.subtitle ?? subtitle}
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        </View>
        {header}
        {extraHeader}
        {tabbed && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-space-16"
          >
            <View
              accessibilityRole="tablist"
              className="flex-row items-end pt-space-12"
            >
              {tabs.map((item) => (
                <Pressable
                  key={item.value}
                  testID={`${prefix}-tab-${item.value}`}
                  accessibilityRole="tab"
                  hitSlop={{ top: 4, bottom: 4 }}
                  accessibilityState={{ selected: item.value === tab }}
                  onPress={() => onTab?.(item.value)}
                  className={
                    item.value === tab
                      ? 'h-space-48 px-space-22 justify-center rounded-tl-radius-18 rounded-tr-radius-18 bg-mdy-bg'
                      : 'h-space-40 px-space-22 justify-center rounded-tl-radius-18 rounded-tr-radius-18 bg-mdy-headerGlass'
                  }
                >
                  <Text
                    maxFontSizeMultiplier={1.3}
                    className={
                      item.value === tab
                        ? 'text-size-14 font-bvp-semibold text-mdy-ink'
                        : 'text-size-14 font-bvp-semibold text-mdy-onBrand'
                    }
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </BrandHeader>
      <View
        className={
          tabbed
            ? tab === tabs[0]?.value
              ? 'grow rounded-tr-radius-28 overflow-hidden'
              : 'grow rounded-tl-radius-28 rounded-tr-radius-28 overflow-hidden'
            : 'grow -mt-space-28 rounded-tl-radius-28 rounded-tr-radius-28 overflow-hidden'
        }
      >
        <Gradient
          id={`${prefix}-panel`}
          variant="background"
          app
        />
        <View className="px-space-24 pt-space-24 pb-space-24 gap-space-24">
          {mock && (
            <Pressable
              testID="teaching-mock-badge"
              accessibilityRole="button"
              onPress={() => setReview(true)}
              className="min-h-space-44 justify-center"
            >
              <Text className="text-size-12 text-mdy-link">{t('mock')}</Text>
            </Pressable>
          )}
          {failure ? (
            <Card
              center
              testID={`${prefix}-${failure === 'denied' ? 'denied' : 'not-found'}`}
            >
              <CircleIcon
                name={failure === 'denied' ? 'lock_person' : 'event_busy'}
              />
              <Text accessibilityRole="header">
                {failure === 'denied'
                  ? (deniedTitle ?? t('denied'))
                  : (notFound ?? t('notFound'))}
              </Text>
              {failure === 'denied' && (
                <Text>{deniedBody ?? t('deniedBody')}</Text>
              )}
              <Button
                size="sm"
                className="self-center px-space-28"
                onPress={onBack}
              >
                {t('back')}
              </Button>
            </Card>
          ) : (
            <FatalProvider onFatal={setFailure}>
              <PageHeaderContext.Provider value={setExtraHeader}>
                <PageHeadingContext.Provider value={setHeading}>
                  <MoreContext.Provider value={registerMore}>
                    <RefreshContext.Provider value={registerRefresh}>
                      {children}
                    </RefreshContext.Provider>
                  </MoreContext.Provider>
                </PageHeadingContext.Provider>
              </PageHeaderContext.Provider>
            </FatalProvider>
          )}
        </View>
      </View>
      {mock && review && (
        <Sheet
          title={t('mock')}
          testID="teaching-review-sheet"
          onClose={() => setReview(false)}
        >
          <ScrollView>
            {(
              [
                'success',
                'loading',
                'empty',
                'offline',
                'error',
                'denied',
                'notFound',
                'refreshError',
                'noRoster',
                'studentsError',
                'unitError',
                'unavailable',
              ] as Scenario[]
            ).map((value) => (
              <Button
                key={value}
                testID={`teaching-scenario-${value}`}
                variant={scenario === value ? 'primary' : 'secondary'}
                onPress={() => {
                  setFailure(undefined);
                  setScenario(value);
                  setReview(false);
                }}
              >
                {value}
              </Button>
            ))}
          </ScrollView>
        </Sheet>
      )}
    </Screen>
  );
}
export function SkeletonList({
  count = 3,
  variant = 'row',
}: {
  count?: number;
  variant?: 'row' | 'class' | 'schedule';
}) {
  const { t } = useTranslation('teaching');
  const reduced = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (!reduced)
      opacity.value = withRepeat(
        withTiming(0.55, { duration: 600, easing: Easing.linear }),
        -1,
        true
      );
    return () => cancelAnimation(opacity);
  }, [opacity, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      accessible
      accessibilityLabel={t('loading')}
      accessibilityRole="progressbar"
      style={style}
    >
      <View className="gap-space-20">
        {Array.from({ length: count }, (_, i) => (
          <View
            key={i}
            className={
              variant === 'class'
                ? 'rounded-radius-18 border border-mdy-glassBorder bg-mdy-glass px-space-24 py-space-20 gap-space-14'
                : variant === 'schedule'
                  ? 'rounded-radius-20 border border-mdy-glassBorder bg-mdy-glass p-space-16 gap-space-14'
                  : 'h-space-84 rounded-radius-18 bg-mdy-muted'
            }
          >
            {variant === 'class' && (
              <>
                <View className="flex-row justify-between gap-space-16">
                  <View className="h-[20px] w-[60%] rounded-radius-5 bg-mdy-muted" />
                  <View className="h-[20px] w-[64px] rounded-radius-5 bg-mdy-muted" />
                </View>
                <View className="h-[14px] w-[40%] rounded-radius-5 bg-mdy-muted" />
                <View className="h-[16px] w-[80%] rounded-radius-5 bg-mdy-muted" />
                <View className="h-[16px] w-[65%] rounded-radius-5 bg-mdy-muted" />
              </>
            )}
            {variant === 'schedule' && (
              <>
                <View className="flex-row gap-space-16">
                  <View className="w-[64px] gap-space-8 pr-space-16 border-r border-mdy-divider">
                    <View className="h-[26px] rounded-radius-5 bg-mdy-muted" />
                    <View className="h-[16px] rounded-radius-5 bg-mdy-muted" />
                  </View>
                  <View className="flex-1 gap-space-8">
                    <View className="h-space-22 w-[80px] rounded-radius-12 bg-mdy-muted" />
                    <View className="h-[18px] w-[90%] rounded-radius-5 bg-mdy-muted" />
                    <View className="h-[18px] w-[65%] rounded-radius-5 bg-mdy-muted" />
                    <View className="h-[16px] w-[75%] rounded-radius-5 bg-mdy-muted" />
                  </View>
                </View>
                <View className="flex-row gap-space-8">
                  <View className="flex-1 h-space-44 rounded-radius-22 bg-mdy-muted" />
                  <View className="flex-1 h-space-44 rounded-radius-22 bg-mdy-muted" />
                </View>
              </>
            )}
          </View>
        ))}
      </View>
    </Animated.View>
  );
}
export function QueryBlock({
  query,
  prefix,
  children,
  loading,
}: PropsWithChildren<{
  query: QueryState;
  prefix: string;
  loading?: ReactNode;
}>) {
  const { t } = useTranslation('teaching');
  if (query.result?.kind === 'unavailable')
    return <Text testID={`${prefix}-unavailable`}>{t('noRoster')}</Text>;
  const failure = query.result?.kind !== 'success' ? query.result : undefined;
  const offline = query.result?.kind === 'offline';
  return (
    <View
      testID={`${prefix}-query-block`}
      className="gap-space-24"
    >
      <View
        testID={`${prefix}-content`}
        className="gap-space-20"
      >
        {!query.data && !query.result ? (
          <View testID={`${prefix}-loading`}>
            {loading ?? <SkeletonList count={1} />}
          </View>
        ) : query.data ? (
          children
        ) : null}
      </View>
      {failure && (
        <View
          className="gap-space-16"
          testID={`${prefix}-feedback`}
        >
          <Alert
            testID={`${prefix}-${query.data ? 'refresh-alert' : 'error'}`}
            warning
          >
            {t(offline ? 'offline' : query.data ? 'refreshFailed' : 'error') +
              (failure.requestId
                ? ` ${t('support', { id: failure.requestId })}`
                : '')}
          </Alert>
          {!offline && (
            <Button
              testID={`${prefix}-retry`}
              variant="text"
              size="sm"
              className="self-center px-space-28"
              busy={query.busy}
              onPress={query.refresh}
            >
              {t('retry')}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}

export function Filters({
  prefix,
  values,
  value,
  onChange,
  group = 'classStatus',
  labelFor,
}: {
  prefix: string;
  values: string[];
  value: string;
  onChange: (value: string) => void;
  group?: string;
  labelFor?: (value: string, label: string) => string;
}) {
  const { t } = useTranslation('teaching');
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      <View
        accessibilityRole="radiogroup"
        className="flex-row gap-space-8"
      >
        {values.map((item) => (
          <Pressable
            key={item}
            testID={`${prefix}-filter-${item || 'all'}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: item === value }}
            onPress={() => onChange(item)}
            className={
              item === value
                ? 'min-h-space-44 rounded-radius-99 px-space-16 justify-center bg-mdy-primary'
                : 'min-h-space-44 rounded-radius-99 px-space-16 justify-center border border-mdy-border bg-mdy-surface'
            }
          >
            <Text
              className={
                item === value
                  ? 'text-size-13 font-bvp-semibold text-mdy-onBrand'
                  : 'text-size-13 text-mdy-link'
              }
            >
              {labelFor
                ? labelFor(item, t(`${group}.${item}`))
                : item
                  ? t(`${group}.${item}`)
                  : t('all')}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
export function Footer({
  query,
  prefix,
  count,
  label,
  active = true,
}: {
  query: QueryState;
  prefix: string;
  count: number;
  label?: string;
  active?: boolean;
}) {
  const { t } = useTranslation('teaching');
  const registerMore = useContext(MoreContext);
  const id = useId();
  useEffect(() => {
    registerMore(
      id,
      active &&
        !query.busy &&
        !query.footerError &&
        count < (query.data?.total ?? 0)
        ? query.more
        : null
    );
    return () => registerMore(id, null);
  }, [query.busy, query.footerError, query.data, count, active]);
  return query.busy && query.data && count < query.data.total ? (
    <View testID={`${prefix}-footer-skeleton`}>
      <Skeleton label={t('loading')}>
        <Button
          disabled
          variant="text"
        >
          {label ?? t('more')}
        </Button>
      </Skeleton>
    </View>
  ) : query.footerOffline ? (
    <Alert
      warning
      testID={`${prefix}-footer-offline`}
    >
      {t('offline')}
    </Alert>
  ) : query.footerError ? (
    <Button
      size="sm"
      className="self-center px-space-28"
      testID={`${prefix}-footer-retry`}
      onPress={query.more}
    >
      {t('retry')}
    </Button>
  ) : count < (query.data?.total ?? 0) ? (
    <Button
      variant="text"
      testID={`${prefix}-more`}
      onPress={query.more}
    >
      {label ?? t('more')}
    </Button>
  ) : null;
}
export function Group({ children }: { children: string }) {
  return (
    <Text
      accessibilityRole="header"
      className="text-size-12 font-bvp-semibold text-mdy-secondary pt-space-20 px-space-8"
    >
      {children}
    </Text>
  );
}
