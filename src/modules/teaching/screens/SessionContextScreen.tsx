import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Chip,
  Icon,
  Text,
} from '@/components/ui/primitives';
import type { IconName } from '@/components/ui/icon';
import { useMindyTheme } from '@/components/ui/theme';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import {
  TeachingPage,
  QueryBlock,
  Group,
  Footer,
  SkeletonList,
} from '../components/shared';
import { StatusChip } from '../components/rows';
import { useTeachingQuery } from '../hooks/useTeachingQuery';
import {
  differentTimezone,
  calendarDate,
  fullDate,
  weekdayLabels,
  safeMeetingLink,
  shortDate,
  time,
  vietnamDate,
  weekdayName,
} from '../format';
import type { TeachingRole, TeachingSession } from '../types';
export function SessionContextScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'SessionContext'>) {
  const { t } = useTranslation('teaching');
  const { state } = useAuth();
  const manager = state.user?.role === 'MANAGER';
  const [tab, setTab] = useState<MentorTab>('overview');
  return (
    <TeachingPage
      prefix="session"
      title={t('mentorSessionTitle')}
      subtitle={route.params.classTitle}
      onBack={navigation.goBack}
      deniedTitle={t('sessionDenied')}
      deniedBody={t('sessionDeniedBody')}
      notFound={t('sessionNotFound')}
      {...(manager
        ? {
            tabs: [
              { value: 'overview', label: t('tabOverview') },
              { value: 'students', label: t('tabStudents') },
            ],
            tab,
            onTab: (value: string) => setTab(value as MentorTab),
          }
        : {
            tabs: [
              { value: 'overview', label: t('tabOverview') },
              { value: 'students', label: t('statStudents') },
              { value: 'materials', label: t('tabMaterials') },
            ],
            tab,
            onTab: (value: string) => setTab(value as MentorTab),
          })}
    >
      {manager ? (
        <Context
          sessionId={route.params.sessionId}
          tab={tab}
        />
      ) : (
        <MentorContext
          sessionId={route.params.sessionId}
          tab={tab}
        />
      )}
    </TeachingPage>
  );
}
type MentorTab = 'overview' | 'students' | 'materials';
function MentorContext({
  sessionId,
  tab,
}: {
  sessionId: string;
  tab: MentorTab;
}) {
  const { t, i18n } = useTranslation('teaching');
  const { notify } = useAuth();
  const query = useTeachingQuery({
    kind: 'context',
    sessionId,
    role: 'MENTOR',
  });
  const item = query.data?.session;
  const active = !!item && item.status !== 'CANCELLED';
  const students = useTeachingQuery(
    { kind: 'sessionStudents', sessionId, role: 'MENTOR' },
    active && tab === 'students'
  );
  const classId = item?.classId ?? '';
  const classInfo = useTeachingQuery(
    { kind: 'class', classId, role: 'MENTOR' },
    !!item,
    false
  ).data?.classInfo;
  const link = safeMeetingLink(item?.meetingUrl ?? null);
  const stats = [
    {
      key: 'students',
      value: active && students.data ? String(students.data.total) : '—',
      label: t('statStudents'),
    },
    // Attendance belongs to P2, so there is nothing real to count yet.
    { key: 'present', value: '—', label: t('statPresent') },
    { key: 'absent', value: '—', label: t('statAbsent') },
  ];
  return (
    <QueryBlock
      prefix="session"
      query={query}
    >
      {item && (
        <>
          <View className={tab === 'overview' ? 'gap-space-20' : 'hidden'}>
            <Card className="mx-space-0 px-space-24 py-space-16 gap-space-14">
              <View className="flex-row flex-wrap items-center gap-space-8">
                <StatusChip
                  group="mentorSessionStatus"
                  value={item.status}
                  testID="session-status"
                />
                {item.assignment === 'SUBSTITUTE' && (
                  <Chip
                    testID="session-assignment"
                    variant="warning"
                  >
                    {t('assignment.SUBSTITUTE')}
                  </Chip>
                )}
                {item.makeup && (
                  <Chip
                    testID="session-makeup-chip"
                    variant="info"
                  >
                    {t('makeup')}
                  </Chip>
                )}
                <Text
                  testID="session-title"
                  className="shrink text-size-12 text-mdy-tertiary"
                >
                  {item.title}
                </Text>
              </View>
              <View className="flex-row flex-wrap items-baseline justify-between gap-space-8">
                <Text
                  testID="session-time"
                  className="text-size-20 font-bvp-bold text-mdy-link"
                >{`${time(item.startsAt)} – ${time(item.endsAt)}`}</Text>
                <Text
                  testID="session-date"
                  className="text-size-13 text-mdy-secondary"
                >
                  {`${weekdayName(item.startsAt, i18n.language)} ${shortDate(vietnamDate(new Date(item.startsAt)))}`}
                </Text>
              </View>
              {item.actualStart && (
                <Text
                  testID="session-actual-start"
                  className="text-size-13 text-mdy-secondary"
                >
                  {t('actualStart', { time: time(item.actualStart) })}
                </Text>
              )}
              {item.actualEnd && (
                <Text
                  testID="session-actual-end"
                  className="text-size-13 text-mdy-secondary"
                >
                  {t('actualEnd', { time: time(item.actualEnd) })}
                </Text>
              )}
              <View className="flex-row gap-space-8">
                {stats.map((stat) => (
                  <View
                    key={stat.key}
                    testID={`session-stat-${stat.key}`}
                    className="flex-1 gap-space-2 p-space-10 rounded-radius-14 bg-mdy-muted2"
                  >
                    <Text className="text-size-18 font-bvp-bold">
                      {stat.value}
                    </Text>
                    <Text className="text-size-11 text-mdy-secondary">
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
              {item.status === 'IN_PROGRESS' && (
                <View className="flex-row flex-wrap gap-space-8">
                  <Button
                    testID="session-attend"
                    size="sm"
                    icon="fact_check"
                    className="flex-1 min-w-[140px] px-space-12 gap-space-6"
                    onPress={() => notify(t('attendLater'))}
                  >
                    {t('attend')}
                  </Button>
                  {link ? (
                    <Button
                      testID="session-link"
                      size="sm"
                      variant="secondary"
                      icon="videocam"
                      accessibilityRole="link"
                      accessibilityLabel={`${t('enterRoom')}, ${link.host}`}
                      accessibilityHint={t('linkHint')}
                      className="flex-1 min-w-[140px] px-space-12 gap-space-6"
                      onPress={() => {
                        Linking.openURL(link.url).catch(() =>
                          notify(t('linkFailed'))
                        );
                      }}
                    >
                      {t('enterRoom')}
                    </Button>
                  ) : (
                    <Text
                      testID="session-link-empty"
                      className="flex-1 self-center text-size-13 text-mdy-secondary"
                    >
                      {t(item.meetingUrl ? 'linkInvalid' : 'linkEmpty')}
                    </Text>
                  )}
                </View>
              )}
              {item.status === 'SCHEDULED' && (
                <View
                  testID="session-starts-note"
                  className="flex-row items-center gap-space-8"
                >
                  <Icon
                    name="info"
                    size={16}
                  />
                  <Text className="flex-1 text-size-12 text-mdy-secondary">
                    {t('startsNote')}
                  </Text>
                </View>
              )}
            </Card>
            <Group>{t('sessionInfo')}</Group>
            <Card className="mx-space-0 p-space-6 gap-space-0">
              <InfoRow
                testID="session-room"
                icon={
                  item.room || !item.meetingUrl ? 'location_on' : 'videocam'
                }
                label={t('location')}
                value={item.room ?? t(item.meetingUrl ? 'online' : 'roomEmpty')}
              />
              <InfoRow
                testID="session-primary-mentor"
                icon="person"
                label={t('primary')}
                value={
                  item.assignment === 'PRIMARY'
                    ? t('youShort')
                    : (item.primaryMentor ?? t('nameUnavailable'))
                }
              />
              {classInfo && (
                <InfoRow
                  testID="session-class-code"
                  icon="tag"
                  label={t('classCode')}
                  value={classInfo.code}
                />
              )}
            </Card>
            {differentTimezone() && (
              <Text
                testID="session-timezone-note"
                className="text-size-12 text-mdy-secondary"
              >
                {t('timezone')}
              </Text>
            )}
          </View>
          {tab === 'students' && (
            <View
              testID="session-students-group"
              className="gap-space-20"
            >
              <Group>
                {t('studentsHead', { count: students.data?.total ?? 0 })}
              </Group>
              {item.status === 'SCHEDULED' && (
                <Alert testID="session-students-provisional">
                  {t('provisional')}
                </Alert>
              )}
              {active ? (
                <QueryBlock
                  query={students}
                  prefix="session-students"
                >
                  <Card
                    className={
                      students.data?.total === 0
                        ? 'mx-space-0 px-space-16 py-space-8 gap-space-0'
                        : 'mx-space-0 p-space-6 gap-space-0'
                    }
                  >
                    {students.data?.students.map((student) => (
                      <View
                        key={`${student.id}-${student.admission}`}
                        testID={`session-student-${student.id}`}
                        className="flex-row items-center gap-space-12 px-space-10 py-space-8"
                      >
                        <Avatar name={student.name ?? t('nameUnavailable')} />
                        <Text className="flex-1 text-size-14 font-bvp-medium">
                          {student.name ?? t('nameUnavailable')}
                        </Text>
                        <View className="flex-row gap-space-6">
                          {student.admission === 'MAKEUP' && (
                            <Chip variant="info">{t('makeupStudent')}</Chip>
                          )}
                          {item.status === 'SCHEDULED' && (
                            <Chip variant="neutral">{t('notMarked')}</Chip>
                          )}
                        </View>
                      </View>
                    ))}
                    {students.data?.total === 0 && (
                      <Text
                        testID="session-students-empty"
                        className="py-space-20 text-center text-size-13 text-mdy-tertiary"
                      >
                        {t('noSessionStudents')}
                      </Text>
                    )}
                    <Footer
                      query={students}
                      prefix="session-students"
                      count={students.data?.students.length ?? 0}
                      label={t('moreStudents')}
                    />
                  </Card>
                </QueryBlock>
              ) : (
                <Card className="mx-space-0 px-space-16 py-space-8">
                  <Text
                    testID="session-students-empty"
                    className="py-space-20 text-center text-size-13 text-mdy-tertiary"
                  >
                    {t('noSessionStudents')}
                  </Text>
                </Card>
              )}
            </View>
          )}
          {tab === 'materials' && (
            <View
              testID="session-materials-group"
              className="gap-space-20"
            >
              <Group>{t('materialsHead')}</Group>
              <Card className="mx-space-0 px-space-16 py-space-8">
                <Text className="py-space-20 text-center text-size-13 text-mdy-tertiary">
                  {t(
                    item.assignment === 'SUBSTITUTE'
                      ? 'materialsByPrimary'
                      : 'noMaterials'
                  )}
                </Text>
              </Card>
            </View>
          )}
        </>
      )}
    </QueryBlock>
  );
}
function InfoRow({
  icon,
  label,
  value,
  testID,
}: {
  icon: IconName;
  label: string;
  value: string;
  testID: string;
}) {
  const { colors } = useMindyTheme();
  return (
    <View
      testID={testID}
      accessible
      className="flex-row items-center gap-space-12 p-space-10"
    >
      <View className="h-space-40 w-space-40 items-center justify-center rounded-radius-99 bg-mdy-tint2">
        <Icon
          name={icon}
          size={20}
          color={colors.link}
        />
      </View>
      <View className="flex-1 gap-space-2">
        <Text className="text-size-12 text-mdy-tertiary">{label}</Text>
        <Text className="text-size-14 font-bvp-medium">{value}</Text>
      </View>
    </View>
  );
}
function Context({ sessionId, tab }: { sessionId: string; tab: MentorTab }) {
  const { t, i18n } = useTranslation('teaching');
  const { notify } = useAuth();
  const query = useTeachingQuery({
    kind: 'context',
    sessionId,
    role: 'MANAGER',
  });
  const item = query.data?.session;
  const [visitedStudents, setVisitedStudents] = useState(false);
  useEffect(() => {
    if (tab === 'students') setVisitedStudents(true);
  }, [tab]);
  // Keep the roster mounted after its first visit so tab changes reuse its data.
  const studentsVisited = visitedStudents || tab === 'students';
  const link = safeMeetingLink(item?.meetingUrl ?? null);
  const date = item ? vietnamDate(new Date(item.startsAt)) : '';
  const today = date === vietnamDate();
  const weekday = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
  return (
    <>
      <View className={tab === 'overview' ? '' : 'hidden'}>
        <QueryBlock
          prefix="session"
          query={query}
          loading={<SkeletonList count={2} />}
        >
          {item && (
            <>
              <Card className="mx-space-0 px-space-24 py-space-16 gap-space-14">
                <View className="flex-row items-center gap-space-12">
                  <View
                    testID="session-date-tile"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    className={
                      today
                        ? 'w-[52px] items-center gap-space-2 py-space-8 rounded-radius-14 bg-mdy-primary'
                        : 'w-[52px] items-center gap-space-2 py-space-8 rounded-radius-14 bg-mdy-muted2'
                    }
                  >
                    <Text
                      className={
                        today
                          ? 'text-size-12 text-mdy-onBrand'
                          : 'text-size-12 text-mdy-secondary'
                      }
                    >
                      {weekdayLabels(i18n.language)[weekday]}
                    </Text>
                    <Text
                      className={
                        today
                          ? 'text-size-20 font-bvp-bold text-mdy-onBrand'
                          : 'text-size-20 font-bvp-bold'
                      }
                    >
                      {date.slice(8)}
                    </Text>
                  </View>
                  <View className="flex-1 gap-space-4">
                    <Text
                      testID="session-title"
                      className="text-size-17 font-bvp-semibold"
                    >
                      {item.title}
                    </Text>
                    <Text
                      testID="session-date"
                      accessibilityLabel={`${fullDate(item.startsAt, i18n.language)} · ${time(item.startsAt)}–${time(item.endsAt)}`}
                      className="text-size-13 text-mdy-secondary"
                    >
                      {`${weekdayLabels(i18n.language)[weekday]}, ${calendarDate(date)} · `}
                      <Text
                        testID="session-time"
                        className="text-size-13 text-mdy-secondary"
                      >{`${time(item.startsAt)}–${time(item.endsAt)}`}</Text>
                    </Text>
                  </View>
                  <View className="self-start">
                    <StatusChip
                      group="sessionStatus"
                      value={item.status}
                      testID="session-status"
                    />
                  </View>
                </View>
                {(item.assignment === 'SUBSTITUTE' || item.makeup) && (
                  <View className="flex-row flex-wrap gap-space-8">
                    {item.assignment === 'SUBSTITUTE' && (
                      <Chip
                        testID="session-assignment"
                        variant="info"
                      >
                        {t('assignment.SUBSTITUTE')}
                      </Chip>
                    )}
                    {item.makeup && (
                      <Chip
                        testID="session-makeup-chip"
                        variant="info"
                      >
                        {t('makeup')}
                      </Chip>
                    )}
                  </View>
                )}
                {item.actualStart && (
                  <Text
                    testID="session-actual-start"
                    className="text-size-13 text-mdy-secondary"
                  >
                    {t('actualStart', { time: time(item.actualStart) })}
                  </Text>
                )}
                {item.actualEnd && (
                  <Text
                    testID="session-actual-end"
                    className="text-size-13 text-mdy-secondary"
                  >
                    {t('actualEnd', { time: time(item.actualEnd) })}
                  </Text>
                )}
              </Card>
              <Group>{t('sessionInfo')}</Group>
              <Card className="mx-space-0 p-space-6 gap-space-0">
                {(item.effectiveMentor || item.status !== 'CANCELLED') && (
                  <InfoRow
                    testID="session-effective-mentor"
                    icon="person"
                    label={t('effective')}
                    value={item.effectiveMentor ?? t('teacherMissing')}
                  />
                )}
                {!(item.assignment === 'PRIMARY' && item.effectiveMentor) && (
                  <InfoRow
                    testID="session-primary-mentor"
                    icon="person"
                    label={t('primary')}
                    value={item.primaryMentor ?? t('nameUnavailable')}
                  />
                )}
                <InfoRow
                  testID="session-room"
                  icon="location_on"
                  label={t('sessionRoom')}
                  value={item.room ?? t('roomEmpty')}
                />
                {!['COMPLETED', 'CANCELLED'].includes(item.status) &&
                  (link ? (
                    <Pressable
                      testID="session-link"
                      accessibilityRole="link"
                      accessibilityLabel={`${t('link')}, ${link.host}`}
                      accessibilityHint={t('linkHint')}
                      className="flex-row items-center"
                      onPress={() => {
                        Linking.openURL(link.url).catch(() =>
                          notify(t('linkFailed'))
                        );
                      }}
                    >
                      <View className="flex-1">
                        <InfoRow
                          testID="session-link-info"
                          icon="videocam"
                          label={t('link')}
                          value={link.host}
                        />
                      </View>
                      <Icon
                        name="open_in_new"
                        size={18}
                      />
                    </Pressable>
                  ) : (
                    <InfoRow
                      testID="session-link-empty"
                      icon="videocam"
                      label={t('link')}
                      value={t(item.meetingUrl ? 'linkInvalid' : 'linkEmpty')}
                    />
                  ))}
              </Card>
              {differentTimezone() && (
                <Text
                  testID="session-timezone-note"
                  className="text-size-12 text-mdy-secondary"
                >
                  {t('timezone')}
                </Text>
              )}
            </>
          )}
        </QueryBlock>
      </View>
      {studentsVisited && (
        <View className={tab === 'students' ? '' : 'hidden'}>
          {item ? (
            <SessionStudents
              item={item}
              role="MANAGER"
              active={tab === 'students'}
            />
          ) : (
            <QueryBlock
              prefix="session-students"
              query={query}
              loading={<SkeletonList count={3} />}
            />
          )}
        </View>
      )}
    </>
  );
}
function StudentEmpty({
  testID,
  children,
}: {
  testID: string;
  children: string;
}) {
  const { colors } = useMindyTheme();
  return (
    <View
      testID={testID}
      className="items-center gap-space-10 px-space-24 py-space-48"
    >
      <View className="h-space-56 w-space-56 rounded-radius-99 bg-mdy-tint2 items-center justify-center">
        <Icon
          name="groups"
          size={26}
          color={colors.link}
        />
      </View>
      <Text className="text-center text-size-14 text-mdy-secondary">
        {children}
      </Text>
    </View>
  );
}
function SessionStudents({
  item,
  role,
  active,
}: {
  item: TeachingSession;
  role: TeachingRole;
  active: boolean;
}) {
  const { t } = useTranslation('teaching');
  const query = useTeachingQuery(
    { kind: 'sessionStudents', sessionId: item.id, role },
    item.status !== 'CANCELLED'
  );
  if (item.status === 'CANCELLED')
    return (
      <StudentEmpty testID="session-students-cancelled">
        {t('cancelledNoRoster')}
      </StudentEmpty>
    );
  if (query.result?.kind === 'unavailable')
    return (
      <StudentEmpty testID="session-students-unavailable">
        {t('noRoster')}
      </StudentEmpty>
    );
  return (
    <View
      testID="session-students-group"
      className="gap-space-20"
    >
      <Text
        testID="session-students-count"
        accessibilityRole="header"
        className="text-size-12 font-bvp-semibold text-mdy-secondary"
      >
        {query.data
          ? t('sessionStudents', { count: query.data.total })
          : t('sessionStudentsHeading')}
      </Text>
      {item.status === 'SCHEDULED' && (
        <Alert testID="session-students-provisional">{t('provisional')}</Alert>
      )}
      <QueryBlock
        query={query}
        prefix="session-students"
        loading={<SkeletonList count={3} />}
      >
        {query.data?.total === 0 ? (
          <StudentEmpty testID="session-students-empty">
            {t('noSessionStudents')}
          </StudentEmpty>
        ) : (
          <Card className="mx-space-0 p-space-6 gap-space-0">
            {query.data?.students.map((student) => (
              <View
                key={`${student.id}-${student.admission}`}
                accessible
                testID={`session-student-${student.id}`}
                className="flex-row items-center gap-space-12 px-space-10 py-space-8"
              >
                <Avatar
                  name={student.name ?? t('nameUnavailable')}
                  size={36}
                />
                <Text className="flex-1 text-size-14 font-bvp-medium">
                  {student.name ?? t('nameUnavailable')}
                </Text>
                {student.admission === 'MAKEUP' && (
                  <Chip variant="info">{t('makeupStudent')}</Chip>
                )}
              </View>
            ))}
          </Card>
        )}
        <Footer
          query={query}
          prefix="session-students"
          count={query.data?.students.length ?? 0}
          label={t('moreStudents')}
          active={active}
        />
      </QueryBlock>
    </View>
  );
}
