import {
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import {
  StyleSheet,
  AccessibilityInfo,
  findNodeHandle,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
  type TextInputProps,
} from 'react-native';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import type { NavigationAction } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Alert,
  Avatar,
  BrandHeader,
  Button,
  Card,
  Chip,
  Icon,
  Screen,
  Sheet,
  Text,
} from '@/components/ui/primitives';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useMindyTheme } from '@/components/ui/theme';
import { useAttendance } from '../AttendanceProvider';
import { isoDate, isoTime, noteLength } from '../model';
import type { AttendanceQuery } from '../hooks';
const styles = StyleSheet.create({ field: { minHeight: 120 } });
import type {
  AttendanceRow,
  AttendanceScenario,
  AttendanceSession,
  Mark,
  Totals,
  WriteResult,
} from '../types';

export type SessionDetailTabs = {
  title: string;
  tabs: { value: string; label: string; testID: string }[];
  tab: string;
  onTab: (value: string) => void;
};

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
  refresh,
  onEnd,
  allowLeaveRef,
  tabs,
  tab,
  onTab,
  showMockControls = true,
}: PropsWithChildren<{
  prefix: string;
  title: string;
  subtitle?: string | undefined;
  onBack: () => void;
  footer?: ReactNode;
  dirty?: boolean;
  busy?: boolean;
  uncertain?: boolean;
  refresh?: () => Promise<object | undefined>;
  onEnd?: (() => void) | undefined;
  allowLeaveRef?: React.RefObject<boolean>;
  tabs?: { value: string; label: string; testID: string }[];
  tab?: string;
  onTab?: (value: string) => void;
  showMockControls?: boolean;
}>) {
  const { t } = useTranslation('attendance');
  const { mock, scenario, setScenario } = useAttendance();
  const { colors } = useMindyTheme();
  const [review, setReview] = useState(false),
    [leave, setLeave] = useState(false),
    [leaving, setLeaving] = useState(false),
    [refreshing, setRefreshing] = useState(false);
  const action = useRef<NavigationAction | undefined>(undefined);
  const navigation = useNavigation();
  const tabsScroll = useRef<ScrollView>(null);
  const activeTabX = useRef(0);
  const insets = useSafeAreaInsets();
  usePreventRemove(!leaving && (dirty || busy || uncertain), (event) => {
    if (allowLeaveRef?.current) {
      navigation.dispatch(event.data.action);
      return;
    }
    if (busy) return;
    action.current = event.data.action;
    setLeave(true);
  });
  useEffect(() => {
    if (leaving && action.current) navigation.dispatch(action.current);
  }, [leaving, navigation]);
  const scenarios: AttendanceScenario[] = [
    'success',
    'loading',
    'empty',
    'offline',
    'error',
    'denied',
    'notFound',
    'uncertain',
    'conflict',
    'expired',
    'stateConflict',
    'recordExists',
    'clockConflict',
    'evidenceInvalid',
    'refreshError',
  ];
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-mdy-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
        <BrandHeader
          subpage
          flush={!!tabs?.length}
        >
          <View className="flex-row items-center gap-space-12">
            <Button
              testID={`${prefix}-back`}
              variant="text"
              onPress={onBack}
              accessibilityLabel={t('back')}
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
                <Text className="text-size-13 text-mdy-onBrandMuted">
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          {!!tabs?.length && (
            <ScrollView
              ref={tabsScroll}
              horizontal
              onContentSizeChange={() =>
                tabsScroll.current?.scrollTo({
                  x: activeTabX.current,
                  animated: false,
                })
              }
              showsHorizontalScrollIndicator={false}
              className="-mx-space-16"
            >
              <View
                accessibilityRole="tablist"
                testID={`${prefix}-tabs`}
                className="flex-row items-end pt-space-12"
              >
                {tabs.map((item) => (
                  <Pressable
                    key={item.value}
                    testID={item.testID}
                    accessibilityRole="tab"
                    onLayout={({ nativeEvent }) => {
                      if (item.value !== tab) return;
                      activeTabX.current = Math.max(
                        0,
                        nativeEvent.layout.x - 16
                      );
                      tabsScroll.current?.scrollTo({
                        x: activeTabX.current,
                        animated: false,
                      });
                    }}
                    accessibilityState={{ selected: item.value === tab }}
                    onPress={() => onTab?.(item.value)}
                    className={
                      item.value === tab
                        ? 'min-h-space-48 px-space-22 py-space-10 justify-center rounded-tl-radius-18 rounded-tr-radius-18 bg-mdy-bg'
                        : 'min-h-space-40 px-space-22 py-space-10 justify-center rounded-tl-radius-18 rounded-tr-radius-18 bg-mdy-headerGlass'
                    }
                  >
                    <Text
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
            tabs?.length
              ? `grow bg-mdy-bg ${tab === tabs[0]?.value ? 'rounded-tr-radius-28' : 'rounded-tl-radius-28 rounded-tr-radius-28'}`
              : 'grow -mt-space-28 rounded-tl-radius-28 rounded-tr-radius-28 bg-mdy-bg'
          }
        >
          {/* Only the panel grows: a horizontal ScrollView stretches inside a growing parent. */}
          <View className="px-space-24 py-space-24 gap-space-20">
            {mock && showMockControls && (
              <Button
                testID="attendance-mock-badge"
                variant="text"
                size="sm"
                onPress={() => setReview(true)}
              >
                {t('reviewMock')}
              </Button>
            )}
            {children}
          </View>
        </View>
      </Screen>
      {footer && (
        <View
          testID={`${prefix}-save-bar`}
          className="bg-mdy-surface border-t border-mdy-divider px-space-24 pt-space-12 gap-space-10"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          {footer}
        </View>
      )}
      {review && (
        <Sheet
          testID="attendance-review"
          title={t('reviewTitle')}
          onClose={() => setReview(false)}
        >
          <ScrollView
            className="max-h-[400px]"
            contentContainerClassName="gap-space-8"
          >
            {scenarios.map((value) => (
              <Button
                key={value}
                testID={`attendance-scenario-${value}`}
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
          title={t('leaveTitle')}
          icon="warning"
          onClose={() => setLeave(false)}
        >
          <Text>{uncertain ? t('unknownResult') : t('unsavedBody')}</Text>
          <Button
            testID="leave-stay"
            onPress={() => setLeave(false)}
          >
            {t('leaveStay')}
          </Button>
          <Button
            testID="leave-discard"
            variant="danger"
            onPress={() => {
              setLeave(false);
              setLeaving(true);
            }}
          >
            {t(uncertain ? 'leaveAnyway' : 'leaveDiscard')}
          </Button>
        </ConfirmationDialog>
      )}
    </KeyboardAvoidingView>
  );
}
export function Loading() {
  const { t } = useTranslation('attendance');
  return (
    <View
      testID="attendance-loading"
      className="gap-space-12"
    >
      <Skeleton label={t('loading')}>
        <View className="h-space-120 rounded-radius-14 bg-mdy-muted2" />
      </Skeleton>
      {[0, 1, 2].map((i) => (
        <Skeleton
          key={i}
          label={t('loading')}
        >
          <View className="h-space-64 rounded-radius-14 bg-mdy-muted2" />
        </Skeleton>
      ))}
    </View>
  );
}
export function QueryBlock({
  query,
  prefix,
  children,
}: PropsWithChildren<{ query: AttendanceQuery; prefix: string }>) {
  const { t } = useTranslation('attendance');
  const kind = query.result?.kind;
  if (kind === 'denied' || kind === 'notFound')
    return (
      <Card testID={`${prefix}-${kind === 'denied' ? 'denied' : 'not-found'}`}>
        <Text accessibilityRole="alert">
          {t(kind === 'denied' ? 'denied' : 'notFound')}
        </Text>
      </Card>
    );
  if (!query.data) {
    if (query.offline)
      return (
        <Alert
          testID={`${prefix}-offline`}
          warning
        >
          {t('offlineEmpty')}
        </Alert>
      );
    if (kind === 'error' || kind === 'unavailable')
      return (
        <Card testID={`${prefix}-error`}>
          <Text>{t('error')}</Text>
          <Button
            testID={`${prefix}-retry`}
            onPress={() => query.retry()}
          >
            {t('retry')}
          </Button>
        </Card>
      );
    return <Loading />;
  }
  return (
    <>
      {children}
      {query.offline ? (
        <Alert
          testID={`${prefix}-offline`}
          warning
        >
          {t('offline')}
        </Alert>
      ) : kind === 'error' ? (
        <View className="gap-space-8">
          <Alert
            testID={`${prefix}-refresh-alert`}
            warning
          >
            {t('stale') +
              (query.result?.requestId
                ? ` · ${t('support', { id: query.result.requestId })}`
                : '')}
          </Alert>
          <Button
            testID={`${prefix}-retry`}
            variant="text"
            onPress={() => query.refresh()}
          >
            {t('retry')}
          </Button>
        </View>
      ) : null}
    </>
  );
}
export function More({
  query,
  count,
  prefix,
  label,
  automatic = false,
}: {
  query: AttendanceQuery;
  count: number;
  prefix: string;
  label?: string;
  automatic?: boolean;
}) {
  const { t } = useTranslation('attendance');
  if (!query.data || (count >= query.data.total && !query.footerError))
    return null;
  return (
    <View className="gap-space-8">
      {query.footerError && !query.offline && (
        <Text accessibilityRole="alert">{t('error')}</Text>
      )}
      <Button
        testID={`${prefix}-more`}
        disabled={query.busy || query.offline}
        busy={query.busy}
        variant="text"
        accessibilityHint={
          automatic
            ? t('remaining', { count: query.data.total - count })
            : undefined
        }
        onPress={() => (query.footerError ? query.retry() : query.more())}
      >
        {query.footerError ? t('retry') : (label ?? t('editor.more'))}
      </Button>
    </View>
  );
}
export function SessionHeading({ session }: { session: AttendanceSession }) {
  const { t } = useTranslation('attendance');
  return (
    <View className="gap-space-8">
      <View className="flex-row flex-wrap items-center gap-space-8">
        <Chip
          variant={session.status === 'IN_PROGRESS' ? 'success' : 'neutral'}
        >
          {t(
            session.status === 'SCHEDULED'
              ? 'scheduled'
              : session.status === 'IN_PROGRESS'
                ? 'inProgress'
                : session.status === 'COMPLETED'
                  ? 'completed'
                  : 'cancelled'
          )}
        </Chip>
        <Text className="text-size-14 font-bvp-semibold">{session.title}</Text>
      </View>
      <Text className="text-size-13 text-mdy-secondary">
        {isoDate(session.startsAt)} · {isoTime(session.startsAt)}–
        {isoTime(session.endsAt)}
      </Text>
      {session.actualStartedAt && (
        <Text className="text-size-12 text-mdy-secondary">
          {t('finalize.started', {
            time: isoTime(session.actualStartedAt),
            date: isoDate(session.actualStartedAt),
          })}
        </Text>
      )}
    </View>
  );
}
export function TotalsStrip({
  totals,
  prefix,
}: {
  totals: Totals | undefined;
  prefix: string;
}) {
  const { t } = useTranslation('attendance');
  return (
    <View
      testID={`${prefix}-totals`}
      className="gap-space-8"
    >
      <View className="flex-row gap-space-8">
        {(['present', 'absent', 'unmarked'] as const).map((key) => (
          <View
            key={key}
            className="flex-1 rounded-radius-14 bg-mdy-muted2 p-space-10 gap-space-4"
          >
            <Text
              testID={`${prefix}-total-${key}`}
              className="text-size-18 font-bvp-bold"
            >
              {totals ? String(totals[key]) : '—'}
            </Text>
            <Text className="text-size-11 text-mdy-secondary">
              {t(`editor.${key}`)}
            </Text>
          </View>
        ))}
      </View>
      {totals && (
        <Text className="text-size-12 text-mdy-secondary">
          {t('editor.totalLine', { count: totals.eligible })}
        </Text>
      )}
    </View>
  );
}
export function AttendanceRowView({
  row,
  prefix,
  status = row.status,
  editable = false,
  onMark,
  dirty = false,
  allowUnmarked = false,
  disabled = false,
  trailing,
  provisional = false,
  hideUnmarked = false,
  compact = false,
}: {
  row: AttendanceRow;
  prefix: string;
  status?: Mark;
  editable?: boolean;
  onMark?: (mark: Mark) => void;
  dirty?: boolean;
  allowUnmarked?: boolean;
  disabled?: boolean;
  trailing?: ReactNode;
  provisional?: boolean;
  hideUnmarked?: boolean;
  compact?: boolean;
}) {
  const { t } = useTranslation('attendance');
  const { width, fontScale } = useWindowDimensions();
  const stacked = width <= 380 || fontScale >= 1.3;
  if (compact) {
    const name = row.name ?? t('nameMissing');
    const words = name.trim().split(/\s+/);
    const initials = (
      (words[0]?.[0] ?? '') +
      (words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '')
    ).toLocaleUpperCase();
    const displayed: 'PRESENT' | 'ABSENT' =
      status === 'PRESENT' ? 'PRESENT' : 'ABSENT';
    const next: Mark = displayed === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    return (
      <View
        testID={`${prefix}-row-${row.id}`}
        className={`min-h-space-52 flex-row items-center gap-space-12 py-space-4 ${dirty ? 'border-l-[3px] border-l-mdy-warning pl-space-8' : ''}`}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="h-space-36 w-space-36 rounded-radius-99 bg-mdy-muted2 items-center justify-center"
        >
          <Text className="text-size-12 font-bvp-semibold">{initials}</Text>
        </View>
        <View className="flex-1 gap-space-2">
          <Text
            numberOfLines={2}
            className="text-size-13 font-bvp-medium"
          >
            {name}
          </Text>
          {row.entryType === 'MAKEUP' && (
            <View className="self-start">
              <Chip variant="info">{t('makeup')}</Chip>
            </View>
          )}
          {dirty && (
            <Text
              testID={`${prefix}-row-${row.id}-unsaved`}
              className="text-size-11 text-mdy-warning"
            >
              {t('unsavedRow')}
            </Text>
          )}
        </View>
        <Pressable
          testID={`${prefix}-mark-${row.id}-${next.toLowerCase()}`}
          accessibilityRole="button"
          accessibilityLabel={t('correction.changeTo', {
            name,
            status: t(`editor.${displayed.toLowerCase()}`),
            next: t(`editor.${next.toLowerCase()}`),
          })}
          accessibilityState={{ disabled: disabled || !editable }}
          disabled={disabled || !editable}
          onPress={() => onMark?.(next)}
          className="min-h-space-44 min-w-[88px] justify-center"
        >
          <View
            className={`min-h-space-28 rounded-radius-99 px-space-12 py-space-4 items-center justify-center ${displayed === 'PRESENT' ? 'bg-mdy-successBg' : 'bg-mdy-dangerBg'}`}
          >
            <Text
              className={`text-size-12 font-bvp-medium ${displayed === 'PRESENT' ? 'text-mdy-success' : 'text-mdy-danger'}`}
            >
              {t(`editor.${displayed.toLowerCase()}`)}
            </Text>
          </View>
        </Pressable>
      </View>
    );
  }
  return (
    <View
      testID={`${prefix}-row-${row.id}`}
      className={`min-h-space-64 py-space-12 px-space-10 gap-space-8 border-b border-mdy-divider ${dirty ? 'border-l-[3px] border-l-mdy-warning' : ''}`}
    >
      <View className="flex-row items-center gap-space-12">
        <Avatar
          name={row.name ?? t('nameMissing')}
          size={36}
        />
        <View className="flex-1 gap-space-4">
          <Text className="text-size-14 font-bvp-medium">
            {row.name ?? t('nameMissing')}
          </Text>
          {row.entryType === 'MAKEUP' && (
            <Chip variant="info">{t('makeup')}</Chip>
          )}
          {row.checkedInAt && (
            <Text className="text-size-12 text-mdy-secondary">
              {t('editor.checkedIn', { time: isoTime(row.checkedInAt) })}
            </Text>
          )}
          {dirty && (
            <Text
              testID={`${prefix}-row-${row.id}-unsaved`}
              className="text-size-12 text-mdy-warning"
            >
              {t('unsavedRow')}
            </Text>
          )}
        </View>
        {!editable &&
          !provisional &&
          !(hideUnmarked && status === 'UNMARKED') && (
            <Chip
              variant={
                status === 'PRESENT'
                  ? 'success'
                  : status === 'ABSENT'
                    ? 'danger'
                    : 'neutral'
              }
            >
              {t(`editor.${status.toLowerCase()}`)}
            </Chip>
          )}
        {trailing}
      </View>
      {editable && (
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={row.name ?? t('nameMissing')}
          className={
            stacked
              ? 'flex-row flex-wrap gap-space-8'
              : 'flex-row justify-end gap-space-8'
          }
        >
          {(['PRESENT', 'ABSENT'] as const).map((mark) => (
            <Pressable
              key={mark}
              testID={`${prefix}-mark-${row.id}-${mark.toLowerCase()}`}
              accessibilityRole="radio"
              accessibilityLabel={`${row.name ?? t('nameMissing')}, ${t(`editor.${mark.toLowerCase()}`)}`}
              accessibilityState={{ checked: status === mark, disabled }}
              disabled={disabled}
              onPress={() =>
                onMark?.(allowUnmarked && status === mark ? 'UNMARKED' : mark)
              }
              className={`min-h-space-44 min-w-[80px] items-center justify-center rounded-radius-22 border px-space-12 ${status === mark ? (mark === 'PRESENT' ? 'bg-mdy-successBg border-mdy-success' : 'bg-mdy-dangerBg border-mdy-danger') : 'bg-mdy-surface border-mdy-border'}`}
            >
              <Text
                className={
                  status === mark
                    ? mark === 'PRESENT'
                      ? 'text-mdy-success'
                      : 'text-mdy-danger'
                    : 'text-mdy-secondary'
                }
              >
                {t(`editor.${mark.toLowerCase()}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
export function Field({
  id,
  label,
  value,
  onChange,
  max,
  error,
  multiline = true,
  disabled = false,
  inputRef,
  trailing,
  compact = false,
  ...props
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  max?: number;
  error?: string | undefined;
  multiline?: boolean;
  disabled?: boolean;
  inputRef?: React.RefObject<TextInput | null> | undefined;
  trailing?: React.ReactNode;
  compact?: boolean;
} & Omit<TextInputProps, 'value' | 'onChange' | 'onChangeText'>) {
  const { t } = useTranslation('attendance');
  const { colors } = useMindyTheme();
  const { height } = useWindowDimensions();
  const count = noteLength(value),
    invalid = !!max && count > max;
  return (
    <View className="gap-space-6">
      <Text className="text-size-13 font-bvp-medium">{label}</Text>
      <View className="relative">
        <TextInput
          {...props}
          ref={inputRef}
          testID={id}
          accessibilityLabel={max ? `${label}, ${max}` : label}
          accessibilityHint={error}
          value={value}
          editable={!disabled}
          onChangeText={onChange}
          multiline={multiline}
          textAlignVertical="top"
          className={`${disabled ? 'bg-mdy-muted2' : 'bg-mdy-surface'} border rounded-radius-14 text-mdy-ink text-size-14 font-bvp-regular p-space-12 ${trailing ? 'pr-space-56' : ''} ${error || invalid ? 'border-mdy-dangerBorder' : 'border-mdy-border'}`}
          style={
            multiline
              ? [!compact && styles.field, { maxHeight: height * 0.4 }]
              : undefined
          }
          placeholderTextColor={colors.placeholder}
        />
        {trailing && (
          <View className="absolute right-space-4 top-space-0 bottom-space-0 justify-center">
            {trailing}
          </View>
        )}
      </View>
      {max && (
        <Text
          testID={`${id}-count`}
          accessibilityLiveRegion={invalid ? 'polite' : 'none'}
          className={`text-size-12 text-right ${invalid ? 'text-mdy-danger' : 'text-mdy-secondary'}`}
        >
          {count}/{max}
        </Text>
      )}
      {(error || invalid) && (
        <Text
          testID={`${id}-error`}
          accessibilityLiveRegion="polite"
          className="text-size-12 text-mdy-danger"
        >
          {error ?? t('note.tooLong', { max })}
        </Text>
      )}
    </View>
  );
}
export function FocusPanel({
  children,
  testID,
}: PropsWithChildren<{ testID: string }>) {
  const ref = useRef<View>(null);
  useEffect(() => {
    const tag = findNodeHandle(ref.current);
    if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
  }, []);
  return (
    <View
      ref={ref}
      testID={testID}
      accessible
      className="gap-space-12 p-space-16 rounded-radius-14 border border-mdy-warning bg-mdy-warningBg"
    >
      {children}
    </View>
  );
}
export function IntentBanner({
  prefix,
  offline,
  busy,
  onRetry,
}: {
  prefix: string;
  offline: boolean;
  busy: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation('attendance');
  return (
    <FocusPanel testID={`${prefix}-intent-banner`}>
      <Text>{t('unknownResult')}</Text>
      <Text className="text-size-12">{t('memoryOnly')}</Text>
      {!offline && (
        <Button
          testID={`${prefix}-resend`}
          disabled={busy}
          onPress={onRetry}
        >
          {t('resend')}
        </Button>
      )}
    </FocusPanel>
  );
}
export function MutationError({
  result,
  prefix,
}: {
  result: WriteResult | undefined;
  prefix: string;
}) {
  const { t } = useTranslation('attendance');
  if (!result || result.kind === 'success' || result.kind === 'uncertain')
    return null;
  const code = result.code;
  const key =
    code === 'TEACHING_NOTE_WINDOW_CLOSED' ||
    code === 'ATTENDANCE_EDIT_WINDOW_EXPIRED'
      ? 'note.closedUnsaved'
      : code?.includes('STATE_CONFLICT')
        ? 'stateChanged'
        : code === 'ATTENDANCE_RECOVERY_EVIDENCE_INVALID'
          ? 'evidenceInvalid'
          : code === 'ATTENDANCE_RECOVERY_RECORD_EXISTS'
            ? 'recordExists'
            : code === 'ATTENDANCE_RECOVERY_CLOCK_CONFLICT'
              ? 'clockConflict'
              : code === 'CLASS_MENTOR_SCHEDULE_CONFLICT'
                ? 'mentorConflict'
                : code === 'REASON_REQUIRED'
                  ? 'reasonRequired'
                  : 'error';
  return (
    <Alert testID={`${prefix}-error`}>
      {t(key) +
        (result.requestId
          ? ` · ${t('support', { id: result.requestId })}`
          : '')}
    </Alert>
  );
}
