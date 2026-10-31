import { useState, useContext, useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import {
  Alert,
  Avatar,
  Card,
  Icon,
  Text,
  type IconName,
} from '@/components/ui/primitives';
import { PageHeadingContext } from '../TeachingProvider';
import { TeachingPage, QueryBlock, Footer, Group } from '../components/shared';
import { SessionRow, StatusChip, StudentRow } from '../components/rows';
import { useTeachingQuery } from '../hooks/useTeachingQuery';
import { calendarDate } from '../format';
import type { TeachingClass } from '../types';
type Tab = 'overview' | 'schedule' | 'students';
type Navigation = NativeStackScreenProps<
  AuthStackParams,
  'ManagerClassDetail'
>['navigation'];
export function ManagerClassDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'ManagerClassDetail'>) {
  const { t } = useTranslation('teaching');
  const [tab, setTab] = useState<Tab>('overview');
  return (
    <TeachingPage
      prefix="manager-detail"
      reserveSubtitle
      title={t('managerDetailTitle')}
      onBack={navigation.goBack}
      tabs={[
        { value: 'overview', label: t('tabOverview') },
        { value: 'schedule', label: t('managerSessions') },
        { value: 'students', label: t('tabStudents') },
      ]}
      tab={tab}
      onTab={(value) => setTab(value as Tab)}
    >
      <Detail
        classId={route.params.classId}
        navigation={navigation}
        tab={tab}
      />
    </TeachingPage>
  );
}
function Detail({
  classId,
  navigation,
  tab,
}: {
  classId: string;
  navigation: Navigation;
  tab: Tab;
}) {
  const { t } = useTranslation('teaching');
  const query = useTeachingQuery({ kind: 'class', classId, role: 'MANAGER' });
  const item = query.data?.classInfo;
  const heading = useContext(PageHeadingContext);
  const [visited, setVisited] = useState<Set<Tab>>(new Set(['overview']));
  useEffect(() => {
    setVisited((previous) => new Set([...previous, tab]));
  }, [tab]);
  useEffect(() => {
    heading({
      title: t('managerDetailTitle'),
      loading: !item && !query.result,
      ...(item ? { subtitle: item.name } : {}),
    });
  }, [item, query.result, heading, t]);
  return (
    <>
      <View className={tab === 'overview' ? '' : 'hidden'}>
        <QueryBlock
          query={query}
          prefix="manager-detail"
        >
          {item && <Overview item={item} />}
        </QueryBlock>
      </View>
      {(['schedule', 'students'] as const).map(
        (value) =>
          visited.has(value) && (
            <View
              key={value}
              className={tab === value ? 'gap-space-20' : 'hidden'}
            >
              {value === 'schedule' ? (
                <Schedule
                  classId={classId}
                  title={item?.name ?? ''}
                  navigation={navigation}
                  active={tab === value}
                />
              ) : (
                <Students
                  classId={classId}
                  active={tab === value}
                />
              )}
            </View>
          )
      )}
    </>
  );
}
function InfoRow({
  label,
  value,
  icon,
  testID,
  avatar = false,
}: {
  label: string;
  value: string;
  icon: IconName;
  testID: string;
  avatar?: boolean;
}) {
  return (
    <View
      accessible
      className="flex-row items-center gap-space-12 p-space-10"
    >
      {avatar ? (
        <Avatar
          name={value}
          size={40}
        />
      ) : (
        <View className="h-space-40 w-space-40 rounded-radius-99 bg-mdy-tint2 items-center justify-center">
          <Icon
            name={icon}
            size={20}
          />
        </View>
      )}
      <View className="flex-1 gap-space-3">
        <Text className="text-size-12 text-mdy-secondary">{label}</Text>
        <Text
          testID={testID}
          className="text-size-14 font-bvp-medium"
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
function Overview({ item }: { item: TeachingClass }) {
  const { t } = useTranslation('teaching');
  return (
    <>
      {item.status === 'CANCELLED' && (
        <Alert
          warning
          testID="manager-detail-cancelled-alert"
        >
          {t('managerCancelled')}
        </Alert>
      )}
      <Card className="mx-space-0 px-space-24 py-space-16 gap-space-14">
        <View className="flex-row flex-wrap items-center gap-space-8">
          <StatusChip
            group="classStatus"
            value={item.status}
            testID="manager-detail-status"
          />
          <Text
            testID="manager-detail-code"
            className="text-size-12 text-mdy-secondary"
          >
            {item.code}
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-space-8">
          {(
            ['ACTIVE', 'PENDING_PAYMENT', 'COMPLETED', 'CANCELLED'] as const
          ).map((value) => (
            <View
              key={value}
              accessible
              testID={`manager-detail-enroll-${value}`}
              className="grow basis-[45%] rounded-radius-14 bg-mdy-muted p-space-10"
            >
              <Text className="text-size-18 font-bvp-bold">
                {item.enrollmentCounts[value]}
              </Text>
              <Text className="text-size-11 text-mdy-secondary">
                {t(
                  value === 'PENDING_PAYMENT'
                    ? 'held'
                    : value === 'COMPLETED'
                      ? 'done'
                      : `enrollment.${value}`
                )}
              </Text>
            </View>
          ))}
        </View>
      </Card>
      <Group>{t('classInfoHead')}</Group>
      <Card className="mx-space-0 px-space-16 py-space-8">
        <InfoRow
          label={t('primary')}
          value={item.mentor ?? t('nameUnavailable')}
          icon="person"
          avatar
          testID="manager-detail-mentor"
        />
        <InfoRow
          label={t('classPeriod')}
          value={`${calendarDate(item.startDate)} – ${calendarDate(item.endDate)}`}
          icon="event_repeat"
          testID="manager-detail-dates"
        />
        <InfoRow
          label={t('classFormat')}
          value={t(`delivery.${item.deliveryMode}`)}
          icon={item.deliveryMode === 'ONLINE' ? 'videocam' : 'meeting_room'}
          testID="manager-detail-delivery"
        />
        <InfoRow
          label={t('seatsLabel')}
          value={t('seats', {
            available: item.availableSeats,
            max: item.maxStudents,
          })}
          icon="groups"
          testID="manager-detail-seats"
        />
        <InfoRow
          label={t('courseLabel')}
          value={item.course}
          icon="menu_book"
          testID="manager-detail-course"
        />
        <InfoRow
          label={t('syllabus')}
          value={t('countClass', {
            units: item.unitCount,
            sessions: item.sessionCount,
          })}
          icon="menu_book"
          testID="manager-detail-count"
        />
      </Card>
    </>
  );
}
function Schedule({
  classId,
  title,
  navigation,
  active,
}: {
  classId: string;
  title: string;
  navigation: Navigation;
  active: boolean;
}) {
  const { t } = useTranslation('teaching');
  const query = useTeachingQuery({
    kind: 'sessions',
    role: 'MANAGER',
    classId,
  });
  return (
    <>
      <Group>{t('allSessions')}</Group>
      <QueryBlock
        query={query}
        prefix="manager-detail-sessions"
      >
        <Card className="mx-space-0 px-space-16 py-space-8">
          {query.data?.sessions.map((item) => (
            <SessionRow
              key={item.id}
              item={item}
              prefix="manager-detail"
              onPress={() =>
                navigation.navigate('SessionContext', {
                  sessionId: item.id,
                  classTitle: title,
                })
              }
            />
          ))}
          {(!query.data || query.data.total === 0) && (
            <Text testID="manager-detail-sessions-empty">
              {t('noClassSessions')}
            </Text>
          )}
        </Card>
        <Footer
          query={query}
          prefix="manager-detail-sessions"
          count={query.data?.sessions.length ?? 0}
          active={active}
        />
      </QueryBlock>
    </>
  );
}
function Students({ classId, active }: { classId: string; active: boolean }) {
  const { t } = useTranslation('teaching');
  const query = useTeachingQuery({
    kind: 'students',
    role: 'MANAGER',
    classId,
  });
  return (
    <QueryBlock
      query={query}
      prefix="manager-detail-students"
    >
      <Text
        accessibilityRole="header"
        testID="manager-detail-students-count"
        className="text-size-12 font-bvp-semibold text-mdy-secondary"
      >
        {query.data
          ? t('studentsHead', { count: query.data.total })
          : t('students')}
      </Text>
      <Card className="mx-space-0 px-space-16 py-space-8">
        {query.data?.students.map((item) => (
          <StudentRow
            key={item.id}
            item={item}
            prefix="manager-detail"
            manager
          />
        ))}
        {(!query.data || query.data.total === 0) && (
          <Text testID="manager-detail-students-empty">
            {t('emptyStudents')}
          </Text>
        )}
      </Card>
      <Footer
        query={query}
        prefix="manager-detail-students"
        count={query.data?.students.length ?? 0}
        active={active}
      />
    </QueryBlock>
  );
}
