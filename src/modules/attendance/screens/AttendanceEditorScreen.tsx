import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Card, Sheet, Text } from '@/components/ui/primitives';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAttendanceMutation, useAttendanceQuery } from '../hooks';
import { useUtilityTabs } from '../components/useUtilityTabs';
import {
  changeDraft,
  compareDraft,
  isoDate,
  isoTime,
  noteLength,
} from '../model';
import {
  AttendanceRowView,
  Field,
  FocusPanel,
  IntentBanner,
  More,
  MutationError,
  Page,
  QueryBlock,
  TotalsStrip,
} from '../components/shared';
import type { AttendanceData, Draft, Intent, Mark } from '../types';

type Props = NativeStackScreenProps<AuthStackParams, 'AttendanceEditor'>;
export function AttendanceEditorScreen(props: Props) {
  return (
    <Editor
      {...props}
      manager={false}
    />
  );
}
export function AttendanceCorrectionScreen(
  props: NativeStackScreenProps<AuthStackParams, 'AttendanceCorrection'>
) {
  return (
    <Editor
      route={props.route}
      navigation={props.navigation}
      manager
    />
  );
}
function Editor({
  route,
  navigation,
  manager,
}: {
  route:
    | Props['route']
    | NativeStackScreenProps<AuthStackParams, 'AttendanceCorrection'>['route'];
  navigation:
    | Props['navigation']
    | NativeStackScreenProps<
        AuthStackParams,
        'AttendanceCorrection'
      >['navigation'];
  manager: boolean;
}) {
  const { t } = useTranslation('attendance');
  const { notify } = useAuth();
  const utility = useUtilityTabs(route.params, 'correction');
  const role = manager ? 'MANAGER' : 'MENTOR';
  const id = route.params.sessionId,
    prefix = manager ? 'correction' : 'attendance';
  const context = useAttendanceQuery({ kind: 'context', role, sessionId: id });
  const cancelled =
    context.data?.session?.status === 'CANCELLED' &&
    !context.data.session.actualStartedAt;
  const query = useAttendanceQuery(
    { kind: 'attendance', role, sessionId: id, pageSize: 100 },
    !!context.data && !cancelled,
    manager && 'enrollmentId' in route.params && !!route.params.enrollmentId
  );
  const session = query.data?.session ?? context.data?.session;
  const preview = useAttendanceQuery(
    { kind: 'candidates', role, sessionId: id, pageSize: 100 },
    !manager && session?.status === 'SCHEDULED'
  );
  const mutation = useAttendanceMutation();
  const [writeClosed, setWriteClosed] = useState(false);
  const [draft, setDraft] = useState<Draft>({}),
    [version, setVersion] = useState<number>(),
    [reason, setReason] = useState(''),
    [reasonError, setReasonError] = useState(false);
  const [sheet, setSheet] = useState<
    'start' | 'save' | 'bulk-present' | 'bulk-absent' | 'finalize'
  >();
  const [review, setReview] = useState<AttendanceData>(),
    [changedReview, setChangedReview] = useState(false),
    [conflicts, setConflicts] = useState<string[] | undefined>(),
    [message, setMessage] = useState(''),
    [finalized, setFinalized] = useState(false);
  const reasonRef = useRef<import('react-native').TextInput>(null);
  const selectedStudent =
    manager && 'enrollmentId' in route.params
      ? route.params.enrollmentId
      : undefined;
  const selectedMakeup =
    manager && 'makeupPlacementId' in route.params
      ? route.params.makeupPlacementId
      : undefined;
  const rows = (query.data?.rows ?? []).filter(
      (row) =>
        !selectedStudent ||
        (row.enrollmentId === selectedStudent &&
          (row.makeupPlacementId ?? undefined) === selectedMakeup)
    ),
    count = Object.keys(draft).length;
  const correctionPresent = query.data?.totals
    ? (selectedStudent
        ? rows.filter((row) => row.status === 'PRESENT').length
        : query.data.totals.present) +
      rows.reduce((delta, row) => {
        const change = draft[row.id];
        return change
          ? delta +
              Number(change.status === 'PRESENT') -
              Number(row.status === 'PRESENT')
          : delta;
      }, 0)
    : undefined;
  const correctionAbsent =
    query.data?.totals && correctionPresent !== undefined
      ? (selectedStudent
          ? rows.length
          : query.data.totals.present +
            query.data.totals.absent +
            query.data.totals.unmarked) - correctionPresent
      : undefined;
  const denied =
    query.result?.kind === 'denied' ||
    query.result?.kind === 'notFound' ||
    mutation.result?.kind === 'denied' ||
    mutation.result?.kind === 'notFound';
  const busy = mutation.busy,
    locked = busy || mutation.uncertain,
    offline = query.offline;
  const editable =
    !!query.data?.session?.permissions.canEditAttendance &&
    !denied &&
    !writeClosed;
  useEffect(() => {
    if (denied) {
      setDraft({});
      setReason('');
      setSheet(undefined);
      setConflicts(undefined);
    }
  }, [denied]);
  useEffect(() => {
    if (preview.result?.kind === 'unavailable') {
      context.refresh().then(() => query.refresh());
    }
  }, [preview.result]);
  const mark = (row: (typeof rows)[number], status: Mark) => {
    try {
      setDraft(changeDraft(draft, row, status));
      if (!count) setVersion(session?.version);
      setMessage('');
    } catch {
      setMessage(t('batchLimit'));
    }
  };
  const body = (
    kind: Intent['kind'],
    expectedVersion = session?.version ?? 0
  ): Omit<Intent, 'key'> => ({
    kind,
    sessionId: id,
    role,
    expectedVersion,
    ...(manager ? { reason: reason.trim() } : {}),
    ...(kind === 'save'
      ? {
          records: rows
            .filter((r) => draft[r.id] && r.entryType === 'REGULAR')
            .map((r) => ({
              enrollmentId: r.enrollmentId,
              status: draft[r.id]!.status,
            })),
          guestRecords: rows
            .filter(
              (r) =>
                draft[r.id] && r.entryType === 'MAKEUP' && r.makeupPlacementId
            )
            .map((r) => ({
              makeupPlacementId: r.makeupPlacementId!,
              status: draft[r.id]!.status,
            })),
        }
      : {}),
    ...(kind === 'bulk' ? { checked: sheet === 'bulk-present' } : {}),
  });
  const handle = async (value: Omit<Intent, 'key'>, retry = false) => {
    const result = await mutation.submit(value, retry);
    if (result?.kind === 'success') {
      if (value.kind === 'save' || value.kind === 'bulk') {
        setDraft({});
        setReason('');
        setConflicts(undefined);
        setVersion(result.data.session?.version);
      }
      if (value.kind === 'sync') setVersion(result.data.session?.version);
      if (value.kind === 'finalize') setFinalized(true);
      setSheet(undefined);
      setMessage('');
      notify(
        t(
          value.kind === 'start'
            ? 'editor.started'
            : value.kind === 'finalize'
              ? 'editor.finalized'
              : value.kind === 'sync'
                ? result.changed
                  ? 'editor.syncAdded'
                  : 'editor.syncSame'
                : result.changed
                  ? 'changed'
                  : 'noChange',
          { count: result.changed }
        )
      );
      await query.refresh();
      await context.refresh();
    } else if (
      result?.kind === 'error' &&
      result.code === 'SESSION_VERSION_CONFLICT'
    ) {
      const fresh = await query.refresh();
      if (value.kind === 'finalize') {
        if (fresh?.kind === 'success') {
          setReview(fresh.data);
          setChangedReview(true);
        }
      } else if (fresh?.kind === 'success') {
        const compared = compareDraft(draft, fresh.data.rows);
        setDraft(compared.draft);
        setConflicts(compared.conflicts);
        setVersion(fresh.data.session?.version);
        setSheet(undefined);
        if (compared.dropped)
          setMessage(t('rowsDropped', { count: compared.dropped }));
      }
    } else if (
      result?.kind === 'error' &&
      result.code === 'ATTENDANCE_EDIT_WINDOW_EXPIRED'
    ) {
      setWriteClosed(true);
      setMessage(t('note.closedUnsaved'));
      await query.refresh();
    } else if (
      result?.kind === 'error' &&
      result.code?.includes('NOT_ELIGIBLE')
    ) {
      const fresh = await query.refresh();
      if (fresh?.kind === 'success') {
        const compared = compareDraft(draft, fresh.data.rows);
        setDraft(compared.draft);
        setMessage(t('rowsDropped', { count: compared.dropped }));
      }
    }
    return result;
  };
  const save = async () => {
    if (manager && (!reason.trim() || noteLength(reason.trim()) > 1000)) {
      setReasonError(true);
      reasonRef.current?.focus();
      return undefined;
    }
    return handle(body('save', version ?? session?.version));
  };
  const finalize = async () => {
    if (count) {
      const result = await save();
      if (result?.kind !== 'success') return;
      setReview(result.data);
    } else {
      const fresh = await query.refresh();
      if (fresh?.kind !== 'success') return;
      setReview(fresh.data);
    }
    setChangedReview(false);
    setSheet('finalize');
  };
  const resolve = (rowId: string, mine: boolean) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    setDraft((old) => {
      const next = { ...old };
      if (mine && next[rowId])
        next[rowId] = { ...next[rowId], baseStatus: row.status };
      else delete next[rowId];
      return next;
    });
    setConflicts((old) => old?.filter((key) => key !== rowId));
  };
  const dirty = count > 0 || !!reason;
  const RosterContainer = manager ? View : Card;
  const footer =
    session && query.data && !denied ? (
      <>
        {count > 0 && (manager || !session.permissions.canFinalize) && (
          <View className="flex-row flex-wrap items-center gap-space-10">
            <Text
              testID={`${prefix}-unsaved-count`}
              className="flex-1 text-size-13"
            >
              {t('unsavedCount', { count })}
            </Text>
            <Button
              testID={manager ? 'correction-continue' : 'attendance-save'}
              disabled={offline || locked || !editable || !!conflicts?.length}
              busy={busy}
              onPress={() => (manager ? setSheet('save') : save())}
            >
              {t(manager ? 'continue' : 'save')}
            </Button>
          </View>
        )}
        {!manager && session.permissions.canStart && (
          <Button
            testID="attendance-start"
            disabled={offline || locked}
            onPress={() => setSheet('start')}
          >
            {t('editor.start')}
          </Button>
        )}
        {!manager && !writeClosed && session.permissions.canFinalize && (
          <Button
            testID="attendance-finalize"
            busy={busy}
            disabled={offline || locked || !!conflicts?.length}
            onPress={finalize}
          >
            {t('editor.finalize')}
          </Button>
        )}
        {finalized && (
          <Button
            testID="attendance-note-action"
            variant="secondary"
            onPress={() =>
              navigation.navigate('TeachingNoteEditor', {
                sessionId: id,
                ...(route.params.classTitle
                  ? { classTitle: route.params.classTitle }
                  : {}),
              })
            }
          >
            {t('noteLink')}
          </Button>
        )}
      </>
    ) : undefined;
  return (
    <Page
      prefix={prefix}
      title={t(
        utility.enabled
          ? 'utility.management'
          : manager
            ? 'correction.title'
            : 'editor.title'
      )}
      {...utility.pageProps}
      subtitle={
        manager && session
          ? `${route.params.classTitle ?? session.classTitle} · ${isoTime(session.startsAt)}`
          : (route.params.classTitle ?? session?.classTitle)
      }
      onBack={navigation.goBack}
      dirty={dirty}
      busy={busy}
      uncertain={mutation.uncertain}
      footer={footer}
      refresh={query.refresh}
    >
      {denied ? (
        <Alert testID={`${prefix}-denied`}>
          {t('denied') + ' ' + t('note.deniedExtra')}
        </Alert>
      ) : (
        <QueryBlock
          query={context}
          prefix={prefix}
        >
          {cancelled ? (
            <Text>{t('cancelledEmpty')}</Text>
          ) : (
            <QueryBlock
              query={query}
              prefix={prefix}
            >
              {session?.status === 'SCHEDULED' && !manager ? (
                <>
                  <Alert
                    testID="attendance-provisional"
                    warning
                  >
                    {t('editor.provisional')}
                  </Alert>
                  {!session.permissions.canStart && (
                    <Text testID="attendance-start-unavailable">
                      {t(
                        isoDate(session.asOf) === isoDate(session.startsAt)
                          ? 'editor.startBlocked'
                          : Date.parse(session.asOf) <
                              Date.parse(session.startsAt)
                            ? 'editor.startBefore'
                            : 'editor.startAfter',
                        { date: isoDate(session.startsAt) }
                      )}
                    </Text>
                  )}
                  <QueryBlock
                    query={preview}
                    prefix="attendance-candidates"
                  >
                    <Text>
                      {t('editor.expected', {
                        count: preview.data?.total ?? 0,
                      })}
                    </Text>
                    <Card className="mx-space-0 p-space-6">
                      {preview.data?.rows.map((row) => (
                        <AttendanceRowView
                          key={row.id}
                          row={row}
                          prefix="attendance-candidate"
                          provisional
                        />
                      ))}
                      {preview.data?.total === 0 && (
                        <Text>{t('editor.previewEmpty')}</Text>
                      )}
                    </Card>
                    <More
                      query={preview}
                      count={preview.data?.rows.length ?? 0}
                      prefix="attendance-candidates"
                    />
                  </QueryBlock>
                </>
              ) : manager && !editable ? (
                <Alert testID="correction-no-edit">
                  {t('correction.noEdit')}
                </Alert>
              ) : (
                <>
                  {manager && (
                    <View
                      testID="correction-counts"
                      className="flex-row gap-space-8"
                    >
                      {(['present', 'absent'] as const).map((key) => (
                        <View
                          key={key}
                          className={
                            key === 'present'
                              ? 'flex-1 rounded-radius-14 bg-mdy-successBg px-space-12 py-space-8 gap-space-2'
                              : 'flex-1 rounded-radius-14 bg-mdy-dangerBg px-space-12 py-space-8 gap-space-2'
                          }
                        >
                          <Text
                            testID={`correction-total-${key}`}
                            className={
                              key === 'present'
                                ? 'text-size-18 font-bvp-semibold text-mdy-success'
                                : 'text-size-18 font-bvp-semibold text-mdy-danger'
                            }
                          >
                            {(key === 'present'
                              ? correctionPresent
                              : correctionAbsent) ?? '—'}
                          </Text>
                          <Text
                            className={
                              key === 'present'
                                ? 'text-size-11 text-mdy-success'
                                : 'text-size-11 text-mdy-danger'
                            }
                          >
                            {t(`editor.${key}`)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {!manager && session?.status === 'COMPLETED' && (
                    <Alert
                      testID={
                        editable
                          ? 'attendance-edit-until'
                          : 'attendance-expired'
                      }
                      warning
                    >
                      {editable
                        ? t('editor.editUntil', {
                            deadline: `${isoTime(session.editableUntil)} ${isoDate(session.editableUntil)}`,
                          })
                        : t('editor.expired')}
                    </Alert>
                  )}
                  {!manager &&
                    session?.status === 'IN_PROGRESS' &&
                    !editable && (
                      <Alert
                        testID="attendance-overdue"
                        warning
                      >
                        {t('editor.overdue')}
                      </Alert>
                    )}
                  {count > 0 && version !== session?.version && (
                    <Text testID={`${prefix}-newer-exists`}>{t('newer')}</Text>
                  )}
                  {offline && editable && (
                    <Alert
                      testID="attendance-offline-mark"
                      warning
                    >
                      {t('editor.offlineMark') + ' ' + t('memoryOnly')}
                    </Alert>
                  )}
                  {message && (
                    <Alert
                      testID={`${prefix}-feedback`}
                      warning
                    >
                      {message}
                    </Alert>
                  )}
                  {conflicts && (
                    <FocusPanel testID={`${prefix}-conflict`}>
                      <Text>{t('conflictTitle')}</Text>
                      <Text>
                        {t(
                          conflicts.length ? 'conflictBody' : 'conflictNoDiff'
                        )}
                      </Text>
                      {conflicts.map((rowId) => {
                        const row = rows.find((r) => r.id === rowId);
                        return (
                          row && (
                            <View
                              key={rowId}
                              className="gap-space-8"
                            >
                              <Text>{row.name ?? t('nameMissing')}</Text>
                              <Text>
                                {t('conflictRow', {
                                  server: t(
                                    `editor.${row.status.toLowerCase()}`
                                  ),
                                  mine: t(
                                    `editor.${draft[rowId]?.status.toLowerCase()}`
                                  ),
                                })}
                              </Text>
                              <Button
                                testID={`${prefix}-use-latest-${rowId}`}
                                variant="secondary"
                                onPress={() => resolve(rowId, false)}
                              >
                                {t('useLatest')}
                              </Button>
                              <Button
                                testID={`${prefix}-keep-mine-${rowId}`}
                                variant="secondary"
                                onPress={() => resolve(rowId, true)}
                              >
                                {t('keepMine')}
                              </Button>
                            </View>
                          )
                        );
                      })}
                      {conflicts.length >= 2 && (
                        <Button
                          testID={`${prefix}-use-latest-all`}
                          onPress={() => {
                            conflicts.forEach((rowId) => resolve(rowId, false));
                          }}
                        >
                          {t('useLatestAll')}
                        </Button>
                      )}
                    </FocusPanel>
                  )}
                  <MutationError
                    result={mutation.result}
                    prefix={prefix}
                  />
                  {mutation.uncertain && !sheet && (
                    <IntentBanner
                      prefix={prefix}
                      offline={offline}
                      busy={busy}
                      onRetry={() =>
                        mutation.intent && handle(mutation.intent, true)
                      }
                    />
                  )}
                  <RosterContainer
                    className={
                      manager
                        ? 'gap-space-0'
                        : 'mx-space-0 p-space-6 gap-space-0'
                    }
                  >
                    {rows.map((row) => (
                      <AttendanceRowView
                        key={row.id}
                        row={row}
                        prefix={prefix}
                        compact
                        status={draft[row.id]?.status ?? row.status}
                        dirty={!!draft[row.id]}
                        editable={editable}
                        disabled={locked}
                        onMark={(status) => mark(row, status)}
                      />
                    ))}
                    {rows.length === 0 && (
                      <Text testID={`${prefix}-empty`}>
                        {t(manager ? 'correction.empty' : 'editor.empty')}
                      </Text>
                    )}
                  </RosterContainer>
                  {!selectedStudent && (
                    <More
                      query={query}
                      count={rows.length}
                      prefix={prefix}
                    />
                  )}
                  {manager &&
                    !selectedStudent &&
                    session?.permissions.canRecover &&
                    Date.parse(session.endsAt) <= Date.parse(session.asOf) && (
                      <Button
                        testID="correction-missing-link"
                        variant="text"
                        onPress={() =>
                          navigation.navigate('AttendanceRecovery', {
                            sessionId: id,
                          })
                        }
                      >
                        {t('correction.missing')}
                      </Button>
                    )}
                </>
              )}
            </QueryBlock>
          )}
        </QueryBlock>
      )}
      {sheet === 'start' && (
        <ConfirmationDialog
          testID="attendance-start-dialog"
          title={t('editor.startTitle')}
          icon="fact_check"
          busy={locked}
          onClose={() => setSheet(undefined)}
        >
          <Text>{t('editor.startBody')}</Text>
          <MutationError
            result={mutation.result}
            prefix={prefix}
          />
          {mutation.uncertain ? (
            <IntentBanner
              prefix={prefix}
              offline={offline}
              busy={busy}
              onRetry={() => mutation.intent && handle(mutation.intent, true)}
            />
          ) : (
            <Button
              testID="attendance-start-confirm"
              disabled={offline || busy}
              onPress={() => handle(body('start'))}
            >
              {t('editor.startConfirm')}
            </Button>
          )}
          <Button
            variant="text"
            disabled={locked}
            onPress={() => setSheet(undefined)}
          >
            {t('editor.later')}
          </Button>
        </ConfirmationDialog>
      )}
      {sheet && sheet !== 'start' && (
        <Sheet
          testID={
            sheet === 'finalize'
              ? 'attendance-finalize-sheet'
              : sheet === 'save'
                ? 'correction-sheet'
                : `${prefix}-bulk-sheet`
          }
          title={t(
            sheet === 'finalize'
              ? 'editor.finalizeTitle'
              : sheet === 'save'
                ? 'correction.confirmTitle'
                : 'editor.bulkTitle'
          )}
          onClose={() => setSheet(undefined)}
          busy={locked}
        >
          <ScrollView
            className="max-h-[400px]"
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-space-12"
          >
            {sheet === 'finalize' ? (
              <>
                <TotalsStrip
                  totals={review?.totals}
                  prefix="attendance-finalize"
                />
                {!!review?.totals?.unmarked && (
                  <Alert
                    testID="attendance-finalize-impact"
                    warning
                  >
                    {t('editor.finalizeImpact', {
                      count: review.totals.unmarked,
                      unmarked: review.totals.unmarked,
                    })}
                  </Alert>
                )}
                {changedReview && (
                  <Alert
                    testID="finalize-changed"
                    warning
                  >
                    {t('changedReview')}
                  </Alert>
                )}
                <Text>
                  {t('editor.finalizeFoot', {
                    deadline: session
                      ? `${isoTime(session.editableUntil)} ${isoDate(session.editableUntil)}`
                      : '',
                  })}
                </Text>
              </>
            ) : sheet === 'save' ? (
              rows
                .filter((r) => draft[r.id])
                .map((row) => (
                  <Text
                    key={row.id}
                    testID={`correction-change-${row.id}`}
                  >
                    {row.name} ·{' '}
                    {t(`editor.${draft[row.id]!.baseStatus.toLowerCase()}`)} →{' '}
                    {t(`editor.${draft[row.id]!.status.toLowerCase()}`)}
                  </Text>
                ))
            ) : (
              <>
                <Text>
                  {t(
                    sheet === 'bulk-present'
                      ? 'editor.bulkPresent'
                      : 'editor.bulkAbsent',
                    { count: query.data?.totals?.eligible ?? 0 }
                  )}
                </Text>
                {count > 0 && <Text>{t('bulkDraft', { count })}</Text>}
              </>
            )}
            {manager && (
              <Field
                id="correction-reason"
                inputRef={reasonRef}
                label={t('correction.reason')}
                value={reason}
                onChange={(value) => {
                  setReason(value);
                  setReasonError(false);
                }}
                max={1000}
                error={reasonError ? t('reasonRequired') : undefined}
                disabled={locked}
              />
            )}
            <MutationError
              result={mutation.result}
              prefix={prefix}
            />
            {mutation.uncertain ? (
              <IntentBanner
                prefix={prefix}
                offline={offline}
                busy={busy}
                onRetry={() => mutation.intent && handle(mutation.intent, true)}
              />
            ) : (
              <Button
                testID={
                  sheet === 'finalize'
                    ? 'attendance-finalize-confirm'
                    : sheet === 'save'
                      ? 'correction-submit'
                      : `${prefix}-bulk-submit`
                }
                disabled={
                  offline ||
                  busy ||
                  (manager && noteLength(reason.trim()) > 1000)
                }
                busy={busy}
                onPress={() => {
                  if (manager && !reason.trim()) {
                    setReasonError(true);
                    reasonRef.current?.focus();
                    return;
                  }
                  if (sheet === 'finalize')
                    handle(body('finalize', review?.session?.version));
                  else if (sheet === 'save') save();
                  else handle(body('bulk'));
                }}
              >
                {t(
                  sheet === 'finalize'
                    ? 'editor.finalize'
                    : sheet === 'save'
                      ? 'correction.submit'
                      : 'editor.bulkConfirm'
                )}
              </Button>
            )}
            <Button
              variant="text"
              disabled={locked}
              onPress={() => setSheet(undefined)}
            >
              {t('back')}
            </Button>
          </ScrollView>
        </Sheet>
      )}
    </Page>
  );
}
