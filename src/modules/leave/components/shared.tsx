import {
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import {
  AppState,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import {
  useNavigation,
  usePreventRemove,
  type NavigationAction,
} from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Alert as BaseAlert,
  BrandHeader,
  Button,
  Card,
  Chip,
  Icon,
  Screen,
  Sheet,
  Text,
  ui,
} from '@/components/ui/primitives';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useMindyTheme } from '@/components/ui/theme';
import { cn } from '@/utils/cn';
import { useLeave } from '../LeaveProvider';
import { dateLabel, vietnamDay } from '../model';
import type { LeaveQuery } from '../hooks';
import type { Outcome, Scenario } from '../types';

export function useWords() {
  const { t } = useTranslation('leave', { keyPrefix: undefined });
  return (key: string, values?: Record<string, string | number>) =>
    String(t(key, { ...values, keySeparator: false }));
}
export function Page({
  children,
  prefix,
  title,
  subtitle,
  onBack,
  footer,
  dirty = false,
  busy = false,
  uncertain = false,
  allowLeave,
  refresh,
  onEnd,
}: PropsWithChildren<{
  prefix: string;
  title: string;
  subtitle?: string | undefined;
  onBack: () => void;
  footer?: ReactNode;
  dirty?: boolean;
  busy?: boolean;
  uncertain?: boolean;
  allowLeave?: React.RefObject<boolean>;
  refresh?: () => Promise<object | undefined>;
  onEnd?: () => void;
}>) {
  const w = useWords(),
    { colors } = useMindyTheme(),
    insets = useSafeAreaInsets();
  const { mock, scenario, setScenario } = useLeave();
  const navigation = useNavigation();
  const [review, setReview] = useState(false),
    [leave, setLeave] = useState(false),
    [leaving, setLeaving] = useState(false),
    [refreshing, setRefreshing] = useState(false);
  const action = useRef<NavigationAction | undefined>(undefined);
  usePreventRemove(
    !leaving && !allowLeave?.current && (dirty || busy || uncertain),
    (event) => {
      if (allowLeave?.current) {
        action.current = event.data.action;
        setLeaving(true);
        return;
      }
      if (busy) return;
      action.current = event.data.action;
      setLeave(true);
    }
  );
  useEffect(() => {
    if (leaving && action.current) navigation.dispatch(action.current);
  }, [leaving, navigation]);
  return (
    <View className="flex-1 bg-mdy-bg">
      <Screen
        testID={`${prefix}-screen`}
        variant="app"
        keyboardAware
        flushBottom
        onScroll={({ nativeEvent: e }) => {
          if (
            e.contentOffset.y + e.layoutMeasurement.height >=
            e.contentSize.height - 120
          )
            onEnd?.();
        }}
        refreshControl={
          refresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await refresh();
                } finally {
                  setRefreshing(false);
                }
              }}
            />
          ) : undefined
        }
      >
        <BrandHeader subpage>
          <View className="flex-row items-center gap-space-12">
            <Button
              testID={`${prefix}-back`}
              variant="text"
              accessibilityLabel={w('back')}
              onPress={onBack}
            >
              <Icon
                name="arrow_back"
                color={colors.onBrand}
              />
            </Button>
            <View className="flex-1 gap-space-4">
              <Text
                accessibilityRole="header"
                className="text-size-18 font-bvp-semibold text-mdy-onBrand"
              >
                {title}
              </Text>
              {subtitle && (
                <Text
                  testID={`${prefix}-subtitle`}
                  className="text-size-13 text-mdy-onBrandMuted"
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
        </BrandHeader>
        <View className="grow -mt-space-28 rounded-tl-radius-28 rounded-tr-radius-28 bg-mdy-bg px-space-24 py-space-24 gap-space-16">
          {mock && (
            <Button
              testID="leave-mock-badge"
              variant="text"
              size="sm"
              onPress={() => setReview(true)}
            >
              {w('mock')}
            </Button>
          )}
          {children}
        </View>
      </Screen>
      {footer && (
        <View
          className="bg-mdy-surface border-t border-mdy-divider px-space-24 pt-space-12 gap-space-10"
          style={{ paddingBottom: Math.max(12, insets.bottom) }}
        >
          {footer}
        </View>
      )}
      {review && (
        <Sheet
          testID="leave-review-scenarios"
          title={w('review')}
          onClose={() => setReview(false)}
        >
          <ScrollView
            className="max-h-[400px]"
            contentContainerClassName="gap-space-8"
          >
            {(
              [
                'success',
                'loading',
                'empty',
                'error',
                'offline',
                'denied',
                'notFound',
                'refreshError',
                'conflict',
                'uncertain',
                'late',
                'stale',
                'studentConflict',
                'full',
                'notEligible',
              ] as Scenario[]
            ).map((value) => (
              <Button
                key={value}
                testID={`leave-scenario-${value}`}
                variant={scenario === value ? 'primary' : 'secondary'}
                onPress={() => {
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
      {leave && (
        <ConfirmationDialog
          testID="leave-dialog"
          title={w('leaveTitle')}
          icon="warning"
          onClose={() => setLeave(false)}
        >
          <Text>{w(uncertain ? 'unknown' : 'leaveBody')}</Text>
          <Button
            testID="leave-stay"
            onPress={() => setLeave(false)}
          >
            {w('stay')}
          </Button>
          <Button
            testID="leave-discard"
            variant="danger"
            onPress={() => {
              setLeave(false);
              setLeaving(true);
            }}
          >
            {w('discard')}
          </Button>
        </ConfirmationDialog>
      )}
    </View>
  );
}
export function Loading() {
  const w = useWords();
  return (
    <View
      testID="leave-loading"
      className="gap-space-12"
    >
      {[0, 1, 2].map((i) => (
        <Skeleton
          key={i}
          label={w('loading')}
        >
          <View className="h-space-120 rounded-radius-14 bg-mdy-muted2" />
        </Skeleton>
      ))}
    </View>
  );
}
export function QueryBlock({
  query,
  prefix,
  children,
}: PropsWithChildren<{ query: LeaveQuery; prefix: string }>) {
  const w = useWords();
  const kind = query.result?.kind;
  if (kind === 'denied' || kind === 'notFound')
    return (
      <Card
        testID={`${prefix}-${kind === 'denied' ? 'denied' : 'not-found'}`}
        className="mx-space-0"
      >
        <Text accessibilityRole="alert">{w(kind)}</Text>
      </Card>
    );
  if (!query.data) {
    if (query.offline)
      return (
        <Notice
          testID={`${prefix}-offline`}
          warning
        >
          {w('leave.offlineEmpty')}
        </Notice>
      );
    if (kind === 'error')
      return (
        <Card
          testID={`${prefix}-error`}
          className="mx-space-0"
        >
          <Text>{w('error')}</Text>
          <Button
            testID={`${prefix}-retry`}
            onPress={query.retry}
          >
            {w('retry')}
          </Button>
        </Card>
      );
    return <Loading />;
  }
  return (
    <>
      {children}
      {query.offline ? (
        <Notice
          testID={`${prefix}-offline`}
          warning
        >
          {w('leave.stale')}
        </Notice>
      ) : kind === 'error' && !query.footerError ? (
        <View className="gap-space-8">
          <Notice
            testID={`${prefix}-refresh-alert`}
            warning
          >
            {w('leave.stale')}
          </Notice>
          <Button
            variant="text"
            testID={`${prefix}-retry`}
            onPress={query.retry}
          >
            {w('retry')}
          </Button>
        </View>
      ) : null}
    </>
  );
}
export function More({ query, prefix }: { query: LeaveQuery; prefix: string }) {
  const w = useWords();
  if (!query.data || query.count >= query.data.total) return null;
  return (
    <View className="gap-space-8">
      {query.footerError && <Text accessibilityRole="alert">{w('error')}</Text>}
      <Button
        testID={`${prefix}-more`}
        variant="text"
        busy={query.busy}
        disabled={query.offline}
        onPress={() => (query.footerError ? query.retry() : query.more())}
      >
        {w(query.footerError ? 'retry' : 'more')}
      </Button>
    </View>
  );
}
export function Filters({
  prefix,
  options,
  value,
  onChange,
  children,
}: PropsWithChildren<{
  prefix: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}>) {
  return (
    <View className="-mx-space-24">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-space-24"
      >
        <View
          accessibilityRole="radiogroup"
          className="flex-row items-center gap-space-8"
        >
          {options.map((option) => (
            <Pressable
              key={option.value}
              testID={`${prefix}-filter-${option.value.toLowerCase()}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: value === option.value }}
              onPress={() => onChange(option.value)}
              className={
                value === option.value
                  ? 'min-h-space-44 rounded-radius-99 px-space-16 justify-center bg-mdy-primary'
                  : 'min-h-space-44 rounded-radius-99 px-space-16 justify-center border border-mdy-border bg-mdy-surface'
              }
            >
              <Text
                className={
                  value === option.value
                    ? 'text-size-13 font-bvp-semibold text-mdy-onBrand'
                    : 'text-size-13 text-mdy-link'
                }
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
          {children}
        </View>
      </ScrollView>
    </View>
  );
}
const fieldStyle = StyleSheet.create({ multiline: { minHeight: 100 } });
export function Field({
  id,
  label,
  value,
  onChange,
  disabled = false,
  multiline = false,
  max,
  error,
  inputRef,
  hideLabel = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  multiline?: boolean;
  max?: number;
  error?: string | undefined;
  inputRef?: React.RefObject<TextInput | null>;
  hideLabel?: boolean;
}) {
  const { colors } = useMindyTheme();
  return (
    <View className="gap-space-6">
      {!hideLabel && (
        <Text className="text-size-13 font-bvp-medium">{label}</Text>
      )}
      <TextInput
        ref={inputRef}
        testID={id}
        accessibilityLabel={label}
        accessibilityHint={error}
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        multiline={multiline}
        textAlignVertical="top"
        placeholderTextColor={colors.placeholder}
        className={`bg-mdy-surface border rounded-radius-14 text-mdy-ink text-size-14 font-bvp-regular p-space-12 ${error || (max && value.length > max) ? 'border-mdy-dangerBorder' : 'border-mdy-border'}`}
        style={multiline ? fieldStyle.multiline : undefined}
      />
      {max && (
        <Text
          className={
            value.length > max
              ? 'text-size-12 text-right text-mdy-danger'
              : 'text-size-12 text-right text-mdy-secondary'
          }
        >{`${value.length}/${max}`}</Text>
      )}
      {error && (
        <Text
          accessibilityLiveRegion="polite"
          className="text-size-12 text-mdy-danger"
        >
          {error}
        </Text>
      )}
    </View>
  );
}
export function DateField({
  id,
  label,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    w = useWords(),
    { colors, isDark } = useMindyTheme();
  return (
    <View className="gap-space-6">
      <Text className="text-size-13 font-bvp-medium">{label}</Text>
      <Button
        variant="secondary"
        testID={id}
        disabled={disabled}
        onPress={() => setOpen(true)}
      >
        {value ? dateLabel(value) : w('chooseDate')}
      </Button>
      {open && (
        <Sheet
          title={label}
          testID={`${id}-calendar`}
          onClose={() => setOpen(false)}
        >
          <Calendar
            testID={`${id}-days`}
            key={String(isDark)}
            current={value || vietnamDay()}
            minDate={vietnamDay()}
            markedDates={value ? { [value]: { selected: true } } : {}}
            onDayPress={(date) => {
              onChange(date.dateString);
              setOpen(false);
            }}
            theme={{
              calendarBackground: colors.surface,
              dayTextColor: colors.ink,
              monthTextColor: colors.ink,
              textSectionTitleColor: colors.secondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.onBrand,
              arrowColor: colors.link,
              todayTextColor: colors.link,
            }}
          />
        </Sheet>
      )}
    </View>
  );
}
export function OutcomeError({
  result,
  prefix,
  retry,
}: {
  result: Outcome | undefined;
  prefix: string;
  retry?: () => void;
}) {
  const w = useWords();
  if (result?.kind === 'uncertain')
    return (
      <View
        testID={`${prefix}-intent`}
        className="gap-space-8"
      >
        <Notice warning>{w('unknown')}</Notice>
        <Button
          testID={`${prefix}-resend`}
          onPress={retry}
        >
          {w('resend')}
        </Button>
      </View>
    );
  if (result?.kind === 'error')
    return (
      <Notice
        testID={`${prefix}-send-error`}
        danger
      >
        {w(result.code) === result.code ? w('SERVER') : w(result.code)}
        {result.requestId
          ? ` · ${w('leave.support', { id: result.requestId })}`
          : ''}
      </Notice>
    );
  return null;
}
export function StatusChip({ status, id }: { status: string; id?: string }) {
  const w = useWords();
  const tone =
    status === 'PENDING' || status === 'NEEDS_PLACEMENT'
      ? 'warning'
      : status === 'APPROVED' || status === 'RESOLVED'
        ? 'success'
        : status === 'REJECTED' || status === 'NEEDS_REASSIGNMENT'
          ? 'danger'
          : status === 'MAKEUP_ASSIGNED'
            ? 'info'
            : 'neutral';
  return (
    <Chip
      {...(id ? { testID: id } : {})}
      variant={tone}
    >
      {w(status)}
    </Chip>
  );
}
export function useForeground(callback: () => void) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') callback();
    });
    return () => subscription.remove();
  }, [callback]);
}

export function Notice({
  children,
  testID = 'leave-notice',
  warning = false,
  danger = false,
}: {
  children: ReactNode;
  testID?: string;
  warning?: boolean;
  danger?: boolean;
}) {
  const { colors } = useMindyTheme();
  const text = Array.isArray(children) ? children.join('') : String(children);
  if (warning || danger)
    return (
      <BaseAlert
        testID={testID}
        warning={warning}
      >
        {text}
      </BaseAlert>
    );
  return (
    <View
      testID={testID}
      accessibilityRole="text"
      className={cn(ui.alert, 'bg-mdy-infoBg')}
    >
      <Icon
        size={18}
        name="info"
        color={colors.info}
      />
      <View className="flex-1">
        <Text className={cn(ui.alertText, 'text-mdy-info')}>{text}</Text>
      </View>
    </View>
  );
}
export function Divider() {
  return <View className="border-t border-mdy-divider" />;
}
export function DueLine({ id, time }: { id?: string; time: string }) {
  const w = useWords(),
    { colors } = useMindyTheme();
  return (
    <View className="flex-row items-center gap-space-6">
      <Icon
        name="schedule"
        size={16}
        color={colors.warning}
      />
      <Text
        {...(id ? { testID: id } : {})}
        className="flex-1 text-size-12 text-mdy-warning"
      >
        {w('leave.dueAt', { time })}
      </Text>
    </View>
  );
}
export function DayTile({ value }: { value: string }) {
  const w = useWords(),
    day = vietnamDay(value);
  return (
    <View className="w-space-44 items-center py-space-6 rounded-radius-12 bg-mdy-muted2">
      <Text className="text-size-11 text-mdy-secondary">
        {w(`leave.weekday.${new Date(`${day}T00:00:00Z`).getUTCDay()}`)}
      </Text>
      <Text className="text-size-15 font-bvp-semibold">{day.slice(8)}</Text>
    </View>
  );
}
