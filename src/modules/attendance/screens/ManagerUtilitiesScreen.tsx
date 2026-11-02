import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { Avatar, Card, Icon, Text } from '@/components/ui/primitives';
import { useAttendanceQuery } from '../hooks';
import { More, Page, QueryBlock, SessionHeading } from '../components/shared';

export function AttendanceManagementScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'AttendanceManagement'>) {
  const { t } = useTranslation('attendance');
  const query = useAttendanceQuery({
    kind: 'managementStudents',
    role: 'MANAGER',
    pageSize: 20,
  });
  return (
    <Page
      prefix="attendance-students"
      title={t('utility.management')}
      subtitle={t('utility.chooseStudent')}
      onBack={navigation.goBack}
      refresh={query.refresh}
    >
      <QueryBlock
        query={query}
        prefix="attendance-students"
      >
        <Card className="mx-space-0 p-space-6 gap-space-0">
          {query.data?.managementStudents.map((student) => (
            <Pressable
              key={student.id}
              testID={`attendance-students-row-${student.id}`}
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate('StudentAttendanceForm', { student })
              }
              className="flex-row items-center gap-space-12 p-space-12 border-b border-mdy-divider"
            >
              <Avatar
                name={student.name ?? t('nameMissing')}
                size={36}
              />
              <Text className="flex-1 text-size-14 font-bvp-medium">
                {student.name ?? t('nameMissing')}
              </Text>
              <Icon
                name="chevron_right"
                size={20}
              />
            </Pressable>
          ))}
          {query.data?.total === 0 && (
            <Text testID="attendance-students-empty">
              {t('utility.noStudents')}
            </Text>
          )}
        </Card>
        <More
          query={query}
          count={query.data?.managementStudents.length ?? 0}
          prefix="attendance-students"
        />
      </QueryBlock>
    </Page>
  );
}
export function ManagerFinalizeSessionsScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'ManagerFinalizeSessions'>) {
  const { t } = useTranslation('attendance');
  const query = useAttendanceQuery({
    kind: 'managerSessions',
    role: 'MANAGER',
    mode: 'finalize',
    status: 'IN_PROGRESS',
    pageSize: 20,
  });
  return (
    <Page
      prefix="finalize-sessions"
      title={t('finalize.title')}
      subtitle={t('utility.chooseSession')}
      onBack={navigation.goBack}
      refresh={query.refresh}
      onEnd={() => {
        if (
          (query.data?.sessions.length ?? 0) < (query.data?.total ?? 0) &&
          !query.busy &&
          !query.offline &&
          !query.footerError
        )
          query.more();
      }}
    >
      <Text className="text-size-13 text-mdy-secondary">
        {t('utility.finalizeInfo')}
      </Text>
      <QueryBlock
        query={query}
        prefix="finalize-sessions"
      >
        {query.data?.sessions.map((session) => (
          <Pressable
            key={session.id}
            testID={`finalize-sessions-row-${session.id}`}
            accessibilityRole="button"
            onPress={() =>
              navigation.navigate('ManagerFinalize', {
                sessionId: session.id,
                classTitle: session.classTitle,
              })
            }
          >
            <Card className="mx-space-0 p-space-16 gap-space-12">
              <Text className="text-size-15 font-bvp-semibold">
                {session.classTitle}
              </Text>
              <SessionHeading session={session} />
            </Card>
          </Pressable>
        ))}
        {query.data?.total === 0 && (
          <Text
            testID="finalize-sessions-empty"
            className="text-center py-space-24 text-mdy-secondary"
          >
            {t('utility.empty')}
          </Text>
        )}
        <More
          query={query}
          count={query.data?.sessions.length ?? 0}
          prefix="finalize-sessions"
        />
      </QueryBlock>
    </Page>
  );
}
