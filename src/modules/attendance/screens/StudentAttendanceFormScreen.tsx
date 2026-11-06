import { useRef, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { Alert, Button, Card, Icon, Text } from '@/components/ui/primitives';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useMindyTheme } from '@/components/ui/theme';
import { cn } from '@/utils/cn';
import { useAttendanceMutation, useAttendanceQuery } from '../hooks';
import { isoDate, isoTime, noteLength } from '../model';
import {
  Field,
  IntentBanner,
  More,
  MutationError,
  Page,
  QueryBlock,
} from '../components/shared';

type Selection = { kind: 'class' | 'session'; id: string };

export function StudentAttendanceFormScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'StudentAttendanceForm'>) {
  const { t } = useTranslation('attendance');
  const { notify } = useAuth();
  const { student } = route.params;
  const [classId, setClassId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [mark, setMark] = useState<'PRESENT' | 'ABSENT'>();
  const [version, setVersion] = useState<number>();
  const [reason, setReason] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<Selection>();
  const [conflict, setConflict] = useState(false);
  const reasonRef = useRef<TextInput>(null);
  const mutation = useAttendanceMutation();
  const classes = useAttendanceQuery({
    kind: 'classes',
    role: 'MANAGER',
    studentId: student.id,
    pageSize: 20,
  });
  const sessions = useAttendanceQuery(
    {
      kind: 'managerSessions',
      role: 'MANAGER',
      classId,
      mode: 'correction',
      pageSize: 20,
    },
    !!classId
  );
  const roster = useAttendanceQuery(
    { kind: 'attendance', role: 'MANAGER', sessionId, pageSize: 100 },
    !!sessionId,
    true
  );
  const enrollments =
    classes.data?.managementStudents.find((item) => item.id === student.id)
      ?.enrollments ?? student.enrollments;
  const row = roster.data?.rows.find((item) =>
    enrollments.some(
      (enrollment) =>
        enrollment.classId === classId &&
        item.enrollmentId === enrollment.enrollmentId &&
        (item.makeupPlacementId ?? undefined) === enrollment.makeupPlacementId
    )
  );
  const session = roster.data?.session;
  const locked = mutation.busy || mutation.uncertain;
  const denied =
    mutation.result?.kind === 'denied' ||
    mutation.result?.kind === 'notFound' ||
    roster.result?.kind === 'denied' ||
    roster.result?.kind === 'notFound';
  const editable = !!row && !!session?.permissions.canEditAttendance && !denied;
  const changed = !!mark && mark !== row?.status;
  const dirty = changed || !!reason;
  // The API pages enrollment history: several records can refer to one class.
  // Keep every enrollment for roster matching, but show each class only once.
  const classOptions = Array.from(
    new Map(
      (classes.data?.classes ?? [])
        .filter((item) =>
          enrollments.some((entry) => entry.classId === item.id)
        )
        .map((item) => [item.id, item])
    ).values()
  );
  const sessionOptions = sessions.data?.sessions ?? [];
  const sessionLabel = (item: (typeof sessionOptions)[number]) =>
    `${item.title} · ${isoDate(item.startsAt)} · ${isoTime(item.startsAt)}`;
  const selectedSession = sessionOptions.find((item) => item.id === sessionId);

  const applySelection = (selection: Selection) => {
    if (selection.kind === 'class') {
      setClassId(selection.id);
      setSessionId('');
    } else setSessionId(selection.id);
    setMark(undefined);
    setVersion(undefined);
    setReason('');
    setInvalid(false);
    setConflict(false);
    mutation.clear();
    setPendingSelection(undefined);
  };
  const select = (selection: Selection) => {
    if (
      locked ||
      selection.id === (selection.kind === 'class' ? classId : sessionId)
    )
      return;
    if (dirty) setPendingSelection(selection);
    else applySelection(selection);
  };
  const save = async (retry = false) => {
    if (!row || !session || !editable || roster.offline || mutation.busy)
      return;
    if (
      !retry &&
      (!changed || !reason.trim() || noteLength(reason.trim()) > 1000)
    ) {
      setInvalid(true);
      reasonRef.current?.focus();
      return;
    }
    const result = await mutation.submit(
      {
        kind: 'save',
        role: 'MANAGER',
        sessionId,
        expectedVersion: version ?? session.version,
        reason: reason.trim(),
        records:
          row.entryType === 'REGULAR' && mark
            ? [{ enrollmentId: row.enrollmentId, status: mark }]
            : [],
        guestRecords:
          row.entryType === 'MAKEUP' && row.makeupPlacementId && mark
            ? [{ makeupPlacementId: row.makeupPlacementId, status: mark }]
            : [],
      },
      retry
    );
    if (result?.kind === 'success') {
      setMark(undefined);
      setVersion(undefined);
      setReason('');
      setInvalid(false);
      setConflict(false);
      notify(t('changed', { count: result.changed }));
      await roster.refresh();
    } else if (
      result?.kind === 'error' &&
      result.code === 'SESSION_VERSION_CONFLICT'
    ) {
      setMark(undefined);
      setVersion(undefined);
      setConflict(true);
      await roster.refresh();
    }
  };

  return (
    <Page
      prefix="student-attendance"
      title={t('correction.title')}
      subtitle={student.name ?? t('nameMissing')}
      onBack={navigation.goBack}
      showMockControls={false}
      dirty={dirty}
      busy={mutation.busy}
      uncertain={mutation.uncertain}
      footer={
        <Button
          testID="student-attendance-save"
          disabled={!editable || !changed || roster.offline || locked}
          busy={mutation.busy}
          onPress={() => save()}
        >
          {t('correction.submit')}
        </Button>
      }
    >
      <Card className="mx-space-0 p-space-16 gap-space-16">
        <FormSelect
          id="student-attendance-class"
          label={t('form.class')}
          placeholder={
            classes.busy && !classes.data
              ? t('loading')
              : t('utility.chooseClass')
          }
          value={classOptions.find((item) => item.id === classId)?.name}
          disabled={locked}
          options={classOptions.map((item) => ({
            id: item.id,
            label: item.name,
          }))}
          onSelect={(id) => select({ kind: 'class', id })}
        >
          <QueryBlock
            query={classes}
            prefix="student-attendance-classes"
          >
            <More
              query={classes}
              count={
                classes.data?.managementStudents.find(
                  (item) => item.id === student.id
                )?.enrollments.length ??
                classes.data?.classes.length ??
                0
              }
              prefix="student-attendance-classes"
            />
            {classOptions.length === 0 && (
              <FormSelectEmpty testID="student-attendance-classes-empty">
                {t('utility.noClasses')}
              </FormSelectEmpty>
            )}
          </QueryBlock>
        </FormSelect>
        <FormSelect
          key={classId}
          id="student-attendance-session"
          label={t('form.session')}
          placeholder={
            !classId
              ? t('form.sessionNeedsClass')
              : sessions.busy && !sessions.data
                ? t('loading')
                : t('utility.chooseSession')
          }
          value={selectedSession ? sessionLabel(selectedSession) : undefined}
          disabled={!classId || locked}
          options={sessionOptions.map((item) => ({
            id: item.id,
            label: sessionLabel(item),
          }))}
          onSelect={(id) => select({ kind: 'session', id })}
        >
          {classId && (
            <QueryBlock
              query={sessions}
              prefix="student-attendance-sessions"
            >
              <More
                query={sessions}
                count={sessionOptions.length}
                prefix="student-attendance-sessions"
              />
              {sessionOptions.length === 0 && (
                <FormSelectEmpty testID="student-attendance-sessions-empty">
                  {t('form.noSessions')}
                </FormSelectEmpty>
              )}
            </QueryBlock>
          )}
        </FormSelect>
        <View
          testID="student-attendance-record-slot"
          className="min-h-space-24 justify-center"
        >
          {!sessionId ? (
            <Text className="text-size-13 text-mdy-secondary">
              {t('form.current', { status: '—' })}
            </Text>
          ) : !roster.data && (!roster.result || roster.busy) ? (
            <Text className="text-size-13 text-mdy-secondary">
              {t('loading')}
            </Text>
          ) : (
            <QueryBlock
              query={roster}
              prefix="student-attendance-record"
            >
              {!row ? (
                <Text testID="student-attendance-missing">
                  {t('correction.empty')}
                </Text>
              ) : !editable ? (
                <Alert testID="student-attendance-no-edit">
                  {t('correction.noEdit')}
                </Alert>
              ) : (
                <Text
                  testID="student-attendance-current"
                  className="text-size-13 text-mdy-secondary"
                >
                  {t('form.current', {
                    status: t(`editor.${row.status.toLowerCase()}`),
                  })}
                </Text>
              )}
            </QueryBlock>
          )}
        </View>
        <View className="gap-space-6">
          <Text className="text-size-13 font-bvp-medium">
            {t('form.status')}
          </Text>
          <View className="flex-row gap-space-8">
            {(['PRESENT', 'ABSENT'] as const).map((status) => {
              const selected = (mark ?? row?.status) === status;
              const disabled = !editable || locked;
              return (
                <Button
                  key={status}
                  testID={`student-attendance-${status.toLowerCase()}`}
                  variant={selected ? 'primary' : 'secondary'}
                  disabled={disabled}
                  onPress={() => {
                    setMark(status);
                    setVersion((old) => old ?? session?.version);
                    setConflict(false);
                  }}
                  // Secondary has no disabled look of its own.
                  className={cn(
                    'flex-1',
                    disabled && !selected && 'opacity-50'
                  )}
                >
                  {t(`editor.${status.toLowerCase()}`)}
                </Button>
              );
            })}
          </View>
        </View>
        <Field
          id="student-attendance-reason"
          label={t('correction.reason')}
          value={reason}
          onChange={(value) => {
            setReason(value);
            setInvalid(false);
          }}
          inputRef={reasonRef}
          max={1000}
          disabled={!editable || locked}
          error={invalid ? t('reasonRequired') : undefined}
        />
        {conflict && (
          <Alert testID="student-attendance-conflict">
            {t('stateChanged')}
          </Alert>
        )}
        <MutationError
          result={mutation.result}
          prefix="student-attendance"
        />
        {mutation.uncertain && (
          <IntentBanner
            prefix="student-attendance"
            offline={roster.offline}
            busy={mutation.busy}
            onRetry={() => save(true)}
          />
        )}
      </Card>
      {pendingSelection && (
        <ConfirmationDialog
          testID="student-attendance-discard"
          title={t('leaveTitle')}
          icon="warning"
          onClose={() => setPendingSelection(undefined)}
        >
          <Text>{t('leaveBody', { count: changed ? 1 : 0 })}</Text>
          <Button
            testID="student-attendance-discard-confirm"
            onPress={() => applySelection(pendingSelection)}
          >
            {t('leaveDiscard')}
          </Button>
          <Button
            variant="text"
            onPress={() => setPendingSelection(undefined)}
          >
            {t('leaveStay')}
          </Button>
        </ConfirmationDialog>
      )}
    </Page>
  );
}

function FormSelectEmpty({
  testID,
  children,
}: React.PropsWithChildren<{ testID: string }>) {
  return (
    <View className="min-h-space-44 justify-center px-space-12 py-space-10">
      <Text
        testID={testID}
        className="text-size-14 font-bvp-regular text-mdy-secondary"
      >
        {children}
      </Text>
    </View>
  );
}

function FormSelect({
  id,
  label,
  placeholder,
  value,
  disabled,
  options,
  onSelect,
  children,
}: React.PropsWithChildren<{
  id: string;
  label: string;
  placeholder: string;
  value?: string | undefined;
  disabled?: boolean;
  options: { id: string; label: string }[];
  onSelect: (id: string) => void;
}>) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<View>(null);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, variables } = useMindyTheme();
  const [anchor, setAnchor] = useState({
    x: 16,
    y: 100,
    width: width - 32,
    height: 48,
  });
  const menuWidth = Math.min(anchor.width, width - 32);
  const below = Math.max(
    0,
    height - insets.bottom - anchor.y - anchor.height - 16
  );
  const menuHeight = Math.max(44, Math.min(320, below));
  const openMenu = () => {
    Keyboard.dismiss();
    trigger.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
      if (measuredWidth > 0)
        setAnchor({
          x,
          y,
          width: measuredWidth,
          height: measuredHeight,
        });
    });
    setOpen(true);
  };
  return (
    <View className="gap-space-6">
      <Text className="text-size-13 font-bvp-medium">{label}</Text>
      <Pressable
        ref={trigger}
        testID={id}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value ?? placeholder}`}
        accessibilityState={{ disabled: !!disabled, expanded: open }}
        disabled={disabled}
        onPress={openMenu}
        className={cn(
          'min-h-space-48 flex-row items-center gap-space-8 rounded-radius-14 border border-mdy-border p-space-12',
          disabled ? 'bg-mdy-muted2' : 'bg-mdy-surface'
        )}
      >
        <Text
          className={cn(
            'flex-1 text-size-14 font-bvp-regular',
            disabled
              ? 'text-mdy-tertiary'
              : value
                ? 'text-mdy-ink'
                : 'text-mdy-secondary'
          )}
        >
          {value ?? placeholder}
        </Text>
        <Icon
          name="expand_more"
          size={20}
          color={disabled ? colors.iconDisabled : colors.ink}
        />
      </Pressable>
      {open && !disabled && (
        <Modal
          transparent
          visible
          hardwareAccelerated
          animationType="none"
          onRequestClose={() => setOpen(false)}
        >
          <View
            className="flex-1"
            style={variables}
            accessibilityViewIsModal
          >
            <Pressable
              testID={`${id}-dropdown-dismiss`}
              style={StyleSheet.absoluteFill}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => setOpen(false)}
            />
            <View
              testID={`${id}-dropdown`}
              className="rounded-radius-14 border border-mdy-border bg-mdy-surface"
              style={[
                dropdownStyles.menu,
                {
                  left: Math.max(
                    16,
                    Math.min(anchor.x, width - menuWidth - 16)
                  ),
                  width: menuWidth,
                  maxHeight: menuHeight,
                  shadowColor: colors.ink,
                  top: anchor.y + anchor.height + 8,
                },
              ]}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                contentContainerClassName="p-space-4"
              >
                {options.map((option) => (
                  <Pressable
                    key={option.id}
                    testID={`${id}-option-${option.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    className="min-h-space-44 justify-center bg-mdy-surface px-space-12 py-space-10"
                    onPress={() => {
                      setOpen(false);
                      onSelect(option.id);
                    }}
                  >
                    <Text className="text-size-14 font-bvp-regular text-mdy-ink">
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
                {children}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const dropdownStyles = StyleSheet.create({
  menu: {
    elevation: 8,
    position: 'absolute',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
});
