import { useState, type ReactElement, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Calendar } from 'react-native-calendars';
import {
  Alert,
  Avatar,
  Button,
  Chip,
  Icon,
  Sheet,
  Text,
} from '@/components/ui/primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { useMindyTheme } from '@/components/ui/theme';
import type { RemoteRead } from '@/shared/hooks/useRemoteRead';
import type { ApiError } from '@/shared/http/apiClient';
import {
  displayDate,
  formatAsOf,
  formatRate,
  rangeProblem,
  type DateRange,
} from './model';
import type { AttendanceCounts, EnrollmentSummary } from './schema';
import './messages';

export function Note({
  testID,
  children,
}: {
  testID: string;
  children: string;
}) {
  return (
    <View
      testID={testID}
      className="flex-row gap-space-8"
    >
      <Icon
        name="info"
        size={16}
      />
      <Text className="flex-1 text-size-12 leading-line-18 text-mdy-secondary">
        {children}
      </Text>
    </View>
  );
}
export function ReportTabs<T extends string>({
  prefix,
  value,
  onChange,
  tabs,
}: {
  prefix: string;
  value: T;
  onChange: (value: T) => void;
  tabs: readonly (readonly [T, string])[];
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      className="flex-row gap-space-8"
    >
      {tabs.map(([tab, label]) => (
        <Pressable
          key={tab}
          testID={`${prefix}-tab-${tab}`}
          accessibilityRole="radio"
          accessibilityState={{ selected: tab === value }}
          onPress={() => onChange(tab)}
          className={
            tab === value
              ? 'min-h-space-44 flex-1 items-center rounded-radius-12 px-space-16 justify-center bg-mdy-surface'
              : 'min-h-space-44 flex-1 items-center rounded-radius-12 px-space-16 justify-center bg-mdy-headerGlass'
          }
        >
          <Text
            className={
              tab === value
                ? 'text-size-13 font-bvp-semibold text-mdy-link'
                : 'text-size-13 font-bvp-semibold text-mdy-onBrand'
            }
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
/** The rate is one color on purpose: no threshold has been agreed. */
export function RateText({
  rate,
  testID,
  large = false,
}: {
  rate: number | null;
  testID: string;
  large?: boolean;
}) {
  const { i18n } = useTranslation('reports');
  return (
    <Text
      testID={testID}
      className={
        large
          ? 'text-[26px] font-bvp-bold text-mdy-link'
          : 'text-size-17 font-bvp-bold'
      }
      style={{ fontVariant: ['tabular-nums'] }}
    >
      {formatRate(rate, i18n.language)}
    </Text>
  );
}
export function CountLines({
  counts,
  prefix,
}: {
  counts: AttendanceCounts;
  prefix: string;
}) {
  const { t } = useTranslation('reports');
  const { present, absent, finalizedEligibleCount, rate } = counts;
  return (
    <View className="gap-space-6">
      <Text
        testID={`${prefix}-denominator`}
        className="text-size-13 text-mdy-secondary"
      >
        {rate === null
          ? t('noFinalized')
          : t('denominator', { present, total: finalizedEligibleCount })}
      </Text>
      {rate !== null && (
        <Text className="text-size-13">
          {`${t('present', { count: present })} · ${t('absent', { count: absent })}`}
        </Text>
      )}
      <CountChips
        counts={counts}
        prefix={prefix}
      />
    </View>
  );
}
function CountChips({
  counts,
  prefix,
}: {
  counts: AttendanceCounts;
  prefix: string;
}) {
  const { t } = useTranslation('reports');
  const { makeupPending, unmarked, excluded } = counts;
  if (!makeupPending && !unmarked && !excluded) return null;
  return (
    <View className="flex-row flex-wrap items-center gap-space-8">
      {makeupPending > 0 && (
        <Chip
          testID={`${prefix}-makeup`}
          variant="warning"
        >
          {t('makeupPending', { count: makeupPending })}
        </Chip>
      )}
      {unmarked > 0 && (
        <Chip
          testID={`${prefix}-unmarked`}
          variant="neutral"
        >
          {t('unmarked', { count: unmarked })}
        </Chip>
      )}
      {excluded > 0 && (
        <Text
          testID={`${prefix}-excluded`}
          className="text-size-12 text-mdy-secondary"
        >
          {t('excluded', { count: excluded })}
        </Text>
      )}
    </View>
  );
}
function useCountsLabel() {
  const { t, i18n } = useTranslation('reports');
  return (name: string, counts: AttendanceCounts) =>
    [
      name,
      counts.rate === null
        ? t('noFinalized')
        : t('a11y.rate', {
            value: formatRate(counts.rate, i18n.language).replace('%', ''),
          }),
      ...(counts.rate === null
        ? []
        : [
            t('a11y.denominator', {
              present: counts.present,
              total: counts.finalizedEligibleCount,
            }),
            t('a11y.present', { count: counts.present }),
            t('a11y.absent', { count: counts.absent }),
          ]),
      ...(counts.makeupPending
        ? [t('a11y.makeup', { count: counts.makeupPending })]
        : []),
      ...(counts.unmarked
        ? [t('a11y.unmarked', { count: counts.unmarked })]
        : []),
      ...(counts.excluded
        ? [t('a11y.excluded', { count: counts.excluded })]
        : []),
    ].join(', ');
}
/** One row per enrollment: a re-enrolled student intentionally has two rows. */
export function AttendanceSummaryRow({
  item,
  prefix,
  onPress,
}: {
  item: EnrollmentSummary;
  prefix: string;
  onPress?: (() => void) | undefined;
}) {
  const { t } = useTranslation('reports');
  const label = useCountsLabel();
  const name = item.student.displayName ?? t('noName');
  const id = `${prefix}-row-${item.enrollmentId}`;
  const body = (
    <View className="gap-space-12 rounded-radius-16 border border-mdy-border bg-mdy-surface p-space-16">
      <View className="flex-row items-center gap-space-12">
        <Avatar
          name={name}
          size={36}
        />
        <Text
          numberOfLines={2}
          className="flex-1 text-size-15 font-bvp-semibold"
        >
          {name}
        </Text>
        <View className="items-end gap-space-2">
          <RateText
            rate={item.rate}
            testID={`${id}-rate`}
          />
          <Text className="text-size-11 text-mdy-secondary">
            {t('mentor.tabAttendance')}
          </Text>
        </View>
        {onPress && (
          <Icon
            name="chevron_right"
            size={20}
          />
        )}
      </View>
      <View className="gap-space-8 border-t border-mdy-border pt-space-12">
        {item.rate !== null && (
          <View className="h-space-4 overflow-hidden rounded-radius-99 bg-mdy-muted2">
            <View
              className="h-space-4 rounded-radius-99 bg-mdy-primary"
              style={{ width: `${item.rate}%` }}
            />
          </View>
        )}
        <CountLines
          counts={item}
          prefix={id}
        />
      </View>
    </View>
  );
  return onPress ? (
    <Pressable
      testID={id}
      accessibilityRole="button"
      accessibilityLabel={label(name, item)}
      onPress={onPress}
      className="active:opacity-80"
    >
      {body}
    </Pressable>
  ) : (
    <View
      testID={id}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label(name, item)}
    >
      {body}
    </View>
  );
}
export function AsOfLine({
  testID,
  asOf,
  timeZone,
}: {
  testID: string;
  asOf: string;
  timeZone: string;
}) {
  const { t } = useTranslation('reports');
  return (
    <Text
      testID={testID}
      className="text-size-12 text-mdy-secondary"
    >
      {t('asOf', { time: formatAsOf(asOf, timeZone) })}
    </Text>
  );
}
export function CountHeading({
  testID,
  children,
}: {
  testID: string;
  children: string;
}) {
  return (
    <Text
      testID={testID}
      accessibilityRole="header"
      className="text-size-12 font-bvp-semibold uppercase text-mdy-secondary"
    >
      {children}
    </Text>
  );
}
export function MeaningButton({ prefix }: { prefix: string }) {
  const { t } = useTranslation('reports');
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        testID={`${prefix}-meaning`}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        className="min-h-space-44 flex-row items-center gap-space-6 active:opacity-80"
      >
        <Icon
          name="info"
          size={16}
        />
        <Text className="text-size-13 text-mdy-link">{t('meaning')}</Text>
      </Pressable>
      {open && (
        <Sheet
          testID={`${prefix}-meaning-sheet`}
          title={t('meaning')}
          onClose={() => setOpen(false)}
        >
          <View className="gap-space-12">
            {(
              [
                'rate',
                'pending',
                'unmarked',
                'excluded',
                'makeup',
                'source',
              ] as const
            ).map((name) => (
              <View
                key={name}
                className="gap-space-2"
              >
                <Text className="text-size-13 font-bvp-semibold">
                  {t(`meaningItems.${name}Title`)}
                </Text>
                <Text className="text-size-13 text-mdy-secondary">
                  {t(`meaningItems.${name}`)}
                </Text>
              </View>
            ))}
          </View>
        </Sheet>
      )}
    </>
  );
}
export function RangeFilter({
  prefix,
  value,
  onChange,
}: {
  prefix: string;
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}) {
  const { t } = useTranslation('reports');
  const { colors } = useMindyTheme();
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState(value?.fromDate ?? '');
  const [toDate, setToDate] = useState(value?.toDate ?? '');
  const [editing, setEditing] = useState<'from' | 'to'>('from');
  const [problem, setProblem] = useState<'order' | 'max'>();
  const show = () => {
    setFromDate(value?.fromDate ?? '');
    setToDate(value?.toDate ?? '');
    setEditing('from');
    setProblem(undefined);
    setOpen(true);
  };
  const apply = () => {
    if (!fromDate || !toDate) return;
    const range = { fromDate, toDate };
    const found = rangeProblem(range);
    setProblem(found);
    if (found) return;
    onChange(range);
    setOpen(false);
  };
  const selected = editing === 'from' ? fromDate : toDate;
  return (
    <View className="shrink flex-row items-center gap-space-4">
      <Pressable
        testID={`${prefix}-range`}
        accessibilityRole="button"
        onPress={show}
        className="shrink min-h-space-44 flex-row items-center gap-space-6 rounded-radius-99 border border-mdy-border bg-mdy-surface px-space-12 active:opacity-80"
      >
        <Icon
          name="date_range"
          size={16}
        />
        <Text
          numberOfLines={1}
          className="shrink text-size-13 text-mdy-link"
        >
          {value
            ? `${displayDate(value.fromDate)} – ${displayDate(value.toDate)}`
            : t('allTime')}
        </Text>
      </Pressable>
      {value && (
        <Pressable
          testID={`${prefix}-range-clear`}
          accessibilityRole="button"
          accessibilityLabel={t('allTime')}
          onPress={() => onChange(undefined)}
          className="h-space-44 w-space-44 items-center justify-center active:opacity-80"
        >
          <Icon
            name="close"
            size={18}
          />
        </Pressable>
      )}
      {open && (
        <Sheet
          testID={`${prefix}-range-sheet`}
          title={t('pickRange')}
          onClose={() => setOpen(false)}
        >
          <View className="flex-row gap-space-12">
            {(['from', 'to'] as const).map((field) => {
              const date = field === 'from' ? fromDate : toDate;
              return (
                <View
                  key={field}
                  className="flex-1 gap-space-6"
                >
                  <Text className="text-size-13 font-bvp-medium">
                    {t(field)}
                  </Text>
                  <Button
                    testID={`${prefix}-range-${field}`}
                    variant={editing === field ? 'primary' : 'secondary'}
                    size="sm"
                    onPress={() => setEditing(field)}
                  >
                    {date ? displayDate(date) : t('pickRange')}
                  </Button>
                </View>
              );
            })}
          </View>
          <Calendar
            {...(selected
              ? {
                  current: selected,
                  markedDates: { [selected]: { selected: true } },
                }
              : {})}
            firstDay={1}
            theme={{
              calendarBackground: colors.sheet,
              dayTextColor: colors.ink,
              monthTextColor: colors.ink,
              arrowColor: colors.link,
              todayTextColor: colors.link,
              textDisabledColor: colors.tertiary,
              textSectionTitleColor: colors.secondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.onBrand,
            }}
            onDayPress={(day) => {
              setProblem(undefined);
              if (editing === 'from') {
                setFromDate(day.dateString);
                setEditing('to');
              } else setToDate(day.dateString);
            }}
          />
          <Text className="text-size-12 text-mdy-secondary">
            {t('rangeHint')}
          </Text>
          {problem && (
            <Text
              testID={`${prefix}-range-error`}
              className="text-size-13 text-mdy-danger"
            >
              {t(problem === 'max' ? 'rangeMax' : 'rangeOrder')}
            </Text>
          )}
          <View className="flex-row gap-space-12">
            <Button
              className="flex-1"
              variant="secondary"
              onPress={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              {t('mentor.viewAll')}
            </Button>
            <Button
              testID={`${prefix}-range-apply`}
              className="flex-1"
              disabled={!fromDate || !toDate}
              onPress={apply}
            >
              {t('apply')}
            </Button>
          </View>
        </Sheet>
      )}
    </View>
  );
}
const problemText = (error: ApiError) =>
  error.kind === 'invalid' ? 'rangeMax' : 'loadFailed';
function support(t: TFunction<'reports'>, error: ApiError) {
  return error.requestId ? ` ${t('support', { id: error.requestId })}` : '';
}
/**
 * The state of one independently loaded part. Skeleton, error and offline never
 * show a zero or an empty list; denial and not-found drop whatever was loaded.
 */
export function ReadGate({
  prefix,
  read,
  skeleton,
  onBack,
  children,
}: {
  prefix: string;
  read: Pick<RemoteRead<object>, 'data' | 'error' | 'offline' | 'refresh'> & {
    busy: boolean;
  };
  skeleton?: ReactElement;
  onBack?: (() => void) | undefined;
  children: ReactNode;
}) {
  const { t } = useTranslation('reports');
  if (read.error?.kind === 'denied')
    return <Alert testID={`${prefix}-denied`}>{t('denied')}</Alert>;
  if (read.error?.kind === 'notFound')
    return (
      <View className="gap-space-8">
        <Alert testID={`${prefix}-not-found`}>{t('notFound')}</Alert>
        {onBack && <Button onPress={onBack}>{t('back')}</Button>}
      </View>
    );
  if (read.data === undefined) {
    if (read.error?.kind === 'offline' || (read.offline && !read.busy))
      return (
        <Text
          testID={`${prefix}-offline`}
          className="text-size-14 text-mdy-secondary"
        >
          {t('offlineEmpty')}
        </Text>
      );
    if (read.error)
      return (
        <View className="gap-space-8">
          <Alert testID={`${prefix}-error`}>
            {t(problemText(read.error)) + support(t, read.error)}
          </Alert>
          {read.error.kind !== 'invalid' && (
            <Button
              testID={`${prefix}-retry`}
              onPress={() => {
                read.refresh();
              }}
            >
              {t('retry')}
            </Button>
          )}
        </View>
      );
    return (
      <View testID={`${prefix}-skeleton`}>
        {skeleton ?? (
          <Skeleton label={t('loading')}>
            <View className="h-space-120 rounded-radius-18 bg-mdy-muted2" />
          </Skeleton>
        )}
      </View>
    );
  }
  return <>{children}</>;
}
/** Warnings follow the content; "Show more" keeps the rows on a failed page. */
export function ListFooter({
  prefix,
  list,
}: {
  prefix: string;
  list: {
    data?: object | undefined;
    error?: ApiError | undefined;
    offline: boolean;
    hasMore: boolean;
    loadingMore: boolean;
    footerError?: ApiError | undefined;
    more: () => Promise<void>;
    refresh: () => Promise<object | undefined>;
  };
}) {
  const { t } = useTranslation('reports');
  if (list.data === undefined) return null;
  const stale = list.offline || list.error?.kind === 'offline';
  return (
    <View className="gap-space-12 pt-space-4">
      {list.hasMore && !list.offline && (
        <Button
          testID={`${prefix}-more`}
          variant={list.footerError ? 'secondary' : 'text'}
          busy={list.loadingMore}
          disabled={list.loadingMore}
          onPress={() => {
            list.more();
          }}
        >
          {t(list.footerError ? 'retry' : 'more')}
        </Button>
      )}
      {stale ? (
        <Alert
          warning
          testID={`${prefix}-stale`}
        >
          {t('stale')}
        </Alert>
      ) : (
        list.error && (
          <View className="gap-space-8">
            <Alert
              warning
              testID={`${prefix}-refresh-error`}
            >
              {t('refreshFailed') + support(t, list.error)}
            </Alert>
            <Button
              variant="text"
              size="sm"
              onPress={() => {
                list.refresh();
              }}
            >
              {t('retry')}
            </Button>
          </View>
        )
      )}
    </View>
  );
}
export function RowSkeleton() {
  const { t } = useTranslation('reports');
  return (
    <View className="gap-space-12">
      {[0, 1, 2, 3].map((key) => (
        <Skeleton
          key={key}
          label={t('loading')}
        >
          <View className="h-space-120 rounded-radius-18 bg-mdy-muted2" />
        </Skeleton>
      ))}
    </View>
  );
}
