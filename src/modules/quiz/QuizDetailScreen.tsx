import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useTeachingQuery } from '@/modules/teaching/hooks/useTeachingQuery';
import { Field } from '@/modules/attendance';
import { Alert, Button, Sheet, Text } from '@/components/ui/primitives';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useQuiz, type MockCommand } from './QuizProvider';
import { useQuizDetail } from './hooks';
import { QuizError } from './service';
import { canWrite } from './model';
import {
  ConfigLines,
  QuestionReadView,
  QuizChips,
  QuizEmpty,
  QuizGate,
  QuizHint,
  QuizPage,
  QuizSection,
  formatInstant,
} from './components';

export function QuizDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'QuizDetail'>) {
  const { t, i18n } = useTranslation('quiz');
  const { state, notify } = useAuth();
  const store = useQuiz();
  const { assignmentId, classId } = route.params;
  const live = useQuizDetail(assignmentId);
  const item = store.mock
    ? store.items.find((q) => q.id === assignmentId)
    : live.data;
  const cls = useTeachingQuery(
    { kind: 'class', role: 'MENTOR', classId },
    state.user?.role === 'MENTOR',
    false
  );
  const context = useTeachingQuery(
    { kind: 'context', role: 'MENTOR', sessionId: item?.sessionId ?? '' },
    state.user?.role === 'MENTOR' &&
      !!item &&
      !item.sessionId.startsWith('mock-'),
    false
  );
  const [showAnswers, setShowAnswers] = useState(item?.status === 'DRAFT'),
    [expanded, setExpanded] = useState(false);
  const [dialog, setDialog] = useState<'publish' | 'archive' | 'delete'>(),
    [reason, setReason] = useState(''),
    [reasonError, setReasonError] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [intent, setIntent] = useState<MockCommand>();
  const [retryAllowed, setRetryAllowed] = useState(false);
  useEffect(
    () => setShowAnswers(item?.status === 'DRAFT'),
    [item?.id, item?.status]
  );
  const fatal =
    state.user?.role !== 'MENTOR' ||
    error === 'denied' ||
    (!!context.data?.session && context.data.session.classId !== classId) ||
    cls.result?.kind === 'denied' ||
    context.result?.kind === 'denied';
  const missing =
    cls.result?.kind === 'notFound' || context.result?.kind === 'notFound';
  const visible =
    item &&
    !fatal &&
    !missing &&
    !['denied', 'notFound', 'loading', 'error'].includes(store.scenario);
  const offline = store.scenario === 'offline';
  const closed =
    store.scenario === 'closed' ||
    error === 'closed' ||
    (cls.data?.classInfo &&
      !canWrite(cls.data.classInfo.status, context.data?.session?.status));
  const blocked = busy || offline || !!intent;
  const edit = (tab: 'info' | 'questions') => {
    if (item)
      navigation.navigate('QuizEditor', {
        classId,
        sessionId: item.sessionId,
        assignmentId,
        initialTab: tab,
      });
  };
  const send = async () => {
    if (!item || !dialog || blocked) return;
    if (
      dialog === 'archive' &&
      (!reason.trim() || reason.trim().length > 2000)
    ) {
      setReasonError(true);
      return;
    }
    const command: MockCommand = {
      kind: dialog,
      id: item.id,
      revision: item.revision,
      ...(dialog === 'archive' ? { reason: reason.trim() } : {}),
    };
    setBusy(true);
    setError('');
    try {
      const result = await store.execute(command);
      setDialog(undefined);
      if (result.kind === 'uncertain') {
        setRetryAllowed(false);
        setIntent(command);
      } else if (result.kind === 'error') {
        setError(result.code);
        if (
          !store.mock &&
          [
            'conflict',
            'frozen',
            'stateConflict',
            'notFound',
            'denied',
          ].includes(result.code)
        )
          await live.refresh();
      } else {
        if (!store.mock && dialog !== 'delete') await live.refresh();
        notify(
          t(
            dialog === 'delete'
              ? 'deleted'
              : dialog === 'publish'
                ? 'published'
                : 'archived'
          )
        );
        if (dialog === 'delete') navigation.goBack();
      }
    } finally {
      setBusy(false);
    }
  };
  const check = async () => {
    if (!intent || !('id' in intent)) return;
    setBusy(true);
    let latest;
    try {
      latest = store.mock
        ? store.read(intent.id)
        : await store.fetchDetail(intent.id);
    } catch (e) {
      if (
        !(
          e instanceof QuizError &&
          e.kind === 'notFound' &&
          intent.kind === 'delete'
        )
      ) {
        setError('error');
        setBusy(false);
        return;
      }
    }
    if (!store.mock && latest) await live.refresh();
    setBusy(false);
    if (
      (intent.kind === 'delete' && !latest) ||
      (intent.kind === 'publish' && latest?.status === 'PUBLISHED') ||
      (intent.kind === 'archive' && latest?.status === 'ARCHIVED')
    ) {
      setIntent(undefined);
      notify(t('saved'));
      if (intent.kind === 'delete') navigation.goBack();
    } else if (
      latest?.revision === intent.revision &&
      ((intent.kind === 'publish' && latest.status === 'DRAFT') ||
        (intent.kind === 'archive' && latest.status === 'PUBLISHED') ||
        (intent.kind === 'delete' && latest.status === 'DRAFT'))
    ) {
      setRetryAllowed(true);
    } else {
      setIntent(undefined);
      setError('conflict');
    }
  };
  const resend = async () => {
    if (!intent || !retryAllowed || busy || offline) return;
    setBusy(true);
    setRetryAllowed(false);
    try {
      const result = await store.execute(intent);
      if (result.kind === 'success') {
        setIntent(undefined);
        notify(t('saved'));
        if (intent.kind === 'delete') navigation.goBack();
        else if (!store.mock) await live.refresh();
      } else if (result.kind === 'error') {
        setIntent(undefined);
        setError(result.code);
        if (!store.mock) await live.refresh();
      }
    } finally {
      setBusy(false);
    }
  };
  const longDescription =
    (item?.description.length ?? 0) > 180 ||
    (item?.description.split('\n').length ?? 0) > 4;
  const duePast =
    item?.status === 'DRAFT' &&
    !!item.dueAt &&
    Date.parse(item.dueAt) <= (store.api?.now() ?? Date.now());
  return (
    <QuizPage
      prefix="quiz-detail"
      title={t('detailTitle')}
      onBack={navigation.goBack}
      refresh={store.mock ? undefined : live.refresh}
      busy={busy}
      dirty={!!intent}
      data={visible ? (item.questions ?? []) : []}
      renderRow={(q, index) => (
        <QuestionReadView
          question={q}
          index={index}
          showAnswer={showAnswers}
        />
      )}
      footer={
        visible && !closed && item.status !== 'ARCHIVED' ? (
          <>
            {offline && <Text>{t('needOnline')}</Text>}
            {item.status === 'DRAFT' ? (
              <>
                {!item.questions?.length && (
                  <Text className="text-center text-size-12 text-mdy-secondary">
                    {t('needOne')}
                  </Text>
                )}
                <Button
                  testID="quiz-detail-publish"
                  disabled={blocked || !item.questions?.length}
                  onPress={() => setDialog('publish')}
                >
                  {t('publish')}
                </Button>
                <View className="flex-row gap-space-8">
                  <Button
                    testID="quiz-detail-edit"
                    variant="secondary"
                    size="sm"
                    icon="edit"
                    className="flex-1"
                    disabled={blocked}
                    onPress={() => edit('info')}
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    testID="quiz-detail-delete"
                    variant="danger"
                    size="sm"
                    icon="delete"
                    className="flex-1"
                    disabled={blocked}
                    onPress={() => setDialog('delete')}
                  >
                    {t('deleteDraft')}
                  </Button>
                </View>
              </>
            ) : (
              <Button
                testID="quiz-detail-archive"
                variant="danger"
                disabled={blocked}
                onPress={() => setDialog('archive')}
              >
                {t('archive')}
              </Button>
            )}
          </>
        ) : undefined
      }
    >
      {fatal || missing ? (
        <Alert testID={`quiz-detail-${fatal ? 'denied' : 'not-found'}`}>
          {t(fatal ? 'denied' : 'notFound')}
        </Alert>
      ) : (
        <QuizGate
          prefix="quiz-detail"
          missing={store.mock && !item && !intent}
          read={store.mock ? undefined : live}
        >
          {item && (
            <>
              <QuizSection>
                <Text
                  testID="quiz-detail-title"
                  className="text-size-17 font-bvp-semibold"
                >
                  {item.title}
                </Text>
                <QuizChips
                  item={item}
                  prefix="quiz-detail"
                />
                <ConfigLines
                  item={item}
                  prefix="quiz-detail"
                  attempts
                />
                {item.publishedAt && (
                  <Text
                    testID="quiz-detail-published-at"
                    className="text-size-13 text-mdy-secondary"
                  >
                    {t('publishedAt', {
                      time: formatInstant(item.publishedAt, i18n.language),
                    })}
                  </Text>
                )}
                {!!item.description && (
                  <View className="gap-space-4 border-t border-mdy-divider pt-space-12">
                    <Text
                      testID="quiz-detail-description"
                      numberOfLines={expanded ? undefined : 4}
                    >
                      {item.description}
                    </Text>
                    {longDescription && (
                      <Button
                        variant="text"
                        size="sm"
                        className="self-start px-space-0"
                        onPress={() => setExpanded((v) => !v)}
                      >
                        {t(expanded ? 'collapse' : 'expand')}
                      </Button>
                    )}
                  </View>
                )}
              </QuizSection>
              {closed && (
                <Alert
                  warning
                  testID="quiz-detail-closed"
                >
                  {t('closed')}
                </Alert>
              )}
              {duePast && (
                <View className="gap-space-4">
                  <Alert
                    warning
                    testID="quiz-detail-due-warning"
                  >
                    {t('duePast')}
                  </Alert>
                  <Button
                    testID="quiz-detail-fix-due"
                    variant="text"
                    size="sm"
                    className="self-start"
                    disabled={blocked || !!closed}
                    onPress={() => edit('info')}
                  >
                    {t('fixDue')}
                  </Button>
                </View>
              )}
              {item.status === 'ARCHIVED' && (
                <QuizHint testID="quiz-detail-archived-note">
                  {t('archivedNote')}
                </QuizHint>
              )}
              {item.status !== 'DRAFT' && (
                <QuizHint testID="quiz-detail-no-results">
                  {t('noResults')}
                </QuizHint>
              )}
              <View className="min-h-space-44 flex-row items-center justify-between gap-space-8">
                <Text
                  testID="quiz-detail-count"
                  accessibilityRole="header"
                  className="text-size-15 font-bvp-semibold"
                >
                  {t('questionsCount', { count: item.questions?.length ?? 0 })}
                </Text>
                {!!item.questions?.length && (
                  <Button
                    testID="quiz-detail-toggle-answers"
                    accessibilityRole="switch"
                    accessibilityState={{ checked: showAnswers }}
                    variant="text"
                    size="sm"
                    icon={showAnswers ? 'visibility_off' : 'visibility'}
                    className="px-space-8"
                    onPress={() => setShowAnswers((v) => !v)}
                  >
                    {t(showAnswers ? 'hideAnswers' : 'showAnswers')}
                  </Button>
                )}
              </View>
              {item.questions?.length === 0 && (
                <QuizEmpty
                  testID="quiz-detail-no-questions"
                  text={t('noQuestions')}
                >
                  {item.status === 'DRAFT' && !closed && (
                    <Button
                      testID="quiz-detail-compose"
                      variant="secondary"
                      size="sm"
                      icon="add"
                      disabled={blocked}
                      onPress={() => edit('questions')}
                    >
                      {t('addQuestion')}
                    </Button>
                  )}
                </QuizEmpty>
              )}
            </>
          )}
          {!!error && <Alert testID="quiz-detail-error">{t(error)}</Alert>}
        </QuizGate>
      )}
      {intent && (
        <View
          testID="quiz-detail-intent"
          className="gap-space-8"
        >
          <Alert
            testID="quiz-detail-uncertain"
            warning
          >
            {t('uncertain')}
          </Alert>
          {!offline && (
            <Button
              testID="quiz-detail-check"
              disabled={busy}
              onPress={check}
            >
              {t('check')}
            </Button>
          )}
          {retryAllowed && !offline && (
            <Button
              testID="quiz-detail-resend"
              disabled={busy}
              onPress={resend}
            >
              {t('resend')}
            </Button>
          )}
        </View>
      )}
      {dialog === 'archive' && (
        <Sheet
          testID="quiz-detail-archive-sheet"
          title={t('archiveTitle')}
          onClose={() => {
            if (!busy) setDialog(undefined);
          }}
        >
          <Text>{t('archiveBody')}</Text>
          <Field
            id="quiz-detail-archive-reason"
            label={t('reason')}
            value={reason}
            onChange={setReason}
            max={2000}
            disabled={busy}
            multiline
          />
          {reasonError && (
            <Text
              testID="quiz-detail-reason-error"
              className="text-mdy-danger"
            >
              {t('reasonRequired')}
            </Text>
          )}
          <Button
            testID="quiz-detail-archive-confirm"
            busy={busy}
            disabled={blocked}
            variant="danger"
            onPress={send}
          >
            {t('archive')}
          </Button>
        </Sheet>
      )}
      {(dialog === 'publish' || dialog === 'delete') && (
        <ConfirmationDialog
          testID={`quiz-detail-${dialog}-dialog`}
          title={t(dialog === 'publish' ? 'publishTitle' : 'deleteDraftTitle')}
          icon="warning"
          busy={busy}
          onClose={() => setDialog(undefined)}
        >
          <Text>{item?.title}</Text>
          {dialog === 'publish' && item && (
            <>
              <Text>
                {t('questionsCount', { count: item.questions?.length ?? 0 })}
              </Text>
              <ConfigLines
                item={item}
                prefix="quiz-publish"
              />
            </>
          )}
          <Text>
            {t(dialog === 'publish' ? 'publishBody' : 'deleteDraftBody')}
          </Text>
          <Button
            variant="text"
            disabled={busy}
            onPress={() => setDialog(undefined)}
          >
            {t('cancel')}
          </Button>
          <Button
            testID={`quiz-detail-${dialog}-confirm`}
            busy={busy}
            disabled={blocked}
            variant={dialog === 'delete' ? 'danger' : 'primary'}
            onPress={send}
          >
            {t(dialog === 'publish' ? 'publish' : 'deleteDraft')}
          </Button>
        </ConfirmationDialog>
      )}
    </QuizPage>
  );
}
