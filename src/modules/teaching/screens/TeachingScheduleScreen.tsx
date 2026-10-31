import { useState, useContext, useEffect, useCallback } from 'react';
import { PageHeaderContext } from '../TeachingProvider';
import { AccessibilityInfo, AppState, Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { Button, Card, Chip, Icon, Text } from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { useTeachingQuery } from '../hooks/useTeachingQuery';
import { TeachingPage, QueryBlock, SkeletonList } from '../components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusChip } from '../components/rows';
import type { TeachingClass, TeachingSession } from '../types';
import {
  addDays,
  calendarDate,
  differentTimezone,
  fullDate,
  shortDate,
  time,
  vietnamDate,
  weekDates,
  weekdayLabels,
  weekdayName,
} from '../format';
export function TeachingScheduleScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'TeachingSchedule'>) {
  const { t } = useTranslation('teaching');
  const [selected, setSelected] = useState(vietnamDate());
  const dates = weekDates(selected);
  const range = {
    from: `${selected}T00:00:00+07:00`,
    to: `${addDays(selected, 1)}T00:00:00+07:00`,
  };
  const { colors } = useMindyTheme();
  const weekOffset = Math.round(
    (Date.parse(`${dates[0] ?? selected}T00:00:00Z`) -
      Date.parse(`${weekDates(vietnamDate())[0] ?? selected}T00:00:00Z`)) /
      (7 * 24 * 60 * 60 * 1000)
  );
  const changeWeek = (days: number) => {
    const next = addDays(selected, days);
    const value = weekDates(next).includes(vietnamDate())
      ? vietnamDate()
      : next;
    setSelected(value);
    AccessibilityInfo.announceForAccessibility(
      `${calendarDate(weekDates(value)[0] ?? value)} – ${calendarDate(weekDates(value)[6] ?? value)}`
    );
  };
  return (
    <TeachingPage
      prefix="schedule"
      title={t('schedule')}
      onBack={navigation.goBack}
      header={
        <>
          <View className="flex-row items-center justify-between gap-space-8">
            <Button
              variant="text"
              testID="schedule-prev-week"
              accessibilityLabel={t('prevWeek')}
              onPress={() => changeWeek(-7)}
            >
              <Icon
                name="arrow_left"
                size={28}
                color={colors.onBrand}
              />
            </Button>
            <Pressable
              testID="schedule-today-button"
              accessibilityRole="button"
              onPress={() => setSelected(vietnamDate())}
              className="items-center gap-space-2"
            >
              <Text
                testID="schedule-week-range"
                className="text-size-15 font-bvp-semibold text-mdy-onBrand"
              >{`${shortDate(dates[0] ?? selected)} – ${shortDate(dates[6] ?? selected)}`}</Text>
              <Text className="text-size-11 font-bvp-medium text-mdy-weekDot">
                {t(
                  weekOffset === 0
                    ? 'thisWeek'
                    : weekOffset === -1
                      ? 'prevWeek'
                      : weekOffset === 1
                        ? 'nextWeek'
                        : 'backToThisWeek'
                )}
              </Text>
            </Pressable>
            <Button
              variant="text"
              testID="schedule-next-week"
              accessibilityLabel={t('nextWeek')}
              onPress={() => changeWeek(7)}
            >
              <Icon
                name="arrow_right"
                size={28}
                color={colors.onBrand}
              />
            </Button>
          </View>
        </>
      }
    >
      <ScheduleBody
        selected={selected}
        dates={dates}
        range={range}
        setSelected={setSelected}
        navigation={navigation}
      />
    </TeachingPage>
  );
}
function ScheduleBody({
  selected,
  dates,
  range,
  setSelected,
  navigation,
}: {
  selected: string;
  dates: string[];
  range: { from: string; to: string };
  setSelected: (value: string) => void;
  navigation: NativeStackScreenProps<
    AuthStackParams,
    'TeachingSchedule'
  >['navigation'];
}) {
  const { t, i18n } = useTranslation('teaching');
  const { notify } = useAuth();
  const query = useTeachingQuery({
    kind: 'schedule',
    role: 'MENTOR',
    ...range,
    pageSize: 100,
  });
  const classes = useTeachingQuery(
    {
      kind: 'classes',
      role: 'MENTOR',
      pageSize: 100,
    },
    true,
    false
  );
  const sessions = query.data?.sessions ?? [];
  const daily = sessions.filter(
    (item) => vietnamDate(new Date(item.startsAt)) === selected
  );
  const [loadedCounts, setLoadedCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (query.result?.kind === 'success' && query.data) {
      const count = query.data.sessions.filter(
        (item) => vietnamDate(new Date(item.startsAt)) === selected
      ).length;
      setLoadedCounts((previous) => ({ ...previous, [selected]: count }));
    }
  }, [selected, query.data, query.result]);
  const setHeader = useContext(PageHeaderContext);
  useEffect(() => {
    setHeader(
      <View
        accessibilityRole="radiogroup"
        className="flex-row gap-space-4"
      >
        {dates.map((date, i) => {
          // An unvisited day is unknown, not an empty day.
          const count = loadedCounts[date];
          return (
            <Pressable
              key={date}
              testID={`schedule-day-${date}`}
              accessibilityRole="radio"
              accessibilityState={{
                selected: date === selected,
                busy: date === selected && !query.data && !query.result,
              }}
              accessibilityLabel={
                count === undefined
                  ? fullDate(`${date}T12:00:00+07:00`, i18n.language)
                  : t('dayLabel', {
                      day: fullDate(`${date}T12:00:00+07:00`, i18n.language),
                      count,
                    })
              }
              onPress={() => setSelected(date)}
              className={
                date === selected
                  ? 'flex-1 min-h-space-64 items-center justify-center rounded-radius-18 bg-mdy-weekSelected'
                  : date === vietnamDate()
                    ? 'flex-1 min-h-space-64 items-center justify-center rounded-radius-18 bg-mdy-headerGlass'
                    : 'flex-1 min-h-space-64 items-center justify-center rounded-radius-18'
              }
            >
              <Text
                maxFontSizeMultiplier={1.3}
                className={
                  date === selected
                    ? 'text-size-11 text-mdy-weekInk'
                    : 'text-size-11 text-mdy-onBrand'
                }
              >
                {weekdayLabels(i18n.language)[i]}
              </Text>
              <Text
                maxFontSizeMultiplier={1.3}
                className={
                  date === selected
                    ? 'text-size-17 font-bvp-semibold text-mdy-weekInk'
                    : 'text-size-17 font-bvp-semibold text-mdy-onBrand'
                }
              >
                {date.slice(8)}
              </Text>
              <View className="h-space-4">
                {count !== undefined && count > 0 && (
                  <View
                    testID={`schedule-day-dot-${date}`}
                    className={
                      date === selected
                        ? 'h-space-4 w-space-4 rounded-radius-99 bg-mdy-weekInk'
                        : 'h-space-4 w-space-4 rounded-radius-99 bg-mdy-weekDot'
                    }
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    );
    return () => setHeader(null);
  }, [
    selected,
    range.from,
    query.data,
    query.result,
    loadedCounts,
    i18n.language,
  ]);
  return (
    <>
      <QueryBlock
        query={query}
        prefix="schedule"
        loading={
          <View
            testID="schedule-day-skeleton"
            className="gap-space-20"
          >
            <ScheduleDayHeading
              selected={selected}
              loading
            />
            <SkeletonList
              variant="schedule"
              count={2}
            />
          </View>
        }
      >
        <ScheduleDayHeading
          selected={selected}
          count={daily.length}
        />
        {daily.map((item) => {
          const classInfo = classes.data?.classes.find(
            (c) => c.id === item.classId
          );
          const title = classInfo?.name;
          const open = () =>
            navigation.navigate('SessionContext', {
              sessionId: item.id,
              ...(title ? { classTitle: title } : {}),
            });
          return (
            <Card
              key={item.id}
              className="mx-space-0 p-space-16 gap-space-14"
            >
              <Pressable
                accessibilityRole="button"
                testID={`schedule-session-${item.id}`}
                onPress={open}
              >
                <View className="flex-row gap-space-16">
                  <View className="gap-space-4 pr-space-16 border-r border-mdy-divider">
                    <Text className="text-size-20 font-bvp-bold text-mdy-link">
                      {time(item.startsAt)}
                    </Text>
                    <Text className="text-size-12 text-mdy-tertiary">
                      {time(item.endsAt)}
                    </Text>
                  </View>
                  <View className="flex-1 gap-space-6">
                    <View className="flex-row flex-wrap gap-space-6">
                      <StatusChip
                        group="mentorSessionStatus"
                        value={item.status}
                      />
                      {item.assignment === 'SUBSTITUTE' && (
                        <Chip
                          testID={`schedule-session-substitute-${item.id}`}
                          variant="warning"
                        >
                          {t('assignment.SUBSTITUTE')}
                        </Chip>
                      )}
                    </View>
                    <View className="min-h-[42px]">
                      {!classes.data && !classes.result ? (
                        <Skeleton label={t('loading')}>
                          <Text
                            numberOfLines={2}
                            className="min-h-[42px] text-size-15 font-bvp-semibold"
                          >
                            {t('classTitle')}
                          </Text>
                        </Skeleton>
                      ) : (
                        <Text
                          testID={`schedule-session-class-${item.id}`}
                          numberOfLines={2}
                          className="text-size-15 font-bvp-semibold"
                        >
                          {title ?? t('classTitle')}
                        </Text>
                      )}
                    </View>
                    <ScheduleLocation
                      item={item}
                      classInfo={classInfo}
                    />
                  </View>
                </View>
              </Pressable>
              <ScheduleActions
                item={item}
                onAttend={() => notify(t('attendLater'))}
                onDetail={open}
              />
            </Card>
          );
        })}
        {!daily.length && (
          <Text testID="schedule-empty-day">{t('emptyDay')}</Text>
        )}
        {!sessions.length && !dates.includes(vietnamDate()) && (
          <Button onPress={() => setSelected(vietnamDate())}>
            {t('backToday')}
          </Button>
        )}
      </QueryBlock>
      {differentTimezone() && (
        <Text
          testID="schedule-timezone-note"
          className="text-size-12 text-mdy-secondary"
        >
          {t('timezone')}
        </Text>
      )}
    </>
  );
}

function ScheduleDayHeading({
  selected,
  count = 0,
  loading = false,
}: {
  selected: string;
  count?: number;
  loading?: boolean;
}) {
  const { t, i18n } = useTranslation('teaching');
  return (
    <View className="flex-row items-baseline justify-between gap-space-8">
      <Text
        testID="schedule-day-title"
        accessibilityRole="header"
        className="flex-1 text-size-17 font-bvp-semibold"
      >
        {[
          `${weekdayName(`${selected}T12:00:00+07:00`, i18n.language)}, ${shortDate(selected)}`,
          ...(selected === vietnamDate() ? [t('today')] : []),
        ].join(' · ')}
      </Text>
      <View className="min-w-[56px]">
        {loading ? (
          <Skeleton label={t('loading')}>
            <Text className="text-size-13 text-mdy-secondary">
              {t('sessionCount', { count: 0 })}
            </Text>
          </Skeleton>
        ) : count > 0 ? (
          <Text className="text-size-13 text-mdy-secondary">
            {t('sessionCount', { count })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function ScheduleLocation({
  item,
  classInfo,
}: {
  item: TeachingSession;
  classInfo?: TeachingClass | undefined;
}) {
  const { t } = useTranslation('teaching');
  // Only the selected day's cards mount this query; never fetch the whole week's
  // contexts or treat absent timetable fields as an empty room in the backend.
  const eligible = item.readSessionContext && item.status !== 'CANCELLED';
  const context = useTeachingQuery(
    { kind: 'context', role: 'MENTOR', sessionId: item.id },
    eligible,
    false
  );
  const info =
    context.result?.kind === 'success' ? context.data?.session : undefined;
  const online =
    classInfo?.deliveryMode === 'ONLINE' ||
    (!classInfo?.deliveryMode && !!info?.meetingUrl);
  const denied =
    context.result?.kind === 'denied' || context.result?.kind === 'notFound';
  const location =
    !eligible || denied
      ? undefined
      : info?.room
        ? info.room
        : online
          ? t('online')
          : !context.result
            ? t('loading')
            : context.result.kind === 'offline'
              ? t('scheduleRoomOffline')
              : context.result.kind !== 'success'
                ? t('scheduleRoomError')
                : t('scheduleRoomEmpty');
  const pending = eligible && !context.result;
  const row = (
    <View className="flex-row items-center gap-space-4">
      <Icon
        name={online && !info?.room ? 'videocam' : 'location_on'}
        size={16}
      />
      <Text
        testID={`schedule-location-${item.id}`}
        numberOfLines={1}
        className="flex-1 text-size-13 text-mdy-secondary"
      >
        {pending ? t('loading') : location}
      </Text>
    </View>
  );
  return (
    <View className="gap-space-6">
      {pending ? (
        <View testID={`schedule-location-loading-${item.id}`}>
          <Skeleton label={t('loading')}>{row}</Skeleton>
        </View>
      ) : location ? (
        row
      ) : null}
    </View>
  );
}

export function ScheduleActions({
  item,
  onAttend,
  onDetail,
}: {
  item: TeachingSession;
  onAttend: () => void;
  onDetail: () => void;
}) {
  const { t } = useTranslation('teaching');
  const [now, setNow] = useState(Date.now);
  useFocusEffect(
    useCallback(() => {
      const update = () => setNow(Date.now());
      update();
      const timer = setInterval(update, 1000);
      const listener = AppState.addEventListener('change', (state) => {
        if (state === 'active') update();
      });
      return () => {
        clearInterval(timer);
        listener.remove();
      };
    }, [])
  );
  const canAttend =
    item.readSessionContext &&
    now >= Date.parse(item.startsAt) &&
    (item.status === 'IN_PROGRESS' ||
      (item.status === 'SCHEDULED' && now < Date.parse(item.endsAt)));
  return (
    <View className="flex-row flex-wrap gap-space-8">
      <Button
        testID={`schedule-attend-${item.id}`}
        size="sm"
        icon="fact_check"
        disabled={!canAttend}
        className="flex-1 min-w-[140px] px-space-12 gap-space-6"
        onPress={onAttend}
      >
        {t('attend')}
      </Button>
      <Button
        testID={`schedule-detail-${item.id}`}
        size="sm"
        variant="secondary"
        icon="info"
        className="flex-1 min-w-[140px] px-space-12 gap-space-6"
        onPress={onDetail}
      >
        {t('detail')}
      </Button>
    </View>
  );
}
