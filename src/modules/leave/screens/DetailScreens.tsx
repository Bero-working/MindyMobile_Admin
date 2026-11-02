import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import {
  Button,
  Card,
  Chip,
  Icon,
  Sheet,
  Text,
} from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { cn } from '@/utils/cn';
import { useLeaveMutation, useLeaveQuery } from '../hooks';
import {
  dateLabel,
  instantLabel,
  rangeLabel,
  slotLabel,
  validReason,
} from '../model';
import {
  Notice as Alert,
  Divider,
  DueLine,
  Field,
  More,
  OutcomeError,
  Page,
  QueryBlock,
  StatusChip,
  useWords,
} from '../components/shared';
import type { LeaveRequest, SourceSession } from '../types';

export function MentorLeaveDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'MentorLeaveDetail'>) {
  return (
    <Detail
      manager={false}
      id={route.params.requestId}
      navigation={navigation}
    />
  );
}
export function LeaveReviewDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'LeaveReviewDetail'>) {
  return (
    <Detail
      manager
      id={route.params.requestId}
      navigation={navigation}
    />
  );
}
function Detail({
  manager,
  id,
  navigation,
}: {
  manager: boolean;
  id: string;
  navigation: Pick<
    NativeStackScreenProps<AuthStackParams, 'MentorLeaveDetail'>['navigation'],
    'navigate' | 'goBack'
  >;
}) {
  const w = useWords(),
    { notify } = useAuth(),
    { colors } = useMindyTheme(),
    prefix = manager ? 'leave-review' : 'leave-detail';
  const role = manager ? 'MANAGER' : 'MENTOR';
  const query = useLeaveQuery({ kind: 'detail', role, id, pageSize: 20 });
  const classes = useLeaveQuery({ kind: 'classes', role, pageSize: 100 });
  const mentors = useLeaveQuery(
    {
      kind: 'mentors',
      role: 'MANAGER',
      ...(query.data?.request?.mentorId
        ? { id: query.data.request.mentorId }
        : {}),
      pageSize: 100,
    },
    manager && !!query.data?.request
  );
  useEffect(() => {
    if (
      classes.data &&
      classes.count < classes.data.total &&
      !classes.busy &&
      !classes.footerError
    )
      classes.more();
  }, [classes.data, classes.busy]);
  const mutation = useLeaveMutation();
  const [sheet, setSheet] = useState<'withdraw' | 'approve' | 'reject'>(),
    [reason, setReason] = useState(''),
    [invalid, setInvalid] = useState(false),
    [replacements, setReplacements] = useState<SourceSession[]>(),
    [saved, setSaved] = useState<LeaveRequest>();
  const version = useRef(0),
    reasonRef = useRef<TextInput>(null);
  const denied = mutation.result?.kind === 'denied';
  const request = denied ? undefined : (saved ?? query.data?.request);
  useEffect(() => {
    if (
      query.data?.request &&
      (!saved || query.data.request.version >= saved.version)
    )
      setSaved(undefined);
  }, [query.data]);
  const canAct = request?.status === 'PENDING';
  const safe =
    !query.offline &&
    query.result?.kind === 'success' &&
    !mutation.busy &&
    !mutation.uncertain;
  const approve =
    canAct && request.sourcesCurrent && request.studentConflictCount === 0;
  const mentorName =
    mentors.data?.options?.find((item) => item.id === request?.mentorId)
      ?.name ?? w('mentorMissing');
  const open = (kind: 'withdraw' | 'approve' | 'reject') => {
    if (!request) return;
    version.current = request.version;
    mutation.clear();
    setInvalid(false);
    setSheet(kind);
  };
  const send = async () => {
    if (!sheet || !request) return;
    if (!validReason(reason)) {
      setInvalid(true);
      reasonRef.current?.focus();
      return;
    }
    const result = await mutation.submit({
      kind: sheet,
      role,
      id,
      body: {
        reason: reason.trim(),
        expectedVersion: version.current,
        ...(sheet === 'approve'
          ? { acknowledgeStudentConflicts: false as const }
          : {}),
      },
    });
    if (result?.kind === 'success' && result.data.request) {
      setSaved(result.data.request);
      setReplacements(result.data.replacements);
      setSheet(undefined);
      setReason('');
      notify(
        w(
          sheet === 'withdraw'
            ? 'leave.detail.withdrawn'
            : sheet === 'approve'
              ? 'leave.review.approved'
              : 'leave.review.rejected'
        )
      );
    } else if (result?.kind === 'error') {
      const data = await query.refresh();
      if (data?.request) version.current = data.request.version;
      if (
        [
          'LEAVE_STATE_CONFLICT',
          'LEAVE_REQUEST_EXPIRED',
          'LEAVE_REQUEST_STALE',
          'LEAVE_STUDENT_CONFLICT',
          'LEAVE_STUDENT_CONFLICT_ACK_REQUIRED',
        ].includes(result.code)
      )
        setSheet(undefined);
    } else if (result?.kind === 'denied') {
      setReason('');
      setSheet(undefined);
    }
  };
  const footer = canAct ? (
    <View className="gap-space-8">
      {query.offline && <Text>{w('leave.needOnline')}</Text>}
      <View className="flex-row gap-space-12">
        {manager ? (
          <>
            <Button
              testID="leave-review-reject"
              className="flex-1"
              variant="secondary"
              disabled={!safe}
              onPress={() => open('reject')}
            >
              {w('leave.review.reject')}
            </Button>
            <Button
              testID="leave-review-approve"
              className="flex-1"
              disabled={!safe || !approve}
              accessibilityHint={!approve ? w('leave.changed') : undefined}
              onPress={() => open('approve')}
            >
              {w('leave.review.approve')}
            </Button>
          </>
        ) : (
          <Button
            testID="leave-detail-withdraw"
            className={cn(
              'flex-1 border-mdy-dangerBorder',
              !safe && 'opacity-50'
            )}
            variant="secondary"
            disabled={!safe}
            onPress={() => open('withdraw')}
          >
            <Text className="text-mdy-danger">
              {w('leave.detail.withdraw')}
            </Text>
          </Button>
        )}
      </View>
    </View>
  ) : undefined;
  return (
    <Page
      prefix={prefix}
      title={w('leave.detail.title')}
      onBack={navigation.goBack}
      refresh={query.refresh}
      footer={footer}
      busy={mutation.busy}
      dirty={!!reason}
      uncertain={mutation.uncertain}
    >
      {denied && (
        <Card
          testID={`${prefix}-denied`}
          className="mx-space-0"
        >
          <Text>{w('denied')}</Text>
        </Card>
      )}
      <QueryBlock
        query={query}
        prefix={prefix}
      >
        {request && (
          <>
            <Card className="mx-space-0 p-space-16">
              <View className="gap-space-10">
                {manager && (
                  <Text
                    testID="leave-review-mentor"
                    className="text-size-14 font-bvp-semibold"
                  >
                    {mentorName}
                  </Text>
                )}
                <View className="flex-row items-start gap-space-8">
                  <View className="flex-1 gap-space-2">
                    <Text
                      testID={`${prefix}-range`}
                      className="text-size-16 font-bvp-semibold"
                    >
                      {rangeLabel(request.fromDate, request.toDate)}
                    </Text>
                    <Text
                      testID={`${prefix}-period`}
                      className="text-size-13 text-mdy-secondary"
                    >
                      {w(request.period)}
                    </Text>
                  </View>
                  <StatusChip
                    id={`${prefix}-status`}
                    status={request.status}
                  />
                </View>
                <Text className="text-size-12 text-mdy-secondary">
                  {w('leave.sentAt', {
                    time: instantLabel(request.submittedAt),
                  })}
                </Text>
                {request.status === 'PENDING' && (
                  <DueLine
                    id={`${prefix}-due`}
                    time={instantLabel(request.expiresAt)}
                  />
                )}
                <Divider />
                <View className="gap-space-4">
                  <Text className="text-size-13 font-bvp-semibold">
                    {w('leave.reason')}
                  </Text>
                  <Text testID={`${prefix}-reason`}>{request.reason}</Text>
                </View>
              </View>
            </Card>
            {request.status !== 'PENDING' && (
              <Card
                testID={`${prefix}-${manager ? 'result' : 'review'}`}
                className="mx-space-0 p-space-16 gap-space-8"
              >
                <Text className="font-bvp-semibold">
                  {w(request.status)} ·{' '}
                  {instantLabel(
                    request.status === 'EXPIRED'
                      ? request.expiresAt
                      : (request.review?.reviewedAt ?? request.submittedAt)
                  )}
                </Text>
                {request.status === 'EXPIRED' ? (
                  <Text className="text-size-13 text-mdy-secondary">
                    {w('leave.reviewExpired')}
                  </Text>
                ) : (
                  <View className="gap-space-4">
                    <Text className="text-size-13 font-bvp-semibold">
                      {w(
                        request.status === 'WITHDRAWN'
                          ? 'leave.reviewWithdrawReason'
                          : 'leave.reviewManagerReason'
                      )}
                    </Text>
                    <Text testID={`${prefix}-review-reason`}>
                      {request.review?.reason}
                    </Text>
                  </View>
                )}
              </Card>
            )}
            {canAct && manager && !request.sourcesCurrent && (
              <Alert
                testID="leave-review-stale-block"
                danger
              >
                {w('leave.review.staleBlock')}
              </Alert>
            )}
            {canAct && (request.studentConflictCount ?? 0) > 0 && (
              <Alert
                testID={
                  manager
                    ? 'leave-review-conflict-block'
                    : 'leave-detail-conflict-warning'
                }
                danger
              >
                {w(
                  manager
                    ? 'leave.review.conflictBlock'
                    : 'leave.detail.conflictWarn',
                  { count: request.studentConflictCount! }
                )}
              </Alert>
            )}
            {canAct && !manager && (
              <Alert testID="leave-detail-not-held">
                {w('leave.detail.notHeld')}
              </Alert>
            )}
            <Text
              accessibilityRole="header"
              className="text-size-14 font-bvp-semibold"
            >
              {w('leave.detail.sessions', { count: request.itemCount })}
            </Text>
            {request.items.map((item) => {
              const name = classes.data?.options?.find(
                (option) => option.id === item.classId
              )?.name;
              const count = request.studentConflicts.filter(
                (conflict) => conflict.sourceSessionId === item.sourceSessionId
              ).length;
              const target =
                request.status === 'APPROVED'
                  ? item.replacementSessionId
                  : null;
              return (
                <Card
                  key={item.id}
                  testID={`${prefix}-session-${item.sourceSessionId}`}
                  className="mx-space-0 p-space-16"
                >
                  <View className="gap-space-8">
                    {name && (
                      <Text className="text-size-14 font-bvp-medium">
                        {name}
                      </Text>
                    )}
                    <View className="flex-row items-center gap-space-8">
                      <Icon
                        name="schedule"
                        size={16}
                        color={colors.secondary}
                      />
                      <Text className="flex-1 text-size-13 text-mdy-secondary">{`${w('leave.sourceTime')} · ${slotLabel({ startsAt: item.sourceStartsAt, endsAt: item.sourceEndsAt })}`}</Text>
                      {request.status === 'APPROVED' && (
                        <Chip variant="neutral">
                          {w('leave.detail.cancelled')}
                        </Chip>
                      )}
                    </View>
                    <Pressable
                      testID={`${prefix}-session-open-${item.sourceSessionId}`}
                      accessibilityRole={target ? 'button' : 'text'}
                      disabled={!target}
                      className="flex-row items-center gap-space-8"
                      onPress={() =>
                        target &&
                        navigation.navigate('SessionContext', {
                          sessionId: target,
                        })
                      }
                    >
                      <Icon
                        name="event_repeat"
                        size={16}
                        color={canAct || target ? colors.link : colors.tertiary}
                      />
                      <Text
                        className={
                          canAct || target
                            ? 'flex-1 text-size-13 text-mdy-link'
                            : 'flex-1 text-size-13 text-mdy-secondary'
                        }
                      >{`${w(request.status === 'APPROVED' ? 'leave.detail.replacement' : canAct ? 'leave.targetTime' : 'leave.detail.proposed')} · ${slotLabel(item)}`}</Text>
                      {target && (
                        <Icon
                          name="chevron_right"
                          size={20}
                          color={colors.tertiary}
                        />
                      )}
                    </Pressable>
                    {canAct && manager && count > 0 && (
                      <Text
                        testID={`${prefix}-session-conflict-${item.sourceSessionId}`}
                        className="text-size-13 text-mdy-danger"
                      >
                        {w('leave.review.rowConflict', { count })}
                      </Text>
                    )}
                  </View>
                </Card>
              );
            })}
            <More
              query={query}
              prefix={prefix}
            />
            {(manager || request.status === 'APPROVED') &&
              request.classExtensions.map((item) => (
                <Text
                  key={item.classId}
                  testID={`${prefix}-class-end-${item.classId}`}
                  className="text-size-13 text-mdy-secondary"
                >{`${w('leave.review.classEnd')}${classes.data?.options?.find((option) => option.id === item.classId)?.name ? ` · ${classes.data.options.find((option) => option.id === item.classId)!.name}` : ''}: ${dateLabel(item.endDate)}`}</Text>
              ))}
            {request.status === 'APPROVED' && (
              <Text className="text-size-12 text-mdy-secondary">
                {w('leave.detail.currentNote')}
              </Text>
            )}
            {manager && replacements && (
              <>
                <Text accessibilityRole="header">
                  {w('leave.review.check')}
                </Text>
                {replacements.map((session) => (
                  <Button
                    key={session.id}
                    testID={`leave-review-replacement-${session.id}`}
                    variant="secondary"
                    onPress={() =>
                      navigation.navigate('SessionContext', {
                        sessionId: session.id,
                      })
                    }
                  >
                    <Text>{`${session.title} · ${slotLabel(session)}`}</Text>
                  </Button>
                ))}
              </>
            )}
          </>
        )}
      </QueryBlock>
      {!sheet && (
        <OutcomeError
          result={mutation.result}
          prefix={prefix}
        />
      )}
      {sheet && request && (
        <Sheet
          title={w(
            sheet === 'withdraw'
              ? 'leave.detail.withdrawTitle'
              : `leave.review.${sheet}Title`
          )}
          testID={`${prefix}-${sheet}-sheet`}
          busy={mutation.busy || mutation.uncertain}
          onClose={() => setSheet(undefined)}
        >
          <ScrollView
            className="max-h-[420px]"
            contentContainerClassName="gap-space-12"
          >
            {sheet === 'approve' ? (
              <>
                <Text>
                  {mentorName} · {rangeLabel(request.fromDate, request.toDate)}
                </Text>
                <Alert warning>
                  {String(
                    `${w('leave.review.approveAfter')}\n${w('leave.review.approveCancel', { count: request.itemCount })}\n${w('leave.review.approveCreate', { count: request.itemCount, mentor: mentorName })}\n${w('leave.review.approveExtend')}\n${w('leave.review.noUndo')}`
                  )}
                </Alert>
              </>
            ) : (
              <Text>
                {w(
                  sheet === 'withdraw'
                    ? 'leave.detail.withdrawBody'
                    : 'leave.review.rejectBody',
                  { range: rangeLabel(request.fromDate, request.toDate) }
                )}
              </Text>
            )}
            <Field
              id={`${prefix}-${sheet}-reason`}
              label={w('leave.reason')}
              value={reason}
              onChange={setReason}
              max={1000}
              multiline
              inputRef={reasonRef}
              disabled={mutation.busy || mutation.uncertain}
              error={
                invalid
                  ? w(
                      validReason(reason)
                        ? 'leave.reason'
                        : reason.trim().length > 1000
                          ? 'reasonLong'
                          : 'leave.reasonRequired'
                    )
                  : undefined
              }
            />
            <OutcomeError
              result={mutation.result}
              prefix={prefix}
              retry={send}
            />
            {!mutation.uncertain && (
              <Button
                testID={`${prefix}-${sheet}-send`}
                variant={sheet === 'approve' ? 'primary' : 'danger'}
                busy={mutation.busy}
                disabled={query.offline}
                onPress={send}
              >
                {w(
                  sheet === 'withdraw'
                    ? 'leave.detail.withdraw'
                    : `leave.review.${sheet}`
                )}
              </Button>
            )}
            <Button
              {...(sheet === 'withdraw'
                ? { testID: 'leave-detail-withdraw-keep' }
                : {})}
              variant="text"
              disabled={mutation.busy || mutation.uncertain}
              onPress={() => setSheet(undefined)}
            >
              {w(sheet === 'withdraw' ? 'leave.detail.keep' : 'back')}
            </Button>
          </ScrollView>
        </Sheet>
      )}
    </Page>
  );
}
