import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { Alert, Button, Icon, Text } from '@/components/ui/primitives';
import {
  useAttendanceMutation,
  useAttendanceQuery,
  useServerNow,
} from '../hooks';
import { isoDate, isoTime, noteLength, parseVietnamTime } from '../model';
import {
  Field,
  IntentBanner,
  MutationError,
  Page,
  QueryBlock,
  SessionHeading,
  TotalsStrip,
} from '../components/shared';
import type { AttendanceData } from '../types';

export function ManagerFinalizeScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'ManagerFinalize'>) {
  const { t } = useTranslation('attendance'),
    { notify } = useAuth();
  const sessionId = route.params.sessionId;
  const query = useAttendanceQuery({
    kind: 'attendance',
    role: 'MANAGER',
    sessionId,
    pageSize: 1,
  });
  const mutation = useAttendanceMutation();
  const [end, setEnd] = useState<string | null>(null),
    [reason, setReason] = useState(''),
    [invalid, setInvalid] = useState(false),
    [review, setReview] = useState<AttendanceData>(),
    [changed, setChanged] = useState(false);
  const endRef = useRef<TextInput>(null),
    reasonRef = useRef<TextInput>(null),
    allowLeave = useRef(false);
  const session = query.data?.session;
  const serverNow = useServerNow(session?.asOf);
  const scheduledEnd = session ? isoTime(session.endsAt) : '';
  const endTime = end ?? scheduledEnd;
  useEffect(() => {
    if (query.data && !review) setReview(query.data);
  }, [query.data, review]);
  const denied =
    query.result?.kind === 'denied' || mutation.result?.kind === 'denied';
  useEffect(() => {
    if (denied) {
      setEnd('');
      setReason('');
      setReview(undefined);
    }
  }, [denied]);
  const canFinalize = !!session?.permissions.canFinalize && !denied;
  const locked = mutation.busy || mutation.uncertain;
  const actualEndedAt = session?.actualStartedAt
    ? parseVietnamTime(isoDate(session.actualStartedAt), endTime)
    : null;
  const validTime =
    !!actualEndedAt &&
    !!session?.actualStartedAt &&
    Date.parse(actualEndedAt) > Date.parse(session.actualStartedAt) &&
    Date.parse(actualEndedAt) <= serverNow;
  const submit = async (retry = false) => {
    if (
      !retry &&
      (!validTime || !reason.trim() || noteLength(reason.trim()) > 1000)
    ) {
      setInvalid(true);
      if (!validTime) endRef.current?.focus();
      else reasonRef.current?.focus();
      return;
    }
    if (!retry) {
      const fresh = await query.refresh();
      if (
        fresh?.kind !== 'success' ||
        !fresh.data.session?.permissions.canFinalize
      )
        return;
      if (fresh.data.session.version !== review?.session?.version) {
        setReview(fresh.data);
        setChanged(true);
        return;
      }
    }
    const result = await mutation.submit(
      {
        kind: 'finalize',
        sessionId,
        role: 'MANAGER',
        expectedVersion: review?.session?.version ?? 0,
        reason: reason.trim(),
        ...(actualEndedAt ? { actualEndedAt } : {}),
      },
      retry
    );
    if (result?.kind === 'success') {
      allowLeave.current = true;
      setReason('');
      setEnd('');
      notify(t('editor.finalized'));
      navigation.goBack();
    } else if (
      result?.kind === 'error' &&
      result.code === 'SESSION_VERSION_CONFLICT'
    ) {
      const fresh = await query.refresh();
      if (fresh?.kind === 'success') {
        setReview(fresh.data);
        setChanged(true);
      }
    }
  };
  return (
    <Page
      prefix="manager-finalize"
      title={t('finalize.title')}
      subtitle={route.params.classTitle ?? session?.classTitle}
      onBack={navigation.goBack}
      dirty={(end !== null && end !== scheduledEnd) || !!reason}
      busy={mutation.busy}
      uncertain={mutation.uncertain}
      allowLeaveRef={allowLeave}
      refresh={query.refresh}
      footer={
        canFinalize ? (
          <Button
            testID="finalize-submit"
            disabled={
              query.offline || locked || noteLength(reason.trim()) > 1000
            }
            busy={mutation.busy}
            onPress={() => submit()}
          >
            {t('finalize.submit')}
          </Button>
        ) : undefined
      }
    >
      {denied ? (
        <Alert testID="manager-finalize-denied">{t('denied')}</Alert>
      ) : (
        <QueryBlock
          query={query}
          prefix="manager-finalize"
        >
          {session && <SessionHeading session={session} />}
          {!canFinalize ? (
            <>
              <Text testID="manager-finalize-unavailable">
                {t('utility.finalizeUnavailable')}
              </Text>
              {reason && <Text selectable>{reason}</Text>}
            </>
          ) : (
            <>
              <TotalsStrip
                totals={review?.totals ?? query.data?.totals}
                prefix="finalize"
              />
              {!!(review?.totals ?? query.data?.totals)?.unmarked && (
                <Alert
                  testID="finalize-impact"
                  warning
                >
                  {t('editor.finalizeImpact', {
                    count: (review?.totals ?? query.data?.totals)?.unmarked,
                  })}
                </Alert>
              )}
              {changed && (
                <Alert
                  testID="finalize-changed"
                  warning
                >
                  {t('changedReview')}
                </Alert>
              )}
              <Field
                id="finalize-end-time"
                inputRef={endRef}
                label={t('finalize.end')}
                trailing={
                  <Pressable
                    testID="finalize-use-schedule"
                    accessibilityRole="button"
                    accessibilityLabel={t('useScheduleTime')}
                    disabled={locked}
                    onPress={() => setEnd(scheduledEnd)}
                    className="w-space-44 h-space-44 items-center justify-center active:opacity-70"
                  >
                    <Icon
                      name="event_repeat"
                      size={20}
                    />
                  </Pressable>
                }
                value={endTime}
                onChange={(value) =>
                  setEnd(
                    value
                      .replace(/[^\d:]/g, '')
                      .replace(/^(\d{2})(\d)/, '$1:$2')
                      .slice(0, 5)
                  )
                }
                multiline={false}
                keyboardType="numbers-and-punctuation"
                error={invalid && !validTime ? t('timeInvalid') : undefined}
                disabled={locked}
              />
              <Field
                id="finalize-reason"
                inputRef={reasonRef}
                label={t('correction.reason')}
                value={reason}
                onChange={setReason}
                max={1000}
                error={
                  invalid && !reason.trim() ? t('reasonRequired') : undefined
                }
                disabled={locked}
              />
              <MutationError
                result={mutation.result}
                prefix="finalize"
              />
            </>
          )}
          {mutation.uncertain && (
            <IntentBanner
              prefix="finalize"
              offline={query.offline}
              busy={mutation.busy}
              onRetry={() => submit(true)}
            />
          )}
        </QueryBlock>
      )}
    </Page>
  );
}
