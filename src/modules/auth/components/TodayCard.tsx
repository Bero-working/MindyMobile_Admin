import {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, Linking, Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Card,
  Chip,
  Icon,
  Text,
} from '@/components/ui/primitives';
import { useTeachingQuery } from '@/modules/teaching/hooks/useTeachingQuery';
import { Skeleton } from '@/components/ui/skeleton';
import {
  addDays,
  safeMeetingLink,
  selectTodaySession,
  time,
  vietnamDate,
} from '@/modules/teaching/format';
import type { TeachingSession } from '@/modules/teaching/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '../AuthApp';
import { useAuth } from '../hooks/useAuth';
type Navigation = NativeStackScreenProps<
  AuthStackParams,
  'Workspace'
>['navigation'];
function useToday() {
  const [date, setDate] = useState(vietnamDate());
  const check = useCallback(() => {
    setDate(vietnamDate());
  }, []);
  useFocusEffect(
    useCallback(() => {
      check();
    }, [check])
  );
  useEffect(() => {
    const timer = setInterval(check, 30000);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [check]);
  return date;
}
export function TodayCard({
  mentor,
  navigation,
}: {
  mentor: boolean;
  navigation: Navigation;
}) {
  return mentor ? (
    <MentorToday navigation={navigation} />
  ) : (
    <TodayFrame>
      <Rest manager />
    </TodayFrame>
  );
}
function TodayFrame({ children }: PropsWithChildren) {
  return (
    <Card
      testID="workspace-today-card"
      frosted
      className="mx-space-0 p-space-24 gap-space-20"
    >
      {children}
    </Card>
  );
}
function ScheduleAction({ navigation }: { navigation: Navigation }) {
  const { t } = useTranslation('teaching');
  return (
    <Pressable
      testID="workspace-today-schedule"
      accessibilityRole="button"
      accessibilityLabel={t('home.viewSchedule')}
      hitSlop={8}
      onPress={() => navigation.navigate('TeachingSchedule')}
      className="absolute top-space-16 right-space-24 z-10 flex-row items-center min-h-space-28 gap-space-4"
    >
      <Text className="text-size-12 font-bvp-semibold text-mdy-link">
        {t('home.viewSchedule')}
      </Text>
      <Icon
        name="chevron_right"
        size={18}
      />
    </Pressable>
  );
}
function Rest({ manager = false }: { manager?: boolean }) {
  const { t } = useTranslation('teaching');
  return (
    <View className="py-space-8 px-space-8 gap-space-4">
      <Text
        accessibilityRole="header"
        className="text-size-15 font-bvp-semibold text-center"
      >
        {t('home.restTitle')}
      </Text>
      <Text className="text-size-13 text-mdy-secondary text-center">
        {t(manager ? 'home.managerRestBody' : 'home.restBody')}
      </Text>
    </View>
  );
}
function MentorToday({ navigation }: { navigation: Navigation }) {
  const { t } = useTranslation('teaching');
  const date = useToday();
  const query = useTeachingQuery(
    {
      kind: 'schedule',
      role: 'MENTOR',
      from: `${date}T00:00:00+07:00`,
      to: `${addDays(date, 1)}T00:00:00+07:00`,
      pageSize: 100,
    },
    true,
    false
  );
  const item = selectTodaySession(query.data?.sessions ?? [], date);
  const context = useTeachingQuery(
    { kind: 'context', role: 'MENTOR', sessionId: item?.id ?? '' },
    !!item && item.status !== 'COMPLETED',
    false
  );
  const classes = useTeachingQuery(
    { kind: 'classes', role: 'MENTOR', pageSize: 100 },
    !!item,
    false
  );
  const results = [
    query.result,
    ...(item ? [classes.result] : []),
    ...(item && item.status !== 'COMPLETED' ? [context.result] : []),
  ];
  const offline = results.some((result) => result?.kind === 'offline');
  const failed = results.some(
    (result) => result?.kind === 'error' || result?.kind === 'unavailable'
  );
  if (offline || failed) {
    return (
      <TodayFrame>
        <Alert
          warning
          testID={offline ? 'workspace-today-offline' : 'workspace-today-error'}
        >
          {t(offline ? 'offline' : 'home.todayFailed')}
        </Alert>
      </TodayFrame>
    );
  }
  const renderContent = () => {
    const denied =
      query.result?.kind === 'denied' || query.result?.kind === 'notFound';
    if (denied)
      return (
        <Text className="text-size-13 text-left mr-20">
          {t('home.todayDenied')}
        </Text>
      );
    if (!query.data)
      return query.result ? (
        <Alert
          warning
          testID="workspace-today-error"
        >
          {t(query.result.kind === 'offline' ? 'offline' : 'home.todayFailed')}
        </Alert>
      ) : (
        <Skeleton label={t('loading')}>
          <Rest />
        </Skeleton>
      );
    return (
      <>
        {item ? (
          <TodaySession
            key={`${date}-${item.id}`}
            item={item}
            navigation={navigation}
            context={context}
            classes={classes}
          />
        ) : (
          <Rest />
        )}
      </>
    );
  };
  return (
    <TodayFrame>
      <ScheduleAction navigation={navigation} />
      {renderContent()}
    </TodayFrame>
  );
}

function TodaySession({
  item,
  navigation,
  context,
  classes,
}: {
  item: TeachingSession;
  navigation: Navigation;
  context: ReturnType<typeof useTeachingQuery>;
  classes: ReturnType<typeof useTeachingQuery>;
}) {
  const { t } = useTranslation('teaching');
  const { notify } = useAuth();
  const active = item.status !== 'COMPLETED';
  const title =
    classes.data?.classes.find((value) => value.id === item.classId)?.name ??
    item.title;
  const info =
    context.result?.kind === 'denied' || context.result?.kind === 'notFound'
      ? undefined
      : context.data?.session;
  const link = safeMeetingLink(info?.meetingUrl ?? null);
  const status = t(
    item.status === 'SCHEDULED' ? 'today' : `sessionStatus.${item.status}`
  );
  const substitute = item.assignment === 'SUBSTITUTE' && active;
  return (
    <>
      <Pressable
        testID="workspace-today-session"
        accessibilityRole="button"
        onPress={() =>
          navigation.navigate('SessionContext', {
            sessionId: item.id,
            classTitle: title,
          })
        }
        className="flex-row items-center gap-space-16"
      >
        <View className="pr-space-16 border-r border-mdy-divider gap-space-6">
          <Text className="text-[26px] font-bvp-bold text-mdy-link">
            {time(item.startsAt)}
          </Text>
          <Text className="text-size-13 text-mdy-secondary">
            {t('home.until', { time: time(item.endsAt) })}
          </Text>
        </View>
        <View className="flex-1 gap-space-6">
          <View
            accessible
            accessibilityLabel={
              substitute ? t('home.substituteLabel', { status }) : status
            }
            className="self-start mr-space-64"
          >
            <Chip
              variant={
                item.status === 'COMPLETED'
                  ? 'neutral'
                  : substitute && item.status === 'SCHEDULED'
                    ? 'warning'
                    : 'success'
              }
            >
              {substitute ? `⇄ ${status}` : status}
            </Chip>
          </View>
          <Text
            numberOfLines={2}
            className="text-size-15 font-bvp-semibold"
          >
            {title}
          </Text>
          {!!info?.room && (
            <View className="flex-row items-center gap-space-4">
              <Icon
                name="location_on"
                size={16}
              />
              <Text className="flex-1 text-size-13 text-mdy-secondary">
                {info.room}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
      {active && !context.result && (
        <Skeleton label={t('loading')}>
          <Button
            disabled
            size="sm"
            icon="videocam"
          >
            {t('home.joinMeet')}
          </Button>
        </Skeleton>
      )}
      {active && link ? (
        <Button
          testID="workspace-today-meet"
          size="sm"
          icon="videocam"
          className="min-h-space-44 rounded-radius-22"
          onPress={() => {
            Linking.openURL(link.url).catch(() => notify(t('linkFailed')));
          }}
        >
          {t(
            link.host === 'meet.google.com' ? 'home.joinMeet' : 'home.openLink'
          )}
        </Button>
      ) : active && info?.meetingUrl && !link ? (
        <Text className="text-size-12 text-mdy-secondary">
          {t('linkInvalid')}
        </Text>
      ) : null}
    </>
  );
}
