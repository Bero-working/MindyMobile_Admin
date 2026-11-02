import { useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useTeachingQuery } from '@/modules/teaching/hooks/useTeachingQuery';
import {
  Filters,
  Footer,
  QueryBlock,
  SkeletonList,
} from '@/modules/teaching/components/shared';
import { MentorClassCard } from '@/modules/teaching/components/rows';
import {
  Alert,
  Button,
  Card,
  Chip,
  Icon,
  Sheet,
  Text,
} from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { cn } from '@/utils/cn';
import { useQuizList } from './hooks';
import { useQuiz } from './QuizProvider';
import {
  ConfigLines,
  QuizChips,
  QuizEmpty,
  QuizGate,
  QuizHint,
  QuizPage,
  formatInstant,
} from './components';
import { canWrite } from './model';
import type { QuizStatus } from './types';

type Navigation = NativeStackScreenProps<
  AuthStackParams,
  'MentorQuizzes'
>['navigation'];

export function QuizListScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'MentorQuizzes'>) {
  return route.params ? (
    <ClassQuizList
      params={route.params}
      navigation={navigation}
    />
  ) : (
    <QuizClassPicker navigation={navigation} />
  );
}

function QuizClassPicker({ navigation }: { navigation: Navigation }) {
  const { t } = useTranslation('quiz');
  const { state } = useAuth();
  const [status, setStatus] = useState('IN_PROGRESS');
  const classes = useTeachingQuery(
    { kind: 'classes', role: 'MENTOR', status, pageSize: 20 },
    state.user?.role === 'MENTOR',
    false
  );
  return (
    <QuizPage
      prefix="quiz-classes"
      title={t('title')}
      subtitle={t('chooseClass')}
      onBack={navigation.goBack}
    >
      <Filters
        prefix="quiz-classes"
        values={['IN_PROGRESS', 'OPEN', 'COMPLETED']}
        value={status}
        onChange={setStatus}
      />
      <QueryBlock
        query={classes}
        prefix="quiz-classes"
        loading={<SkeletonList variant="class" />}
      >
        {classes.data?.classes.map((c) => (
          <MentorClassCard
            key={c.id}
            testID={`quiz-class-${c.id}`}
            item={c}
            onPress={() =>
              navigation.push('MentorQuizzes', {
                classId: c.id,
                classTitle: c.name,
              })
            }
          />
        ))}
        {classes.data?.total === 0 && (
          <QuizEmpty
            testID="quiz-classes-empty"
            text={t('noClasses')}
          />
        )}
        <Footer
          query={classes}
          prefix="quiz-classes"
          count={classes.data?.classes.length ?? 0}
        />
      </QueryBlock>
    </QuizPage>
  );
}

function SessionOption({
  testID,
  title,
  subtitle,
  selected = false,
  disabled = false,
  note,
  onPress,
}: {
  testID?: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  disabled?: boolean;
  note?: string | undefined;
  onPress: () => void;
}) {
  const { colors } = useMindyTheme();
  return (
    <Pressable
      {...(testID ? { testID } : {})}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'min-h-space-56 flex-row items-center gap-space-12 rounded-radius-14 border px-space-12 py-space-10 active:opacity-80',
        selected
          ? 'border-mdy-primary bg-mdy-tint'
          : 'border-mdy-border bg-mdy-surface',
        disabled && 'opacity-50'
      )}
    >
      <Icon
        name="calendar_month"
        size={20}
        color={colors.primary}
      />
      <View className="flex-1 gap-space-2">
        <Text
          numberOfLines={2}
          className="text-size-14 font-bvp-medium"
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-size-12 text-mdy-secondary">{subtitle}</Text>
        )}
      </View>
      {note && <Chip variant="neutral">{note}</Chip>}
      {selected && (
        <Icon
          name="check"
          size={20}
          color={colors.primary}
        />
      )}
    </Pressable>
  );
}

