import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { Button, Card, Sheet, Text } from '@/components/ui/primitives';
import { useLeave } from '../LeaveProvider';
import { useLeaveMutation, useLeaveQuery } from '../hooks';
import { conflictMode, slotLabel, validReason } from '../model';
import {
  Notice as Alert,
  Field,
  Loading,
  More,
  OutcomeError,
  Page,
  QueryBlock,
  useWords,
} from '../components/shared';
import { ConflictCard } from './ListScreens';
import type { Candidate, Conflict, Outcome, SourceSession } from '../types';

export function MakeupPlacementScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'MakeupPlacement'>) {
  const { conflictId, classId } = route.params;
  const w = useWords(),
    { notify } = useAuth(),
    { source, offline, scenario, memory } = useLeave();
  const prefix = 'makeup-placement';
  const [conflict, setConflict] = useState<Conflict>(),
    [readResult, setReadResult] = useState<Outcome>(),
    [finding, setFinding] = useState(true);
  const [picked, setPicked] = useState<Candidate>(),
    [cancel, setCancel] = useState(false),
    [reason, setReason] = useState(''),
    [checked, setChecked] = useState(false),
    [placed, setPlaced] = useState<SourceSession>();
  const mounted = useRef(true),
    epoch = useRef(0),
    captured = useRef(0);
  const mutation = useLeaveMutation();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      epoch.current++;
    };
  }, []);
  const find = useCallback(async () => {
    if (!source) return;
    const ticket = ++epoch.current;
    setFinding(true);
    let result: Outcome = { kind: 'notFound' };
    let found: Conflict | undefined;
    if (offline) result = { kind: 'offline' };
    else
      try {
        let page = 1,
          loaded = 0;
        while (true) {
          result = await source.read({
            kind: 'conflicts',
            role: 'MANAGER',
            classId,
            pageSize: 100,
            page,
          });
          if (!mounted.current || ticket !== epoch.current) return;
          if (result.kind !== 'success') break;
          const rows = result.data.conflicts ?? [];
          found = rows.find((item) => item.id === conflictId);
          loaded += rows.length;
          if (found || loaded >= result.data.total || !rows.length) break;
          page++;
        }
        if (!found && result.kind === 'success') result = { kind: 'notFound' };
      } catch {
        result = { kind: 'error', code: 'SERVER' };
      }
    if (!mounted.current || ticket !== epoch.current) return;
    setReadResult(result);
    setFinding(false);
    if (found) setConflict(found);
    else if (result.kind === 'denied' || result.kind === 'notFound') {
      setConflict(undefined);
      setReason('');
      setPicked(undefined);
      setCancel(false);
    }
  }, [source, offline, classId, conflictId, scenario]);
  useFocusEffect(
    useCallback(() => {
      find();
      return () => {
        epoch.current++;
      };
    }, [find])
  );
  useEffect(() => {
    const listener = () => {
      find();
    };
    memory.listeners.add(listener);
    return () => {
      memory.listeners.delete(listener);
    };
  }, [find, memory]);
  const mode = conflict ? conflictMode(conflict) : undefined;
  const candidates = useLeaveQuery(
    { kind: 'candidates', role: 'MANAGER', id: conflictId, pageSize: 20 },
    !!conflict && mode === 'NEEDS_PLACEMENT' && readResult?.kind === 'success'
  );
  const classes = useLeaveQuery({
    kind: 'classes',
    role: 'MANAGER',
    pageSize: 100,
  });
  useEffect(() => {
    if (
      classes.data &&
      classes.count < classes.data.total &&
      !classes.busy &&
      !classes.footerError
    )
      classes.more();
  }, [classes.data, classes.busy]);
  const name = (id: string) =>
    classes.data?.options?.find((item) => item.id === id)?.name;
  const send = async () => {
    if (!conflict || !validReason(reason)) return;
    if (!cancel && (!picked || !checked)) return;
    if (
      cancel &&
      (!conflict.placementId || conflict.placementVersion === null)
    ) {
      await find();
      return;
    }
    const result = await mutation.submit({
      kind: cancel ? 'cancel' : 'place',
      role: 'MANAGER',
      id: cancel ? conflict.placementId! : conflict.id,
      body: cancel
        ? { reason: reason.trim(), expectedVersion: captured.current }
        : {
            reason: reason.trim(),
            expectedVersion: captured.current,
            targetSessionId: picked!.session.id,
            expectedTargetVersion: picked!.session.version,
            contentMatchConfirmed: true,
          },
    });
    if (result?.kind === 'success') {
      setPlaced(result.data.placedSession);
      setPicked(undefined);
      setCancel(false);
      setChecked(false);
      setReason('');
      if (result.data.conflicts?.[0]) setConflict(result.data.conflicts[0]);
      notify(w(cancel ? 'makeup.place.cancelled' : 'makeup.place.placed'));
      await find();
    } else if (result?.kind === 'error') {
      setChecked(false);
      await find();
      await candidates.refresh();
      if (
        result.code === 'MAKEUP_ALREADY_ASSIGNED' ||
        result.code === 'MAKEUP_STATE_CONFLICT' ||
        result.code === 'MAKEUP_NOT_ELIGIBLE'
      ) {
        setPicked(undefined);
        setCancel(false);
      }
    } else if (result?.kind === 'denied') {
      setConflict(undefined);
      setReason('');
      setPicked(undefined);
      setCancel(false);
      setReadResult(result);
    }
  };
  const close = () => {
    setPicked(undefined);
    setCancel(false);
  };
  const safe = !offline && !finding && readResult?.kind === 'success';
  return (
    <Page
      prefix={prefix}
      title={w('makeup.place.title')}
      onBack={navigation.goBack}
      dirty={!!reason}
      busy={mutation.busy}
      uncertain={mutation.uncertain}
      refresh={async () => {
        await find();
        return candidates.refresh();
      }}
      onEnd={() => {
        if (mode === 'NEEDS_PLACEMENT' && !candidates.footerError)
          candidates.more();
      }}
    >
      {readResult?.kind === 'denied' || readResult?.kind === 'notFound' ? (
        <Card
          testID={`${prefix}-${readResult.kind === 'denied' ? 'denied' : 'not-found'}`}
          className="mx-space-0"
        >
          <Text>
            {w(
              readResult.kind === 'denied' ? 'denied' : 'makeup.place.notFound'
            )}
          </Text>
        </Card>
      ) : !conflict ? (
        finding ? (
          <Loading />
        ) : (
          <Card
            testID={`${prefix}-${offline ? 'offline' : 'error'}`}
            className="mx-space-0"
          >
            <Text>{w(offline ? 'leave.offlineEmpty' : 'error')}</Text>
            {!offline && (
              <Button
                testID={`${prefix}-retry`}
                onPress={find}
              >
                {w('retry')}
              </Button>
            )}
          </Card>
        )
      ) : (
        <>
          <View testID={`${prefix}-student`}>
            <ConflictCard
              item={conflict}
              prefix={prefix}
              className={name(conflict.source.classId)}
            />
          </View>
          {mode === 'NEEDS_PLACEMENT' ? (
            <>
              <Text
                accessibilityRole="header"
                className="text-size-14 font-bvp-semibold"
              >
                {w('makeup.place.pickSection', {
                  count: candidates.data?.total ?? 0,
                })}
              </Text>
              <Text className="text-size-13 text-mdy-secondary">
                {w('makeup.place.pickHint')}
              </Text>
              {candidates.result?.kind === 'error' &&
              candidates.result.code === 'MAKEUP_NOT_ELIGIBLE' ? (
                <Alert
                  testID={`${prefix}-not-eligible`}
                  warning
                >
                  {w('makeup.place.notEligiblePending')}
                </Alert>
              ) : (
                <QueryBlock
                  query={candidates}
                  prefix={`${prefix}-candidates`}
                >
                  {candidates.data?.candidates?.map((candidate) => (
                    <Pressable
                      key={candidate.session.id}
                      testID={`${prefix}-candidate-${candidate.session.id}`}
                      accessibilityRole="button"
                      onPress={() => {
                        captured.current = conflict.version;
                        setPicked(candidate);
                        setChecked(false);
                        mutation.clear();
                      }}
                    >
                      <Card className="mx-space-0 p-space-16">
                        <View className="gap-space-8">
                          {name(candidate.session.classId) && (
                            <Text className="text-size-13 text-mdy-secondary">
                              {name(candidate.session.classId)}
                            </Text>
                          )}
                          <Text className="text-size-14 font-bvp-semibold">
                            {candidate.session.title}
                          </Text>
                          <Text>{slotLabel(candidate.session)}</Text>
                          <Text className="text-size-13 text-mdy-secondary">
                            {candidate.mentorName ?? w('noMentor')}
                          </Text>
                          <Text
                            testID={`${prefix}-candidate-seats-${candidate.session.id}`}
                            className="text-size-13 text-mdy-success"
                          >
                            {w('makeup.place.seats', {
                              count: candidate.remainingCapacity,
                            })}
                          </Text>
                        </View>
                      </Card>
                    </Pressable>
                  ))}
                  {candidates.data?.total === 0 && (
                    <Card
                      testID={`${prefix}-no-candidates`}
                      className="mx-space-0"
                    >
                      <Text>{w('makeup.place.noCandidates')}</Text>
                    </Card>
                  )}
                  <More
                    query={candidates}
                    prefix={prefix}
                  />
                </QueryBlock>
              )}
            </>
          ) : (
            <>
              {mode === 'NEEDS_REASSIGNMENT' && (
                <Alert
                  testID={`${prefix}-reassign-note`}
                  warning
                >
                  {w('makeup.place.reassignNote')}
                </Alert>
              )}
              {placed ? (
                <Card
                  testID={`${prefix}-placed`}
                  className="mx-space-0"
                >
                  <Text>{w('makeup.place.placedSection')}</Text>
                  <Text>{placed.title}</Text>
                  <Text>{slotLabel(placed)}</Text>
                </Card>
              ) : (
                <Alert testID={`${prefix}-placed-unknown`}>
                  {w('makeup.place.placedUnknown')}
                </Alert>
              )}
              {mode !== 'RESOLVED' && (
                <Button
                  testID={`${prefix}-cancel`}
                  variant={
                    mode === 'NEEDS_REASSIGNMENT' ? 'primary' : 'secondary'
                  }
                  disabled={
                    !safe || mutation.busy || conflict.placementVersion === null
                  }
                  onPress={() => {
                    captured.current = conflict.placementVersion!;
                    mutation.clear();
                    setCancel(true);
                  }}
                >
                  {w(
                    mode === 'NEEDS_REASSIGNMENT'
                      ? 'makeup.place.cancelReassign'
                      : 'makeup.place.cancel'
                  )}
                </Button>
              )}
            </>
          )}
          {offline && (
            <Alert
              testID={`${prefix}-offline`}
              warning
            >
              {w('leave.stale')}
            </Alert>
          )}
          {readResult?.kind === 'error' && (
            <Alert warning>{w('leave.stale')}</Alert>
          )}
        </>
      )}
      {!picked && !cancel && (
        <OutcomeError
          result={mutation.result}
          prefix={prefix}
        />
      )}
      {(picked || cancel) && (
        <Sheet
          testID={`${prefix}-${cancel ? 'cancel' : 'confirm'}-sheet`}
          title={w(
            cancel ? 'makeup.place.cancelTitle' : 'makeup.place.confirmTitle'
          )}
          busy={mutation.busy || mutation.uncertain}
          onClose={close}
        >
          <ScrollView
            className="max-h-[420px]"
            contentContainerClassName="gap-space-12"
          >
            {cancel ? (
              <Text>{w('makeup.place.cancelBody')}</Text>
            ) : (
              picked && (
                <>
                  <Text>
                    {w('makeup.place.willJoin', {
                      student: conflict?.studentName ?? w('mentorMissing'),
                    })}
                  </Text>
                  <Text className="font-bvp-semibold">
                    {picked.session.title}
                  </Text>
                  <Text>{slotLabel(picked.session)}</Text>
                  <Pressable
                    testID={`${prefix}-content-check`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    disabled={mutation.busy || mutation.uncertain}
                    onPress={() => setChecked(!checked)}
                    className="min-h-space-44 flex-row items-center gap-space-10"
                  >
                    <Text className="text-size-18 text-mdy-link">
                      {checked ? '☑' : '☐'}
                    </Text>
                    <Text className="flex-1 text-size-13">
                      {w('makeup.place.contentCheck')}
                    </Text>
                  </Pressable>
                </>
              )
            )}
            <Field
              id={`${prefix}-${cancel ? 'cancel-reason' : 'reason'}`}
              label={w('leave.reason')}
              value={reason}
              onChange={setReason}
              max={1000}
              multiline
              disabled={mutation.busy || mutation.uncertain}
            />
            {!cancel && (
              <Text className="text-size-12 text-mdy-secondary">
                {w('makeup.place.scopeNote')}
              </Text>
            )}
            {!safe && <Text>{w('leave.needOnline')}</Text>}
            <OutcomeError
              result={mutation.result}
              prefix={prefix}
              retry={send}
            />
            {!mutation.uncertain && (
              <Button
                testID={`${prefix}-${cancel ? 'cancel-send' : 'submit'}`}
                variant={cancel ? 'danger' : 'primary'}
                busy={mutation.busy}
                disabled={
                  !safe || !validReason(reason) || (!cancel && !checked)
                }
                onPress={send}
              >
                {w(cancel ? 'makeup.place.cancel' : 'makeup.place.submit')}
              </Button>
            )}
            <Button
              variant="text"
              disabled={mutation.busy || mutation.uncertain}
              onPress={close}
            >
              {w('back')}
            </Button>
          </ScrollView>
        </Sheet>
      )}
    </Page>
  );
}
