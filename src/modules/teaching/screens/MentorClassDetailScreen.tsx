import { useState, useContext, useEffect } from 'react';
import { PageHeadingContext } from '../TeachingProvider';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { Alert, Button, Card, Icon, Text } from '@/components/ui/primitives';
import type { IconName } from '@/components/ui/icon';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import {
  TeachingPage,
  QueryBlock,
  Footer,
  type QueryState,
} from '../components/shared';
import { MentorSessionRow, StatusChip } from '../components/rows';
import { useTeachingQuery } from '../hooks/useTeachingQuery';
import { safeMeetingLink } from '../format';
import type { TeachingClass } from '../types';
export function MentorClassDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'MentorClassDetail'>) {
  const { t } = useTranslation('teaching');
  return (
    <TeachingPage
      prefix="class-detail"
      reserveSubtitle
      title={t('classTitle')}
      onBack={navigation.goBack}
      deniedTitle={t('classDenied')}
      deniedBody={t('classDeniedBody')}
    >
      <Detail
        classId={route.params.classId}
        navigation={navigation}
      />
    </TeachingPage>
  );
}
function Detail({
  classId,
  navigation,
}: {
  classId: string;
  navigation: NativeStackScreenProps<
    AuthStackParams,
    'MentorClassDetail'
  >['navigation'];
}) {
  const { t } = useTranslation('teaching');
  const { notify } = useAuth();
  const query = useTeachingQuery({
    kind: 'class',
    classId,
    role: 'MENTOR',
  });
  const item = query.data?.classInfo;
  const sessions = useTeachingQuery(
    { kind: 'sessions', classId, role: 'MENTOR', pageSize: 100 },
    !!item && item.status !== 'DRAFT'
  );
  const list = sessions.data?.sessions ?? [];
  const nextSession = [...list]
    .sort(
      (a, b) =>
        (a.status === 'IN_PROGRESS' ? 0 : 1) -
          (b.status === 'IN_PROGRESS' ? 0 : 1) ||
        Date.parse(a.startsAt) - Date.parse(b.startsAt)
    )
    .find(
      (session) =>
        session.readSessionContext &&
        (session.status === 'IN_PROGRESS' ||
          (session.status === 'SCHEDULED' &&
            Date.parse(session.endsAt) > Date.now()))
    );
  const context = useTeachingQuery(
    {
      kind: 'context',
      role: 'MENTOR',
      ...(nextSession ? { sessionId: nextSession.id } : {}),
    },
    !!nextSession &&
      !!item &&
      !['COMPLETED', 'CANCELLED', 'DRAFT'].includes(item.status),
    false
  );
  const contextSession = context.data?.session;
  const currentContext =
    contextSession?.id === nextSession?.id &&
    contextSession?.classId === classId
      ? contextSession
      : undefined;
  const link = ['COMPLETED', 'CANCELLED'].includes(item?.status ?? '')
    ? null
    : safeMeetingLink(currentContext?.meetingUrl ?? null);
  const heading = useContext(PageHeadingContext);
  useEffect(() => {
    heading({
      title: item?.name ?? t('classTitle'),
      ...(item ? { subtitle: item.code } : {}),
      loading: !item && !query.result,
    });
  }, [item, query.result, heading, t]);
  return (
    <QueryBlock
      query={query}
      prefix="class-detail"
    >
      {item && (
        <>
          <Card className="mx-space-0 px-space-24 py-space-16 gap-space-14">
            <View className="flex-row items-start gap-space-12">
              <View className="flex-1 gap-space-3">
                <Text className="text-size-17 font-bvp-semibold">
                  {item.name}
                </Text>
                <Text
                  testID="class-detail-course"
                  className="text-size-12 text-mdy-tertiary"
                >
                  {item.course}
                </Text>
              </View>
              <StatusChip
                group="mentorClassStatus"
                value={item.status}
                testID="class-detail-status"
              />
            </View>
            {item.scope === 'SESSION' && (
              <StatusChip
                group="scope"
                value={item.scope}
                testID="class-detail-scope"
              />
            )}
            {!!currentContext?.room && (
              <View className="flex-row">
                <Fact
                  icon="location_on"
                  text={currentContext.room}
                />
              </View>
            )}
            <View className="flex-row items-center justify-between gap-space-12">
              <Fact
                icon="menu_book"
                testID="class-detail-count"
                text={t(
                  item.scope === 'CLASS' ? 'countClass' : 'countSession',
                  {
                    units: item.unitCount,
                    sessions: item.sessionCount,
                  }
                )}
              />
              {item.readClassRoster && (
                <Pressable
                  testID="class-detail-students-button"
                  accessibilityRole="button"
                  onPress={() =>
                    navigation.navigate('MentorStudents', { classId })
                  }
                  className="shrink-0 flex-row items-center gap-space-6"
                >
                  <Icon
                    name="groups"
                    size={16}
                  />
                  <Text className="shrink text-size-13 font-bvp-semibold text-mdy-link">
                    {t('students')}
                  </Text>
                  <Icon
                    name="chevron_right"
                    size={16}
                  />
                </Pressable>
              )}
            </View>
            {link && (
              <Button
                testID="class-detail-enter-button"
                size="sm"
                icon="videocam"
                accessibilityHint={t('linkHint')}
                onPress={() => {
                  Linking.openURL(link.url).catch(() =>
                    notify(t('linkFailed'))
                  );
                }}
              >
                {t('enterClass')}
              </Button>
            )}
          </Card>
          {item.scope === 'SESSION' && (
            <Alert testID="class-detail-scope-alert">{t('scopeAlert')}</Alert>
          )}
          {['CANCELLED', 'COMPLETED'].includes(item.status) && (
            <Alert
              testID="class-detail-readonly-alert"
              warning={item.status === 'CANCELLED'}
            >
              {t(
                item.status === 'CANCELLED'
                  ? 'cancelledAlert'
                  : 'completedAlert'
              )}
            </Alert>
          )}
          <Sessions
            classInfo={item}
            query={sessions}
            title={item.name}
            navigation={navigation}
          />
        </>
      )}
    </QueryBlock>
  );
}
function Fact({
  icon,
  text,
  testID,
}: {
  icon: IconName;
  text: string;
  testID?: string;
}) {
  return (
    <View
      {...(testID ? { testID } : {})}
      className="shrink flex-row items-center gap-space-6"
    >
      <Icon
        name={icon}
        size={16}
      />
      <Text className="shrink text-size-13 text-mdy-secondary">{text}</Text>
    </View>
  );
}
function Sessions({
  classInfo,
  query,
  title,
  navigation,
}: {
  classInfo: TeachingClass;
  query: QueryState;
  title: string;
  navigation: NativeStackScreenProps<
    AuthStackParams,
    'MentorClassDetail'
  >['navigation'];
}) {
  const { t } = useTranslation('teaching');
  const closed = ['COMPLETED', 'CANCELLED'].includes(classInfo.status);
  const [tab, setTab] = useState<'upcoming' | 'done'>(
    closed ? 'done' : 'upcoming'
  );
  const list = query.data?.sessions ?? [];
  const isDone = (status: string) =>
    ['COMPLETED', 'CANCELLED'].includes(status);
  const upcoming = list
    .filter((item) => !isDone(item.status))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const done = list
    .filter((item) => isDone(item.status))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const shown = tab === 'upcoming' ? upcoming : done;
  const taught = done.filter((item) => item.status === 'COMPLETED').length;
  return (
    <>
      <View className="flex-row items-center justify-between pt-space-8">
        <Text
          accessibilityRole="header"
          className="text-size-17 font-bvp-semibold"
        >
          {t('sessionsHeading')}
        </Text>
        <Text
          testID="class-detail-sessions-done"
          className="text-size-13 text-mdy-secondary"
        >
          {t('sessionsDone', { done: taught, total: classInfo.sessionCount })}
        </Text>
      </View>
      <View
        accessibilityRole="radiogroup"
        className="flex-row gap-space-8"
      >
        {(
          [
            ['upcoming', t('tabUpcoming', { count: upcoming.length })],
            ['done', t('tabDone', { count: done.length })],
          ] as const
        ).map(([value, label]) => (
          <Pressable
            key={value}
            testID={`class-detail-tab-${value}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === tab }}
            onPress={() => setTab(value)}
            className={
              value === tab
                ? 'min-h-space-44 rounded-radius-99 px-space-16 justify-center bg-mdy-primary'
                : 'min-h-space-44 rounded-radius-99 px-space-16 justify-center border border-mdy-border bg-mdy-surface'
            }
          >
            <Text
              className={
                value === tab
                  ? 'text-size-13 font-bvp-semibold text-mdy-onBrand'
                  : 'text-size-13 font-bvp-semibold text-mdy-link'
              }
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <QueryBlock
        query={query}
        prefix="class-detail-sessions"
      >
        <Card className="mx-space-0 p-space-6 gap-space-0">
          {shown.map((item) => (
            <MentorSessionRow
              key={item.id}
              item={item}
              onPress={() =>
                navigation.navigate('SessionContext', {
                  sessionId: item.id,
                  classTitle: title,
                })
              }
            />
          ))}
          {!shown.length && (
            <Text
              testID="class-detail-no-sessions"
              className="py-space-24 text-center text-size-14 text-mdy-tertiary"
            >
              {t('noSessionsTab')}
            </Text>
          )}
          <Footer
            query={query}
            prefix="class-detail-sessions"
            count={list.length}
            label={t('moreSessions')}
          />
        </Card>
      </QueryBlock>
    </>
  );
}
