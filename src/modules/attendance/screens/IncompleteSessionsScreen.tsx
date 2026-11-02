import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { Button, Card, Chip, Sheet, Text } from '@/components/ui/primitives';
import { useAttendanceQuery } from '../hooks';
import { Field, More, Page, QueryBlock } from '../components/shared';
import { isoDate, isoTime } from '../model';
import type { Issue } from '../types';

export function IncompleteSessionsScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'IncompleteSessions'>) {
  const { t } = useTranslation('attendance');
  const [issue, setIssue] = useState<Issue>(),
    [classId, setClassId] = useState<string>(),
    [pick, setPick] = useState(false),
    [search, setSearch] = useState('');
  const query = useAttendanceQuery({
    kind: 'incomplete',
    role: 'MANAGER',
    pageSize: 20,
    ...(issue ? { issue } : {}),
    ...(classId ? { classId } : {}),
  });
  const classes = useAttendanceQuery(
    { kind: 'classes', role: 'MANAGER', pageSize: 100 },
    true,
    true
  );
  const clear = () => {
    setIssue(undefined);
    setClassId(undefined);
  };
  return (
    <Page
      prefix="incomplete"
      title={t('incomplete.title')}
      subtitle={
        query.data
          ? t('incomplete.subtitle', { count: query.data.total })
          : undefined
      }
      onBack={navigation.goBack}
      refresh={query.refresh}
      onEnd={() => {
        if (
          (query.data?.incomplete.length ?? 0) < (query.data?.total ?? 0) &&
          !query.busy &&
          !query.footerError &&
          !query.offline
        )
          query.more();
      }}
    >
      <Text
        testID="incomplete-info"
        className="text-size-12 text-mdy-secondary"
      >
        {t('incomplete.info')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        testID="incomplete-status-scroll"
      >
        <View
          accessibilityRole="radiogroup"
          className="flex-row items-center gap-space-8"
        >
          {(
            [undefined, 'OVERDUE_NOT_STARTED', 'STARTED_NOT_FINALIZED'] as const
          ).map((value, i) => (
            <Pressable
              key={value ?? 'all'}
              testID={`incomplete-filter-${i === 0 ? 'all' : i === 1 ? 'not-started' : 'not-finalized'}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: issue === value }}
              className={
                issue === value
                  ? 'min-h-space-44 rounded-radius-99 px-space-16 justify-center bg-mdy-primary'
                  : 'min-h-space-44 rounded-radius-99 px-space-16 justify-center border border-mdy-border bg-mdy-surface'
              }
              onPress={() => setIssue(value)}
            >
              <Text
                className={
                  issue === value
                    ? 'text-size-13 font-bvp-semibold text-mdy-onBrand'
                    : 'text-size-13 text-mdy-link'
                }
              >
                {t(value ? `issue.${value}` : 'all')}
              </Text>
            </Pressable>
          ))}
          <Button
            testID="incomplete-class-filter"
            variant="secondary"
            size="sm"
            onPress={() => setPick(true)}
          >
            {classes.data?.classes.find((item) => item.id === classId)?.name ??
              t('class')}
          </Button>
          {classId && (
            <Button
              testID="incomplete-class-clear"
              variant="text"
              onPress={() => setClassId(undefined)}
            >
              {t('close')}
            </Button>
          )}
        </View>
      </ScrollView>
      <QueryBlock
        query={query}
        prefix="incomplete"
      >
        {query.data?.incomplete.map((item) => {
          const session = item.session,
            name = classes.data?.classes.find(
              (value) => value.id === session.classId
            )?.name;
          const days = Math.floor(
            (Date.parse(
              `${isoDate(session.asOf).split('/').reverse().join('-')}T00:00:00Z`
            ) -
              Date.parse(
                `${isoDate(session.endsAt).split('/').reverse().join('-')}T00:00:00Z`
              )) /
              86400000
          );
          return (
            <Pressable
              key={item.id}
              testID={`incomplete-row-${item.id}`}
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate('SessionContext', {
                  sessionId: item.id,
                  initialTab: 'attendance',
                  ...(name ? { classTitle: name } : {}),
                })
              }
            >
              <Card className="mx-space-0 p-space-16 gap-space-8">
                {name && (
                  <Text
                    testID={`incomplete-row-class-${item.id}`}
                    className="text-size-15 font-bvp-semibold"
                  >
                    {name}
                  </Text>
                )}
                <Text>{session.title}</Text>
                <Text className="text-size-13 text-mdy-secondary">
                  {isoDate(session.startsAt)} · {isoTime(session.startsAt)}–
                  {isoTime(session.endsAt)}
                </Text>
                <Chip
                  variant={
                    item.issue === 'OVERDUE_NOT_STARTED' ? 'warning' : 'danger'
                  }
                >
                  {t(`issue.${item.issue}`)}
                </Chip>
                <Text className="text-size-12 text-mdy-secondary">
                  {session.effectiveMentor ?? t('mentorMissing')}
                </Text>
                <Text className="text-size-12">
                  {days === 0 ? t('today') : t('daysAgo', { count: days })}
                </Text>
                {item.deadlineExpired !== null && (
                  <Text
                    testID={`incomplete-row-deadline-${item.id}`}
                    className="text-size-12 text-mdy-secondary"
                  >
                    {t(item.deadlineExpired ? 'deadlineExpired' : 'expires', {
                      deadline: `${isoTime(session.editableUntil)} ${isoDate(session.editableUntil)}`,
                    })}
                  </Text>
                )}
              </Card>
            </Pressable>
          );
        })}
        {query.data?.total === 0 && (
          <View
            testID={
              issue || classId ? 'incomplete-empty-filter' : 'incomplete-empty'
            }
            className="py-space-24 gap-space-12"
          >
            <Text>
              {t(
                issue || classId ? 'incomplete.emptyFilter' : 'incomplete.empty'
              )}
            </Text>
            {(issue || classId) && (
              <Button
                testID="incomplete-clear-filters"
                onPress={clear}
              >
                {t('incomplete.clearFilters')}
              </Button>
            )}
          </View>
        )}
        <More
          query={query}
          count={query.data?.incomplete.length ?? 0}
          prefix="incomplete"
        />
      </QueryBlock>
      {pick && (
        <Sheet
          testID="incomplete-class-sheet"
          title={t('class')}
          onClose={() => setPick(false)}
        >
          <Field
            id="incomplete-class-search"
            label={t('search')}
            value={search}
            onChange={setSearch}
            multiline={false}
          />
          <QueryBlock
            query={classes}
            prefix="incomplete-classes"
          >
            <ScrollView
              className="max-h-[300px]"
              contentContainerClassName="gap-space-8"
            >
              {classes.data?.classes
                .filter((item) =>
                  item.name
                    .toLocaleLowerCase()
                    .includes(search.toLocaleLowerCase())
                )
                .map((item) => (
                  <Button
                    key={item.id}
                    testID={`incomplete-class-option-${item.id}`}
                    variant="secondary"
                    onPress={() => {
                      setClassId(item.id);
                      setPick(false);
                    }}
                  >
                    {item.name}
                  </Button>
                ))}
            </ScrollView>
          </QueryBlock>
        </Sheet>
      )}
    </Page>
  );
}
