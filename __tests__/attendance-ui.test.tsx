import {
  act,
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthApp, type AuthService } from '@/modules/auth';
import { MindyThemeProvider } from '@/components/ui/theme';
import { createAttendanceMock } from '@/modules/attendance/services/mockAttendance';
import i18n from '@/translations';
jest.setTimeout(20000);
configure({ asyncUtilTimeout: 4000 });
import type {
  AttendanceScenario,
  AttendanceSource,
} from '@/modules/attendance/types';

function open(
  role = 'MENTOR',
  source?: AttendanceSource,
  attendanceMock = true
) {
  const service: AuthService = {
    restore: async () => ({
      kind: 'user',
      user: {
        email: `${role}@example.test`,
        displayName: 'Trần Thị Linh',
        role,
      },
    }),
    login: async () => ({ kind: 'signedOut' }),
    logout: async () => ({ kind: 'ok' }),
  };
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 800 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <MindyThemeProvider>
        <AuthApp
          service={service}
          cache={new QueryClient()}
          teachingMock
          attendanceMock={attendanceMock}
          attendanceSource={source}
        />
      </MindyThemeProvider>
    </SafeAreaProvider>
  );
}
beforeEach(async () => {
  await i18n.changeLanguage('vi');
});
test('development review default source accepts a saved draft', async () => {
  open();
  await editor();
  fireEvent.press(screen.getByTestId('attendance-mark-attendance-2-present'));
  fireEvent.press(screen.getByTestId('attendance-finalize'));
  await waitFor(
    () =>
      expect(
        screen.queryByTestId('attendance-row-attendance-2-unsaved')
      ).toBeNull(),
    { timeout: 4000 }
  );
});
async function editor() {
  fireEvent.press(await screen.findByTestId('workspace-today-attend'));
  await screen.findByTestId('attendance-row-attendance-1');
}
test('TC-P2-HOME-06, S1 draft/save: totals remain saved until commit', async () => {
  const base = createAttendanceMock();
  const write = jest.fn(base.write);
  open('MENTOR', { ...base, write });
  await editor();
  const before = await base.read({
    kind: 'attendance',
    role: 'MENTOR',
    sessionId: 'today-primary',
  });
  expect(screen.queryByTestId('attendance-total-present')).toBeNull();
  expect(screen.queryByTestId('attendance-bulk-present')).toBeNull();
  expect(screen.queryByTestId('attendance-sync')).toBeNull();
  expect(
    screen.getByTestId('attendance-mark-attendance-3-present')
  ).toHaveTextContent('Vắng');
  expect(
    screen.queryByTestId('attendance-mark-attendance-3-absent')
  ).toBeNull();
  fireEvent.press(screen.getByTestId('attendance-mark-attendance-2-present'));
  expect(
    screen.getByTestId('attendance-row-attendance-2-unsaved')
  ).toBeTruthy();
  const unsaved = await base.read({
    kind: 'attendance',
    role: 'MENTOR',
    sessionId: 'today-primary',
  });
  if (before.kind !== 'success' || unsaved.kind !== 'success')
    throw new Error('Expected attendance');
  expect(unsaved.data.totals).toEqual(before.data.totals);
  fireEvent.press(screen.getByTestId('attendance-finalize'));
  await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
  expect(await write.mock.results[0]?.value).toMatchObject({ kind: 'success' });
  await waitFor(() =>
    expect(
      screen.queryByTestId('attendance-row-attendance-2-unsaved')
    ).toBeNull()
  );
});
test('TC-P2-S1-58/59: offline permits loaded draft; reconnect does not write', async () => {
  const base = createAttendanceMock();
  const write = jest.fn(base.write);
  open('MENTOR', { ...base, write });
  await editor();
  fireEvent.press(screen.getByTestId('attendance-mock-badge'));
  fireEvent.press(await screen.findByTestId('attendance-scenario-offline'));
  fireEvent.press(screen.getByTestId('attendance-mark-attendance-2-present'));
  expect(screen.getByTestId('attendance-finalize')).toBeDisabled();
  expect(write).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('attendance-mock-badge'));
  fireEvent.press(await screen.findByTestId('attendance-scenario-success'));
  await waitFor(() =>
    expect(screen.getByTestId('attendance-finalize')).not.toBeDisabled()
  );
  expect(write).not.toHaveBeenCalled();
});
test('TC-P2-S1-41/43/46: save before finalizing; note action stays available', async () => {
  const base = createAttendanceMock(),
    write = jest.fn(base.write);
  open('MENTOR', { ...base, write });
  await editor();
  fireEvent.press(screen.getByTestId('attendance-mark-attendance-2-present'));
  expect(screen.queryByTestId('attendance-save')).toBeNull();
  fireEvent.press(screen.getByTestId('attendance-finalize'));
  await screen.findByTestId('attendance-finalize-sheet');
  expect(write.mock.calls[0]?.[0].kind).toBe('save');
  expect(screen.getByTestId('attendance-finalize-impact')).toBeTruthy();
  fireEvent.press(screen.getByTestId('attendance-finalize-confirm'));
  await screen.findByTestId('attendance-note-action');
  expect(write.mock.calls[1]?.[0].kind).toBe('finalize');
});
test('TC-P2-S2-01/03/24: independent note version and dirty Back guard', async () => {
  const base = createAttendanceMock(),
    write = jest.fn(base.write);
  open('MENTOR', { ...base, write });
  fireEvent.press(await screen.findByTestId('workspace-today-session'));
  fireEvent.press(await screen.findByTestId('session-note'));
  fireEvent.changeText(
    await screen.findByTestId('note-content'),
    '  Nội dung 😀  '
  );
  fireEvent.press(screen.getByTestId('note-back'));
  await screen.findByTestId('leave-dialog');
  fireEvent.press(screen.getByTestId('leave-stay'));
  fireEvent.press(screen.getByTestId('note-save'));
  await waitFor(() => expect(write).toHaveBeenCalled());
  expect(write.mock.calls[0]?.[0]).toMatchObject({
    kind: 'note',
    expectedVersion: 0,
    content: '  Nội dung 😀  ',
  });
});
test('Manager backlog uses one horizontal filter row and removes old per-session actions', async () => {
  open('MANAGER');
  await screen.findByTestId('workspace-incomplete-summary');
  expect(screen.queryByTestId('workspace-open-incomplete')).toBeNull();
  fireEvent.press(await screen.findByTestId('workspace-incomplete-summary'));
  expect(screen.getByTestId('incomplete-status-scroll').props.horizontal).toBe(
    true
  );
  fireEvent.press(
    await screen.findByTestId('incomplete-row-overdue-not-finalized')
  );
  await screen.findByTestId('manager-att-row-attendance-1');
  fireEvent.press(screen.getByTestId('session-tab-overview'));
  expect(screen.queryByTestId('manager-att-correct')).toBeNull();
  expect(screen.queryByTestId('manager-att-audits')).toBeNull();
  expect(screen.queryByTestId('manager-att-finalize')).toBeNull();
});
test('TC-P2-S1-22/23: uncertain response locks editor and retries same intent', async () => {
  let scenario: AttendanceScenario = 'success';
  const source = createAttendanceMock(() => scenario),
    write = jest.fn(source.write);
  open('MENTOR', { ...source, write });
  await editor();
  scenario = 'uncertain';
  fireEvent.press(screen.getByTestId('attendance-mark-attendance-2-present'));
  fireEvent.press(screen.getByTestId('attendance-finalize'));
  await screen.findByTestId('attendance-intent-banner');
  expect(
    screen.getByTestId('attendance-mark-attendance-1-absent')
  ).toBeDisabled();
  scenario = 'success';
  fireEvent.press(screen.getByTestId('attendance-resend'));
  await waitFor(() => expect(write).toHaveBeenCalledTimes(2));
  expect(write.mock.calls[0]?.[0]).toEqual(write.mock.calls[1]?.[0]);
});

