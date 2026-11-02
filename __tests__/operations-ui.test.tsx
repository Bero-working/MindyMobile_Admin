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
import { createTeachingMock } from '@/modules/teaching/services/mockTeaching';
import { createOperationsMock } from '@/modules/operations/services/mockOperations';
import type { OperationsSource, Scenario } from '@/modules/operations/types';
import i18n from '@/translations';
jest.setTimeout(60000);
configure({ asyncUtilTimeout: 10000 });
function open(source?: OperationsSource, role = 'MANAGER') {
  const teaching = createTeachingMock();
  const service: AuthService = {
    restore: async () => ({
      kind: 'user',
      user: {
        id: 'manager-test',
        email: `${role}@example.test`,
        displayName: 'Quản lý',
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
          teachingSource={teaching}
          teachingMock
          attendanceMock
          operationsMock
          operationsSource={
            source ??
            createOperationsMock(teaching, () => 'success', 'manager-test')
          }
        />
      </MindyThemeProvider>
    </SafeAreaProvider>
  );
}
beforeEach(async () => {
  await i18n.changeLanguage('vi');
});

async function futureSession() {
  fireEvent.press(await screen.findByTestId('workspace-open-manager-classes'));
  fireEvent.press(await screen.findByTestId('manager-classes-card-primary'));
  fireEvent.press(await screen.findByTestId('manager-detail-tab-schedule'));
  fireEvent.press(
    await screen.findByTestId('manager-detail-session-next-primary')
  );
  await screen.findByTestId('session-ops-group');
}
test('TC-P5-S1-07/08/10: assignment requires explicit candidate/reason and uses candidates version', async () => {
  const base = createOperationsMock(createTeachingMock());
  const write = jest.fn(base.write);
  open({ ...base, write });
  await futureSession();
  fireEvent.press(screen.getByTestId('session-ops-assign'));
  await screen.findByTestId('substitute-row-mentor-1');
  fireEvent.press(screen.getByTestId('substitute-submit'));
  expect(write).not.toHaveBeenCalled();
  expect(screen.getByTestId('substitute-reason-error')).toBeTruthy();
  fireEvent.press(screen.getByTestId('substitute-row-mentor-1'));
  fireEvent.changeText(
    screen.getByTestId('substitute-reason'),
    'Dạy thay theo buổi'
  );
  fireEvent.press(screen.getByTestId('substitute-submit'));
  await screen.findByTestId('substitute-confirm');
  fireEvent.press(screen.getByTestId('substitute-confirm-submit'));
  await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
  expect(write.mock.calls[0]?.[0]).toMatchObject({
    kind: 'assign',
    mentorId: 'mentor-1',
    expectedVersion: 3,
  });
});
test('TC-P5-S2-07/13: reschedule starts unchanged/disabled and sends times without title', async () => {
  const base = createOperationsMock(createTeachingMock());
  const write = jest.fn(base.write);
  open({ ...base, write });
  await futureSession();
  fireEvent.press(screen.getByTestId('session-ops-reschedule'));
  await screen.findByTestId('reschedule-end');
  expect(screen.queryByTestId('session-edit-title')).toBeNull();
  fireEvent.changeText(screen.getByTestId('reschedule-end'), '20:30');
  fireEvent.changeText(
    screen.getByTestId('reschedule-reason'),
    'Đổi thời gian'
  );
  fireEvent.press(screen.getByTestId('reschedule-submit'));
  await screen.findByTestId('reschedule-confirm');
  fireEvent.press(screen.getByTestId('reschedule-confirm-submit'));
  await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
  expect(write.mock.calls[0]?.[0]).toMatchObject({
    kind: 'reschedule',
    reason: 'Đổi thời gian',
  });
  expect(write.mock.calls[0]?.[0]).not.toHaveProperty('title');
});
test('TC-P5-S3-05/07/12: cancellation is separate, preserves cancelled state and leaves replacement date empty', async () => {
  const base = createOperationsMock(createTeachingMock());
  const write = jest.fn(base.write);
  open({ ...base, write });
  await futureSession();
  fireEvent.press(screen.getByTestId('session-ops-cancel'));
  await screen.findByTestId('replacement-cancel-reason');
  fireEvent.changeText(
    screen.getByTestId('replacement-cancel-reason'),
    'Hủy buổi thử'
  );
  fireEvent.press(screen.getByTestId('replacement-cancel-submit'));
  await screen.findByTestId('replacement-cancel-confirm');
  fireEvent.press(screen.getByTestId('replacement-cancel-confirm-submit'));
  await screen.findByTestId('replacement-cancelled');
  expect(write).toHaveBeenCalledTimes(1);
  expect(write.mock.calls[0]?.[0].kind).toBe('cancel');
  expect(screen.getByTestId('replacement-start').props.value).toBe('');
  expect(screen.getByTestId('replacement-end').props.editable).toBe(false);
  expect(screen.queryByTestId('replacement-cancel-submit')).toBeNull();
});
test('TC-P5-HOME-01/S4-01: Home is lazy and cash list only reads pending query', async () => {
  const base = createOperationsMock(createTeachingMock());
  const read = jest.fn(base.read);
  open({ ...base, read });
  await screen.findByTestId('workspace-open-cash-orders');
  expect(read).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('workspace-open-cash-orders'));
  await screen.findByTestId('cash-list-row-order-1');
  expect(read).toHaveBeenCalledWith({
    kind: 'orders',
    status: 'PENDING',
    page: 1,
    pageSize: 20,
  });
  expect(read.mock.calls.every(([r]) => r.kind === 'orders')).toBe(true);
  fireEvent.press(screen.getByTestId('cash-list-status-paid'));
  await screen.findByTestId('cash-list-row-order-26');
  expect(screen.queryByTestId('cash-list-row-order-1')).toBeNull();
});
test('TC-P5-HOME-02: Mentor has no CASH entry point', async () => {
  open(undefined, 'MENTOR');
  await screen.findByTestId('workspace-open-schedule');
  expect(screen.queryByTestId('workspace-open-cash-orders')).toBeNull();
});
test('TC-P5-S4-15/19: code search waits for submit and drops status/class filters', async () => {
  const base = createOperationsMock(createTeachingMock());
  const read = jest.fn(base.read);
  open({ ...base, read });
  fireEvent.press(await screen.findByTestId('workspace-open-cash-orders'));
  await screen.findByTestId('cash-list-row-order-1');
  const count = read.mock.calls.length;
  fireEvent.changeText(
    screen.getByTestId('cash-list-search'),
    ' md000000000026 '
  );
  expect(read.mock.calls.length).toBe(count);
  fireEvent(screen.getByTestId('cash-list-search'), 'submitEditing');
  await screen.findByTestId('cash-list-row-order-26');
  expect(read.mock.calls.at(-1)?.[0]).toEqual({
    kind: 'orders',
    orderCode: 'MD000000000026',
    page: 1,
    pageSize: 20,
  });
});
test('cash class filter: picker scrolls within the screen, selects a class and clears back to all', async () => {
  const base = createOperationsMock(createTeachingMock());
  const read = jest.fn(base.read);
  const listed = await base.read({ kind: 'classes' });
  if (listed.kind !== 'success') throw new Error('classes unavailable');
  const picked = listed.data.classes![0]!;
  open({ ...base, read });
  fireEvent.press(await screen.findByTestId('workspace-open-cash-orders'));
  await screen.findByTestId('cash-list-row-order-1');
  fireEvent.press(screen.getByTestId('cash-list-class'));
  const option = await screen.findByTestId(`cash-list-class-${picked.id}`);
  const list = screen.getByTestId('cash-list-class-list');
  expect(list.props.keyboardShouldPersistTaps).toBe('handled');
  expect(list.props.style.maxHeight).toBeGreaterThan(0);
  expect(
    screen.getByTestId('cash-list-class-all').props.accessibilityState
  ).toMatchObject({ checked: true });
  fireEvent.press(option);
  await waitFor(() =>
    expect(screen.queryByTestId('cash-list-class-sheet')).toBeNull()
  );
  expect(screen.getByTestId('cash-list-class')).toHaveTextContent(picked.name);
  await waitFor(() =>
    expect(read.mock.calls.at(-1)?.[0]).toMatchObject({
      kind: 'orders',
      classId: picked.id,
    })
  );
  fireEvent.press(screen.getByTestId('cash-list-class'));
  fireEvent.press(await screen.findByTestId('cash-list-class-all'));
  await waitFor(() =>
    expect(screen.queryByTestId('cash-list-class-sheet')).toBeNull()
  );
  await waitFor(() =>
    expect(read.mock.calls.at(-1)?.[0]).toEqual({
      kind: 'orders',
      status: 'PENDING',
      page: 1,
      pageSize: 20,
    })
  );
});
async function cashDetail() {
  fireEvent.press(await screen.findByTestId('workspace-open-cash-orders'));
  fireEvent.press(await screen.findByTestId('cash-list-row-order-1'));
  await screen.findByTestId('cash-detail-confirm');
}
test('TC-P5-S5-11/14/16/17/19: recheck then empty money field, exact amount and collector verification', async () => {
  const base = createOperationsMock(
    createTeachingMock(),
    () => 'success',
    'manager-test'
  );
  const write = jest.fn(base.write),
    read = jest.fn(base.read);
  open({ ...base, write, read });
  await cashDetail();
  fireEvent.press(screen.getByTestId('cash-detail-confirm'));
  await screen.findByTestId('cash-detail-sheet');
  expect(read.mock.calls.filter(([r]) => r.kind === 'order')).toHaveLength(2);
  expect(screen.getByTestId('cash-detail-received').props.value).toBe('');
  fireEvent.changeText(screen.getByTestId('cash-detail-received'), '6500001');
  fireEvent.press(screen.getByTestId('cash-detail-submit'));
  expect(write).not.toHaveBeenCalled();
  expect(screen.getByTestId('cash-detail-received-error')).toBeTruthy();
  fireEvent.changeText(
    screen.getByTestId('cash-detail-received'),
    '6.500.000 ₫abc'
  );
  fireEvent.press(screen.getByTestId('cash-detail-submit'));
  await waitFor(() => expect(write).toHaveBeenCalledTimes(1));
  expect(write.mock.calls[0]?.[0]).toEqual({
    kind: 'collect',
    id: 'order-1',
    receivedAmount: 6500000,
  });
  await waitFor(() =>
    expect(screen.queryByTestId('cash-detail-sheet')).toBeNull()
  );
  expect(screen.getByTestId('cash-detail-collector')).toHaveTextContent(
    'Bạn đã xác nhận'
  );
});
test('TC-P5-S5-20: a different collector gives warning instead of claiming own collection', async () => {
  const base = createOperationsMock(
    createTeachingMock(),
    () => 'otherCollector',
    'manager-test'
  );
  open(base);
  await cashDetail();
  fireEvent.press(screen.getByTestId('cash-detail-confirm'));
  await screen.findByTestId('cash-detail-received');
  fireEvent.changeText(screen.getByTestId('cash-detail-received'), '6500000');
  fireEvent.press(screen.getByTestId('cash-detail-submit'));
  expect(await screen.findByTestId('cash-detail-by-other')).toHaveTextContent(
    /đã được/
  );
});
test('TC-P5-S5-22/23: response lost after commit reads PAID and does not send a second payment', async () => {
  let scenario: Scenario = 'success';
  const base = createOperationsMock(
    createTeachingMock(),
    () => scenario,
    'manager-test'
  );
  const write = jest.fn(base.write);
  open({ ...base, write });
  await cashDetail();
  fireEvent.press(screen.getByTestId('cash-detail-confirm'));
  await screen.findByTestId('cash-detail-received');
  fireEvent.changeText(screen.getByTestId('cash-detail-received'), '6500000');
  scenario = 'uncertain';
  await act(async () => {
    fireEvent.press(screen.getByTestId('cash-detail-submit'));
  });
  await waitFor(() =>
    expect(screen.queryByTestId('cash-detail-sheet')).toBeNull()
  );
  expect(write).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('cash-detail-resend')).toBeNull();
});

test.each([
  ['vi', 'Đơn tiền mặt', 'Nhập mã đơn', 'Tất cả lớp', 'Chờ xác nhận'],
  [
    'en',
    'Cash orders',
    'Enter order code',
    'All classes',
    'Awaiting confirmation',
  ],
])(
  'CASH localization renders labels instead of keys in %s',
  async (language, title, search, classes, pending) => {
    await i18n.changeLanguage(language);
    open();
    fireEvent.press(await screen.findByTestId('workspace-open-cash-orders'));
    await screen.findByTestId('cash-list-row-order-1');
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByPlaceholderText(search)).toBeTruthy();
    expect(screen.getByText(classes)).toBeTruthy();
    expect(screen.getAllByText(pending).length).toBeGreaterThan(0);
    for (const key of [
      'cash.title',
      'cash.search',
      'cash.allClasses',
      'status.PENDING',
      'cash.count',
    ])
      expect(screen.queryByText(key)).toBeNull();
  }
);
