import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import {
  Avatar,
  Button,
  Card,
  CircleIcon,
  Sheet,
  Text,
} from '@/components/ui/primitives';
import { useLeaveQuery } from '../hooks';
import {
  conflictMode,
  instantLabel,
  rangeLabel,
  slotLabel,
  statuses,
} from '../model';
import {
  Notice as Alert,
  Divider,
  DueLine,
  Field,
  Filters,
  More,
  Page,
  QueryBlock,
  StatusChip,
  useWords,
} from '../components/shared';
import type { Conflict, LeaveRequest, LeaveStatus, Option } from '../types';

export function LeaveCard({
  item,
  prefix,
  mentorName,
  onPress,
}: {
  item: LeaveRequest;
  prefix: string;
  mentorName?: string | undefined;
  onPress?: (() => void) | undefined;
}) {
  const w = useWords();
  const period = w(item.period),
    meta = `${w('leave.sessionCount', { count: item.itemCount })} · ${w('leave.sentAt', { time: instantLabel(item.submittedAt) })}`,
    due = item.status === 'PENDING' ? instantLabel(item.expiresAt) : undefined;
  const content = (
    <Card className="mx-space-0 p-space-16">
      <View className="gap-space-8">
        {mentorName && (
          <View className="flex-row gap-space-8 items-center">
            <Avatar
              name={mentorName}
              size={36}
            />
            <Text
              testID={`${prefix}-row-mentor-${item.id}`}
              className="text-size-14 font-bvp-semibold"
            >
              {mentorName}
            </Text>
          </View>
        )}
        <View className="flex-row gap-space-8 items-start">
          <View className="flex-1 gap-space-2">
            <Text className="text-size-15 font-bvp-semibold">
              {rangeLabel(item.fromDate, item.toDate)}
            </Text>
            <Text className="text-size-13 text-mdy-secondary">{period}</Text>
          </View>
          <StatusChip
            id={`${prefix}-row-status-${item.id}`}
            status={item.status}
          />
        </View>
        <Text
          numberOfLines={2}
          className="text-size-13"
        >
          {item.reason}
        </Text>
        <Divider />
        <Text className="text-size-12 text-mdy-secondary">{meta}</Text>
        {due && (
          <DueLine
            id={`${prefix}-row-due-${item.id}`}
            time={due}
          />
        )}
      </View>
    </Card>
  );
  return onPress ? (
    <Pressable
      testID={`${prefix}-row-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={[
        mentorName,
        rangeLabel(item.fromDate, item.toDate),
        period,
        w(item.status),
        item.reason,
        meta,
        due && w('leave.dueAt', { time: due }),
      ]
        .filter(Boolean)
        .join(', ')}
      onPress={onPress}
    >
      {content}
    </Pressable>
  ) : (
    content
  );
}
export function ConflictCard({
  item,
  prefix,
  className,
  onPress,
}: {
  item: Conflict;
  prefix: string;
  className?: string | undefined;
  onPress?: (() => void) | undefined;
}) {
  const w = useWords(),
    mode = conflictMode(item);
  const sorted = [...item.intervals].sort(
    (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)
  );
  const content = (
    <Card className="mx-space-0 p-space-16">
      <View className="gap-space-8">
        <View className="flex-row items-center gap-space-8">
          <Avatar
            name={item.studentName ?? w('mentorMissing')}
            size={36}
          />
          <Text className="flex-1 text-size-14 font-bvp-semibold">
            {item.studentName ?? w('mentorMissing')}
          </Text>
          {/* Chip self-aligns to the top; the wrapper centers it on the name. */}
          <View>
            <StatusChip
              id={`${prefix}-row-status-${item.id}`}
              status={mode}
            />
          </View>
        </View>
        {className && (
          <Text
            testID={`${prefix}-row-class-${item.id}`}
            className="text-size-13 text-mdy-secondary"
          >
            {className}
          </Text>
        )}
        <Text className="text-size-14 font-bvp-medium">
          {item.source.title}
        </Text>
        <Text className="text-size-13 text-mdy-secondary">
          {slotLabel(item.source)}
        </Text>
        {!!sorted.length && (
          <Text
            testID={`${prefix}-row-overlap-${item.id}`}
            className="text-size-13 text-mdy-warning"
          >
            {w('makeup.conflicts.overlap', { time: slotLabel(sorted[0]!) })}
            {sorted.length > 1
              ? ` · ${w('makeup.conflicts.overlapMore', { count: sorted.length - 1 })}`
              : ''}
          </Text>
        )}
        {mode === 'NEEDS_REASSIGNMENT' && (
          <Text className="text-size-13 text-mdy-danger">
            {w('makeup.conflicts.reassignNote')}
          </Text>
        )}
        {mode === 'MAKEUP_ASSIGNED' && (
          <Text className="text-size-13 text-mdy-secondary">
            {w('makeup.conflicts.assignedNote')}
          </Text>
        )}
      </View>
    </Card>
  );
  return onPress && mode !== 'RESOLVED' ? (
    <Pressable
      testID={`${prefix}-row-${item.id}`}
      accessibilityRole="button"
      onPress={onPress}
    >
      {content}
    </Pressable>
  ) : (
    <View testID={`${prefix}-row-${item.id}`}>{content}</View>
  );
}
function Picker({
  prefix,
  kind,
  options,
  onPick,
  onClose,
  error,
  retry,
}: {
  prefix: string;
  kind: 'mentor' | 'class';
  options: Option[] | undefined;
  onPick: (id: string) => void;
  onClose: () => void;
  error: boolean;
  retry: () => void;
}) {
  const w = useWords(),
    [search, setSearch] = useState('');
  return (
    <Sheet
      testID={`${prefix}-${kind}-sheet`}
      title={w(
        kind === 'mentor'
          ? 'leave.queue.mentorSheet'
          : 'makeup.conflicts.classSheet'
      )}
      onClose={onClose}
    >
      <Field
        id={`${prefix}-${kind}-search`}
        label={w(
          kind === 'mentor'
            ? 'leave.queue.mentorSearch'
            : 'makeup.conflicts.classSearch'
        )}
        value={search}
        onChange={setSearch}
      />
      <ScrollView
        className="max-h-[360px]"
        contentContainerClassName="gap-space-8"
      >
        {options
          ?.filter((item) =>
            item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())
          )
          .map((item) => (
            <Button
              key={item.id}
              testID={`${prefix}-${kind}-option-${item.id}`}
              variant="secondary"
              onPress={() => {
                onPick(item.id);
                onClose();
              }}
            >
              {item.name}
            </Button>
          ))}
        {error && (
          <>
            <Text>{w('error')}</Text>
            <Button onPress={retry}>{w('retry')}</Button>
          </>
        )}
      </ScrollView>
    </Sheet>
  );
}
export function MentorLeaveListScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'MentorLeaveList'>) {
  return (
    <LeaveList
      manager={false}
      navigation={navigation}
    />
  );
}
export function LeaveReviewQueueScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'LeaveReviewQueue'>) {
  return (
    <LeaveList
      manager
      navigation={navigation}
    />
  );
}
function LeaveList({
  manager,
  navigation,
}: {
  manager: boolean;
  navigation: Pick<
    NativeStackScreenProps<AuthStackParams, 'MentorLeaveList'>['navigation'],
    'navigate' | 'goBack'
  >;
}) {
  const w = useWords(),
    prefix = manager ? 'leave-queue' : 'leave-list';
  const [status, setStatus] = useState<LeaveStatus | 'ALL'>(
      manager ? 'PENDING' : 'ALL'
    ),
    [mentorId, setMentorId] = useState<string>(),
    [picker, setPicker] = useState(false);
  const query = useLeaveQuery({
    kind: 'list',
    role: manager ? 'MANAGER' : 'MENTOR',
    pageSize: 20,
    ...(status === 'ALL' ? {} : { status }),
    ...(mentorId ? { mentorId } : {}),
  });
  const mentors = useLeaveQuery(
    { kind: 'mentors', role: 'MANAGER', pageSize: 100 },
    manager
  );
  useEffect(() => {
    if (
      mentors.data &&
      mentors.count < mentors.data.total &&
      !mentors.busy &&
      !mentors.footerError
    )
      mentors.more();
  }, [mentors.data, mentors.busy]);
  const filtered = manager
    ? status !== 'PENDING' || !!mentorId
    : status !== 'ALL';
  const clear = () => {
    setStatus(manager ? 'PENDING' : 'ALL');
    setMentorId(undefined);
  };
  const empty = query.data?.total === 0;
  const create = (
    <Button
      testID="leave-list-create"
      icon="add"
      onPress={() => navigation.navigate('LeavePlanEditor')}
    >
      {w('leave.list.create')}
    </Button>
  );
  return (
    <Page
      prefix={prefix}
      title={w('leave.list.title')}
      subtitle={
        manager && query.data
          ? w('leave.queue.subtitle', { count: query.data.total })
          : undefined
      }
      onBack={navigation.goBack}
      refresh={query.refresh}
      onEnd={() => {
        if (!query.footerError) query.more();
      }}
      footer={!manager && !empty ? create : undefined}
    >
      <Filters
        prefix={prefix}
        value={status}
        options={(manager ? statuses : ['ALL', ...statuses]).map((value) => ({
          value,
          label: w(value === 'ALL' ? 'all' : value),
        }))}
        onChange={(value) => setStatus(value as LeaveStatus | 'ALL')}
      >
        {manager && (
          <>
            <Button
              variant="secondary"
              testID={`${prefix}-mentor-filter`}
              onPress={() => setPicker(true)}
            >
              {mentors.data?.options?.find((item) => item.id === mentorId)
                ?.name ?? w('leave.queue.mentor')}
            </Button>
            {mentorId && (
              <Button
                variant="text"
                testID={`${prefix}-mentor-clear`}
                onPress={() => setMentorId(undefined)}
              >
                {w('close')}
              </Button>
            )}
          </>
        )}
      </Filters>
      <QueryBlock
        query={query}
        prefix={prefix}
      >
        {query.data?.requests?.map((item) => (
          <LeaveCard
            key={item.id}
            item={item}
            prefix={prefix}
            mentorName={
              manager
                ? (mentors.data?.options?.find(
                    (option) => option.id === item.mentorId
                  )?.name ?? w('mentorMissing'))
                : undefined
            }
            onPress={() =>
              manager
                ? navigation.navigate('LeaveReviewDetail', {
                    requestId: item.id,
                  })
                : navigation.navigate('MentorLeaveDetail', {
                    requestId: item.id,
                  })
            }
          />
        ))}
        {empty && (
          <Card
            testID={`${prefix}-${filtered ? 'empty-filter' : 'empty'}`}
            className="mx-space-0"
            center
          >
            {!filtered && <CircleIcon name="event_note" />}
            <Text className="text-center">
              {w(
                filtered
                  ? manager
                    ? 'leave.queue.emptyFilter'
                    : 'leave.list.emptyFilter'
                  : manager
                    ? 'leave.queue.emptyPending'
                    : 'leave.list.empty'
              )}
            </Text>
            {filtered ? (
              <Button
                testID={
                  manager ? 'leave-queue-clear-filters' : 'leave-list-show-all'
                }
                variant="text"
                onPress={clear}
              >
                {w(manager ? 'leave.queue.clear' : 'leave.list.showAll')}
              </Button>
            ) : !manager ? (
              create
            ) : null}
          </Card>
        )}
        <More
          query={query}
          prefix={prefix}
        />
      </QueryBlock>
      {picker && (
        <Picker
          prefix={prefix}
          kind="mentor"
          options={mentors.data?.options}
          onPick={setMentorId}
          onClose={() => setPicker(false)}
          error={mentors.result?.kind === 'error'}
          retry={mentors.retry}
        />
      )}
    </Page>
  );
}
export function MakeupConflictsScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'MakeupConflicts'>) {
  const w = useWords(),
    prefix = 'makeup-conflicts';
  const [status, setStatus] = useState('ACTIVE'),
    [classId, setClassId] = useState<string>(),
    [picker, setPicker] = useState(false);
  const query = useLeaveQuery({
    kind: 'conflicts',
    role: 'MANAGER',
    pageSize: 20,
    ...(status === 'ACTIVE' ? {} : { status }),
    ...(classId ? { classId } : {}),
  });
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
  const clear = () => {
    setStatus('ACTIVE');
    setClassId(undefined);
  };
  const keys = {
    ACTIVE: 'filterActive',
    OPEN: 'filterOpen',
    MAKEUP_ASSIGNED: 'filterAssigned',
    RESOLVED: 'filterResolved',
  };
  return (
    <Page
      prefix={prefix}
      title={w('makeup.conflicts.title')}
      subtitle={
        query.data
          ? w('makeup.conflicts.subtitle', { count: query.data.total })
          : undefined
      }
      onBack={navigation.goBack}
      refresh={query.refresh}
      onEnd={() => {
        if (!query.footerError) query.more();
      }}
    >
      <Alert testID={`${prefix}-info`}>{w('makeup.conflicts.info')}</Alert>
      <Filters
        prefix={prefix}
        options={Object.entries(keys).map(([value, label]) => ({
          value,
          label: w(`makeup.conflicts.${label}`),
        }))}
        value={status}
        onChange={setStatus}
      >
        <Button
          testID={`${prefix}-class-filter`}
          variant="secondary"
          onPress={() => setPicker(true)}
        >
          {classes.data?.options?.find((item) => item.id === classId)?.name ??
            w('makeup.conflicts.class')}
        </Button>
        {classId && (
          <Button
            testID={`${prefix}-class-clear`}
            variant="text"
            onPress={() => setClassId(undefined)}
          >
            {w('close')}
          </Button>
        )}
      </Filters>
      <QueryBlock
        query={query}
        prefix={prefix}
      >
        {query.data?.conflicts?.map((item) => (
          <ConflictCard
            key={item.id}
            item={item}
            prefix={prefix}
            className={
              classes.data?.options?.find(
                (option) => option.id === item.source.classId
              )?.name
            }
            onPress={() =>
              navigation.navigate('MakeupPlacement', {
                conflictId: item.id,
                classId: item.source.classId,
              })
            }
          />
        ))}
        {query.data?.total === 0 && (
          <Card
            testID={`${prefix}-${status !== 'ACTIVE' || classId ? 'empty-filter' : 'empty'}`}
            className="mx-space-0"
            center
          >
            <Text>
              {w(
                status !== 'ACTIVE' || classId
                  ? 'makeup.conflicts.emptyFilter'
                  : 'makeup.conflicts.empty'
              )}
            </Text>
            {(status !== 'ACTIVE' || classId) && (
              <Button
                testID={`${prefix}-clear-filters`}
                variant="text"
                onPress={clear}
              >
                {w('makeup.conflicts.clear')}
              </Button>
            )}
          </Card>
        )}
        <More
          query={query}
          prefix={prefix}
        />
      </QueryBlock>
      {picker && (
        <Picker
          prefix={prefix}
          kind="class"
          options={classes.data?.options}
          onPick={setClassId}
          onClose={() => setPicker(false)}
          error={classes.result?.kind === 'error'}
          retry={classes.retry}
        />
      )}
    </Page>
  );
}