test('P5 replaces mock session editor; overdue context cannot reschedule or change historical teaching data', async () => {
  const source = createAttendanceMock();
  const write = jest.fn(source.write);
  open('MANAGER', { ...source, write });
  fireEvent.press(await screen.findByTestId('workspace-incomplete-summary'));
  fireEvent.press(
    await screen.findByTestId('incomplete-row-overdue-not-started')
  );
  fireEvent.press(await screen.findByTestId('session-tab-overview'));
  expect(screen.queryByTestId('manager-session-edit')).toBeNull();
  expect(screen.queryByTestId('session-ops-reschedule')).toBeNull();
  expect(write).not.toHaveBeenCalled();
});

test('Student attendance form selects class and session inline and requires a reason', async () => {
  const source = createAttendanceMock();
  const write = jest.fn(source.write);
  open('MANAGER', { ...source, write });
  fireEvent.press(
    await screen.findByTestId('workspace-open-attendance-management')
  );
  fireEvent.press(
    await screen.findByTestId('attendance-students-row-student-2')
  );
  expect(await screen.findByTestId('student-attendance-screen')).toBeTruthy();
  expect(screen.getByTestId('student-attendance-session')).toBeDisabled();
  expect(screen.getByText('Chọn lớp học trước')).toBeTruthy();
  expect(screen.getByTestId('student-attendance-reason')).toBeTruthy();
  fireEvent.press(await screen.findByTestId('student-attendance-class'));
  expect(
    await screen.findByTestId('student-attendance-class-dropdown')
  ).toHaveStyle({ position: 'absolute' });
  fireEvent.press(
    screen.getByTestId('student-attendance-class-dropdown-dismiss')
  );
  expect(screen.queryByTestId('student-attendance-class-dropdown')).toBeNull();
  fireEvent.press(screen.getByTestId('student-attendance-class'));

  fireEvent.press(
    await screen.findByTestId('student-attendance-class-option-primary')
  );
  fireEvent.press(await screen.findByTestId('student-attendance-session'));
  expect(
    screen.queryByTestId(
      'student-attendance-session-option-overdue-not-started'
    )
  ).toBeNull();
  fireEvent.press(
    await screen.findByTestId('student-attendance-session-option-today-primary')
  );
  await screen.findByTestId('student-attendance-current');
  expect(screen.queryByTestId('correction-row-attendance-1')).toBeNull();
  fireEvent.press(screen.getByTestId('student-attendance-present'));
  fireEvent.press(await screen.findByTestId('student-attendance-save'));
  expect(write).not.toHaveBeenCalled();
  fireEvent.changeText(
    screen.getByTestId('student-attendance-reason'),
    'Verified with mentor'
  );
  fireEvent.press(screen.getByTestId('student-attendance-save'));
  await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
  expect(write.mock.calls[0]?.[0]).toMatchObject({
    kind: 'save',
    reason: 'Verified with mentor',
    records: [{ enrollmentId: 'enrollment-2', status: 'PRESENT' }],
    guestRecords: [],
  });
  await waitFor(() =>
    expect(screen.getByTestId('student-attendance-save')).toBeDisabled()
  );
  const after = await source.read({
    kind: 'attendance',
    role: 'MANAGER',
    sessionId: 'today-primary',
  });
  if (after.kind !== 'success') throw new Error('Expected attendance');
  expect(after.data.rows[0]?.status).toBe('PRESENT');
  expect(after.data.rows[1]?.status).toBe('PRESENT');
  expect(after.data.audits[0]?.reason).toBe('Verified with mentor');
});

