import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Avatar, Card, Chip, Icon, Text } from '@/components/ui/primitives';
import type { TeachingClass, TeachingSession, TeachingStudent } from '../types';
import {
  calendarDate,
  monthLabel,
  time,
  vietnamDate,
  weekdayLabels,
} from '../format';
export function StatusChip({
  group,
  value,
  testID,
}: {
  group:
    | 'classStatus'
    | 'mentorClassStatus'
    | 'sessionStatus'
    | 'mentorSessionStatus'
    | 'classSessionStatus'
    | 'enrollment'
    | 'order'
    | 'assignment'
    | 'scope';
  value: string;
  testID?: string;
}) {
  const { t } = useTranslation('teaching');
  const variant =
    value === 'CANCELLED' || value === 'EXPIRED'
      ? group === 'order' && value === 'CANCELLED'
        ? 'neutral'
        : 'danger'
      : value === 'PENDING' || value === 'PENDING_PAYMENT'
        ? 'warning'
        : ['ACTIVE', 'PAID', 'IN_PROGRESS'].includes(value)
          ? 'success'
          : ['COMPLETED', 'DRAFT'].includes(value)
            ? 'neutral'
            : value === 'SUBSTITUTE' || value === 'SESSION'
              ? 'info'
              : 'brand';
  return (
    <Chip
      variant={variant}
      {...(testID ? { testID } : {})}
    >
      {t(`${group}.${value}`)}
    </Chip>
  );
}
export function ProgressBar({
  current,
  total,
  label,
}: {
  current: number | null;
  total: number | null;
  label: string;
}) {
  const { t } = useTranslation('teaching');
  if (current === null || total === null) return null;
  return (
    <View className="gap-space-6">
      <View className="flex-row justify-between">
        <Text className="text-size-12 text-mdy-secondary">{t('progress')}</Text>
        <Text className="text-size-12 font-bvp-semibold text-mdy-link">
          {label}
        </Text>
      </View>
      <View className="h-space-6 rounded-radius-99 bg-mdy-muted overflow-hidden">
        <View
          className="h-full rounded-radius-99 bg-mdy-primary"
          style={{
            width: `${total ? Math.max(0, Math.min(100, Math.round((current / total) * 100))) : 0}%`,
          }}
        />
      </View>
    </View>
  );
}
export function classScheduleLine(item: TeachingClass, language: string) {
  const days = weekdayLabels(language);
  return [
    ...item.scheduleDays.map((day) => days[day]),
    ...(item.scheduleTime ? [item.scheduleTime] : []),
  ].join(' · ');
}
export function MentorClassCard({
  item,
  onPress,
}: {
  item: TeachingClass;
  onPress: () => void;
}) {
  const { t } = useTranslation('teaching');
  const detail = [
    ...(item.availableSeats !== null && item.maxStudents !== null
      ? [t('seats', { available: item.availableSeats, max: item.maxStudents })]
      : []),
    ...(item.deliveryMode ? [t(`delivery.${item.deliveryMode}`)] : []),
  ].join(' · ');
  return (
    <Pressable
      testID={`classes-card-${item.id}`}
      accessibilityRole="button"
      onPress={onPress}
      className="active:opacity-80"
    >
      <Card className="mx-space-0 px-space-24 py-space-16 gap-space-16">
        <View className="flex-row items-start gap-space-12">
          <View className="flex-1 gap-space-3">
            <Text
              numberOfLines={2}
              className={
                item.status === 'CANCELLED'
                  ? 'text-size-15 font-bvp-semibold text-mdy-secondary'
                  : 'text-size-15 font-bvp-semibold text-mdy-ink'
              }
            >
              {item.name}
            </Text>
            <Text className="text-size-12 text-mdy-tertiary">{item.code}</Text>
          </View>
          <StatusChip
            group="mentorClassStatus"
            value={item.status}
          />
        </View>
        <ProgressBar
          current={item.elapsedSessions ?? null}
          total={item.sessionCount}
          label={t('sessionProgress', {
            current: item.elapsedSessions ?? 0,
            total: item.sessionCount,
            remaining: Math.max(
              0,
              (item.sessionCount ?? 0) - (item.elapsedSessions ?? 0)
            ),
          })}
        />
        {item.elapsedSessions == null && (
          <Text className="text-size-12 text-mdy-secondary">
            {t('progressUnavailable')}
          </Text>
        )}
        {item.scope === 'SESSION' && (
          <>
            <StatusChip
              group="scope"
              value={item.scope}
              testID={`classes-card-scope-${item.id}`}
            />
            <Text
              testID={`classes-card-mentor-${item.id}`}
              className="text-size-13 text-mdy-secondary"
            >
              {t('primaryMentor', {
                name: item.mentor ?? t('nameUnavailable'),
              })}
            </Text>
          </>
        )}
        <View className="gap-space-6">
          <View className="flex-row items-center gap-space-6">
            <Icon
              name="event_repeat"
              size={16}
            />
            <Text className="flex-1 text-size-13 text-mdy-secondary">
              {`${calendarDate(item.startDate)} – ${calendarDate(item.endDate)}`}
            </Text>
          </View>
          <View className="flex-row items-center gap-space-6">
            <Icon
              name="groups"
              size={16}
            />
            <Text className="flex-1 text-size-13 text-mdy-secondary">
              {detail || t('classDetailsUnavailable')}
            </Text>
            <Icon
              name="chevron_right"
              size={20}
            />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
export function ClassCard({
  item,
  prefix,
  onPress,
}: {
  item: TeachingClass;
  prefix: string;
  onPress: () => void;
}) {
  const { t } = useTranslation('teaching');
  return (
    <Pressable
      testID={`${prefix}-card-${item.id}`}
      accessible
      accessibilityRole="button"
      onPress={onPress}
      className="active:opacity-80"
    >
      <Card className="mx-space-0 px-space-24 py-space-16 gap-space-16">
        <View className="flex-row items-start gap-space-12">
          <View className="flex-1 gap-space-3">
            <Text
              numberOfLines={2}
              className={
                item.status === 'CANCELLED'
                  ? 'text-size-15 font-bvp-semibold text-mdy-secondary'
                  : 'text-size-15 font-bvp-semibold text-mdy-ink'
              }
            >
              {item.name}
            </Text>
            <Text className="text-size-12 text-mdy-secondary">{item.code}</Text>
          </View>
          <StatusChip
            group="classStatus"
            value={item.status}
          />
        </View>
        <View className="flex-row items-center gap-space-6">
          <Icon
            name="person"
            size={16}
          />
          <Text
            testID={`${prefix}-mentor-${item.id}`}
            className="flex-1 text-size-13 text-mdy-secondary"
          >
            {t('primaryMentor', { name: item.mentor ?? t('nameUnavailable') })}
          </Text>
        </View>
        <View className="flex-row items-center gap-space-6">
          <Icon
            name="event_repeat"
            size={16}
          />
          <Text className="flex-1 text-size-13 text-mdy-secondary">{`${calendarDate(item.startDate)} – ${calendarDate(item.endDate)} · ${t(`delivery.${item.deliveryMode}`)}`}</Text>
        </View>
        <View className="flex-row items-center gap-space-6">
          <Icon
            name="groups"
            size={16}
          />
          <Text
            testID={`${prefix}-seats-${item.id}`}
            className="flex-1 text-size-13 text-mdy-secondary"
          >
            {item.availableSeats === null || item.maxStudents === null
              ? '—'
              : t('seats', {
                  available: item.availableSeats,
                  max: item.maxStudents,
                })}
          </Text>
          <Icon
            name="chevron_right"
            size={20}
          />
        </View>
      </Card>
    </Pressable>
  );
}
export function MentorSessionRow({
  item,
  onPress,
}: {
  item: TeachingSession;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation('teaching');
  const allowed = item.readSessionContext;
  const owner = allowed
    ? ''
    : item.effectiveMentor
      ? t('assigned', { name: item.effectiveMentor })
      : item.status === 'CANCELLED'
        ? ''
        : t('teacherMissing');
  const date = vietnamDate(new Date(item.startsAt));
  const today = date === vietnamDate();
  const weekday = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
  const dateText = today ? 'text-mdy-onBrand' : 'text-mdy-ink';
  return (
    <Pressable
      testID={`class-detail-session-${item.id}`}
      accessibilityRole={allowed ? 'button' : undefined}
      disabled={!allowed}
      onPress={onPress}
      className={
        today
          ? 'flex-row items-center gap-space-12 p-space-10 rounded-radius-14 bg-mdy-tint active:bg-mdy-muted'
          : 'flex-row items-center gap-space-12 p-space-10 rounded-radius-14 active:bg-mdy-muted'
      }
    >
      <View
        className={
          today
            ? 'w-space-44 items-center py-space-6 rounded-radius-12 bg-mdy-primary'
            : 'w-space-44 items-center py-space-6 rounded-radius-12 bg-mdy-muted2'
        }
      >
        <Text className={`text-size-11 font-bvp-semibold ${dateText}`}>
          {weekdayLabels(i18n.language)[weekday]}
        </Text>
        <Text className={`text-size-17 font-bvp-bold ${dateText}`}>
          {date.slice(8)}
        </Text>
        <Text className={`text-size-11 ${dateText}`}>
          {monthLabel(date, i18n.language)}
        </Text>
      </View>
      <View className="flex-1 gap-space-3">
        <Text
          numberOfLines={2}
          className="text-size-14 font-bvp-semibold"
        >
          {item.title}
        </Text>
        <Text className="text-size-12 text-mdy-tertiary">
          {[
            `${time(item.startsAt)}–${time(item.endsAt)}`,
            ...(item.room ? [item.room] : []),
          ].join(' · ')}
        </Text>
        {item.assignment === 'SUBSTITUTE' && (
          <StatusChip
            group="assignment"
            value="SUBSTITUTE"
          />
        )}
        {!!owner && (
          <Text
            testID={`class-detail-session-owner-${item.id}`}
            className="text-size-12 text-mdy-secondary"
          >
            {owner}
          </Text>
        )}
      </View>
      <View>
        {today && !['COMPLETED', 'CANCELLED'].includes(item.status) ? (
          <Chip variant="success">{t('today')}</Chip>
        ) : (
          <StatusChip
            group="classSessionStatus"
            value={item.status}
          />
        )}
      </View>
    </Pressable>
  );
}
export function SessionRow({
  item,
  prefix,
  onPress,
}: {
  item: TeachingSession;
  prefix: string;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation('teaching');
  const date = vietnamDate(new Date(item.startsAt));
  const today = date === vietnamDate();
  const weekday = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
  const owner =
    item.effectiveMentor ??
    (item.status === 'CANCELLED' ? '' : t('teacherMissing'));
  const tone = today ? 'text-mdy-onBrand' : 'text-mdy-ink';
  return (
    <Pressable
      testID={`${prefix}-session-${item.id}`}
      accessible
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-space-12 p-space-10 rounded-radius-14 active:bg-mdy-muted"
    >
      <View
        className={
          today
            ? 'w-space-44 py-space-6 items-center rounded-radius-12 bg-mdy-primary'
            : 'w-space-44 py-space-6 items-center rounded-radius-12 bg-mdy-muted'
        }
      >
        <Text className={`text-size-11 ${tone}`}>
          {weekdayLabels(i18n.language)[weekday]}
        </Text>
        <Text className={`text-size-16 font-bvp-bold ${tone}`}>
          {date.slice(8)}
        </Text>
        <Text className={`text-size-11 ${tone}`}>
          {monthLabel(date, i18n.language)}
        </Text>
      </View>
      <View className="flex-1 gap-space-3">
        <Text
          numberOfLines={2}
          className="text-size-14 font-bvp-medium"
        >
          {item.title}
        </Text>
        <Text
          testID={`${prefix}-session-teacher-${item.id}`}
          className="text-size-12 text-mdy-secondary"
        >
          {[
            `${time(item.startsAt)}–${time(item.endsAt)}`,
            ...(owner ? [owner] : []),
            ...(item.assignment === 'SUBSTITUTE'
              ? [t('assignment.SUBSTITUTE')]
              : []),
          ].join(' · ')}
        </Text>
      </View>
      <StatusChip
        group="sessionStatus"
        value={item.status}
      />
    </Pressable>
  );
}
export function StudentRow({
  item,
  prefix,
  session = false,
  manager = false,
}: {
  item: TeachingStudent;
  prefix: string;
  session?: boolean;
  manager?: boolean;
}) {
  const { t } = useTranslation('teaching');
  if (manager)
    return (
      <View
        testID={`manager-detail-student-${item.id}`}
        accessible
        className="flex-row items-center gap-space-12 py-space-8 px-space-10"
      >
        <Avatar
          name={item.name ?? t('nameUnavailable')}
          size={36}
        />
        <View className="flex-1 gap-space-4">
          <Text className="text-size-14 font-bvp-medium">
            {item.name ?? t('nameUnavailable')}
          </Text>
          {item.studentStatus && item.studentStatus !== 'ACTIVE' && (
            <Text className="text-size-12 text-mdy-secondary">
              {t(
                item.studentStatus === 'SUSPENDED'
                  ? 'suspended'
                  : 'pendingVerify'
              )}
            </Text>
          )}
        </View>
        <StatusChip
          group="enrollment"
          value={item.enrollment ?? ''}
          testID={`manager-detail-student-status-${item.id}`}
        />
      </View>
    );
  const method = t(`method.${item.method}`);
  const detail =
    item.order === 'PAID' && item.paidAt
      ? t('paidLine', {
          date: calendarDate(vietnamDate(new Date(item.paidAt))),
          method,
        })
      : item.order === 'PENDING' && item.expiresAt
        ? t('heldLine', {
            dateTime: `${calendarDate(vietnamDate(new Date(item.expiresAt)))} ${time(item.expiresAt)}`,
            method,
          })
        : method;
  return (
    <View
      testID={
        session
          ? `session-student-${item.id}`
          : manager
            ? `manager-detail-student-${item.id}`
            : `students-row-${item.id}`
      }
      className="flex-row gap-space-16 px-space-8 py-space-16 border-b border-mdy-divider"
    >
      <Avatar name={item.name ?? t('nameUnavailable')} />
      <View className="flex-1 gap-space-4">
        <Text className="text-size-14 font-bvp-medium">
          {item.name ?? t('nameUnavailable')}
        </Text>
        {session ? (
          item.admission === 'MAKEUP' && (
            <Chip variant="info">{t('makeupStudent')}</Chip>
          )
        ) : (
          <>
            <View className="flex-row flex-wrap gap-space-8">
              <StatusChip
                group="enrollment"
                value={item.enrollment ?? ''}
                testID={`${prefix}-enrollment-${item.id}`}
              />
              <StatusChip
                group="order"
                value={item.order ?? ''}
                testID={`${prefix}-order-${item.id}`}
              />
            </View>
            <Text
              testID={`${prefix}-line-${item.id}`}
              className="text-size-12 text-mdy-secondary"
            >
              {detail}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
