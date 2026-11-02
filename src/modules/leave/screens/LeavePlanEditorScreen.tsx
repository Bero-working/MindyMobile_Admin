import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { Button, Card, Icon, Sheet, Text } from '@/components/ui/primitives';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useMindyTheme } from '@/components/ui/theme';
import { useLeave } from '../LeaveProvider';
import { useLeaveMutation, useLeaveQuery } from '../hooks';
import {
  dateRangeError,
  instantLabel,
  periods,
  reconcileMappings,
  requestBytes,
  slotAllowed,
  slotLabel,
  timeLabel,
  validReason,
  vietnamDay,
} from '../model';
import {
  Notice as Alert,
  DateField,
  DayTile,
  Field,
  Loading,
  OutcomeError,
  Page,
  StatusChip,
  useWords,
} from '../components/shared';
import type {
  LeaveIntent,
  Mapping,
  Outcome,
  Period,
  Preview,
  Slot,
  SourceSession,
} from '../types';

export function LeavePlanEditorScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'LeavePlanEditor'>) {
  const w = useWords(),
    { notify } = useAuth(),
    { colors } = useMindyTheme(),
    { source, offline } = useLeave();
  const [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [period, setPeriod] = useState<Period>('FULL_DAY');
  const [preview, setPreview] = useState<Preview>(),
    [mappings, setMappings] = useState<Record<string, Mapping>>({}),
    [reason, setReason] = useState('');
  const [reading, setReading] = useState(false),
    [result, setResult] = useState<Outcome>(),
    [changed, setChanged] = useState(false),
    [confirm, setConfirm] = useState(false),
    [tooLarge, setTooLarge] = useState(false),
    [invalid, setInvalid] = useState(false);
  const [editRange, setEditRange] = useState<{
      from: string;
      to: string;
      period: Period;
    }>(),
    [picked, setPicked] = useState<SourceSession>();
  const mutation = useLeaveMutation(),
    reasonRef = useRef<TextInput>(null),
    allowLeave = useRef(false),
    previewLock = useRef(false),
    epoch = useRef(0),
    mounted = useRef(true);
  const rangeError = from && to ? dateRangeError(from, to) : undefined;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      epoch.current++;
    };
  }, []);
  const editable = !mutation.busy && !mutation.uncertain && !reading;
  const changeRange = (value: { from: string; to: string; period: Period }) => {
    if (Object.keys(mappings).length) {
      setEditRange(value);
      return;
    }
    applyRange(value);
  };
  const applyRange = (value: { from: string; to: string; period: Period }) => {
    epoch.current++;
    setFrom(value.from);
    setTo(value.to);
    setPeriod(value.period);
    setPreview(undefined);
    setMappings({});
    setChanged(false);
    setResult(undefined);
    setEditRange(undefined);
  };
  const readPreview = async (checking = false) => {
    if (previewLock.current || !source || offline || !from || !to || rangeError)
      return undefined;
    const ticket = ++epoch.current;
    previewLock.current = true;
    setReading(true);
    setTooLarge(false);
    let response: Outcome;
    try {
      response = await source.read({
        kind: 'preview',
        role: 'MENTOR',
        fromDate: from,
        toDate: to,
        period,
      });
    } catch {
      response = { kind: 'error', code: 'SERVER' };
    }
    previewLock.current = false;
    if (!mounted.current || ticket !== epoch.current) return undefined;
    setReading(false);
    setResult(response);
    if (response.kind === 'denied') {
      setPreview(undefined);
      setMappings({});
      setReason('');
      setFrom('');
      setTo('');
      return undefined;
    }
    if (response.kind !== 'success' || !response.data.preview) return undefined;
    const value = response.data.preview;
    const next = {
      ...value,
      sources: [...value.sources].sort(
        (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)
      ),
    };
    const newMappings = reconcileMappings(mappings, next);
    const differs =
      !!preview &&
      JSON.stringify(
        [...preview.sourceVersions].sort((a, b) =>
          a.sessionId.localeCompare(b.sessionId)
        )
      ) !==
        JSON.stringify(
          [...next.sourceVersions].sort((a, b) =>
            a.sessionId.localeCompare(b.sessionId)
          )
        );
    setPreview(next);
    setMappings(newMappings);
    setChanged(checking && differs);
    return { preview: next, mappings: newMappings, differs };
  };
  const makeBody = (
    value: Preview,
    selected: Record<string, Mapping>
  ): LeaveIntent['body'] => ({
    fromDate: from,
    toDate: to,
    period,
    reason: reason.trim(),
    sourceVersions: value.sourceVersions.map((item) => ({ ...item })),
    sessionMappings: value.sources.map((item) => ({
      sourceSessionId: item.id,
      targetDate:
        selected[item.id]!.targetDate ??
        vietnamDay(selected[item.id]!.startsAt),
      targetPeriod: selected[item.id]!.targetPeriod ?? 'EVENING',
      startsAt: selected[item.id]!.startsAt,
      endsAt: selected[item.id]!.endsAt,
    })),
  });
  const prepared = useRef<LeaveIntent['body'] | undefined>(undefined);
  const prepare = async () => {
    if (!validReason(reason)) {
      setInvalid(true);
      reasonRef.current?.focus();
      return;
    }
    const refreshed = await readPreview(true);
    if (
      !refreshed ||
      refreshed.differs ||
      !refreshed.preview.noticeEligible ||
      !refreshed.preview.sources.length ||
      refreshed.preview.sources.some((item) => !refreshed.mappings[item.id])
    )
      return;
    const body = makeBody(refreshed.preview, refreshed.mappings);
    if (requestBytes(body) > 64 * 1024) {
      setTooLarge(true);
      return;
    }
    prepared.current = body;
    setConfirm(true);
  };
  const send = async () => {
    if (!prepared.current) return;
    const response = await mutation.submit({
      kind: 'create',
      role: 'MENTOR',
      body: prepared.current,
    });
    if (response?.kind === 'success' && response.data.request) {
      allowLeave.current = true;
      setConfirm(false);
      notify(w('sent'));
      navigation.replace('MentorLeaveDetail', {
        requestId: response.data.request.id,
      });
    } else if (response?.kind === 'denied') {
      setConfirm(false);
      setPreview(undefined);
      setMappings({});
      setReason('');
      setFrom('');
      setTo('');
      setResult(response);
    } else if (response?.kind !== 'uncertain') {
      setConfirm(false);
      if (
        response?.kind === 'error' &&
        ['LEAVE_REQUEST_STALE', 'LEAVE_NOTICE_TOO_SHORT'].includes(
          response.code
        )
      )
        await readPreview(true);
    }
  };
  const validPreview = preview?.noticeEligible && preview.sources.length > 0;
  const done = preview?.sources.filter((item) => mappings[item.id]).length ?? 0;
  const footer = validPreview ? (
    <View className="flex-row items-center gap-space-12">
      <Text
        testID="leave-plan-progress"
        className="flex-1 text-size-13"
      >
        {w('leave.plan.progress', { done, total: preview.sources.length })}
      </Text>
      <Button
        testID="leave-plan-submit"
        disabled={offline || !editable || done !== preview.sources.length}
        busy={reading || mutation.busy}
        onPress={prepare}
      >
        {w('leave.plan.submit')}
      </Button>
    </View>
  ) : undefined;
  return (
    <Page
      prefix="leave-plan"
      title={w('leave.plan.title')}
      onBack={navigation.goBack}
      footer={footer}
      dirty={!!from || !!to || !!reason}
      busy={reading || mutation.busy}
      uncertain={mutation.uncertain}
      allowLeave={allowLeave}
    >
      <Text
        accessibilityRole="header"
        className="text-size-14 font-bvp-semibold"
      >
        {`1. ${w('leave.plan.sectionRange')}`}
      </Text>
      <View className="flex-row gap-space-12">
        <View className="flex-1">
          <DateField
            id="leave-plan-from"
            label={w('leave.plan.from')}
            value={from}
            disabled={!editable}
            onChange={(value) =>
              changeRange({ from: value, to: to || value, period })
            }
          />
        </View>
        <View className="flex-1">
          <DateField
            id="leave-plan-to"
            label={w('leave.plan.to')}
            value={to}
            disabled={!editable}
            onChange={(value) => changeRange({ from, to: value, period })}
          />
        </View>
      </View>
      <Text className="text-size-13 font-bvp-medium">
        {w('leave.plan.period')}
      </Text>
      <View
        accessibilityRole="radiogroup"
        className="flex-row flex-wrap gap-space-8"
      >
        {periods.map((value) => {
          const [name, hours] = w(value).split(' · ');
          return (
            <Pressable
              key={value}
              testID={`leave-plan-period-${value.toLowerCase()}`}
              accessibilityRole="radio"
              accessibilityLabel={w(value)}
              accessibilityState={{
                selected: period === value,
                disabled: !editable,
              }}
              disabled={!editable}
              onPress={() => changeRange({ from, to, period: value })}
              className={
                period === value
                  ? 'grow basis-[45%] min-h-space-56 justify-center items-center px-space-12 py-space-8 rounded-radius-14 border border-mdy-primary bg-mdy-primary'
                  : 'grow basis-[45%] min-h-space-56 justify-center items-center px-space-12 py-space-8 rounded-radius-14 border border-mdy-border bg-mdy-surface'
              }
            >
              <Text
                className={
                  period === value
                    ? 'text-size-14 font-bvp-semibold text-mdy-onBrand'
                    : 'text-size-14 font-bvp-medium'
                }
              >
                {name}
              </Text>
              {hours && (
                <Text
                  className={
                    period === value
                      ? 'text-size-11 text-mdy-onBrandMuted'
                      : 'text-size-11 text-mdy-secondary'
                  }
                >
                  {hours}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
      <Text className="text-size-12 text-mdy-secondary">
        {w('leave.plan.periodHint')}
      </Text>
      {rangeError && (
        <Text
          testID="leave-plan-range-error"
          className="text-size-13 text-mdy-danger"
        >
          {w(
            rangeError === 'before'
              ? 'leave.plan.toBeforeFrom'
              : rangeError === 'max'
                ? 'leave.plan.rangeMax'
                : 'invalidDate'
          )}
        </Text>
      )}
      <Button
        testID="leave-plan-preview"
        variant="secondary"
        disabled={!from || !to || !!rangeError || offline || !editable}
        busy={reading}
        onPress={() => readPreview()}
      >
        {w('leave.plan.preview')}
      </Button>
      {offline && (
        <Alert
          testID="leave-plan-offline"
          warning
        >
          {w('leave.needOnline')}
        </Alert>
      )}
      {result?.kind === 'denied' && (
        <Card
          testID="leave-plan-denied"
          className="mx-space-0"
        >
          <Text>{w('denied')}</Text>
        </Card>
      )}
      {result?.kind === 'error' && (
        <View className="gap-space-8">
          <OutcomeError
            result={result}
            prefix="leave-plan"
          />
          {!offline && (
            <Button
              testID="leave-plan-retry"
              onPress={() => readPreview()}
            >
              {w('retry')}
            </Button>
          )}
        </View>
      )}
      {reading && <Loading />}
      {preview && !reading && (
        <>
          {!preview.sources.length ? (
            <Alert testID="leave-plan-no-sessions">
              {w('leave.plan.noSessions')}
            </Alert>
          ) : (
            <>
              {!preview.noticeEligible ? (
                <Alert
                  testID="leave-plan-notice-late"
                  danger
                >
                  {w('leave.plan.noticeLate', {
                    session: instantLabel(preview.sources[0]!.startsAt),
                    deadline: preview.noticeDeadline
                      ? instantLabel(preview.noticeDeadline)
                      : '—',
                  })}
                </Alert>
              ) : (
                <>
                  <Text
                    accessibilityRole="header"
                    className="text-size-14 font-bvp-semibold"
                  >
                    {`2. ${w('leave.plan.sectionMakeup', {
                      done,
                      total: preview.sources.length,
                    })}`}
                  </Text>
                  <Alert testID="leave-plan-notice-ok">
                    {w('leave.plan.noticeOk', {
                      deadline: preview.noticeDeadline
                        ? instantLabel(preview.noticeDeadline)
                        : '—',
                    })}
                  </Alert>
                </>
              )}
              {changed && (
                <Alert
                  testID="leave-plan-changed"
                  warning
                >
                  {w('changed')}
                </Alert>
              )}
              {preview.sources.map((item) => (
                <Card
                  key={item.id}
                  testID={`leave-plan-session-${item.id}`}
                  className="mx-space-0 p-space-16"
                >
                  <View className="gap-space-12">
                    <View className="flex-row gap-space-12">
                      <DayTile value={item.startsAt} />
                      <View className="flex-1 gap-space-2">
                        {item.className && (
                          <Text className="text-size-13 text-mdy-secondary">
                            {item.className}
                          </Text>
                        )}
                        <Text className="text-size-14 font-bvp-semibold">
                          {item.title}
                        </Text>
                        <Text className="text-size-13">
                          {`${timeLabel(item.startsAt)}–${timeLabel(item.endsAt)}`}
                        </Text>
                        {item.assignment === 'SUBSTITUTE' && (
                          <StatusChip status="leave.plan.substitute" />
                        )}
                      </View>
                    </View>
                    {mappings[item.id] && (
                      <View className="flex-row items-center gap-space-8">
                        <Icon
                          name="event_repeat"
                          size={16}
                          color={colors.link}
                        />
                        <Text
                          testID={`leave-plan-session-target-${item.id}`}
                          className="flex-1 text-size-13 text-mdy-link"
                        >
                          {w('leave.targetTime')} ·{' '}
                          {slotLabel(mappings[item.id]!)}
                        </Text>
                        {preview.noticeEligible && (
                          <Button
                            testID={`leave-plan-pick-${item.id}`}
                            size="sm"
                            variant="secondary"
                            disabled={offline || !editable}
                            onPress={() => setPicked(item)}
                          >
                            {w('leave.plan.change')}
                          </Button>
                        )}
                      </View>
                    )}
                    {!mappings[item.id] && preview.noticeEligible && (
                      <Button
                        testID={`leave-plan-pick-${item.id}`}
                        size="sm"
                        variant="secondary"
                        disabled={offline || !editable}
                        onPress={() => setPicked(item)}
                      >
                        {w('leave.plan.pick')}
                      </Button>
                    )}
                  </View>
                </Card>
              ))}
              {validPreview && (
                <>
                  <Text
                    accessibilityRole="header"
                    className="text-size-14 font-bvp-semibold"
                  >
                    {`3. ${w('leave.plan.sectionReason')}`}
                  </Text>
                  <Field
                    id="leave-plan-reason"
                    hideLabel
                    label={w('leave.reason')}
                    value={reason}
                    onChange={(value) => {
                      setReason(value);
                      setInvalid(false);
                    }}
                    max={1000}
                    multiline
                    inputRef={reasonRef}
                    disabled={!editable}
                    error={
                      invalid
                        ? w(
                            reason.trim().length > 1000
                              ? 'reasonLong'
                              : 'leave.reasonRequired'
                          )
                        : undefined
                    }
                  />
                  <Text className="text-size-13 text-mdy-secondary">
                    {w('leave.plan.pendingNote')}
                  </Text>
                  <Text className="text-size-12 text-mdy-secondary">
                    {w('leave.plan.memoryNote')}
                  </Text>
                </>
              )}
            </>
          )}
        </>
      )}
      {tooLarge && (
        <Alert
          testID="leave-plan-too-large"
          danger
        >
          {w('bodyTooLarge')}
        </Alert>
      )}
      {!confirm && (
        <OutcomeError
          result={mutation.result}
          prefix="leave-plan"
          retry={send}
        />
      )}
      {picked && (
        <SlotPicker
          source={picked}
          range={{ fromDate: from, toDate: to, period }}
          others={Object.entries(mappings)
            .filter(([id]) => id !== picked.id)
            .map(([, value]) => value)}
          onClose={() => setPicked(undefined)}
          onChanged={async () => {
            setPicked(undefined);
            await readPreview(true);
          }}
          onPick={(value) => {
            setMappings({
              ...mappings,
              [picked.id]: { ...value, version: picked.version },
            });
            setPicked(undefined);
          }}
        />
      )}
      {editRange && (
        <ConfirmationDialog
          testID="leave-plan-range-dialog"
          title={w('leaveTitle')}
          icon="warning"
          onClose={() => setEditRange(undefined)}
        >
          <Text>
            {w('changeRange', { count: Object.keys(mappings).length })}
          </Text>
          <Button
            testID="leave-plan-keep-range"
            onPress={() => setEditRange(undefined)}
          >
            {w('keepRange')}
          </Button>
          <Button
            testID="leave-plan-clear-range"
            variant="danger"
            onPress={() => applyRange(editRange)}
          >
            {w('clearRange')}
          </Button>
        </ConfirmationDialog>
      )}
      {confirm && preview && (
        <ConfirmationDialog
          testID="leave-plan-confirm"
          title={w('leave.plan.confirmTitle')}
          icon="event_note"
          busy={mutation.busy || mutation.uncertain}
          onClose={() => setConfirm(false)}
        >
          <Text>
            {w('leave.plan.confirmBody', {
              count: preview.sources.length,
              expires: instantLabel(preview.sources[0]!.startsAt),
            })}
          </Text>
          <OutcomeError
            result={mutation.result}
            prefix="leave-plan"
            retry={send}
          />
          {!mutation.uncertain && (
            <Button
              testID="leave-plan-confirm-send"
              busy={mutation.busy}
              disabled={offline}
              onPress={send}
            >
              {w('leave.plan.submit')}
            </Button>
          )}
          <Button
            variant="text"
            disabled={mutation.busy || mutation.uncertain}
            onPress={() => setConfirm(false)}
          >
            {w('leave.plan.confirmBack')}
          </Button>
        </ConfirmationDialog>
      )}
    </Page>
  );
}
function SlotPicker({
  source,
  range,
  others,
  onPick,
  onClose,
  onChanged,
}: {
  source: SourceSession;
  range: { fromDate: string; toDate: string; period: Period };
  others: Slot[];
  onPick: (slot: Slot & { targetDate: string; targetPeriod: Period }) => void;
  onClose: () => void;
  onChanged: () => void;
}) {
  const w = useWords(),
    { offline } = useLeave();
  const originalHour = Number(timeLabel(source.startsAt).slice(0, 2));
  const [date, setDate] = useState(''),
    [period, setPeriod] = useState<Period>(
      originalHour < 12
        ? 'MORNING'
        : originalHour < 18
          ? 'AFTERNOON'
          : 'EVENING'
    ),
    [selected, setSelected] = useState<Slot>();
  const query = useLeaveQuery(
    {
      kind: 'slots',
      role: 'MENTOR',
      id: source.id,
      targetDate: date,
      targetPeriod: period,
    },
    !!date
  );
  const scroll = useRef<ScrollView>(null),
    positions = useRef(new Map<string, number>());
  useEffect(() => {
    if (
      query.data?.sessionVersion !== undefined &&
      query.data.sessionVersion !== source.version
    )
      onChanged();
  }, [query.data]);
  const slots =
    query.data?.slots?.filter((slot) => slotAllowed(slot, range, others)) ?? [];
  const closest = [...slots].sort(
    (a, b) =>
      Math.abs(
        Number(timeLabel(a.startsAt).replace(':', '')) -
          Number(timeLabel(source.startsAt).replace(':', ''))
      ) -
      Math.abs(
        Number(timeLabel(b.startsAt).replace(':', '')) -
          Number(timeLabel(source.startsAt).replace(':', ''))
      )
  )[0];
  const move = () => {
    const y = closest ? positions.current.get(closest.startsAt) : undefined;
    if (y !== undefined)
      scroll.current?.scrollTo({ y: Math.max(0, y - 40), animated: false });
  };
  return (
    <Sheet
      testID="leave-plan-slot-sheet"
      title={w('leave.plan.pickTitle')}
      onClose={onClose}
    >
      <Text className="font-bvp-semibold">{source.title}</Text>
      <Text className="text-size-13 text-mdy-secondary">
        {slotLabel(source)} ·{' '}
        {w('leave.plan.duration', {
          minutes:
            (Date.parse(source.endsAt) - Date.parse(source.startsAt)) / 60000,
        })}
      </Text>
      <DateField
        id="leave-plan-target-date"
        label={w('leave.plan.targetDate')}
        value={date}
        onChange={(value) => {
          setDate(value);
          setSelected(undefined);
        }}
        disabled={offline}
      />
      <View className="flex-row flex-wrap gap-space-8">
        {periods
          .filter((value) => value !== 'FULL_DAY')
          .map((value) => (
            <Button
              key={value}
              testID={`leave-plan-target-period-${value.toLowerCase()}`}
              size="sm"
              variant={period === value ? 'primary' : 'secondary'}
              disabled={offline}
              onPress={() => {
                setPeriod(value);
                setSelected(undefined);
              }}
            >
              {w(value)}
            </Button>
          ))}
      </View>
      {!date ? (
        <Text>{w('leave.plan.pickDateFirst')}</Text>
      ) : query.busy ? (
        <Loading />
      ) : query.result?.kind === 'error' ? (
        <View>
          <Text>{w('error')}</Text>
          {!offline && (
            <Button
              testID="leave-plan-slot-retry"
              onPress={query.retry}
            >
              {w('retry')}
            </Button>
          )}
        </View>
      ) : !slots.length ? (
        <Text testID="leave-plan-slot-empty">{w('leave.plan.noSlots')}</Text>
      ) : (
        <ScrollView
          ref={scroll}
          className="max-h-[220px]"
          onContentSizeChange={move}
        >
          <View className="flex-row flex-wrap gap-space-8">
            {slots.map((slot) => (
              <Pressable
                key={slot.startsAt}
                testID={`leave-plan-slot-${timeLabel(slot.startsAt)}`}
                accessibilityRole="radio"
                accessibilityState={{
                  selected: selected?.startsAt === slot.startsAt,
                }}
                onLayout={({ nativeEvent }) => {
                  positions.current.set(slot.startsAt, nativeEvent.layout.y);
                  move();
                }}
                onPress={() => setSelected(slot)}
                className={
                  selected?.startsAt === slot.startsAt
                    ? 'grow basis-[45%] min-h-space-44 items-center justify-center px-space-12 rounded-radius-14 border border-mdy-primary bg-mdy-primary'
                    : 'grow basis-[45%] min-h-space-44 items-center justify-center px-space-12 rounded-radius-14 border border-mdy-border bg-mdy-surface'
                }
              >
                <Text
                  className={
                    selected?.startsAt === slot.startsAt
                      ? 'text-mdy-onBrand text-size-13'
                      : 'text-mdy-ink text-size-13'
                  }
                >{`${timeLabel(slot.startsAt)}–${timeLabel(slot.endsAt)}`}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
      <Button
        testID="leave-plan-use-slot"
        disabled={!selected || offline}
        onPress={() =>
          selected &&
          onPick({ ...selected, targetDate: date, targetPeriod: period })
        }
      >
        {w('leave.plan.useSlot')}
      </Button>
      <Button
        testID="leave-plan-slot-close"
        variant="text"
        onPress={onClose}
      >
        {w('close')}
      </Button>
    </Sheet>
  );
}