test('Selecting a class keeps the form fields mounted while sessions load', async () => {
  const source = createAttendanceMock();
  let finishLoading!: () => void;
  const pending = new Promise<void>((resolve) => {
    finishLoading = resolve;
  });
  const read: AttendanceSource['read'] = async (request) => {
    if (request.kind === 'managerSessions') await pending;
    return source.read(request);
  };
  open('MANAGER', { ...source, read });
  fireEvent.press(
    await screen.findByTestId('workspace-open-attendance-management')
  );
  fireEvent.press(
    await screen.findByTestId('attendance-students-row-student-2')
  );
  fireEvent.press(await screen.findByTestId('student-attendance-class'));
  fireEvent.press(
    await screen.findByTestId('student-attendance-class-option-primary')
  );
  expect(screen.getByTestId('student-attendance-session')).toBeTruthy();
  expect(screen.getByTestId('student-attendance-reason')).toBeTruthy();
  expect(screen.getByTestId('student-attendance-record-slot')).toBeTruthy();
  expect(screen.queryByTestId('attendance-loading')).toBeNull();
  await act(async () => finishLoading());
  fireEvent.press(screen.getByTestId('student-attendance-session'));
  fireEvent.press(
    await screen.findByTestId('student-attendance-session-option-today-primary')
  );
  await screen.findByTestId('student-attendance-current');
  expect(screen.queryByTestId('attendance-loading')).toBeNull();
});

