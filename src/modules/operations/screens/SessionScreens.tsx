import { useEffect, useRef, useState } from 'react';
import { Pressable, View, type TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useLeave } from '@/modules/leave';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Sheet,
  Text,
} from '@/components/ui/primitives';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useOperationsQuery, useOperationsMutation } from '../hooks';
import { useOperations } from '../provider';
import { validSchedule, replacementEnd } from '../model';
import type { Candidate, Mutation, Session } from '../types';
import {
  Alert,
  Page,
  Field,
  IntentBanner,
  QueryState,
  More,
  SessionSummary,
  ReasonField,
  ScheduleFields,
  MutationError,
  isoDate,
  isoTime,
  parseVietnamTime,
} from '../components/shared';
type Props = NativeStackScreenProps<
  AuthStackParams,
  'SubstituteAssignment' | 'RescheduleSession' | 'ReplacementSession'
>;
export function SubstituteAssignmentScreen(props: Props) {
  return (
    <SessionForm
      {...props}
      mode="assign"
    />
  );
}
export function RescheduleSessionScreen(props: Props) {
  return (
    <SessionForm
      {...props}
      mode="reschedule"
    />
  );
}
export function ReplacementSessionScreen(props: Props) {
  return (
    <SessionForm
      {...props}
      mode="replacement"
    />
  );
}
function SessionForm({
  route,
  navigation,
  mode,
}: Props & { mode: 'assign' | 'reschedule' | 'replacement' }) {
  const { t } = useTranslation('operations');
  const { notify } = useAuth();
  const { nextKey } = useOperations();
  const leave = useLeave();
  const query = useOperationsQuery({
    kind: 'context',
    id: route.params.sessionId,
  });
  const [cancelled, setCancelled] = useState<Session>();
  const session = cancelled ?? query.data?.session;
  const classQuery = useOperationsQuery(
    { kind: 'class', id: session?.classId },
    !!session && mode !== 'assign'
  );
  const classInfo = classQuery.data?.classInfo;
  const [search, setSearch] = useState(''),
    [debounced, setDebounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const isFuture =
    !!session &&
    session.status === 'SCHEDULED' &&
    Date.parse(session.startsAt) > Date.parse(session.asOf);
  const candidates = useOperationsQuery(
    { kind: 'candidates', id: session?.id, search: debounced },
    mode === 'assign' && isFuture
  );
  const impact = useOperationsQuery(
    { kind: 'impact', id: session?.id, status: session?.status },
    mode === 'replacement' &&
      !!session &&
      ['SCHEDULED', 'IN_PROGRESS'].includes(session.status)
  );
  const mutation = useOperationsMutation();
  const [selected, setSelected] = useState<Candidate>(),
    [reason, setReason] = useState(''),
    [clearReason, setClearReason] = useState('');
  const [draft, setDraft] = useState<{
    date?: string;
    start?: string;
    end?: string;
    title?: string;
  }>({});
  const [invalid, setInvalid] = useState(false),
    [confirmation, setConfirmation] = useState(false),
    [clearSheet, setClearSheet] = useState(false);
  const allowLeave = useRef(false),
    reasonRef = useRef<TextInput>(null);
  const replacement = mode === 'replacement' && session?.status === 'CANCELLED';
  const prefix =
    mode === 'assign'
      ? 'substitute'
      : mode === 'reschedule'
        ? 'reschedule'
        : 'replacement';
  const locked = mutation.busy || mutation.uncertain;
  const code =
    mutation.result && mutation.result.kind !== 'success'
      ? mutation.result.code
      : undefined;
  const unauthorized =
    mutation.result?.kind === 'denied' || mutation.result?.kind === 'notFound';
  useEffect(() => {
    if (unauthorized) {
      setReason('');
      setClearReason('');
      setDraft({});
      setSelected(undefined);
      setConfirmation(false);
      setClearSheet(false);
      setCancelled(undefined);
    }
  }, [unauthorized]);
  const blocked = !session
    ? ''
    : (classInfo && ['COMPLETED', 'CANCELLED'].includes(classInfo.status)) ||
        code === 'CLASS_NOT_EDITABLE'
      ? 'classClosed'
      : mode === 'assign'
        ? !isFuture
          ? session.status === 'IN_PROGRESS'
            ? 'substitute.started'
            : session.status === 'SCHEDULED'
              ? 'substitute.past'
              : 'substitute.closed'
          : ''
        : mode === 'reschedule'
          ? !isFuture
            ? session.status === 'SCHEDULED'
              ? 'rescheduleScreen.past'
              : 'rescheduleScreen.notScheduled'
            : ''
          : session.status === 'COMPLETED'
            ? 'replacement.completed'
            : replacement &&
                classInfo &&
                !['OPEN', 'IN_PROGRESS'].includes(classInfo.status)
              ? 'replacement.classNotOpen'
              : '';
  const duration = session
    ? (Date.parse(session.endsAt) - Date.parse(session.startsAt)) / 60000
    : 0;
  const date =
    draft.date ?? (replacement ? '' : session ? isoDate(session.startsAt) : '');
  const start =
    draft.start ??
    (replacement ? '' : session ? isoTime(session.startsAt) : '');
  const end = replacement
    ? (replacementEnd(start, duration) ?? '')
    : (draft.end ?? (session ? isoTime(session.endsAt) : ''));
  const title = draft.title ?? session?.title ?? '';
  const startsAt = parseVietnamTime(date, start),
    endsAt = parseVietnamTime(date, end);
  const sameSchedule =
    !!session &&
    !!startsAt &&
    !!endsAt &&
    Date.parse(startsAt) === Date.parse(session.startsAt) &&
    Date.parse(endsAt) === Date.parse(session.endsAt);
  const outOfPeriod =
    mode === 'reschedule' &&
    !!classInfo &&
    !!startsAt &&
    (startsAt.slice(0, 10) < classInfo.startDate ||
      startsAt.slice(0, 10) > classInfo.endDate);
  const timeError =
    !session || validSchedule(date, start, end, session.asOf)
      ? ''
      : startsAt && endsAt && Date.parse(endsAt) > Date.parse(startsAt)
        ? t('startPast')
        : t('timeRange');
  const versionMismatch =
    mode === 'assign' &&
    !!session &&
    candidates.data?.sessionVersion !== undefined &&
    session.version !== candidates.data.sessionVersion;
  useEffect(() => {
    if (versionMismatch && !query.busy && !candidates.busy) {
      query.refresh();
      candidates.refresh();
    }
  }, [versionMismatch]);
  const attempt = (clearing = false) => {
    setInvalid(true);
    if (
      !(clearing ? clearReason : reason).trim() ||
      (clearing ? clearReason : reason).trim().length > 1000
    ) {
      reasonRef.current?.focus();
      return;
    }
    if (mode === 'assign') {
      if (
        (!clearing && !selected) ||
        versionMismatch ||
        !candidates.data ||
        candidates.result?.kind !== 'success'
      )
        return;
    } else if (mode === 'reschedule' || replacement) {
      if (
        timeError ||
        outOfPeriod ||
        (replacement && (!title.trim() || title.trim().length > 250))
      )
        return;
    }
    setConfirmation(true);
  };
  const submit = async (retry = false) => {
    if (!session || blocked || query.offline || unauthorized) return;
    const kind =
      mode === 'assign'
        ? 'assign'
        : mode === 'reschedule'
          ? 'reschedule'
          : replacement
            ? 'replace'
            : 'cancel';
    const intent: Mutation = {
      kind,
      id: session.id,
      key: nextKey(),
      expectedVersion:
        mode === 'assign'
          ? (candidates.data?.sessionVersion ?? session.version)
          : session.version,
      reason: (clearSheet ? clearReason : reason).trim(),
      ...(kind === 'assign'
        ? { mentorId: clearSheet ? null : selected?.id }
        : {}),
      ...(kind === 'reschedule' || kind === 'replace'
        ? { startsAt: startsAt!, endsAt: endsAt! }
        : {}),
      ...(kind === 'replace'
        ? { classUnitId: session.unitId, title: title.trim() }
        : {}),
    };
    const result = await mutation.submit(intent, retry);
    if (!result) return;
    setConfirmation(false);
    if (result.kind === 'uncertain') setClearSheet(false);
    if (result.kind === 'success' && result.data.session) {
      const updated = result.data.session;
      if (kind === 'cancel') {
        setCancelled(updated);
        setInvalid(false);
        setDraft({});
        setConfirmation(false);
        mutation.reset();
      } else {
        allowLeave.current = true;
        notify(
          t(
            kind === 'assign'
              ? clearSheet
                ? 'substitute.cleared'
                : 'substitute.assigned'
              : kind === 'reschedule'
                ? 'rescheduleScreen.done'
                : 'replacement.done',
            {
              name: updated.effectiveMentor,
              time: `${isoDate(updated.startsAt)} ${isoTime(updated.startsAt)}–${isoTime(updated.endsAt)}`,
            }
          )
        );
        if (
          kind === 'replace' &&
          result.data.classEndDate &&
          classInfo &&
          result.data.classEndDate > classInfo.endDate
        )
          notify(
            `${t('replacement.done')} · ${t('replacement.doneExtended', { date: result.data.classEndDate })}`
          );
        if (kind === 'replace')
          navigation.replace('SessionContext', {
            sessionId: updated.id,
            ...(route.params.classTitle
              ? { classTitle: route.params.classTitle }
              : {}),
          });
        else navigation.goBack();
      }
    } else if (result.kind === 'error') {
      if (
        result.code === 'SESSION_VERSION_CONFLICT' ||
        result.code === 'SESSION_STATE_CONFLICT'
      ) {
        setCancelled(undefined);
        await query.refresh();
      }
      if (
        mode === 'assign' &&
        [
          'SESSION_VERSION_CONFLICT',
          'CLASS_MENTOR_SCHEDULE_CONFLICT',
          'CLASS_MENTOR_NOT_ELIGIBLE',
        ].includes(result.code ?? '')
      ) {
        setSelected(undefined);
        await candidates.refresh();
      }
    }
  };
  const actionLabel =
    mode === 'assign'
      ? 'substitute.submit'
      : mode === 'reschedule'
        ? 'rescheduleScreen.submit'
        : replacement
          ? 'replacement.submit'
          : 'replacement.cancelSubmit';
  const canShow = !!session && !blocked && !unauthorized;
  return (
    <Page
      prefix={prefix}
      showMockControls={false}
      title={t(
        mode === 'assign'
          ? 'substitute.title'
          : mode === 'reschedule'
            ? 'rescheduleScreen.title'
            : replacement
              ? 'replacement.title'
              : 'replacement.cancelTitle'
      )}
      subtitle={route.params.classTitle ?? session?.classTitle}
      onBack={navigation.goBack}
      dirty={
        !!reason || !!clearReason || !!selected || Object.keys(draft).length > 0
      }
      busy={mutation.busy}
      uncertain={mutation.uncertain}
      allowLeaveRef={allowLeave}
      refresh={query.refresh}
      footer={
        canShow && (
          <>
            <Button
              testID={`${prefix}-${mode === 'replacement' && !replacement ? 'cancel-submit' : 'submit'}`}
              variant={
                mode === 'replacement' && !replacement ? 'danger' : 'primary'
              }
              disabled={
                locked ||
                query.offline ||
                versionMismatch ||
                (mode === 'assign' &&
                  (!candidates.data ||
                    candidates.result?.kind !== 'success')) ||
                (mode === 'reschedule' && sameSchedule) ||
                code === 'MAKEUP_ALREADY_EXISTS' ||
                reason.length > 1000
              }
              busy={mutation.busy}
              onPress={() => attempt()}
            >
              {t(actionLabel)}
            </Button>
            {cancelled && (
              <Button
                testID="replacement-later"
                variant="text"
                disabled={locked}
                onPress={navigation.goBack}
              >
                {t('replacement.later')}
              </Button>
            )}
          </>
        )
      }
    >
      {unauthorized ? (
        <Card
          testID={`${prefix}-${mutation.result?.kind === 'denied' ? 'denied' : 'not-found'}`}
        >
          <Text>
            {t(mutation.result?.kind === 'denied' ? 'denied' : 'notFound')}
          </Text>
        </Card>
      ) : (
        <QueryState
          query={query}
          prefix={prefix}
        >
          {session && (
            <SessionSummary
              session={session}
              prefix={prefix}
            />
          )}
          {blocked ? (
            <Card testID={`${prefix}-blocked`}>
              <Text>{t(blocked)}</Text>
            </Card>
          ) : (
            session && (
              <>
                {mode === 'assign' ? (
                  <>
                    <Text>
                      {t('substitute.primary', {
                        name: session.primaryMentor ?? t('cash.noName'),
                      })}
                    </Text>
                    {session.assignment === 'SUBSTITUTE' && (
                      <Button
                        testID="substitute-clear"
                        variant="secondary"
                        disabled={locked || query.offline}
                        onPress={() => {
                          setClearSheet(true);
                          setInvalid(false);
                        }}
                      >
                        {t('substitute.clear')}
                      </Button>
                    )}
                    <Field
                      id="substitute-search"
                      label={t('substitute.search')}
                      value={search}
                      onChange={setSearch}
                      maxLength={100}
                      multiline={false}
                      disabled={locked || query.offline}
                    />
                    {selected && (
                      <Text testID="substitute-selected">
                        {t('substitute.selected', { name: selected.name })}
                      </Text>
                    )}
                    <QueryState
                      query={candidates}
                      prefix="substitute-candidates"
                    >
                      <Text
                        testID="substitute-count"
                        accessibilityLiveRegion="polite"
                      >
                        {t(
                          search
                            ? 'substitute.results'
                            : 'substitute.available',
                          { count: candidates.data?.total }
                        )}
                      </Text>
                      <Text className="text-size-12 text-mdy-secondary">
                        {t('substitute.basis')}
                      </Text>
                      <Text
                        testID="substitute-checked-at"
                        className="text-size-12"
                      >
                        {t('substitute.checkedAt', {
                          time: candidates.data
                            ? isoTime(candidates.data.asOf)
                            : '',
                        })}
                      </Text>
                      <Card>
                        <View accessibilityRole="radiogroup">
                          {candidates.data?.candidates?.map((mentor) => (
                            <Pressable
                              key={mentor.id}
                              testID={`substitute-row-${mentor.id}${mentor.isCurrent ? '-current' : ''}`}
                              accessibilityRole="radio"
                              accessibilityLabel={
                                mentor.name ?? t('cash.noName')
                              }
                              accessibilityState={{
                                checked: selected?.id === mentor.id,
                                disabled:
                                  mentor.isCurrent || locked || query.offline,
                              }}
                              disabled={
                                mentor.isCurrent || locked || query.offline
                              }
                              className="min-h-space-56 flex-row items-center gap-space-12 py-space-12"
                              onPress={() => setSelected(mentor)}
                            >
                              <Avatar name={mentor.name ?? t('cash.noName')} />
                              <Text className="flex-1">
                                {mentor.name ?? t('cash.noName')}
                              </Text>
                              {mentor.isCurrent ? (
                                <Chip variant="info">
                                  {t('substitute.isCurrent')}
                                </Chip>
                              ) : (
                                <Text>
                                  {selected?.id === mentor.id ? '◉' : '○'}
                                </Text>
                              )}
                            </Pressable>
                          ))}
                        </View>
                      </Card>
                      {candidates.data?.total === 0 && (
                        <Text
                          testID={
                            search ? 'substitute-no-result' : 'substitute-empty'
                          }
                        >
                          {t(
                            search ? 'substitute.noResult' : 'substitute.empty'
                          )}
                        </Text>
                      )}
                      <More
                        query={candidates}
                        prefix="substitute"
                      />
                    </QueryState>
                    {invalid && !selected && (
                      <Text
                        testID="substitute-select-error"
                        accessibilityRole="alert"
                        className="text-mdy-danger"
                      >
                        {t('substitute.selectRequired')}
                      </Text>
                    )}
                  </>
                ) : mode === 'reschedule' || replacement ? (
                  <>
                    {cancelled && (
                      <>
                        <Text
                          testID="replacement-progress"
                          accessibilityLabel={t('replacement.stepReplace')}
                        >
                          {t('replacement.stepCancel')} ✓ —{' '}
                          {t('replacement.stepReplace')}
                        </Text>
                        <Alert
                          testID="replacement-cancelled"
                          warning
                        >
                          {t('replacement.cancelled')}
                        </Alert>
                      </>
                    )}
                    {replacement && (
                      <Field
                        id="replacement-title"
                        label={t('replacement.name')}
                        value={title}
                        onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
                        max={250}
                        multiline={false}
                        disabled={locked}
                        error={
                          invalid && !title.trim()
                            ? t('replacement.nameRequired')
                            : undefined
                        }
                      />
                    )}
                    <ScheduleFields
                      prefix={prefix}
                      date={date}
                      start={start}
                      end={end}
                      onDate={(v) => setDraft((d) => ({ ...d, date: v }))}
                      onStart={(v) => setDraft((d) => ({ ...d, start: v }))}
                      onEnd={(v) => setDraft((d) => ({ ...d, end: v }))}
                      disabled={locked || code === 'MAKEUP_ALREADY_EXISTS'}
                      readOnlyEnd={replacement}
                      minDate={new Date(Date.parse(session.asOf) + 7 * 3600000)
                        .toISOString()
                        .slice(0, 10)}
                      {...(!replacement && classInfo
                        ? { maxDate: classInfo.endDate }
                        : {})}
                      invalid={
                        invalid
                          ? timeError || (outOfPeriod ? t('outsidePeriod') : '')
                          : undefined
                      }
                    />
                    {outOfPeriod && invalid && (
                      <Text
                        testID={`${prefix}-date-error`}
                        className="text-mdy-danger"
                      >
                        {t('outsidePeriod')}
                      </Text>
                    )}
                    <Text testID={`${prefix}-duration`}>
                      {t(
                        replacement
                          ? 'replacement.keepDuration'
                          : 'rescheduleScreen.duration',
                        {
                          minutes:
                            startsAt && endsAt
                              ? (Date.parse(endsAt) - Date.parse(startsAt)) /
                                60000
                              : duration,
                        }
                      )}
                    </Text>
                    <Text
                      testID={
                        replacement
                          ? 'replacement-no-copy'
                          : 'reschedule-keep-teacher'
                      }
                    >
                      {t(
                        replacement
                          ? 'replacement.noCopy'
                          : 'rescheduleScreen.keepTeacher',
                        { name: session.primaryMentor ?? t('cash.noName') }
                      )}
                    </Text>
                    {classQuery.result?.kind === 'error' && !replacement && (
                      <Text testID="reschedule-class-unknown">
                        {t('rescheduleScreen.classUnknown')}
                      </Text>
                    )}
                    {replacement &&
                      classInfo &&
                      startsAt &&
                      startsAt.slice(0, 10) > classInfo.endDate && (
                        <Text testID="replacement-extend">
                          {t('replacement.extend', { date })}
                        </Text>
                      )}
                  </>
                ) : (
                  <>
                    {session.status === 'IN_PROGRESS' && (
                      <Alert
                        testID="replacement-in-progress"
                        warning
                      >
                        {t('replacement.inProgress')}
                      </Alert>
                    )}
                    <Card testID="replacement-scope">
                      <Text className="font-bvp-semibold">
                        {t('replacement.scope')}
                      </Text>
                      {impact.data?.impact && (
                        <Text testID="replacement-scope-students">
                          {t(
                            impact.data.impact.present !== undefined
                              ? 'replacement.totals'
                              : 'replacement.candidates',
                            {
                              count: impact.data.impact.total,
                              eligible: impact.data.impact.total,
                              present: impact.data.impact.present,
                              absent: impact.data.impact.absent,
                            }
                          )}
                        </Text>
                      )}
                      <Text>{t('replacement.scopeSchedule')}</Text>
                      <Text>{t('replacement.scopeFinal')}</Text>
                    </Card>
                  </>
                )}
                <ReasonField
                  prefix={
                    mode === 'replacement' && !replacement
                      ? 'replacement-cancel'
                      : prefix
                  }
                  value={reason}
                  onChange={setReason}
                  invalid={invalid}
                  disabled={locked || code === 'MAKEUP_ALREADY_EXISTS'}
                  inputRef={reasonRef}
                />
                <MutationError
                  prefix={prefix}
                  result={mutation.result}
                />
                {code === 'SESSION_HAS_MAKEUP_PLACEMENTS' && leave.enabled && (
                  <Button
                    testID={`${prefix}-open-makeup`}
                    variant="secondary"
                    onPress={() => navigation.navigate('MakeupConflicts')}
                  >
                    {t('placements')}
                  </Button>
                )}
                {code === 'MAKEUP_ALREADY_EXISTS' && (
                  <Button
                    testID="replacement-open-schedule"
                    variant="secondary"
                    onPress={() =>
                      navigation.navigate('ManagerClassDetail', {
                        classId: session.classId,
                      })
                    }
                  >
                    {t('replacement.openSchedule')}
                  </Button>
                )}
                {mutation.uncertain && (
                  <IntentBanner
                    prefix={prefix}
                    busy={mutation.busy}
                    offline={query.offline}
                    onRetry={() => submit(true)}
                  />
                )}
              </>
            )
          )}
        </QueryState>
      )}
      {clearSheet && !unauthorized && (
        <Sheet
          testID="substitute-clear-sheet"
          title={t('substitute.clear')}
          onClose={() => {
            if (!locked) setClearSheet(false);
          }}
        >
          <Text>
            {t('substitute.clearBody', {
              current: session?.effectiveMentor,
              primary: session?.primaryMentor,
            })}
          </Text>
          <Field
            id="substitute-clear-reason"
            label={t('reason')}
            value={clearReason}
            onChange={setClearReason}
            max={1000}
            disabled={locked}
            error={
              invalid && !clearReason.trim() ? t('reasonRequired') : undefined
            }
          />
          <Button
            testID="substitute-clear-submit"
            disabled={locked || query.offline}
            onPress={() => attempt(true)}
          >
            {t('substitute.clearSubmit')}
          </Button>
        </Sheet>
      )}
      {confirmation && (
        <ConfirmationDialog
          testID={`${prefix}-${mode === 'replacement' && !replacement ? 'cancel-confirm' : 'confirm'}`}
          icon={
            mode === 'assign'
              ? 'swap_horiz'
              : mode === 'replacement'
                ? 'event_busy'
                : 'calendar_month'
          }
          title={t(
            mode === 'assign'
              ? clearSheet
                ? 'substitute.clear'
                : 'substitute.confirmTitle'
              : mode === 'reschedule'
                ? 'rescheduleScreen.confirmTitle'
                : replacement
                  ? 'replacement.confirmTitle'
                  : 'replacement.cancelConfirm',
            { name: selected?.name }
          )}
          busy={mutation.busy || mutation.uncertain}
          onClose={() => setConfirmation(false)}
        >
          {mode === 'reschedule' ? (
            <>
              <Text testID="reschedule-confirm-from">
                {t('rescheduleScreen.from', {
                  time: session
                    ? `${isoDate(session.startsAt)} ${isoTime(session.startsAt)}–${isoTime(session.endsAt)}`
                    : '',
                })}
              </Text>
              <Text testID="reschedule-confirm-to">
                {t('rescheduleScreen.to', { time: `${date} ${start}–${end}` })}
              </Text>
              <Text>{t('rescheduleScreen.confirmBody')}</Text>
            </>
          ) : (
            <Text>
              {t(
                mode === 'assign'
                  ? clearSheet
                    ? 'substitute.clearBody'
                    : 'substitute.confirmBody'
                  : replacement
                    ? 'replacement.confirmBody'
                    : 'replacement.cancelBody',
                {
                  name: selected?.name,
                  current: session?.effectiveMentor,
                  primary: session?.primaryMentor,
                  session: replacement ? title : session?.title,
                  time: `${date} ${start}–${end}`,
                  date: session ? isoDate(session.startsAt) : '',
                }
              )}
            </Text>
          )}
          <Button
            testID={`${prefix}-${mode === 'replacement' && !replacement ? 'cancel-confirm-submit' : 'confirm-submit'}`}
            variant={
              mode === 'replacement' && !replacement ? 'danger' : 'primary'
            }
            disabled={mutation.busy || mutation.uncertain}
            busy={mutation.busy}
            onPress={() => submit()}
          >
            {t(actionLabel)}
          </Button>
          <Button
            variant="text"
            disabled={locked}
            onPress={() => setConfirmation(false)}
          >
            {t('substitute.back')}
          </Button>
        </ConfirmationDialog>
      )}
    </Page>
  );
}
