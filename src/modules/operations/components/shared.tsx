import { Children } from 'react';
import {
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { View, type TextInput } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { Card, Chip, Button, Sheet, Text } from '@/components/ui/primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { Field, isoDate, isoTime } from '@/modules/attendance';
import { StatusChip } from '@/modules/teaching/components/rows';
import { useOperations } from '../provider';
import type { OperationsQuery } from '../hooks';
import type { Session, Scenario, Result, Order } from '../types';
import { formatMoney } from '../model';
export {
  Page,
  Field,
  IntentBanner,
  isoDate,
  isoTime,
  parseVietnamTime,
} from '@/modules/attendance';

export function QueryState({
  query,
  prefix,
  children,
}: PropsWithChildren<{ query: OperationsQuery; prefix: string }>) {
  const { t } = useTranslation('operations');
  const { mock, scenario, setScenario } = useOperations();
  const [controls, setControls] = useState(false);
  const kind = query.result?.kind;
  return (
    <>
      {mock && (
        <Button
          size="sm"
          variant="secondary"
          testID="operations-review-open"
          onPress={() => setControls(true)}
        >
          {t('mock')}
        </Button>
      )}
      {controls && (
        <Sheet
          testID="operations-review"
          title={t('mock')}
          onClose={() => setControls(false)}
        >
          {(
            [
              'success',
              'loading',
              'empty',
              'offline',
              'error',
              'denied',
              'notFound',
              'uncertain',
              'conflict',
              'mentorBusy',
              'placements',
              'alreadyExists',
              'holdInvalid',
              'otherCollector',
            ] as Scenario[]
          ).map((value) => (
            <Button
              key={value}
              testID={`operations-scenario-${value}`}
              variant={scenario === value ? 'primary' : 'secondary'}
              onPress={() => {
                setScenario(value);
                setControls(false);
              }}
            >
              {value}
            </Button>
          ))}
        </Sheet>
      )}
      {kind === 'denied' || kind === 'notFound' ? (
        <Card
          testID={`${prefix}-${kind === 'denied' ? 'denied' : 'not-found'}`}
        >
          <Text accessibilityRole="alert">{t(kind)}</Text>
        </Card>
      ) : !query.data ? (
        query.offline ? (
          <Alert
            testID={`${prefix}-offline`}
            warning
          >
            {t('offlineEmpty')}
          </Alert>
        ) : kind === 'error' ? (
          <Card testID={`${prefix}-error`}>
            <Text>{t('error')}</Text>
            <Button
              testID={`${prefix}-retry`}
              onPress={() => query.retry()}
            >
              {t('retry')}
            </Button>
          </Card>
        ) : (
          <View
            testID={`${prefix}-skeleton`}
            className="gap-space-12"
          >
            {[0, 1, 2].map((i) => (
              <Skeleton
                key={i}
                label={t('loading')}
              >
                <View className="h-space-120 rounded-radius-14 bg-mdy-muted2" />
              </Skeleton>
            ))}
          </View>
        )
      ) : (
        <>
          {children}
          {query.offline ? (
            <Alert
              testID={`${prefix}-offline`}
              warning
            >
              {t('needOnline')}
            </Alert>
          ) : kind === 'error' && !query.footerError ? (
            <Alert testID={`${prefix}-error`}>
              {t('cash.refreshFailed')}
              <Button
                testID={`${prefix}-retry`}
                onPress={() => query.refresh()}
              >
                {t('retry')}
              </Button>
            </Alert>
          ) : null}
        </>
      )}
    </>
  );
}
export function More({
  query,
  prefix,
}: {
  query: OperationsQuery;
  prefix: string;
}) {
  const { t } = useTranslation('operations');
  if (!query.hasMore) return null;
  return (
    <Button
      testID={`${prefix}-more`}
      variant="secondary"
      disabled={query.busy || query.offline}
      busy={query.busy}
      onPress={() => (query.footerError ? query.retry() : query.more())}
    >
      {t(query.footerError ? 'retry' : 'cash.more')}
    </Button>
  );
}
export function SessionSummary({
  session,
  prefix,
}: {
  session: Session;
  prefix: string;
}) {
  const { t } = useTranslation('operations');
  return (
    <Card
      testID={`${prefix}-summary`}
      className="gap-space-8"
    >
      <View className="flex-row items-start gap-space-12">
        <View className="w-space-52 items-center rounded-radius-14 bg-mdy-tint2 p-space-8">
          <Text className="font-bvp-semibold text-size-18">
            {isoDate(session.startsAt).slice(0, 2)}
          </Text>
          <Text className="text-size-12">
            {isoDate(session.startsAt).slice(3, 5)}
          </Text>
        </View>
        <View className="flex-1 gap-space-6">
          <Text className="text-size-15 font-bvp-semibold">
            {session.title}
          </Text>
          <Text className="text-size-13 text-mdy-secondary">{`${isoDate(session.startsAt)} · ${isoTime(session.startsAt)}–${isoTime(session.endsAt)}`}</Text>
        </View>
      </View>
      <StatusChip
        group="sessionStatus"
        value={session.status}
      />
      {session.effectiveMentor && (
        <Text className="text-size-13">
          {t('rescheduleScreen.teacher', { name: session.effectiveMentor })}
        </Text>
      )}
    </Card>
  );
}
export function ReasonField({
  prefix,
  value,
  onChange,
  invalid,
  disabled = false,
  inputRef,
}: {
  prefix: string;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
  disabled?: boolean;
  inputRef?: React.RefObject<TextInput | null>;
}) {
  const { t } = useTranslation('operations');
  return (
    <Field
      id={`${prefix}-reason`}
      label={`${t('reason')} *`}
      value={value}
      onChange={onChange}
      max={1000}
      error={invalid && !value.trim() ? t('reasonRequired') : undefined}
      disabled={disabled}
      inputRef={inputRef}
    />
  );
}
export function ScheduleFields({
  prefix,
  date,
  start,
  end,
  onDate,
  onStart,
  onEnd,
  invalid,
  disabled,
  readOnlyEnd = false,
  minDate,
  maxDate,
}: {
  prefix: string;
  date: string;
  start: string;
  end: string;
  onDate: (v: string) => void;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  invalid?: string | undefined;
  disabled: boolean;
  readOnlyEnd?: boolean;
  minDate?: string;
  maxDate?: string;
}) {
  const { t } = useTranslation('operations');
  const [open, setOpen] = useState(false);
  const trigger = useRef<View>(null);
  const current = date ? date.split('/').reverse().join('-') : minDate;
  const time = (v: string) =>
    v
      .replace(/[^\d:]/g, '')
      .replace(/^(\d{2})(\d)/, '$1:$2')
      .slice(0, 5);
  return (
    <>
      <Button
        ref={trigger}
        testID={`${prefix}-open-calendar`}
        variant="secondary"
        disabled={disabled}
        onPress={() => setOpen(true)}
      >
        {date || t('replacement.pickDate')}
      </Button>
      {open && (
        <Sheet
          testID={`${prefix}-calendar-sheet`}
          title={t('rescheduleScreen.date')}
          onClose={() => setOpen(false)}
          returnFocusRef={trigger}
        >
          <Calendar
            testID={`${prefix}-calendar`}
            {...(current ? { current } : {})}
            {...(minDate ? { minDate } : {})}
            {...(maxDate ? { maxDate } : {})}
            firstDay={1}
            markedDates={current ? { [current]: { selected: true } } : {}}
            onDayPress={(day) => {
              onDate(
                `${String(day.day).padStart(2, '0')}/${String(day.month).padStart(2, '0')}/${day.year}`
              );
              setOpen(false);
            }}
          />
        </Sheet>
      )}
      <Field
        id={`${prefix}-start`}
        label={t('rescheduleScreen.start')}
        value={start}
        onChange={(v) => onStart(time(v))}
        multiline={false}
        keyboardType="numbers-and-punctuation"
        disabled={disabled}
      />
      <Field
        id={`${prefix}-end`}
        label={t('rescheduleScreen.end')}
        value={end}
        onChange={(v) => onEnd(time(v))}
        multiline={false}
        keyboardType="numbers-and-punctuation"
        disabled={disabled || readOnlyEnd}
      />
      {invalid && (
        <Text
          testID={`${prefix}-time-error`}
          accessibilityRole="alert"
          className="text-mdy-danger"
        >
          {invalid}
        </Text>
      )}
    </>
  );
}
export function MutationError({
  result,
  prefix,
}: {
  result?: Result | undefined;
  prefix: string;
}) {
  const { t } = useTranslation('operations');
  if (!result || result.kind === 'success' || result.kind === 'uncertain')
    return null;
  const key: Record<string, string> = {
    SESSION_VERSION_CONFLICT: 'versionConflict',
    SESSION_STATE_CONFLICT: 'stateChanged',
    CLASS_NOT_EDITABLE: 'classClosed',
    CLASS_MENTOR_SCHEDULE_CONFLICT: 'substitute.mentorBusy',
    CLASS_SESSION_OVERLAP: 'overlap',
    SESSION_HAS_MAKEUP_PLACEMENTS: 'placements',
    MAKEUP_ALREADY_EXISTS: 'replacement.exists',
    SESSION_START_NOT_FUTURE: 'startPast',
    CLASS_SESSION_OUTSIDE_CLASS_PERIOD: 'outsidePeriod',
    CLASS_SESSION_TIME_RANGE_INVALID: 'timeRange',
    CLASS_SESSION_OVERNIGHT_NOT_ALLOWED: 'timeRange',
    CLASS_MENTOR_NOT_ELIGIBLE: 'substitute.ineligible',
  };
  return (
    <Alert testID={`${prefix}-error`}>
      {t(result.code ? (key[result.code] ?? 'error') : 'error')}
      {result.requestId ? ` · ${t('support', { id: result.requestId })}` : ''}
    </Alert>
  );
}
export function MoneyText({
  value,
  testID,
  large = false,
}: {
  value: number;
  testID: string;
  large?: boolean;
}) {
  return (
    <Text
      testID={testID}
      accessibilityLabel={`${value} đồng`}
      className={
        large
          ? 'text-size-28 leading-line-42 font-bvp-bold text-mdy-link'
          : 'text-size-15 font-bvp-bold'
      }
    >
      {formatMoney(value)}
    </Text>
  );
}
export const isOrderOverdue = (order: Order, asOf: string) =>
  order.status === 'PENDING' && Date.parse(order.expiresAt) <= Date.parse(asOf);
export function OrderStatusChip({
  order,
  asOf,
  testID,
}: {
  order: Order;
  asOf: string;
  testID: string;
}) {
  const { t } = useTranslation('operations');
  const overdue = isOrderOverdue(order, asOf);
  return (
    <Chip
      testID={testID}
      variant={
        overdue
          ? 'danger'
          : order.status === 'PAID'
            ? 'success'
            : order.status === 'PENDING'
              ? 'warning'
              : 'neutral'
      }
    >
      {t(`status.${overdue ? 'overdue' : order.status}`)}
    </Chip>
  );
}

export function Alert({
  children,
  testID,
  warning = false,
}: {
  children: ReactNode;
  testID: string;
  warning?: boolean;
}) {
  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      className={`gap-space-8 border rounded-radius-14 p-space-12 ${warning ? 'bg-mdy-warningBg border-mdy-warning' : 'bg-mdy-dangerBg border-mdy-dangerBorder'}`}
    >
      {Children.map(children, (child) =>
        typeof child === 'string' || typeof child === 'number' ? (
          <Text>{child}</Text>
        ) : (
          child
        )
      )}
    </View>
  );
}