test('Changing class within the form confirms discarding edits and resets dependent fields', async () => {
  open('MANAGER');
  fireEvent.press(
    await screen.findByTestId('workspace-open-attendance-management')
  );
  fireEvent.press(
    await screen.findByTestId('attendance-students-row-student-2')
  );
  fireEvent.press(await screen.findByTestId('student-attendance-class'));
  fireEvent.press(
    await screen.findByTestId('student-attendance-class-option-primary')
  );
  fireEvent.press(await screen.findByTestId('student-attendance-session'));
  fireEvent.press(
    await screen.findByTestId('student-attendance-session-option-today-primary')
  );
  await screen.findByTestId('student-attendance-current');
  fireEvent.press(screen.getByTestId('student-attendance-present'));
  fireEvent.changeText(
    screen.getByTestId('student-attendance-reason'),
    'Unsaved reason'
  );
  fireEvent.press(screen.getByTestId('student-attendance-class'));
  fireEvent.press(
    await screen.findByTestId('student-attendance-class-option-substitute')
  );
  expect(await screen.findByTestId('student-attendance-discard')).toBeTruthy();
  expect(screen.getByTestId('student-attendance-reason').props.value).toBe(
    'Unsaved reason'
  );
  fireEvent.press(screen.getByTestId('student-attendance-discard-confirm'));
  await waitFor(() =>
    expect(screen.queryByTestId('student-attendance-current')).toBeNull()
  );
  expect(screen.getByTestId('student-attendance-reason').props.value).toBe('');
  expect(screen.getByTestId('student-attendance-save')).toBeDisabled();
  expect(screen.getByTestId('student-attendance-present')).toBeDisabled();
  fireEvent.press(await screen.findByTestId('student-attendance-session'));
  expect(
    await screen.findByTestId(
      'student-attendance-session-option-substitute-completed'
    )
  ).toBeTruthy();
  expect(
    screen.queryByTestId('student-attendance-session-option-today-primary')
  ).toBeNull();
});

test('TC-P2-S2-13/14/15: note conflict keeps text and requires an explicit new save', async () => {
  let scenario: AttendanceScenario = 'success';
  const source = createAttendanceMock(() => scenario),
    write = jest.fn(source.write);
  open('MENTOR', { ...source, write });
  fireEvent.press(await screen.findByTestId('workspace-today-session'));
  fireEvent.press(await screen.findByTestId('session-note'));
  fireEvent.changeText(
    await screen.findByTestId('note-content'),
    'Bản của tôi'
  );
  scenario = 'conflict';
  fireEvent.press(screen.getByTestId('note-save'));
  await screen.findByTestId('note-conflict');
  expect(screen.getByTestId('note-content').props.value).toBe('Bản của tôi');
  fireEvent.press(screen.getByTestId('note-keep-mine'));
  expect(write).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByTestId('note-save'));
  await waitFor(() => expect(write).toHaveBeenCalledTimes(2));
  expect(write.mock.calls[1]?.[0].expectedVersion).toBe(1);
  expect(write.mock.calls[1]?.[0].key).not.toBe(write.mock.calls[0]?.[0].key);
});

test('TC-P2-S1-32: denied mutation erases the visible snapshot and draft', async () => {
  const source = createAttendanceMock();
  open('MENTOR', { ...source, write: async () => ({ kind: 'denied' }) });
  await editor();
  fireEvent.press(screen.getByTestId('attendance-mark-attendance-2-present'));
  fireEvent.press(screen.getByTestId('attendance-finalize'));
  await screen.findByTestId('attendance-denied');
  expect(screen.queryByTestId('attendance-row-attendance-1')).toBeNull();
  expect(
    screen.queryByTestId('attendance-row-attendance-2-unsaved')
  ).toBeNull();
});

test('TC-P2-S1-28: expired write closes editing even if cached permissions are stale', async () => {
  const source = createAttendanceMock();
  const write = jest.fn(async () => ({
    kind: 'error' as const,
    code: 'ATTENDANCE_EDIT_WINDOW_EXPIRED',
  }));
  open('MENTOR', {
    ...source,
    write,
  });
  await editor();
  fireEvent.press(screen.getByTestId('attendance-mark-attendance-2-present'));
  await act(async () =>
    fireEvent.press(screen.getByTestId('attendance-finalize'))
  );
  expect(write).toHaveBeenCalled();
  await waitFor(() =>
    expect(
      screen.queryByTestId('attendance-mark-attendance-2-present')
    ).toBeNull()
  );
  expect(
    screen.getByTestId('attendance-row-attendance-2-unsaved')
  ).toBeTruthy();
  expect(screen.queryByTestId('attendance-finalize')).toBeNull();
});