function ClassQuizList({
  params,
  navigation,
}: {
  params: NonNullable<AuthStackParams['MentorQuizzes']>;
  navigation: Navigation;
}) {
  const { t, i18n } = useTranslation('quiz');
  const { state } = useAuth();
  const { height } = useWindowDimensions();
  const { items, scenario, mock } = useQuiz();
  const { classId, sessionId, classTitle, sessionTitle } = params;
  const allowed = state.user?.role === 'MENTOR';
  const cls = useTeachingQuery(
    { kind: 'class', role: 'MENTOR', classId },
    allowed,
    false
  );
  const context = useTeachingQuery(
    { kind: 'context', role: 'MENTOR', ...(sessionId ? { sessionId } : {}) },
    allowed && !!sessionId,
    false
  );
  const sessions = useTeachingQuery(
    { kind: 'sessions', role: 'MENTOR', classId, pageSize: 100 },
    allowed && !sessionId,
    false
  );
  const [status, setStatus] = useState<QuizStatus | ''>(''),
    [filterSession, setFilterSession] = useState(''),
    [picker, setPicker] = useState<'create' | 'filter'>(),
    [page, setPage] = useState(1);
  const live = useQuizList({
    classId,
    ...(sessionId ? { sessionId } : {}),
    ...(filterSession ? { filterSession } : {}),
    status,
  });
  const classInfo = cls.data?.classInfo;
  const denied =
    cls.result?.kind === 'denied' || context.result?.kind === 'denied';
  const notFound =
    cls.result?.kind === 'notFound' || context.result?.kind === 'notFound';
  const writable =
    !!classInfo &&
    canWrite(classInfo.status, context.data?.session?.status) &&
    scenario !== 'closed';
  const offline = scenario === 'offline';
  const lookup = sessions.data?.sessions ?? [];
  // Only UI fixtures are contextualized. This is not a server-scope adapter.
  const contextual = items.map((q) => ({
    ...q,
    key: q.id,
    sessionId: q.sessionId.startsWith('mock-session-')
      ? (sessionId ??
        lookup[q.sessionId.endsWith('2') ? 1 : 0]?.id ??
        q.sessionId)
      : q.sessionId,
  }));
  const filtered =
    scenario === 'empty'
      ? []
      : contextual.filter(
          (q) =>
            (!status || q.status === status) &&
            (!sessionId || q.sessionId === sessionId) &&
            (!filterSession || q.sessionId === filterSession)
        );
  const readable =
    allowed &&
    !denied &&
    !notFound &&
    !['loading', 'error', 'denied', 'notFound'].includes(scenario) &&
    (mock || !!live.data);
  const show = mock
    ? filtered.slice(0, page * 20)
    : (live.data?.items ?? []).map((q) => ({ ...q, key: q.id }));
  const total = mock ? filtered.length : (live.data?.total ?? 0);
  const create = () => {
    const id = sessionId ?? filterSession;
    if (id)
      navigation.navigate('QuizEditor', {
        classId,
        sessionId: id,
        ...(sessionTitle ? { sessionTitle } : {}),
      });
    else setPicker('create');
  };
  return (
    <QuizPage
      prefix="quiz-list"
      title={t(sessionId ? 'sessionTitle' : 'title')}
      subtitle={sessionTitle ?? classTitle}
      onBack={navigation.goBack}
      refresh={mock ? undefined : live.refresh}
      data={readable ? show : []}
      renderRow={(item) => (
        <Pressable
          testID={`quiz-list-row-${item.id}`}
          accessibilityRole="button"
          onPress={() =>
            navigation.navigate('QuizDetail', {
              classId,
              assignmentId: item.id,
            })
          }
        >
          <Card className="mx-space-0 gap-space-12 px-space-20 py-space-20">
            <View className="flex-row items-start gap-space-8">
              <Text
                numberOfLines={2}
                className="flex-1 text-size-15 font-bvp-semibold"
              >
                {item.title}
              </Text>
              <Icon
                name="chevron_right"
                size={20}
              />
            </View>
            <QuizChips
              item={item}
              prefix={`quiz-list-row-${item.id}`}
            />
            {!sessionId && lookup.find((s) => s.id === item.sessionId) && (
              <Text
                testID={`quiz-list-row-${item.id}-session`}
                numberOfLines={1}
                className="text-size-13 text-mdy-secondary"
              >
                {lookup.find((s) => s.id === item.sessionId)?.title}
              </Text>
            )}
            <ConfigLines
              item={item}
              prefix={`quiz-list-row-${item.id}`}
            />
          </Card>
        </Pressable>
      )}
      footer={
        readable && total > show.length ? (
          <Button
            testID="quiz-list-more"
            disabled={offline || live.loadingMore}
            variant="text"
            busy={live.loadingMore}
            onPress={() => {
              if (mock) setPage((p) => p + 1);
              else live.more();
            }}
          >
            {t('more')}
          </Button>
        ) : undefined
      }
    >
      {denied || notFound ? (
        <Alert testID={`quiz-list-${denied ? 'denied' : 'not-found'}`}>
          {t(denied ? 'denied' : 'notFound')}
        </Alert>
      ) : (
        <QuizGate
          prefix="quiz-list"
          read={mock ? undefined : live}
        >
          {writable ? (
            <Button
              testID="quiz-list-create"
              icon="add"
              disabled={offline}
              onPress={create}
            >
              {t('create')}
            </Button>
          ) : (
            classInfo && (
              <Alert
                warning
                testID="quiz-list-readonly"
              >
                {t('closed')}
              </Alert>
            )
          )}
          {classInfo?.scope === 'SESSION' && (
            <QuizHint testID="quiz-list-substitute">{t('substitute')}</QuizHint>
          )}
          <Filters
            prefix="quiz-list"
            values={['', 'DRAFT', 'PUBLISHED', 'ARCHIVED']}
            value={status}
            onChange={(value) => {
              setStatus(value as QuizStatus | '');
              setPage(1);
            }}
            labelFor={(value) => t(value || 'all')}
          />
          {!sessionId && (
            <View className="flex-row items-center gap-space-8">
              <Pressable
                testID="quiz-list-session"
                accessibilityRole="button"
                onPress={() => setPicker('filter')}
                className="shrink min-h-space-44 flex-row items-center gap-space-6 rounded-radius-99 border border-mdy-border bg-mdy-surface px-space-16 active:opacity-80"
              >
                <Icon
                  name="calendar_month"
                  size={16}
                />
                <Text
                  numberOfLines={1}
                  className="shrink text-size-13 text-mdy-link"
                >
                  {lookup.find((s) => s.id === filterSession)?.title ??
                    t('allSessions')}
                </Text>
                <Icon
                  name="expand_more"
                  size={16}
                />
              </Pressable>
              {!!filterSession && (
                <Pressable
                  testID="quiz-list-session-clear"
                  accessibilityRole="button"
                  accessibilityLabel={t('showAll')}
                  onPress={() => {
                    setFilterSession('');
                    setPage(1);
                  }}
                  className="h-space-44 w-space-44 items-center justify-center active:opacity-80"
                >
                  <Icon
                    name="close"
                    size={18}
                  />
                </Pressable>
              )}
            </View>
          )}
          <Text
            testID="quiz-list-count"
            className="text-size-13 text-mdy-secondary"
          >
            {t('count', { count: total })}
          </Text>
          {total === 0 && (
            <QuizEmpty
              testID={
                status || filterSession
                  ? 'quiz-list-empty-filter'
                  : 'quiz-list-empty'
              }
              text={t(status || filterSession ? 'emptyFilter' : 'empty')}
            >
              {!!(status || filterSession) && (
                <Button
                  testID="quiz-list-show-all"
                  variant="text"
                  size="sm"
                  onPress={() => {
                    setStatus('');
                    setFilterSession('');
                    setPage(1);
                  }}
                >
                  {t('showAll')}
                </Button>
              )}
            </QuizEmpty>
          )}
          {live.footerError && !offline && (
            <Alert
              testID="quiz-list-more-error"
              warning
            >
              {t('error')}
            </Alert>
          )}
          {offline && <Text>{t('needOnline')}</Text>}
        </QuizGate>
      )}
      {picker && (
        <Sheet
          testID="quiz-list-session-sheet"
          title={t(picker === 'create' ? 'pickSession' : 'allSessions')}
          onClose={() => setPicker(undefined)}
        >
          {!sessions.data && (
            <Text>{t(sessions.result ? 'contextError' : 'loading')}</Text>
          )}
          <ScrollView
            testID="quiz-list-session-scroll"
            style={{ maxHeight: height * 0.6 }}
            contentContainerClassName="gap-space-8"
          >
            {picker === 'filter' && (
              <SessionOption
                title={t('allSessions')}
                selected={!filterSession}
                onPress={() => {
                  setFilterSession('');
                  setPage(1);
                  setPicker(undefined);
                }}
              />
            )}
            {lookup.map((s) => (
              <SessionOption
                key={s.id}
                testID={`quiz-list-session-${s.id}`}
                title={s.title}
                subtitle={formatInstant(s.startsAt, i18n.language)}
                selected={picker === 'filter' && filterSession === s.id}
                note={
                  s.status === 'CANCELLED' ? t('sessionCancelled') : undefined
                }
                disabled={
                  picker === 'create' && (s.status === 'CANCELLED' || offline)
                }
                onPress={() => {
                  if (picker === 'create')
                    navigation.navigate('QuizEditor', {
                      classId,
                      sessionId: s.id,
                      sessionTitle: s.title,
                    });
                  else {
                    setFilterSession(s.id);
                    setPage(1);
                  }
                  setPicker(undefined);
                }}
              />
            ))}
            {lookup.length < (sessions.data?.total ?? 0) && (
              <Button
                variant="text"
                size="sm"
                busy={sessions.busy}
                disabled={sessions.busy || offline}
                onPress={() => sessions.more()}
              >
                {t('more')}
              </Button>
            )}
          </ScrollView>
        </Sheet>
      )}
    </QuizPage>
  );
}
