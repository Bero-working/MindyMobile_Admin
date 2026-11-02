import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PropsWithChildren,
} from 'react';
import {
  BackHandler,
  Keyboard,
  FlatList,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import {
  useNavigation,
  usePreventRemove,
  type NavigationAction,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'react-native-calendars';
import {
  Alert,
  BrandHeader,
  Button,
  Card,
  Chip,
  Icon,
  Sheet,
  Text,
  type IconName,
} from '@/components/ui/primitives';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useMindyTheme } from '@/components/ui/theme';
import { Field } from '@/modules/attendance';
import { parseVietnamTime } from '@/modules/attendance/model';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { cn } from '@/utils/cn';
import { useQuiz } from './QuizProvider';
import { formatScore } from './model';
import type { ReadState } from './hooks';
import type { Question, Quiz, Scenario } from './types';
import './messages';

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: 20, paddingHorizontal: 16, paddingVertical: 28 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
const scenarios: Scenario[] = [
  'success',
  'loading',
  'empty',
  'offline',
  'error',
  'refreshError',
  'denied',
  'notFound',
  'conflict',
  'uncertain',
  'closed',
];
export function QuizPage<T extends { key: string }>({
  prefix,
  title,
  subtitle,
  onBack,
  children,
  footer,
  data = [],
  renderRow,
  dirty = false,
  busy = false,
  beforeBack,
  refresh,
}: PropsWithChildren<{
  prefix: string;
  title: string;
  subtitle?: string | undefined;
  onBack: () => void;
  footer?: ReactNode;
  data?: T[];
  renderRow?: (item: T, index: number) => ReactNode;
  dirty?: boolean;
  busy?: boolean;
  beforeBack?: (() => boolean) | undefined;
  refresh?: (() => Promise<object | undefined>) | undefined;
}>) {
  const { t } = useTranslation('quiz');
  const { colors, variables } = useMindyTheme();
  const { scenario, setScenario, mock } = useQuiz();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [review, setReview] = useState(false),
    [leave, setLeave] = useState(false),
    [leaving, setLeaving] = useState(false);
  const action = useRef<NavigationAction | undefined>(undefined);
  usePreventRemove(!leaving && (dirty || busy), (event) => {
    if (busy) return;
    if (beforeBack?.()) return;
    action.current = event.data.action;
    setLeave(true);
  });
  useEffect(() => {
    if (leaving) {
      if (action.current) navigation.dispatch(action.current);
      else onBack();
    }
  }, [leaving]);
  const back = () => {
    if (busy || beforeBack?.()) return;
    if (dirty) setLeave(true);
    else onBack();
  };
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (Keyboard.isVisible()) return false;
      if (busy || beforeBack?.() || dirty) {
        if (!busy && !beforeBack) setLeave(true);
        return true;
      }
      return false;
    });
    return () => listener.remove();
  }, [busy, dirty, beforeBack]);
  return (
    <KeyboardAvoidingView
      testID={`${prefix}-screen`}
      className="flex-1 bg-mdy-bg"
      style={variables}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BrandHeader subpage>
        <View className="flex-row items-center gap-space-12">
          <Button
            testID={`${prefix}-back`}
            variant="text"
            size="sm"
            className="px-space-8"
            onPress={back}
            accessibilityLabel={t('back')}
          >
            <Icon
              name="arrow_back"
              color={colors.onBrand}
            />
          </Button>
          <View className="flex-1">
            <Text
              accessibilityRole="header"
              className="text-size-18 font-bvp-semibold text-mdy-onBrand"
            >
              {title}
            </Text>
            {subtitle && (
              <Text className="text-size-13 text-mdy-onBrandMuted">
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </BrandHeader>
      <FlatList<T>
        className="-mt-space-28 rounded-tl-radius-28 rounded-tr-radius-28 bg-mdy-bg"
        refreshControl={
          refresh ? (
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                refresh();
              }}
            />
          ) : undefined
        }
        data={data}
        keyExtractor={(item) => item.key}
        renderItem={({ item, index }) => (
          <View className="mb-space-12">{renderRow?.(item, index)}</View>
        )}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        ListHeaderComponent={
          <View className="gap-space-16">
            {mock && (
              <Button
                testID="quiz-mock-badge"
                variant="text"
                size="sm"
                onPress={() => setReview(true)}
              >
                {t('mock')}
              </Button>
            )}
            {children}
          </View>
        }
      />
      {footer && (
        <View
          testID={`${prefix}-save-bar`}
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: colors.surface,
              borderTopColor: colors.divider,
            },
          ]}
        >
          {footer}
        </View>
      )}
      {review && (
        <Sheet
          testID="quiz-review"
          title={t('review')}
          onClose={() => setReview(false)}
        >
          <ScrollView
            className="max-h-[360px]"
            contentContainerClassName="gap-space-8"
          >
            {scenarios.map((s) => (
              <Button
                key={s}
                testID={`quiz-scenario-${s}`}
                variant={s === scenario ? 'primary' : 'secondary'}
                onPress={() => {
                  setScenario(s);
                  setReview(false);
                }}
              >
                {s}
              </Button>
            ))}
          </ScrollView>
        </Sheet>
      )}
      {leave && (
        <ConfirmationDialog
          testID="quiz-leave-dialog"
          title={t('leaveTitle')}
          icon="warning"
          onClose={() => setLeave(false)}
        >
          <Text>{t('leaveBody')}</Text>
          <Button
            testID="quiz-leave-stay"
            onPress={() => setLeave(false)}
          >
            {t('keepEditing')}
          </Button>
          <Button
            testID="quiz-leave-discard"
            variant="danger"
            onPress={() => {
              setLeave(false);
              setLeaving(true);
            }}
          >
            {t('discard')}
          </Button>
        </ConfirmationDialog>
      )}
    </KeyboardAvoidingView>
  );
}
export function QuizSection({
  title,
  testID,
  children,
}: PropsWithChildren<{ title?: string; testID?: string }>) {
  return (
    <Card
      {...(testID ? { testID } : {})}
      className="mx-space-0 px-space-20 py-space-24"
    >
      {title && (
        <Text
          accessibilityRole="header"
          className="text-size-15 font-bvp-semibold"
        >
          {title}
        </Text>
      )}
      {children}
    </Card>
  );
}
export function QuizHint({
  testID,
  icon = 'info',
  children,
}: {
  testID?: string;
  icon?: IconName;
  children: string;
}) {
  return (
    <View
      {...(testID ? { testID } : {})}
      className="flex-row gap-space-8"
    >
      <Icon
        name={icon}
        size={16}
      />
      <Text className="flex-1 text-size-12 leading-line-18 text-mdy-secondary">
        {children}
      </Text>
    </View>
  );
}
export function OptionBadge({
  label,
  correct = false,
}: {
  label: string;
  correct?: boolean;
}) {
  return (
    <View
      className={cn(
        'h-space-28 w-space-28 items-center justify-center rounded-radius-14',
        correct ? 'bg-mdy-surface' : 'bg-mdy-muted'
      )}
    >
      <Text
        className={cn(
          'text-size-12 font-bvp-semibold',
          correct ? 'text-mdy-success' : 'text-mdy-secondary'
        )}
      >
        {label}
      </Text>
    </View>
  );
}
export function QuestionReadView({
  question,
  index,
  showAnswer,
}: {
  question: Question;
  index: number;
  showAnswer: boolean;
}) {
  const { t } = useTranslation('quiz');
  const { colors } = useMindyTheme();
  const id = question.id ?? question.key;
  return (
    <Card
      testID={`quiz-detail-question-${id}`}
      className="mx-space-0 gap-space-14 px-space-20 py-space-20"
    >
      <Text
        accessibilityRole="header"
        className="font-bvp-semibold"
      >{`${index + 1}. ${question.prompt}`}</Text>
      {question.options.map((option) => {
        const correct = showAnswer && option.label === question.correctOption;
        return (
          <View
            key={option.label}
            className={cn(
              'flex-row gap-space-10 rounded-radius-12 p-space-8',
              correct && 'bg-mdy-successBg'
            )}
          >
            <OptionBadge
              label={option.label}
              correct={correct}
            />
            <View className="flex-1 gap-space-4">
              <Text>{option.text}</Text>
              {correct && (
                <View className="flex-row items-center gap-space-4">
                  <Icon
                    name="check_circle"
                    size={16}
                    color={colors.success}
                  />
                  <Text
                    testID={`quiz-detail-correct-${id}`}
                    className="text-size-12 font-bvp-semibold text-mdy-success"
                  >
                    {t('correct')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </Card>
  );
}
function ConfigLine({
  icon,
  testID,
  children,
  strong = false,
}: {
  icon: IconName;
  testID?: string;
  children: string;
  strong?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-space-8">
      <Icon
        name={icon}
        size={16}
      />
      <Text
        {...(testID ? { testID } : {})}
        className={cn(
          'flex-1 text-size-13',
          strong ? 'font-bvp-medium' : 'text-mdy-secondary'
        )}
      >
        {children}
      </Text>
    </View>
  );
}
export function QuizEmpty({
  testID,
  text,
  children,
}: PropsWithChildren<{ testID: string; text: string }>) {
  const { colors } = useMindyTheme();
  return (
    <View
      testID={testID}
      className="items-center gap-space-12 py-space-32"
    >
      <View className="h-space-56 w-space-56 items-center justify-center rounded-radius-28 bg-mdy-tint2">
        <Icon
          name="edit_note"
          size={26}
          color={colors.primary}
        />
      </View>
      <Text className="text-center text-size-14 text-mdy-secondary">
        {text}
      </Text>
      {children}
    </View>
  );
}
export function QuizGate({
  prefix,
  children,
  missing = false,
  read,
}: PropsWithChildren<{
  prefix: string;
  missing?: boolean;
  read?: ReadState<object> | undefined;
}>) {
  const { t } = useTranslation('quiz');
  const { state } = useAuth();
  const { scenario, setScenario } = useQuiz();
  if (state.user?.role !== 'MENTOR' || scenario === 'denied')
    return <Alert testID={`${prefix}-denied`}>{t('denied')}</Alert>;
  if (read && !read.data) {
    if (read.error)
      return (
        <View className="gap-space-8">
          <Alert
            testID={`${prefix}-${read.error.kind === 'notFound' ? 'not-found' : read.error.kind}`}
          >
            {t(
              read.error.kind === 'offline' ? 'offlineEmpty' : read.error.kind
            ) + (read.error.requestId ? ` · ${read.error.requestId}` : '')}
          </Alert>
          {!['offline', 'denied', 'notFound'].includes(read.error.kind) && (
            <Button
              testID={`${prefix}-retry`}
              onPress={() => {
                read.refresh();
              }}
            >
              {t('retry')}
            </Button>
          )}
        </View>
      );
    return (
      <View testID={`${prefix}-skeleton`}>
        <Skeleton label={t('loading')}>
          <View className="h-space-120 bg-mdy-muted2" />
        </Skeleton>
      </View>
    );
  }
  if (scenario === 'notFound' || missing)
    return <Alert testID={`${prefix}-not-found`}>{t('notFound')}</Alert>;
  if (scenario === 'loading')
    return (
      <View
        testID={`${prefix}-skeleton`}
        className="gap-space-12"
      >
        {[0, 1, 2].map((key) => (
          <Skeleton
            key={key}
            label={t('loading')}
          >
            <View className="h-space-80 rounded-radius-14 bg-mdy-muted2" />
          </Skeleton>
        ))}
      </View>
    );
  if (scenario === 'error')
    return (
      <Card
        testID={`${prefix}-error`}
        className="mx-space-0"
      >
        <Text>{t('error')}</Text>
        <Button
          testID={`${prefix}-retry`}
          onPress={() => setScenario('success')}
        >
          {t('retry')}
        </Button>
      </Card>
    );
  return (
    <>
      {children}
      {read?.error && read.error.kind !== 'offline' && (
        <View>
          <Alert
            testID={`${prefix}-refresh-error`}
            warning
          >
            {t('refreshError') +
              (read.error.requestId ? ` · ${read.error.requestId}` : '')}
          </Alert>
          <Button
            onPress={() => {
              read.refresh();
            }}
          >
            {t('retry')}
          </Button>
        </View>
      )}
      {scenario === 'offline' && (
        <Alert
          warning
          testID={`${prefix}-offline`}
        >
          {t('stale')}
        </Alert>
      )}
      {scenario === 'refreshError' && (
        <View>
          <Alert
            warning
            testID={`${prefix}-refresh-error`}
          >
            {t('refreshError')}
          </Alert>
          <Button onPress={() => setScenario('success')}>{t('retry')}</Button>
        </View>
      )}
    </>
  );
}
export function ConfigLines({
  item,
  prefix,
  attempts = false,
}: {
  item: Quiz;
  prefix: string;
  attempts?: boolean;
}) {
  const { t, i18n } = useTranslation('quiz');
  const time = item.dueAt ? formatInstant(item.dueAt, i18n.language) : '';
  return (
    <View className="gap-space-6">
      <ConfigLine
        icon="task_alt"
        testID={`${prefix}-score`}
        strong
      >
        {t('points', { score: formatScore(item.maxScore, i18n.language) })}
      </ConfigLine>
      <ConfigLine
        icon="schedule"
        testID={`${prefix}-limit`}
      >
        {item.timeLimitMinutes === null
          ? t('noLimit')
          : t('minutes', { count: item.timeLimitMinutes })}
      </ConfigLine>
      <ConfigLine
        icon="calendar_month"
        testID={`${prefix}-due`}
      >
        {item.dueAt ? t('due', { time }) : t('noDue')}
      </ConfigLine>
      {attempts && <ConfigLine icon="person">{t('oneAttempt')}</ConfigLine>}
    </View>
  );
}
export function QuizChips({ item, prefix }: { item: Quiz; prefix: string }) {
  const { t } = useTranslation('quiz');
  return (
    <View className="flex-row flex-wrap gap-space-8">
      <Chip
        testID={`${prefix}-status`}
        variant={item.status === 'PUBLISHED' ? 'success' : 'neutral'}
      >
        {t(item.status)}
      </Chip>
      <Chip
        testID={`${prefix}-purpose`}
        variant="neutral"
      >
        {t(item.purpose)}
      </Chip>
    </View>
  );
}
export function formatInstant(value: string, language: string): string {
  return new Intl.DateTimeFormat(
    language.startsWith('vi') ? 'vi-VN' : 'en-GB',
    {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    }
  ).format(new Date(value));
}
export function DueFields({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  error?: string | undefined;
}) {
  const { t } = useTranslation('quiz');
  const { colors } = useMindyTheme();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(''),
    [hour, setHour] = useState('18:00');
  useEffect(() => {
    if (value && Number.isFinite(Date.parse(value))) {
      const local = new Date(
        Date.parse(value) + 7 * 60 * 60 * 1000
      ).toISOString();
      setDate(local.slice(0, 10));
      setHour(local.slice(11, 16));
    } else if (!value) setDate('');
  }, [value]);
  const change = (d: string, h: string) => {
    const instant = parseVietnamTime(d.split('-').reverse().join('/'), h);
    onChange(instant ?? `${d}T${h}:00+07:00`);
  };
  return (
    <View className="gap-space-8">
      <View className="flex-row gap-space-12">
        <View className="flex-1 gap-space-6">
          <Text className="text-size-13 font-bvp-medium">{t('dueField')}</Text>
          <Button
            testID="quiz-editor-due-date"
            variant="secondary"
            size="sm"
            icon="calendar_month"
            className="justify-start rounded-radius-14 px-space-12"
            disabled={disabled}
            onPress={() => setOpen(true)}
          >
            {date ? date.split('-').reverse().join('/') : t('pickDate')}
          </Button>
        </View>
        {(date || value) && (
          <View className="flex-1">
            <Field
              id="quiz-editor-due-time"
              label={t('hour')}
              value={hour}
              onChange={(v) => {
                setHour(v);
                change(date, v);
              }}
              disabled={disabled}
              multiline={false}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        )}
      </View>
      {(date || value) && (
        <Button
          testID="quiz-editor-due-clear"
          variant="text"
          size="sm"
          className="self-start px-space-0"
          disabled={disabled}
          onPress={() => {
            setDate('');
            onChange('');
          }}
        >
          {t('clearDue')}
        </Button>
      )}
      {error && (
        <Text
          testID="quiz-editor-due-error"
          className="text-mdy-danger"
        >
          {error}
        </Text>
      )}
      {open && (
        <Sheet
          testID="quiz-editor-due-sheet"
          title={t('pickDate')}
          onClose={() => setOpen(false)}
        >
          <Calendar
            {...(date
              ? { current: date, markedDates: { [date]: { selected: true } } }
              : {})}
            firstDay={1}
            theme={{
              calendarBackground: colors.sheet,
              dayTextColor: colors.ink,
              monthTextColor: colors.ink,
              arrowColor: colors.link,
              todayTextColor: colors.link,
              textDisabledColor: colors.tertiary,
              textSectionTitleColor: colors.secondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.onBrand,
            }}
            onDayPress={(day) => {
              setDate(day.dateString);
              change(day.dateString, hour);
              setOpen(false);
            }}
          />
        </Sheet>
      )}
    </View>
  );
}