test('TC-P2-S4-15/16/17: capabilities hide the complete action group', async () => {
  const source = createAttendanceMock();
  const read: AttendanceSource['read'] = async (request) => {
    const result = await source.read(request);
    return result.kind === 'success' &&
      request.kind === 'attendance' &&
      result.data.session
      ? {
          kind: 'success',
          data: {
            ...result.data,
            session: {
              ...result.data.session,
              permissions: {
                canStart: false,
                canEditAttendance: false,
                canSyncRoster: false,
                canFinalize: false,
                canRecover: false,
                canViewAttendanceAudits: false,
              },
            },
          },
        }
      : result;
  };
  open('MANAGER', { ...source, read });
  fireEvent.press(await screen.findByTestId('workspace-incomplete-summary'));
  fireEvent.press(
    await screen.findByTestId('incomplete-row-overdue-not-finalized')
  );
  await screen.findByTestId('manager-att-row-attendance-1');
  expect(screen.queryByTestId('manager-att-history-attendance-1')).toBeNull();
  fireEvent.press(screen.getByTestId('session-tab-overview'));
  await screen.findByTestId('session-title');
  expect(screen.queryByTestId('manager-att-actions')).toBeNull();
});

test('TC-P2-S2-28/29: offline keeps typing and reconnect never writes a note', async () => {
  const source = createAttendanceMock(),
    write = jest.fn(source.write);
  open('MENTOR', { ...source, write });
  fireEvent.press(await screen.findByTestId('workspace-today-session'));
  fireEvent.press(await screen.findByTestId('session-note'));
  fireEvent.changeText(await screen.findByTestId('note-content'), 'Chưa lưu');
  fireEvent.press(screen.getByTestId('attendance-mock-badge'));
  fireEvent.press(await screen.findByTestId('attendance-scenario-offline'));
  fireEvent.changeText(screen.getByTestId('note-content'), 'Vẫn gõ được');
  expect(screen.getByTestId('note-save')).toBeDisabled();
  fireEvent.press(screen.getByTestId('attendance-mock-badge'));
  fireEvent.press(await screen.findByTestId('attendance-scenario-success'));
  await waitFor(() =>
    expect(screen.getByTestId('note-save')).not.toBeDisabled()
  );
  expect(write).not.toHaveBeenCalled();
  expect(screen.getByTestId('note-content').props.value).toBe('Vẫn gõ được');
});

test('Session detail attendance is read-only with no history icons or unmarked labels', async () => {
  const source = createAttendanceMock();
  const write = jest.fn(source.write);
  open('MANAGER', { ...source, write });
  fireEvent.press(await screen.findByTestId('workspace-incomplete-summary'));
  fireEvent.press(
    await screen.findByTestId('incomplete-row-overdue-not-finalized')
  );
  await screen.findByTestId('manager-att-row-attendance-3');
  expect(screen.queryByTestId('manager-att-history-attendance-3')).toBeNull();
  expect(
    screen.queryByTestId('manager-att-mark-attendance-3-present')
  ).toBeNull();
  expect(screen.queryByText(i18n.t('attendance:editor.unmarked'))).toBeNull();
  expect(write).not.toHaveBeenCalled();
});

test('Student correction explains an empty session dropdown', async () => {
  const source = createAttendanceMock();
  open('MANAGER', {
    ...source,
    read: async (request) => {
      const result = await source.read(request);
      return request.kind === 'managerSessions' && result.kind === 'success'
        ? { ...result, data: { ...result.data, sessions: [], total: 0 } }
        : result;
    },
  });
  fireEvent.press(
    await screen.findByTestId('workspace-open-attendance-management')
  );
  fireEvent.press(
    await screen.findByTestId('attendance-students-row-student-2')
  );
  fireEvent.press(await screen.findByTestId('student-attendance-class'));
  fireEvent.press(
    await screen.findByTestId('student-attendance-class-option-primary')
  );
  await waitFor(() =>
    expect(screen.getByText('Chọn buổi học để tiếp tục')).toBeTruthy()
  );
  fireEvent.press(screen.getByTestId('student-attendance-session'));

  expect(
    await screen.findByTestId('student-attendance-sessions-empty')
  ).toHaveTextContent(i18n.t('attendance:form.noSessions'));
  expect(screen.queryByText(i18n.t('attendance:utility.empty'))).toBeNull();
});

