import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Card, Icon, Text } from '@/components/ui/primitives';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import type { TeachingSession } from '@/modules/teaching/types';
import { useAttendanceQuery } from '../hooks';
import { QueryBlock } from './shared';
import { isoDate } from '../model';

export function MentorAttendanceEntry({
  item,
  studentTotal,
  roomAction,
}: {
  item: TeachingSession;
  studentTotal?: number | undefined;
  roomAction?: ReactNode;
}) {
  const { t } = useTranslation('attendance');
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParams>>();
  const query = useAttendanceQuery(
    { kind: 'attendance', role: 'MENTOR', sessionId: item.id, pageSize: 1 },
    item.status !== 'CANCELLED'
  );
  const session = query.data?.session,
    scheduled = session?.status === 'SCHEDULED';
  if (item.status === 'CANCELLED') return null;
  const permissions = session?.permissions;
  return (
    <View className="gap-space-12">
      <View className="flex-row gap-space-8">
        {(['students', 'present', 'absent'] as const).map((key) => (
          <View
            key={key}
            testID={`session-stat-${key}`}
            className="flex-1 p-space-10 gap-space-4 bg-mdy-muted2 rounded-radius-14"
          >
            <Text className="text-size-18 font-bvp-bold">
              {!session
                ? '—'
                : scheduled
                  ? key === 'students' && studentTotal !== undefined
                    ? String(studentTotal)
                    : '—'
                  : String(
                      key === 'students'
                        ? (query.data?.totals?.eligible ?? '—')
                        : (query.data?.totals?.[key] ?? '—')
                    )}
            </Text>
            <Text className="text-size-11 text-mdy-secondary">
              {t(key === 'students' ? 'students' : `editor.${key}`)}
            </Text>
          </View>
        ))}
      </View>
      {!query.data && query.result && (
        <>
          <Alert
            testID="session-totals-error"
            warning
          >
            {t('context.totalsFailed')}
          </Alert>
          {!query.offline && (
            <Button
              testID="session-totals-retry"
              variant="text"
              onPress={() => query.refresh()}
            >
              {t('retry')}
            </Button>
          )}
        </>
      )}
      {permissions && (
        <View className="flex-row flex-wrap gap-space-8">
          {scheduled ? (
            permissions.canStart ? (
              <Button
                testID="session-start"
                size="sm"
                className="flex-1 min-w-[140px] min-h-space-52 rounded-radius-22"
                onPress={() =>
                  navigation.navigate('AttendanceEditor', {
                    sessionId: item.id,
                  })
                }
              >
                {t('context.start')}
              </Button>
            ) : (
              <Text testID="session-starts-note">
                {t('editor.startBefore', { date: isoDate(item.startsAt) })}
              </Text>
            )
          ) : (
            <Button
              testID={
                permissions.canEditAttendance
                  ? 'session-attend'
                  : 'session-attend-view'
              }
              size="sm"
              className="flex-1 min-w-[140px] min-h-space-52 rounded-radius-22"
              onPress={() =>
                navigation.navigate('AttendanceEditor', { sessionId: item.id })
              }
            >
              {t(
                permissions.canEditAttendance
                  ? session?.status === 'COMPLETED'
                    ? 'context.edit'
                    : 'context.attend'
                  : 'context.view'
              )}
            </Button>
          )}
          {roomAction}
        </View>
      )}
      {permissions && !scheduled && (
        <Button
          testID="session-note"
          variant="secondary"
          size="sm"
          className="min-h-space-52 rounded-radius-22"
          onPress={() =>
            navigation.navigate('TeachingNoteEditor', {
              sessionId: item.id,
            })
          }
        >
          {t('noteLink')}
        </Button>
      )}
    </View>
  );
}
export function ManagerIncompleteSummary() {
  const { t } = useTranslation('attendance');
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParams>>();
  const query = useAttendanceQuery({
    kind: 'incomplete',
    role: 'MANAGER',
    pageSize: 1,
  });
  const total = query.data?.total;
  return (
    <Card
      testID="workspace-today-card"
      frosted
      className="mx-space-0 p-space-24 gap-space-12"
    >
      <QueryBlock
        query={query}
        prefix="workspace-incomplete"
      >
        {total === 0 ? (
          <View className="gap-space-4">
            <Text className="text-center text-size-15 font-bvp-semibold">
              {t('home.noneTitle')}
            </Text>
            <Text className="text-center text-size-13 text-mdy-secondary">
              {t('home.none')}
            </Text>
          </View>
        ) : total !== undefined ? (
          <Pressable
            testID="workspace-incomplete-summary"
            accessibilityRole="button"
            onPress={() => navigation.navigate('IncompleteSessions')}
            className="flex-row items-center gap-space-16 min-h-space-64"
          >
            <View className="pr-space-16 border-r border-mdy-divider">
              <Text className="text-[26px] font-bvp-bold text-mdy-link">
                {total}
              </Text>
            </View>
            <Text className="flex-1 text-size-15 font-bvp-semibold">
              {t('home.pendingLabel')}
            </Text>
            <Icon
              name="chevron_right"
              size={18}
            />
          </Pressable>
        ) : null}
      </QueryBlock>
    </Card>
  );
}
export function useVisited(active: boolean) {
  const [visited, setVisited] = useState(active);
  if (active && !visited) setVisited(true);
  return active || visited;
}
