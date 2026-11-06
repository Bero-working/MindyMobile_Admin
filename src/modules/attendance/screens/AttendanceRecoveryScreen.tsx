import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Icon,
  Sheet,
  Text,
} from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import {
  useAttendanceMutation,
  useAttendanceQuery,
  useServerNow,
} from '../hooks';
import {
  admissionBasis,
  isoDate,
  isoTime,
  noteLength,
  parseVietnamTime,
  recoveryRequestBytes,
} from '../model';
import {
  AttendanceRowView,
  Field,
  IntentBanner,
  More,
  MutationError,
  Page,
  QueryBlock,
  SessionHeading,
} from '../components/shared';
import type { AttendanceData, Mark, RecoveryStudent, Intent } from '../types';

type Selection = { student: RecoveryStudent; status?: Mark };
export function AttendanceRecoveryScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'AttendanceRecovery'>) {
  return (
    <AttendanceRecoveryView
      params={route.params}
      onBack={navigation.goBack}
    />
  );
}
export function AttendanceRecoveryView({
  params,
  onBack,
  onSaved,
  detailTabs,
}: {
  params: AuthStackParams['AttendanceRecovery'];
  onBack: () => void;
  onSaved?: () => void;
  detailTabs?: import('../components/shared').SessionDetailTabs;
}) {
  const { t } = useTranslation('attendance'),
    { notify } = useAuth();
  const { colors } = useMindyTheme();
  const { height } = useWindowDimensions();
  const id = params.sessionId;
  const query = useAttendanceQuery({
    kind: 'context',
    role: 'MANAGER',
    sessionId: id,
  });
  const permissions = useAttendanceQuery({
    kind: 'attendance',
    role: 'MANAGER',
    sessionId: id,
    pageSize: 1,
  });
  const session = permissions.data?.session ?? query.data?.session;
  const serverNow = useServerNow(session?.asOf);
  const [saved, setSaved] = useState(false);
  const allowLeave = useRef(false);
  const [date, setDate] = useState(''),
    [start, setStart] = useState(''),
    [end, setEnd] = useState(''),
    [evidence, setEvidence] = useState(''),
    [reason, setReason] = useState('');
  const [picker, setPicker] = useState(!params.enrollmentId),
    [review, setReview] = useState<AttendanceData>(),
    [selected, setSelected] = useState<Record<string, Selection>>({}),
    [search, setSearch] = useState(''),
    [invalid, setInvalid] = useState(false),
    [feedback, setFeedback] = useState(''),
    [noLonger, setNoLonger] = useState(false);
  const evidenceRef = useRef<import('react-native').TextInput>(null),
    reasonRef = useRef<import('react-native').TextInput>(null),
    dateRef = useRef<import('react-native').TextInput>(null);
  const students = useAttendanceQuery(
    {
      kind: 'recoveryStudents',
      role: 'MANAGER',
      sessionId: id,
      ...(session ? { classId: session.classId } : {}),
      pageSize: 100,
    },
    !!session?.permissions.canRecover && (picker || !!params.enrollmentId)
  );
  useEffect(() => {
    const student = students.data?.students.find(
      (item) => item.id === params.enrollmentId
    );
    if (student) setSelected({ [student.id]: { student } });
  }, [students.data, params.enrollmentId]);
  const existing = useAttendanceQuery(
    { kind: 'attendance', role: 'MANAGER', sessionId: id, pageSize: 100 },
    picker && (permissions.data?.totals?.eligible ?? 0) > 0,
    true
  );
  const mutation = useAttendanceMutation();
  const locked = mutation.busy || mutation.uncertain;
  const denied =
    query.result?.kind === 'denied' ||
    permissions.result?.kind === 'denied' ||
    mutation.result?.kind === 'denied';
  const canRecover =
    !!permissions.data?.session?.permissions.canRecover &&
    !!session &&
    Date.parse(session.endsAt) <= Date.parse(session.asOf) &&
    !noLonger;
  useEffect(() => {
    if (session) {
      setDate(isoDate(session.actualStartedAt ?? session.startsAt));
      setStart(isoTime(session.actualStartedAt ?? session.startsAt));
      setEnd(isoTime(session.actualEndedAt ?? session.endsAt));
    }
  }, [
    session?.startsAt,
    session?.endsAt,
    session?.actualStartedAt,
    session?.actualEndedAt,
  ]);
  useEffect(() => {
    if (denied) {
      setEvidence('');
      setReason('');
      setDate('');
      setStart('');
      setEnd('');
      setSelected({});
      setPicker(false);
      setReview(undefined);
    }
  }, [denied]);
  const started = parseVietnamTime(date, start),
    ended = parseVietnamTime(date, end);
  const timeValid =
    !!started &&
    !!ended &&
    Date.parse(ended) > Date.parse(started) &&
    !!session &&
    Date.parse(ended) <= serverNow;
  useEffect(() => {
    if (!started) return;
    setSelected((old) => {
      const kept = Object.fromEntries(
        Object.entries(old).filter(([, entry]) =>
          admissionBasis(
            entry.student.enrollmentStatus,
            entry.student.paymentType,
            entry.student.paidAt,
            started
          )
        )
      );
      return kept;
    });
  }, [started]);
  const entries = Object.values(selected);
  const visibleStudents =
    students.data?.students.filter((student) =>
      (student.name ?? t('nameMissing'))
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase())
    ) ?? [];
  const makeBody = (version = session?.version ?? 0): Omit<Intent, 'key'> => ({
    kind: 'recover',
    sessionId: id,
    role: 'MANAGER',
    expectedVersion: version,
    reason: reason.trim(),
    evidenceNote: evidence.trim(),
    actualStartedAt: session?.actualStartedAt ?? started ?? '',
    actualEndedAt: session?.actualEndedAt ?? ended ?? '',
    recoveryRecords: entries.flatMap((entry) => {
      const basis =
        started &&
        admissionBasis(
          entry.student.enrollmentStatus,
          entry.student.paymentType,
          entry.student.paidAt,
          started
        );
      return basis && entry.status
        ? [
            {
              enrollmentId: entry.student.id,
              status: entry.status,
              admissionBasis: basis,
            },
          ]
        : [];
    }),
  });
  const tooLarge = recoveryRequestBytes(makeBody()) > 256 * 1024;
  const openReview = async () => {
    setInvalid(true);
    if (!timeValid) {
      dateRef.current?.focus();
      return;
    }
    if (!evidence.trim() || noteLength(evidence.trim()) > 2000) {
      evidenceRef.current?.focus();
      return;
    }
    if (!reason.trim() || noteLength(reason.trim()) > 1000) {
      reasonRef.current?.focus();
      return;
    }
    if (!entries.length || entries.some((entry) => !entry.status) || tooLarge)
      return;
    const fresh = await permissions.refresh();
    if (
      fresh?.kind !== 'success' ||
      !fresh.data.session?.permissions.canRecover
    )
      return;
    setReview(fresh.data);
  };
  const submit = async (retry = false) => {
    const body = makeBody(review?.session?.version);
    if (!retry && recoveryRequestBytes(body) > 256 * 1024) return;
    const result = await mutation.submit(body, retry);
    if (result?.kind === 'success') {
      setSelected({});
      setReason('');
      setEvidence('');
      setReview(undefined);
      notify(t('recoveryDone', { count: result.changed }));
      setSaved(true);
      allowLeave.current = true;
      (onSaved ?? onBack)();
    } else if (result?.kind === 'error') {
      if (
        result.code === 'SESSION_VERSION_CONFLICT' ||
        result.code === 'ATTENDANCE_RECOVERY_RECORD_EXISTS'
      ) {
        const fresh = await existing.load(1, false);
        permissions.refresh();
        setReview(undefined);
        if (fresh?.kind === 'success') {
          const keys = new Set(fresh.data.rows.map((r) => r.enrollmentId));
          setSelected((old) =>
            Object.fromEntries(
              Object.entries(old).filter(([key]) => !keys.has(key))
            )
          );
        }
        setFeedback(
          t(
            result.code === 'SESSION_VERSION_CONFLICT'
              ? 'changedReview'
              : 'recordExists'
          )
        );
      } else if (result.code === 'ATTENDANCE_RECOVERY_CLOCK_CONFLICT') {
        await query.refresh();
        await permissions.refresh();
        setReview(undefined);
        setFeedback(t('clockConflict'));
      } else if (result.code === 'SESSION_STATE_CONFLICT') {
        setNoLonger(true);
        setReview(undefined);
      }
    }
  };
  const pick = (student: RecoveryStudent) => {
    setSelected({ [student.id]: { student } });
    setPicker(false);
  };
  const formatTime = (value: string) =>
    value
      .replace(/[^\d:]/g, '')
      .replace(/^(\d{2})(\d)/, '$1:$2')
      .slice(0, 5);
  const dirty =
    !saved &&
    !denied &&
    !!(
      evidence ||
      reason ||
      entries.length ||
      date !==
        (session ? isoDate(session.actualStartedAt ?? session.startsAt) : '') ||
      start !==
        (session ? isoTime(session.actualStartedAt ?? session.startsAt) : '') ||
      end !== (session ? isoTime(session.actualEndedAt ?? session.endsAt) : '')
    );
  return (
    <Page
      prefix="recovery"
      title={t('recovery.title')}
      {...detailTabs}
      subtitle={params.classTitle ?? session?.classTitle}
      onBack={onBack}
      dirty={dirty}
      allowLeaveRef={allowLeave}
      busy={locked}
      uncertain={mutation.uncertain}
      refresh={query.refresh}
      footer={
        canRecover && !denied && entries.length > 0 ? (
          <Button
            testID="recovery-review"
            disabled={locked || permissions.offline}
            onPress={openReview}
          >
            {t('recovery.review', { defaultValue: t('reviewRecovery') })}
          </Button>
        ) : undefined
      }
    >
      {denied ? (
        <Alert testID="recovery-denied">{t('denied')}</Alert>
      ) : (
        <QueryBlock
          query={query}
          prefix="recovery"
        >
          <QueryBlock
            query={permissions}
            prefix="recovery-permissions"
          >
            {session && <SessionHeading session={session} />}
            {!canRecover ? (
              <View
                testID="recovery-unavailable"
                className="gap-space-12"
              >
                <Text>{t('recoverUnavailable')}</Text>
                {noLonger && <Text selectable>{evidence}</Text>}
              </View>
            ) : entries.length === 0 ? (
              <QueryBlock
                query={students}
                prefix="recovery-student"
              >
                {!picker && (
                  <View className="gap-space-12">
                    <Text>{t('recoveryNone')}</Text>
                    <Text>{t('recoverySelectionHint')}</Text>
                    <Button
                      testID="recovery-pick-students"
                      onPress={() => setPicker(true)}
                    >
                      {t('recoveryPick')}
                    </Button>
                  </View>
                )}
              </QueryBlock>
            ) : (
              <>
                <Alert
                  testID="recovery-warning"
                  warning
                >
                  {t('recoveryWarning')}
                </Alert>
                {session?.status === 'SCHEDULED' && (
                  <Text>{t('recoveryComplete')}</Text>
                )}
                <Field
                  id="recovery-date"
                  inputRef={dateRef}
                  label={t('date')}
                  trailing={
                    !session?.actualStartedAt && (
                      <Pressable
                        testID="recovery-use-schedule-date"
                        accessibilityRole="button"
                        accessibilityLabel={t('useScheduleDate')}
                        disabled={locked}
                        onPress={() =>
                          session && setDate(isoDate(session.startsAt))
                        }
                        className="w-space-44 h-space-44 items-center justify-center active:opacity-70"
                      >
                        <Icon
                          name="event_repeat"
                          size={20}
                        />
                      </Pressable>
                    )
                  }
                  value={date}
                  onChange={(value) =>
                    setDate(
                      value
                        .replace(/[^\d/]/g, '')
                        .replace(/^(\d{2})(\d)/, '$1/$2')
                        .replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2')
                        .slice(0, 10)
                    )
                  }
                  multiline={false}
                  keyboardType="numbers-and-punctuation"
                  disabled={locked || !!session?.actualStartedAt}
                  error={invalid && !timeValid ? t('timeRequired') : undefined}
                />
                <Field
                  id="recovery-start-time"
                  label={t('startTime')}
                  trailing={
                    !session?.actualStartedAt && (
                      <Pressable
                        testID="recovery-use-schedule-start-time"
                        accessibilityRole="button"
                        accessibilityLabel={`${t('useScheduleTime')}: ${t('startTime')}`}
                        disabled={locked}
                        onPress={() =>
                          session && setStart(isoTime(session.startsAt))
                        }
                        className="w-space-44 h-space-44 items-center justify-center active:opacity-70"
                      >
                        <Icon
                          name="event_repeat"
                          size={20}
                        />
                      </Pressable>
                    )
                  }
                  value={start}
                  onChange={(value) => setStart(formatTime(value))}
                  multiline={false}
                  keyboardType="numbers-and-punctuation"
                  disabled={locked || !!session?.actualStartedAt}
                />
                <Field
                  id="recovery-end-time"
                  label={t('endTime')}
                  trailing={
                    !session?.actualEndedAt && (
                      <Pressable
                        testID="recovery-use-schedule-end-time"
                        accessibilityRole="button"
                        accessibilityLabel={`${t('useScheduleTime')}: ${t('endTime')}`}
                        disabled={locked}
                        onPress={() =>
                          session && setEnd(isoTime(session.endsAt))
                        }
                        className="w-space-44 h-space-44 items-center justify-center active:opacity-70"
                      >
                        <Icon
                          name="event_repeat"
                          size={20}
                        />
                      </Pressable>
                    )
                  }
                  value={end}
                  onChange={(value) => setEnd(formatTime(value))}
                  multiline={false}
                  keyboardType="numbers-and-punctuation"
                  disabled={locked || !!session?.actualEndedAt}
                  error={invalid && !timeValid ? t('timeInvalid') : undefined}
                />
                {timeValid && session && date !== isoDate(session.startsAt) && (
                  <Alert
                    testID="recovery-date-differs"
                    warning
                  >
                    {t('dateDiffers')}
                  </Alert>
                )}
                <Field
                  id="recovery-evidence"
                  inputRef={evidenceRef}
                  label={t('recovery.evidence')}
                  value={evidence}
                  onChange={setEvidence}
                  max={2000}
                  disabled={locked}
                  error={
                    invalid && !evidence.trim()
                      ? t('evidenceRequired')
                      : undefined
                  }
                />
                <Field
                  id="recovery-reason"
                  inputRef={reasonRef}
                  label={t('correction.reason')}
                  value={reason}
                  onChange={setReason}
                  max={1000}
                  disabled={locked}
                  error={
                    invalid && !reason.trim() ? t('reasonRequired') : undefined
                  }
                />
                {feedback && (
                  <Alert
                    testID="recovery-feedback"
                    warning
                  >
                    {feedback}
                  </Alert>
                )}
                <Card className="mx-space-0 p-space-6 gap-space-0">
                  {entries.map((entry) => (
                    <View
                      key={entry.student.id}
                      className="gap-space-8"
                    >
                      <AttendanceRowView
                        row={{
                          id: entry.student.id,
                          enrollmentId: entry.student.id,
                          makeupPlacementId: null,
                          entryType: 'REGULAR',
                          name: entry.student.name,
                          status: entry.status ?? 'UNMARKED',
                          checkedInAt: null,
                        }}
                        status={entry.status ?? 'UNMARKED'}
                        prefix="recovery"
                        editable
                        disabled={locked}
                        onMark={(status) =>
                          setSelected((old) => ({
                            ...old,
                            [entry.student.id]: { ...entry, status },
                          }))
                        }
                      />
                      {invalid && !entry.status && (
                        <Text
                          testID={`recovery-mark-error-${entry.student.id}`}
                          className="text-mdy-danger"
                        >
                          {t('selectMark')}
                        </Text>
                      )}
                    </View>
                  ))}
                </Card>
                {invalid && !entries.length && (
                  <Text
                    testID="recovery-none-selected"
                    className="text-mdy-danger"
                  >
                    {t('recoveryNone')}
                  </Text>
                )}
                {tooLarge && (
                  <Alert testID="recovery-too-large">{t('tooLarge')}</Alert>
                )}
                <MutationError
                  result={mutation.result}
                  prefix="recovery"
                />
              </>
            )}
          </QueryBlock>
        </QueryBlock>
      )}
      {picker && canRecover && (
        <Sheet
          testID="recovery-picker"
          title={t('recoveryPick')}
          onClose={() => setPicker(false)}
        >
          <View className="flex-row items-start gap-space-8">
            <Icon
              name="info"
              size={18}
            />
            <Text className="flex-1 text-size-12 text-mdy-secondary">
              {t('recoverGuestLimit')}
            </Text>
          </View>
          <View className="flex-row items-center gap-space-8 rounded-radius-14 border border-mdy-border bg-mdy-surface pl-space-12 pr-space-4">
            <Icon
              name="search"
              size={20}
            />
            <TextInput
              testID="recovery-search"
              accessibilityLabel={t('recovery.pickSearch')}
              placeholder={t('recovery.pickerPlaceholder')}
              placeholderTextColor={colors.placeholder}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              returnKeyType="search"
              className="flex-1 min-w-0 min-h-space-48 text-size-14 font-bvp-regular text-mdy-ink py-space-10"
            />
            {!!search && (
              <Pressable
                testID="recovery-search-clear"
                accessibilityRole="button"
                accessibilityLabel={t('recovery.clearSearch')}
                onPress={() => setSearch('')}
                className="w-space-44 h-space-44 items-center justify-center"
              >
                <Icon
                  name="close"
                  size={18}
                />
              </Pressable>
            )}
          </View>
          <QueryBlock
            query={students}
            prefix="recovery-students"
          >
            <ScrollView
              style={{ maxHeight: Math.min(320, height * 0.38) }}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="gap-space-10 pb-space-4"
            >
              {visibleStudents.map((student) => {
                const already = existing.data?.rows.some(
                    (row) => row.enrollmentId === student.id
                  ),
                  basis =
                    started &&
                    admissionBasis(
                      student.enrollmentStatus,
                      student.paymentType,
                      student.paidAt,
                      started
                    ),
                  waiting =
                    (permissions.data?.totals?.eligible ?? 0) > 0 &&
                    (!existing.data ||
                      existing.busy ||
                      existing.data.rows.length < existing.data.total);
                const unavailable = already
                  ? t('alreadyRecorded')
                  : student.enrollmentStatus === 'PENDING_PAYMENT'
                    ? t('notEligible')
                    : !student.paidAt
                      ? t('noPayment')
                      : !basis
                        ? t('latePayment')
                        : waiting
                          ? t('loading')
                          : undefined;
                return (
                  <Pressable
                    key={student.id}
                    testID={`recovery-option-${student.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={student.name ?? t('nameMissing')}
                    accessibilityHint={
                      unavailable ?? t('recovery.chooseStudent')
                    }
                    accessibilityState={{
                      disabled: !!unavailable,
                      selected: !!selected[student.id],
                    }}
                    disabled={!!unavailable}
                    onPress={() => pick(student)}
                    className={`rounded-radius-14 border p-space-14 gap-space-10 ${selected[student.id] ? 'border-mdy-link bg-mdy-tint2' : 'border-mdy-border bg-mdy-surface'} ${unavailable ? '' : 'active:bg-mdy-muted2'}`}
                  >
                    <View className="flex-row items-center gap-space-10">
                      <Avatar
                        name={student.name ?? t('nameMissing')}
                        size={36}
                      />
                      <Text className="flex-1 text-size-14 font-bvp-semibold">
                        {student.name ?? t('nameMissing')}
                      </Text>
                      <Icon
                        name={
                          unavailable
                            ? 'lock'
                            : selected[student.id]
                              ? 'check_circle'
                              : 'chevron_right'
                        }
                        size={20}
                        color={unavailable ? colors.tertiary : colors.primary}
                      />
                    </View>
                    <View className="gap-space-4">
                      <Text
                        className={`text-size-12 font-bvp-medium ${unavailable ? 'text-mdy-secondary' : 'text-mdy-link'}`}
                      >
                        {unavailable ?? t('recovery.canSelect')}
                      </Text>
                      {!unavailable && basis && (
                        <Text className="text-size-11 text-mdy-secondary">
                          {t(`basis.${basis}`)}
                        </Text>
                      )}
                      {!!student.paidAt && (
                        <Text className="text-size-11 text-mdy-tertiary">
                          {t('recovery.paymentTime', {
                            time: isoTime(student.paidAt),
                            date: isoDate(student.paidAt),
                          })}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
              {students.data && visibleStudents.length === 0 && (
                <View
                  testID="recovery-search-empty"
                  className="items-center py-space-24 gap-space-8"
                >
                  <Icon
                    name="search"
                    size={28}
                  />
                  <Text className="text-center text-size-13 text-mdy-secondary">
                    {t(
                      search.trim()
                        ? 'recovery.noSearchResults'
                        : 'recovery.emptyClass'
                    )}
                  </Text>
                </View>
              )}
              <More
                query={students}
                count={students.data?.students.length ?? 0}
                prefix="recovery-students"
              />
            </ScrollView>
          </QueryBlock>
          <Button
            testID="recovery-picker-close"
            variant="secondary"
            onPress={() => setPicker(false)}
          >
            {t('close')}
          </Button>
        </Sheet>
      )}
      {review && (
        <Sheet
          testID="recovery-review-sheet"
          title={t('reviewRecovery')}
          onClose={() => setReview(undefined)}
          busy={locked}
        >
          <ScrollView
            className="max-h-[400px]"
            contentContainerClassName="gap-space-12"
          >
            <Text>
              {date} · {start}–{end}
            </Text>
            <Text>{evidence}</Text>
            <Text>{reason}</Text>
            <Text>
              {t('recoverySummary', {
                count: entries.length,
                present: entries.filter((entry) => entry.status === 'PRESENT')
                  .length,
                absent: entries.filter((entry) => entry.status === 'ABSENT')
                  .length,
              })}
            </Text>
            {session?.status === 'SCHEDULED' && (
              <Text>{t('recoveryComplete')}</Text>
            )}
            <Alert
              testID="recovery-review-warning"
              warning
            >
              {t('recoveryWarning')}
            </Alert>
            {review.session?.version !== session?.version && (
              <Text>{t('changedReview')}</Text>
            )}
            <MutationError
              result={mutation.result}
              prefix="recovery"
            />
            {mutation.uncertain ? (
              <IntentBanner
                prefix="recovery"
                offline={permissions.offline}
                busy={mutation.busy}
                onRetry={() => submit(true)}
              />
            ) : (
              <Button
                testID="recovery-submit"
                disabled={permissions.offline || locked || tooLarge}
                onPress={() => submit()}
              >
                {t('recover')}
              </Button>
            )}
            <Button
              variant="text"
              disabled={locked}
              onPress={() => setReview(undefined)}
            >
              {t('back')}
            </Button>
          </ScrollView>
        </Sheet>
      )}
    </Page>
  );
}