test('Selected makeup student correction saves only the makeup record', async () => {
  const source = createAttendanceMock();
  const write = jest.fn(source.write);
  open('MANAGER', { ...source, write });
  fireEvent.press(
    await screen.findByTestId('workspace-open-attendance-management')
  );
  fireEvent.press(
    await screen.findByTestId('attendance-students-row-student-3')
  );

  expect(await screen.findByTestId('student-attendance-screen')).toBeTruthy();
  expect(screen.getByTestId('student-attendance-session')).toBeDisabled();
  expect(screen.getByTestId('student-attendance-reason')).toBeTruthy();
  fireEvent.press(await screen.findByTestId('student-attendance-class'));
  expect(
    screen.queryByTestId('student-attendance-class-option-substitute')
  ).toBeNull();
  fireEvent.press(
    await screen.findByTestId('student-attendance-class-option-primary')
  );
  fireEvent.press(await screen.findByTestId('student-attendance-session'));
  fireEvent.press(
    await screen.findByTestId('student-attendance-session-option-today-primary')
  );
  await waitFor(() =>
    expect(screen.getByTestId('student-attendance-present')).not.toBeDisabled()
  );
  fireEvent.press(screen.getByTestId('student-attendance-present'));
  expect(screen.queryByTestId('correction-row-attendance-1')).toBeNull();
  fireEvent.changeText(
    await screen.findByTestId('student-attendance-reason'),
    'Verified makeup'
  );
  fireEvent.press(screen.getByTestId('student-attendance-save'));
  await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
  expect(write.mock.calls[0]?.[0]).toMatchObject({
    records: [],
    guestRecords: [{ makeupPlacementId: 'makeup-1', status: 'PRESENT' }],
    reason: 'Verified makeup',
  });
});

test('Home finalize utility opens a dedicated screen and removes the completed session', async () => {
  const source = createAttendanceMock(),
    write = jest.fn(source.write);
  open('MANAGER', { ...source, write });
  fireEvent.press(await screen.findByTestId('workspace-open-manager-finalize'));
  fireEvent.press(
    await screen.findByTestId('finalize-sessions-row-today-primary')
  );
  expect((await screen.findByTestId('finalize-end-time')).props.value).toBe(
    '20:00'
  );
  fireEvent.changeText(screen.getByTestId('finalize-end-time'), '19:30');
  fireEvent.press(screen.getByTestId('finalize-use-schedule'));
  expect(screen.getByTestId('finalize-end-time').props.value).toBe('20:00');
  fireEvent.changeText(screen.getByTestId('finalize-end-time'), '');
  fireEvent.press(screen.getByTestId('finalize-submit'));
  expect(write).not.toHaveBeenCalled();
  expect(screen.getByTestId('finalize-end-time-error')).toBeTruthy();
  fireEvent.changeText(screen.getByTestId('finalize-end-time'), '19:45');
  fireEvent.changeText(
    screen.getByTestId('finalize-reason'),
    'Đối chiếu giờ kết thúc'
  );
  await act(async () => fireEvent.press(screen.getByTestId('finalize-submit')));
  expect(write).toHaveBeenCalled();
  await waitFor(() =>
    expect(screen.queryByTestId('manager-finalize-screen')).toBeNull()
  );
  expect(write.mock.calls[0]?.[0]).toMatchObject({
    kind: 'finalize',
    reason: 'Đối chiếu giờ kết thúc',
  });
  expect(write.mock.calls[0]?.[0].actualEndedAt).toMatch(/T19:45:00\+07:00$/);
  await waitFor(() =>
    expect(
      screen.queryByTestId('finalize-sessions-row-today-primary')
    ).toBeNull()
  );
});

