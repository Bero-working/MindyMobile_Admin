import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useTeachingQuery } from '@/modules/teaching/hooks/useTeachingQuery';
import { Field } from '@/modules/attendance';
import {
  Alert,
  Button,
  Card,
  Chip,
  Icon,
  Row,
  Sheet,
  Text,
} from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { cn } from '@/utils/cn';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useQuizDetail } from './hooks';
import { QuizError } from './service';
import { useQuiz, type MockCommand } from './QuizProvider';
import {
  DueFields,
  OptionBadge,
  QuizGate,
  QuizHint,
  QuizPage,
  QuizSection,
} from './components';
import { pickQuestionFile, QuizImportError } from './importFile';
import {
  parseQuestionFile,
  type ImportFatal,
  type ImportIssue,
} from './importParser';
import {
  canWrite,
  labels,
  metadataOf,
  moveQuestion,
  newQuestion,
  validateMetadata,
  validateQuestion,
} from './model';
import type { Metadata, Question, Quiz } from './types';

const initial: Metadata = {
  title: '',
  description: '',
  purpose: '',
  maxScore: '10',
  dueAt: '',
  timeLimit: '',
};
const equal = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);
const sampleCsv = `question,A,B,C,D,correct
"2 + 2 = ?",3,4,5,6,B`;
const sampleTxt = `Câu 1: 2 + 2 = ?
A. 3
B. 4
C. 5
D. 6
Đáp án: B`;
export function QuizEditorScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'QuizEditor'>) {
  const { t } = useTranslation('quiz');
  const { state, notify } = useAuth();
  const { colors } = useMindyTheme();
  const store = useQuiz();
  const { classId, sessionId, sessionTitle } = route.params;
  const live = useQuizDetail(route.params.assignmentId);
  const existing = store.mock
    ? store.items.find((q) => q.id === route.params.assignmentId)
    : live.data;
  const [saved, setSaved] = useState<Quiz | undefined>(existing),
    [metadata, setMetadata] = useState<Metadata>(
      existing ? metadataOf(existing) : initial
    ),
    [questions, setQuestions] = useState<Question[]>(existing?.questions ?? []);
  const [tab, setTab] = useState<'info' | 'questions'>(
      route.params.initialTab ?? 'info'
    ),
    [question, setQuestion] = useState<Question>(),
    [questionIndex, setQuestionIndex] = useState(-1),
    [menu, setMenu] = useState<number>(),
    [deleteIndex, setDeleteIndex] = useState<number>(),
    [discardQuestion, setDiscardQuestion] = useState(false),
    [reload, setReload] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [questionErrors, setQuestionErrors] = useState<Record<string, string>>({}),
    [problem, setProblem] = useState(''),
    [busy, setBusy] = useState(false),
    [intent, setIntent] = useState<MockCommand>(),
    [candidates, setCandidates] = useState<Quiz[]>([]);
  const [retryAllowed, setRetryAllowed] = useState(false),
    [checkedCreate, setCheckedCreate] = useState(false),
    [newDraftConfirm, setNewDraftConfirm] = useState(false);
  const [importing, setImporting] = useState(false),
    [importProblem, setImportProblem] = useState<ImportFatal>(),
    [importFormat, setImportFormat] = useState(false),
    [imported, setImported] = useState<{
      name: string;
      questions: Question[];
      issues: ImportIssue[];
    }>();
  const localSequence = useRef(0),
    leaveAllowed = useRef(false);
  const cls = useTeachingQuery(
    { kind: 'class', role: 'MENTOR', classId },
    state.user?.role === 'MENTOR',
    false
  );
  const context = useTeachingQuery(
    { kind: 'context', role: 'MENTOR', sessionId },
    state.user?.role === 'MENTOR' && !sessionId.startsWith('mock-'),
    false
  );
  const fatal =
    state.user?.role !== 'MENTOR' ||
    problem === 'denied' ||
    ['denied', 'notFound'].includes(store.scenario) ||
    cls.result?.kind === 'denied' ||
    context.result?.kind === 'denied' ||
    live.error?.kind === 'denied';
  const mismatch =
    context.data?.session &&
    !sessionId.startsWith('mock-') &&
    (context.data.session.id !== sessionId ||
      context.data.session.classId !== classId);
  const closed =
    store.scenario === 'closed' ||
    problem === 'closed' ||
    (!!cls.data?.classInfo &&
      !canWrite(cls.data.classInfo.status, context.data?.session?.status));
  const offline = store.scenario === 'offline';
  const missing =
    problem === 'notFound' ||
    (!!route.params.assignmentId &&
      (store.mock ? !existing : live.error?.kind === 'notFound'));
  const frozen = saved && saved.status !== 'DRAFT';
  const editable = !busy && !intent && !closed && !frozen && !fatal;
  const infoDirty = !equal(metadata, saved ? metadataOf(saved) : initial);
  const questionsDirty = !equal(questions, saved?.questions ?? []);
  const dirty = infoDirty || questionsDirty || !!question;
  const visible =
    !fatal &&
    !mismatch &&
    !missing &&
    !['loading', 'error', 'notFound'].includes(store.scenario) &&
    (store.mock || !route.params.assignmentId || !!live.data);
  useEffect(() => {
    if (existing && !saved && !fatal && !missing) {
      setSaved(existing);
      setMetadata(metadataOf(existing));
      setQuestions(existing.questions ?? []);
    }
  }, [existing, saved, fatal, missing]);
  useEffect(() => {
    if (fatal) {
      setMetadata(initial);
      setQuestions([]);
      setQuestion(undefined);
      setSaved(undefined);
      setIntent(undefined);
      setCandidates([]);
      setImported(undefined);
    }
  }, [fatal]);
  const accept = (quiz: Quiz, kind: MockCommand['kind']) => {
    setSaved(quiz);
    if (kind === 'create' || kind === 'metadata') setMetadata(metadataOf(quiz));
    if (kind === 'create' || kind === 'questions')
      setQuestions(quiz.questions ?? []);
    if (kind === 'create') setTab('questions');
    setIntent(undefined);
    setProblem('');
    notify(t(kind === 'create' ? 'created' : 'saved'));
  };
  const send = async () => {
    if (!editable || offline || !cls.data?.classInfo) return;
    const info = !saved || tab === 'info';
    if (info) {
      const invalid = validateMetadata(metadata, !saved);
      setErrors(invalid);
      if (Object.keys(invalid).length) return;
    }
    if (!info && !questions.length) return;
    const command: MockCommand = !saved
      ? { kind: 'create', sessionId, metadata }
      : tab === 'info'
        ? { kind: 'metadata', id: saved.id, revision: saved.revision, metadata }
        : {
            kind: 'questions',
            id: saved.id,
            revision: saved.revision,
            questions,
          };
    setBusy(true);
    setProblem('');
    try {
      const result = await store.execute(command);
      if (result.kind === 'uncertain') {
        setRetryAllowed(false);
        setCheckedCreate(false);
        setIntent(command);
      } else if (result.kind === 'error') setProblem(result.code);
      else if (result.quiz) accept(result.quiz, command.kind);
    } finally {
      setBusy(false);
    }
  };
  const beginQuestion = (index: number) => {
    setQuestionIndex(index);
    setQuestion(
      index < 0
        ? newQuestion(`local-${++localSequence.current}`)
        : (JSON.parse(JSON.stringify(questions[index])) as Question)
    );
    setQuestionErrors({});
  };
  const doneQuestion = (next = false) => {
    if (!question) return;
    const invalid = validateQuestion(question);
    setQuestionErrors(invalid);
    if (Object.keys(invalid).length) return;
    const clean = {
      ...question,
      prompt: question.prompt.trim(),
      options: question.options.map((o) => ({ ...o, text: o.text.trim() })),
    };
    const updated =
      questionIndex < 0
        ? [...questions, clean]
        : questions.map((q, i) => (i === questionIndex ? clean : q));
    setQuestions(updated);
    setQuestion(undefined);
    if (next && updated.length < 200) {
      setQuestion(newQuestion(`local-${++localSequence.current}`));
      setQuestionIndex(-1);
      setQuestionErrors({});
    }
  };
  const chooseImport = async () => {
    if (!editable || importing) return;
    setImportProblem(undefined);
    setImporting(true);
    try {
      const file = await pickQuestionFile();
      if (!file) return;
      const result = parseQuestionFile(
        file.name,
        file.content,
        () => `local-${++localSequence.current}`
      );
      if ('fatal' in result) setImportProblem(result.fatal);
      else setImported({ name: file.name, ...result });
    } catch (e) {
      setImportProblem(
        e instanceof QuizImportError ? e.code : 'importUnreadable'
      );
    } finally {
      setImporting(false);
    }
  };
  const check = async () => {
    if (!intent || busy) return;
    setBusy(true);
    try {
      if (intent.kind === 'create') {
        let rows = store.items;
        if (!store.mock) {
          try {
            rows = (
              await store.fetchList({
                classId,
                sessionId,
                pageSize: 100,
                status: 'DRAFT',
              })
            ).items;
          } catch {
            setProblem('error');
            return;
          }
        }
        setCheckedCreate(true);
        setCandidates(
          rows.filter(
            (q) =>
              q.sessionId === sessionId &&
              q.status === 'DRAFT' &&
              q.title === intent.metadata.title.trim()
          )
        );
        return;
      }
      let latest;
      try {
        latest =
          'id' in intent
            ? store.mock
              ? store.read(intent.id)
              : await store.fetchDetail(intent.id)
            : undefined;
      } catch (e) {
        setProblem(
          e instanceof QuizError && e.kind === 'notFound' ? 'notFound' : 'error'
        );
        return;
      }
      if (!latest) {
        setProblem('notFound');
        return;
      }
      const contentMatches =
        intent.kind === 'metadata'
          ? equal(metadataOf(latest), {
              ...intent.metadata,
              title: intent.metadata.title.trim(),
              maxScore: latest.maxScore,
            })
          : intent.kind === 'questions'
            ? equal(
                (latest.questions ?? []).map((q) => ({
                  prompt: q.prompt,
                  options: q.options,
                  correctOption: q.correctOption,
                })),
                intent.questions.map((q) => ({
                  prompt: q.prompt,
                  options: q.options,
                  correctOption: q.correctOption,
                }))
              )
            : false;
      if (contentMatches && latest.revision > intent.revision)
        accept(latest, intent.kind);
      else if (latest.revision === intent.revision && latest.status === 'DRAFT')
        setRetryAllowed(true);
      else {
        setIntent(undefined);
        setProblem('conflict');
      }
    } finally {
      setBusy(false);
    }
  };
  const resend = async () => {
    if (!intent || !retryAllowed || busy || offline || intent.kind === 'create')
      return;
    setBusy(true);
    setRetryAllowed(false);
    try {
      const result = await store.execute(intent);
      if (result.kind === 'success' && result.quiz)
        accept(result.quiz, intent.kind);
      else if (result.kind === 'error') {
        setProblem(result.code);
        setIntent(undefined);
      }
    } finally {
      setBusy(false);
    }
  };
  const openCandidate = async (quiz: Quiz) => {
    setBusy(true);
    try {
      const detail = store.mock
        ? store.read(quiz.id)
        : await store.fetchDetail(quiz.id);
      if (detail) {
        accept(detail, 'create');
        setCandidates([]);
      }
    } catch {
      setProblem('error');
    } finally {
      setBusy(false);
    }
  };
  const reloadLatest = async () => {
    let latest;
    try {
      latest = saved
        ? store.mock
          ? store.read(saved.id)
          : await store.fetchDetail(saved.id)
        : undefined;
    } catch (e) {
      setProblem(
        e instanceof QuizError && e.kind === 'notFound' ? 'notFound' : 'error'
      );
      setReload(false);
      return;
    }
    if (latest) {
      setSaved(latest);
      setMetadata(metadataOf(latest));
      setQuestions(latest.questions ?? []);
      setQuestion(undefined);
      setProblem('');
      setIntent(undefined);
    } else setProblem('notFound');
    setReload(false);
  };
  const change = (key: keyof Metadata, value: string) =>
    setMetadata((old) => ({ ...old, [key]: value }));
  const preview = () => {
    if (!saved || dirty) return;
    leaveAllowed.current = true;
    navigation.replace('QuizDetail', { classId, assignmentId: saved.id });
  };
  const beforeBack = question
    ? () => {
        setDiscardQuestion(true);
        return true;
      }
    : undefined;
  const ready = editable && !offline && !!cls.data?.classInfo && !mismatch;
  return (
    <QuizPage
      prefix="quiz-editor"
      title={
        question
          ? t('questionTitle', {
              number:
                questionIndex < 0 ? questions.length + 1 : questionIndex + 1,
              count:
                questionIndex < 0 ? questions.length + 1 : questions.length,
            })
          : t(saved ? 'editTitle' : 'createTitle')
      }
      subtitle={sessionTitle}
      onBack={navigation.goBack}
      dirty={!leaveAllowed.current && !fatal && !closed && dirty}
      busy={busy}
      beforeBack={beforeBack}
      data={
        visible && saved && tab === 'questions' && !question ? questions : []
      }
      renderRow={(q, index) => (
        <Card className="mx-space-0 px-space-16 py-space-16">
          <View className="flex-row items-start gap-space-4">
            <Pressable
              testID={`quiz-editor-question-${q.key}`}
              accessibilityRole="button"
              disabled={!editable}
              onPress={() => beginQuestion(index)}
              className="flex-1 flex-row gap-space-10 active:opacity-80"
            >
              <OptionBadge label={String(index + 1)} />
              <View className="flex-1 gap-space-6">
                <Text numberOfLines={2}>{q.prompt}</Text>
                <Chip variant="success">
                  {t('correctIs', { label: q.correctOption })}
                </Chip>
              </View>
            </Pressable>
            <Pressable
              testID={`quiz-editor-question-menu-${q.key}`}
              accessibilityRole="button"
              accessibilityLabel={t('questionMenu', { number: index + 1 })}
              disabled={!editable}
              onPress={() => setMenu(index)}
              className="h-space-44 w-space-44 items-center justify-center active:opacity-80"
            >
              <Icon
                name="more_vert"
                size={20}
              />
            </Pressable>
          </View>
        </Card>
      )}
      footer={
        visible && !frozen && !closed ? (
          <>
            {(infoDirty || questionsDirty) && (
              <Text
                testID="quiz-editor-unsaved"
                className="text-size-12 leading-line-18 text-mdy-warning"
              >
                {t(
                  questionsDirty && questions.length >= 10
                    ? 'unsavedMany'
                    : 'unsaved',
                  { count: questions.length }
                )}
              </Text>
            )}
            {offline && (
              <Text className="text-size-12 text-mdy-secondary">
                {t('needOnline')}
              </Text>
            )}
            {question ? (
              <View className="flex-row gap-space-8">
                {questions.length < 199 && (
                  <Button
                    testID="quiz-question-next"
                    variant="secondary"
                    className="flex-1 px-space-12"
                    disabled={!editable}
                    onPress={() => doneQuestion(true)}
                  >
                    {t('nextQuestion')}
                  </Button>
                )}
                <Button
                  testID="quiz-question-done"
                  className="flex-1"
                  disabled={!editable}
                  onPress={() => doneQuestion()}
                >
                  {t('done')}
                </Button>
              </View>
            ) : (
              <>
                <Button
                  testID={
                    saved
                      ? tab === 'info'
                        ? 'quiz-editor-save-info'
                        : 'quiz-editor-save-questions'
                      : 'quiz-editor-create'
                  }
                  busy={busy}
                  disabled={
                    !ready ||
                    (!!saved &&
                      (tab === 'info'
                        ? !infoDirty
                        : !questionsDirty || !questions.length))
                  }
                  onPress={send}
                >
                  {t(
                    !saved
                      ? 'createDraft'
                      : tab === 'info'
                        ? 'saveInfo'
                        : 'saveQuestions'
                  )}
                </Button>
                {saved && (
                  <Button
                    testID="quiz-editor-preview"
                    variant="text"
                    size="sm"
                    disabled={dirty || busy || !!intent || offline}
                    onPress={preview}
                  >
                    {t(dirty ? 'saveBeforeReview' : 'preview')}
                  </Button>
                )}
              </>
            )}
          </>
        ) : undefined
      }
    >
      {fatal || mismatch ? (
        <Alert testID="quiz-editor-denied">{t('denied')}</Alert>
      ) : (
        <QuizGate
          prefix="quiz-editor"
          missing={missing}
          read={!store.mock && route.params.assignmentId ? live : undefined}
        >
          {frozen ? (
            <>
              <Alert testID="quiz-editor-frozen">{t('frozen')}</Alert>
              <Button
                onPress={() => {
                  if (saved)
                    navigation.replace('QuizDetail', {
                      classId,
                      assignmentId: saved.id,
                    });
                }}
              >
                {t('detailTitle')}
              </Button>
            </>
          ) : (
            <>
              {closed && (
                <Alert testID="quiz-editor-closed">{t('closed')}</Alert>
              )}
              {saved && !question && (
                <View className="flex-row gap-space-4 rounded-radius-16 bg-mdy-muted p-space-4">
                  {(['info', 'questions'] as const).map((value) => (
                    <Pressable
                      key={value}
                      testID={`quiz-editor-tab-${value}`}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: tab === value }}
                      onPress={() => setTab(value)}
                      className={cn(
                        'min-h-space-44 flex-1 items-center justify-center rounded-radius-12 px-space-8',
                        tab === value && 'bg-mdy-surface'
                      )}
                    >
                      <Text
                        className={cn(
                          'text-size-14 font-bvp-semibold',
                          tab === value ? 'text-mdy-ink' : 'text-mdy-secondary'
                        )}
                      >
                        {t(value) +
                          (value === 'questions'
                            ? ` (${questions.length})`
                            : '')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {!!problem && (
                <View
                  testID={
                    problem === 'conflict'
                      ? 'quiz-editor-conflict'
                      : 'quiz-editor-error'
                  }
                  className="gap-space-8"
                >
                  <Alert
                    testID="quiz-editor-problem"
                    warning
                  >
                    {t(problem)}
                  </Alert>
                  {problem === 'conflict' && (
                    <Button
                      testID="quiz-editor-reload"
                      variant="text"
                      onPress={() => setReload(true)}
                    >
                      {t('reload')}
                    </Button>
                  )}
                </View>
              )}
              {intent && (
                <View
                  testID="quiz-editor-intent"
                  className="gap-space-8"
                >
                  <Alert
                    testID="quiz-editor-uncertain"
                    warning
                  >
                    {t('uncertain')}
                  </Alert>
                  {!offline && (
                    <Button
                      testID="quiz-editor-check"
                      onPress={check}
                    >
                      {t('check')}
                    </Button>
                  )}
                  {retryAllowed && !offline && (
                    <Button
                      testID="quiz-editor-resend"
                      disabled={busy}
                      onPress={resend}
                    >
                      {t('resend')}
                    </Button>
                  )}
                  {checkedCreate && <Text>{t('maybeCreated')}</Text>}
                  {checkedCreate && !offline && (
                    <Button
                      testID="quiz-editor-new-draft"
                      variant="text"
                      disabled={busy}
                      onPress={() => setNewDraftConfirm(true)}
                    >
                      {t('createNew')}
                    </Button>
                  )}
                  {candidates.map((q) => (
                    <Button
                      key={q.id}
                      disabled={busy}
                      onPress={() => {
                        openCandidate(q);
                      }}
                    >
                      {q.title + ' · ' + t('edit')}
                    </Button>
                  ))}
                </View>
              )}
              {question ? (
                <QuizSection>
                  <Field
                    id="quiz-question-prompt"
                    label={t('prompt')}
                    value={question.prompt}
                    onChange={(value) =>
                      setQuestion({ ...question, prompt: value })
                    }
                    max={5000}
                    multiline
                    disabled={!editable}
                    error={
                      questionErrors.prompt
                        ? t(questionErrors.prompt)
                        : undefined
                    }
                  />
                  <QuizHint>{t('chooseCorrect')}</QuizHint>
                  {labels.map((label) => (
                    <View
                      key={label}
                      className={cn(
                        'gap-space-6 rounded-radius-14 border p-space-16',
                        question.correctOption === label
                          ? 'border-mdy-primary bg-mdy-tint'
                          : 'border-mdy-border'
                      )}
                    >
                      <Field
                        compact
                        id={`quiz-question-option-${label}`}
                        label={t('option', { label })}
                        value={
                          question.options.find((o) => o.label === label)
                            ?.text ?? ''
                        }
                        onChange={(text) =>
                          setQuestion({
                            ...question,
                            options: question.options.map((o) =>
                              o.label === label ? { ...o, text } : o
                            ),
                          })
                        }
                        max={2000}
                        multiline
                        disabled={!editable}
                        error={
                          questionErrors[label]
                            ? t(questionErrors[label])
                            : undefined
                        }
                      />
                      <Pressable
                        testID={`quiz-question-correct-${label}`}
                        accessibilityRole="radio"
                        accessibilityState={{
                          checked: question.correctOption === label,
                          disabled: !editable,
                        }}
                        accessibilityLabel={`${label} · ${t('correct')}`}
                        disabled={!editable}
                        onPress={() =>
                          setQuestion({ ...question, correctOption: label })
                        }
                        className="min-h-space-44 flex-row items-center gap-space-8 active:opacity-80"
                      >
                        <Icon
                          name={
                            question.correctOption === label
                              ? 'radio_button_checked'
                              : 'radio_button_unchecked'
                          }
                          size={22}
                          color={
                            question.correctOption === label
                              ? colors.primary
                              : colors.secondary
                          }
                        />
                        <Text
                          className={cn(
                            'text-size-13',
                            question.correctOption === label
                              ? 'font-bvp-semibold text-mdy-link'
                              : 'text-mdy-secondary'
                          )}
                        >
                          {t(
                            question.correctOption === label
                              ? 'correct'
                              : 'markCorrect'
                          )}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                  {questionErrors.correctOption && (
                    <Text
                      testID="quiz-question-correct-error"
                      className="text-mdy-danger"
                    >
                      {t('correctRequired')}
                    </Text>
                  )}
                  <QuizHint>{t('memory')}</QuizHint>
                </QuizSection>
              ) : !saved || tab === 'info' ? (
                <>
                  <QuizSection title={t('sectionGeneral')}>
                    <Field
                      id="quiz-editor-title"
                      multiline={false}
                      label={t('titleField')}
                      value={metadata.title}
                      onChange={(v) => change('title', v)}
                      max={250}
                      disabled={!editable}
                      error={errors.title ? t(errors.title) : undefined}
                    />
                    <Field
                      id="quiz-editor-description"
                      label={t('description')}
                      value={metadata.description}
                      onChange={(v) => change('description', v)}
                      max={20000}
                      multiline
                      disabled={!editable}
                      error={
                        errors.description ? t(errors.description) : undefined
                      }
                    />
                  </QuizSection>
                  <QuizSection title={t('sectionGrading')}>
                    <View className="gap-space-6">
                      <Text className="text-size-13 font-bvp-medium">
                        {t('purpose')}
                      </Text>
                      <View className="flex-row gap-space-8">
                        {(['TEST', 'HOMEWORK'] as const).map((purpose) => (
                          <Pressable
                            key={purpose}
                            testID={`quiz-editor-purpose-${purpose}`}
                            accessibilityRole="radio"
                            accessibilityState={{
                              checked: metadata.purpose === purpose,
                              disabled: !!saved || !editable,
                            }}
                            disabled={!!saved || !editable}
                            onPress={() => change('purpose', purpose)}
                            className={cn(
                              'min-h-space-52 flex-1 flex-row items-center gap-space-8 rounded-radius-14 border px-space-12',
                              metadata.purpose === purpose
                                ? 'border-mdy-primary bg-mdy-tint'
                                : 'border-mdy-border bg-mdy-surface',
                              (!!saved || !editable) && 'opacity-60'
                            )}
                          >
                            <Icon
                              name={
                                metadata.purpose === purpose
                                  ? 'radio_button_checked'
                                  : 'radio_button_unchecked'
                              }
                              size={20}
                              color={
                                metadata.purpose === purpose
                                  ? colors.primary
                                  : colors.secondary
                              }
                            />
                            <Text className="shrink text-size-14 font-bvp-medium">
                              {t(purpose)}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    {errors.purpose && (
                      <Text
                        testID="quiz-editor-purpose-error"
                        className="text-mdy-danger"
                      >
                        {t(errors.purpose)}
                      </Text>
                    )}
                    <Field
                      id="quiz-editor-score"
                      multiline={false}
                      label={t('score')}
                      value={metadata.maxScore}
                      onChange={(v) => change('maxScore', v)}
                      keyboardType="decimal-pad"
                      disabled={!!saved || !editable}
                      error={errors.maxScore ? t(errors.maxScore) : undefined}
                    />
                    <QuizHint
                      testID="quiz-editor-locked-config"
                      icon="lock"
                    >
                      {t('lockedConfig')}
                    </QuizHint>
                  </QuizSection>
                  <QuizSection title={t('sectionTime')}>
                    <DueFields
                      value={metadata.dueAt}
                      onChange={(v) => change('dueAt', v)}
                      disabled={!editable}
                      error={errors.dueAt ? t(errors.dueAt) : undefined}
                    />
                    <Field
                      id="quiz-editor-time-limit"
                      multiline={false}
                      label={t('timeLimit')}
                      value={metadata.timeLimit}
                      onChange={(v) => change('timeLimit', v)}
                      keyboardType="number-pad"
                      disabled={!editable}
                      error={errors.timeLimit ? t(errors.timeLimit) : undefined}
                    />
                    <QuizHint>{t('timerHint')}</QuizHint>
                    {!!metadata.dueAt &&
                      Date.parse(metadata.dueAt) <
                        (store.api?.now() ?? Date.now()) && (
                        <Alert
                          testID="quiz-editor-due-warning"
                          warning
                        >
                          {t('duePast')}
                        </Alert>
                      )}
                  </QuizSection>
                  <QuizHint>{t('memory')}</QuizHint>
                </>
              ) : (
                <QuizSection title={t('sectionAdd')}>
                  {!questions.length && (
                    <Text
                      testID="quiz-editor-no-questions"
                      className="text-size-13 text-mdy-secondary"
                    >
                      {`${t('noQuestions')} ${t('needOne')}`}
                    </Text>
                  )}
                  {questions.length < 200 ? (
                    <>
                      <View className="flex-row gap-space-8">
                        <Button
                          testID="quiz-editor-add-question"
                          icon="add"
                          size="sm"
                          className="flex-1 px-space-8"
                          disabled={!editable || importing}
                          onPress={() => beginQuestion(-1)}
                        >
                          {t('addQuestion')}
                        </Button>
                        <Button
                          testID="quiz-editor-import"
                          variant="secondary"
                          icon="upload_file"
                          size="sm"
                          className="flex-1 px-space-8"
                          busy={importing}
                          disabled={!editable}
                          onPress={() => {
                            chooseImport();
                          }}
                        >
                          {t('importFile')}
                        </Button>
                      </View>
                      {importProblem && (
                        <Alert testID="quiz-import-error">
                          {t(importProblem)}
                        </Alert>
                      )}
                      <Button
                        testID="quiz-import-format-toggle"
                        variant="text"
                        size="sm"
                        className="self-start px-space-0"
                        onPress={() => setImportFormat((v) => !v)}
                      >
                        {t(
                          importFormat ? 'importFormatHide' : 'importFormatShow'
                        )}
                      </Button>
                      {importFormat && (
                        <View
                          testID="quiz-import-format"
                          className="gap-space-8"
                        >
                          <Text className="text-size-13 text-mdy-secondary">
                            {t('importFormatIntro')}
                          </Text>
                          {(
                            [
                              ['importFormatCsv', sampleCsv],
                              ['importFormatTxt', sampleTxt],
                            ] as const
                          ).map(([title, sample]) => (
                            <View
                              key={title}
                              className="gap-space-4"
                            >
                              <Text className="text-size-13 font-bvp-medium">
                                {t(title)}
                              </Text>
                              <View className="rounded-radius-12 bg-mdy-muted p-space-12">
                                <Text className="text-size-12 leading-line-18">
                                  {sample}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <Text>{t('maxQuestions')}</Text>
                  )}
                  <QuizHint>{t('memory')}</QuizHint>
                </QuizSection>
              )}
            </>
          )}
        </QuizGate>
      )}
      {menu !== undefined && (
        <Sheet
          testID="quiz-question-menu"
          title={t('questionMenu', { number: menu + 1 })}
          onClose={() => setMenu(undefined)}
        >
          <View>
            <Row
              compact
              chevron={false}
              icon="edit"
              testID="quiz-question-edit"
              label={t('edit')}
              onPress={() => {
                beginQuestion(menu);
                setMenu(undefined);
              }}
            />
            {menu > 0 && (
              <Row
                compact
                chevron={false}
                icon="arrow_upward"
                testID="quiz-question-move-up"
                label={t('moveUp')}
                onPress={() => {
                  setQuestions((old) => moveQuestion(old, menu, -1));
                  setMenu(undefined);
                }}
              />
            )}
            {menu < questions.length - 1 && (
              <Row
                compact
                chevron={false}
                icon="arrow_downward"
                testID="quiz-question-move-down"
                label={t('moveDown')}
                onPress={() => {
                  setQuestions((old) => moveQuestion(old, menu, 1));
                  setMenu(undefined);
                }}
              />
            )}
            <Row
              compact
              chevron={false}
              danger
              icon="delete"
              testID="quiz-question-delete"
              label={t('remove')}
              onPress={() => {
                setDeleteIndex(menu);
                setMenu(undefined);
              }}
            />
          </View>
        </Sheet>
      )}
      {imported && !fatal && (
        <Sheet
          testID="quiz-import-preview"
          title={t('importPreviewTitle')}
          onClose={() => setImported(undefined)}
        >
          <Text
            numberOfLines={1}
            className="text-size-13 text-mdy-secondary"
          >
            {imported.name}
          </Text>
          <Text testID="quiz-import-found">
            {t(imported.questions.length ? 'importFound' : 'importNothing', {
              count: imported.questions.length,
            })}
          </Text>
          {!!imported.issues.length && (
            <View
              testID="quiz-import-issues"
              className="gap-space-4"
            >
              <Text className="text-size-13 font-bvp-medium text-mdy-warning">
                {t('importSkipped', { count: imported.issues.length })}
              </Text>
              {imported.issues.slice(0, 5).map((issue) => (
                <Text
                  key={issue.line}
                  className="text-size-12 leading-line-18 text-mdy-secondary"
                >
                  {t('importLine', {
                    line: issue.line,
                    reason: t(issue.code),
                  })}
                </Text>
              ))}
              {imported.issues.length > 5 && (
                <Text className="text-size-12 text-mdy-secondary">
                  {t('importMoreIssues', {
                    count: imported.issues.length - 5,
                  })}
                </Text>
              )}
            </View>
          )}
          {questions.length + imported.questions.length > 200 ? (
            <Alert testID="quiz-import-over-limit">
              {t('importOverLimit', { current: questions.length })}
            </Alert>
          ) : (
            !!imported.questions.length && (
              <QuizHint>{t('importAppendHint')}</QuizHint>
            )
          )}
          <Button
            testID="quiz-import-confirm"
            disabled={
              !imported.questions.length ||
              questions.length + imported.questions.length > 200
            }
            onPress={() => {
              setQuestions((old) => [...old, ...imported.questions]);
              setImported(undefined);
            }}
          >
            {t('importConfirm', { count: imported.questions.length })}
          </Button>
          <Button
            testID="quiz-import-cancel"
            variant="text"
            size="sm"
            onPress={() => setImported(undefined)}
          >
            {t('cancel')}
          </Button>
        </Sheet>
      )}
      {deleteIndex !== undefined && (
        <ConfirmationDialog
          testID="quiz-question-delete-dialog"
          title={t('deleteQuestion', { number: deleteIndex + 1 })}
          icon="warning"
          onClose={() => setDeleteIndex(undefined)}
        >
          <Button
            variant="text"
            onPress={() => setDeleteIndex(undefined)}
          >
            {t('cancel')}
          </Button>
          <Button
            testID="quiz-question-delete-confirm"
            variant="danger"
            onPress={() => {
              setQuestions((old) => old.filter((_, i) => i !== deleteIndex));
              setDeleteIndex(undefined);
            }}
          >
            {t('remove')}
          </Button>
        </ConfirmationDialog>
      )}
      {discardQuestion && (
        <ConfirmationDialog
          testID="quiz-question-discard-dialog"
          title={t('questionLeave')}
          icon="warning"
          onClose={() => setDiscardQuestion(false)}
        >
          <Button
            testID="quiz-question-discard-stay"
            onPress={() => setDiscardQuestion(false)}
          >
            {t('keepEditing')}
          </Button>
          <Button
            testID="quiz-question-discard-confirm"
            variant="danger"
            onPress={() => {
              setQuestion(undefined);
              setDiscardQuestion(false);
            }}
          >
            {t('discard')}
          </Button>
        </ConfirmationDialog>
      )}
      {newDraftConfirm && (
        <ConfirmationDialog
          testID="quiz-new-draft-dialog"
          title={t('createNew')}
          icon="warning"
          onClose={() => setNewDraftConfirm(false)}
        >
          <Text>{t('duplicateWarning')}</Text>
          <Button onPress={() => setNewDraftConfirm(false)}>
            {t('cancel')}
          </Button>
          <Button
            testID="quiz-new-draft-confirm"
            onPress={() => {
              setIntent(undefined);
              setCheckedCreate(false);
              setCandidates([]);
              setNewDraftConfirm(false);
            }}
          >
            {t('confirm')}
          </Button>
        </ConfirmationDialog>
      )}
      {reload && (
        <ConfirmationDialog
          testID="quiz-editor-reload-dialog"
          title={t('reload')}
          icon="warning"
          onClose={() => setReload(false)}
        >
          <Text>{t('leaveBody')}</Text>
          <Button onPress={() => setReload(false)}>{t('cancel')}</Button>
          <Button
            testID="quiz-editor-reload-confirm"
            variant="danger"
            onPress={() => {
              reloadLatest();
            }}
          >
            {t('reload')}
          </Button>
        </ConfirmationDialog>
      )}
    </QuizPage>
  );
}