test('Manager detail History and Recovery tabs load on demand and keep the session; dirty recovery guards tab switches', async () => {
  const source = createAttendanceMock();
  const read = jest.fn(source.read);
  open('MANAGER', { ...source, read });
  fireEvent.press(await screen.findByTestId('workspace-incomplete-summary'));
  fireEvent.press(
    await screen.findByTestId('incomplete-row-overdue-not-started')
  );
  await screen.findByTestId('manager-att-provisional');
  expect(
    read.mock.calls.some(
      ([r]) => r.kind === 'audits' || r.kind === 'recoveryStudents'
    )
  ).toBe(false);
  fireEvent.press(screen.getByTestId('session-tab-history'));
  await screen.findByTestId('audit-empty');
  expect(
    read.mock.calls.some(
      ([r]) => r.kind === 'audits' && r.sessionId === 'overdue-not-started'
    )
  ).toBe(true);
  expect(read.mock.calls.some(([r]) => r.kind === 'recoveryStudents')).toBe(
    false
  );
  expect(
    screen.getByTestId('session-tab-history').props.accessibilityState.selected
  ).toBe(true);
  fireEvent.press(screen.getByTestId('session-tab-recovery'));
  await screen.findByTestId('recovery-picker');
  fireEvent.press(screen.getByTestId('recovery-picker-scrim'));
  expect(screen.queryByText('Ghi danh chưa đủ điều kiện.')).toBeNull();
  fireEvent.press(await screen.findByTestId('recovery-pick-students'));
  fireEvent.press(await screen.findByTestId('recovery-option-enrollment-1'));
  await screen.findByTestId('recovery-date');
  expect(
    read.mock.calls.some(
      ([r]) => r.kind === 'recoveryStudents' && r.classId === 'primary'
    )
  ).toBe(true);
  fireEvent.changeText(
    screen.getByTestId('recovery-reason'),
    'Unsaved evidence review'
  );
  fireEvent.press(screen.getByTestId('session-tab-history'));
  await screen.findByTestId('leave-dialog');
  fireEvent.press(screen.getByTestId('leave-stay'));
  expect(screen.getByTestId('recovery-reason').props.value).toBe(
    'Unsaved evidence review'
  );
  fireEvent.press(screen.getByTestId('session-tab-history'));
  fireEvent.press(await screen.findByTestId('leave-discard'));
  await screen.findByTestId('audit-empty');
  fireEvent.press(screen.getByTestId('audit-back'));
  await screen.findByTestId('incomplete-screen');
});

test('Recovery tab on an ineligible session shows server permission feedback without loading a picker', async () => {
  const source = createAttendanceMock();
  const read = jest.fn(source.read);
  open('MANAGER', { ...source, read });
  fireEvent.press(await screen.findByTestId('workspace-incomplete-summary'));
  fireEvent.press(
    await screen.findByTestId('incomplete-row-overdue-not-finalized')
  );
  await screen.findByTestId('manager-att-row-attendance-1');
  fireEvent.press(screen.getByTestId('session-tab-recovery'));
  await screen.findByTestId('recovery-unavailable');
  expect(screen.queryByTestId('recovery-picker')).toBeNull();
  expect(read.mock.calls.some(([r]) => r.kind === 'recoveryStudents')).toBe(
    false
  );
});

test('live mode registers Mentor attendance/note routes and hides mock scenario controls', async () => {
  open('MENTOR', createAttendanceMock(), false);
  await editor();
  expect(screen.queryByTestId('attendance-mock-badge')).toBeNull();
  fireEvent.press(screen.getByTestId('attendance-finalize'));
  fireEvent.press(await screen.findByTestId('attendance-finalize-confirm'));
  fireEvent.press(await screen.findByTestId('attendance-note-action'));
  await screen.findByTestId('note-content');
  expect(screen.queryByTestId('attendance-mock-badge')).toBeNull();
});
test('live mode registers Manager utility and backlog routes', async () => {
  open('MANAGER', createAttendanceMock(), false);
  fireEvent.press(
    await screen.findByTestId('workspace-open-attendance-management')
  );
  await screen.findByTestId('attendance-students-row-student-1');
  fireEvent.press(screen.getByTestId('attendance-students-row-student-1'));
  await screen.findByTestId('student-attendance-class');
  fireEvent.press(screen.getByTestId('student-attendance-back'));
  fireEvent.press(await screen.findByTestId('attendance-students-back'));
  fireEvent.press(await screen.findByTestId('workspace-incomplete-summary'));
  await screen.findByTestId('incomplete-row-overdue-not-started');
  expect(screen.queryByTestId('attendance-mock-badge')).toBeNull();
});
