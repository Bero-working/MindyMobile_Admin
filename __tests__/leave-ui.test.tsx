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
import { createLeaveMock } from '@/modules/leave/services/mockLeave';
import type { LeaveSource, Scenario } from '@/modules/leave/types';
import i18n from '@/translations';
import { vietnamDay } from '@/modules/leave/model';

jest.setTimeout(25000);
configure({ asyncUtilTimeout: 10000 });
function open(
  role: 'MENTOR' | 'MANAGER' = 'MENTOR',
  source?: LeaveSource,
  leaveMock = true
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
          attendanceMock
          leaveMock={leaveMock}
          leaveSource={source}
        />
      </MindyThemeProvider>
    </SafeAreaProvider>
  );
}
beforeEach(async () => {
  await i18n.changeLanguage('vi');
});

test.each(['MENTOR', 'MANAGER'] as const)(
  'live-mode %s leave entry navigates to list and detail without requiring leaveMock',
  async (role) => {
    const source = createLeaveMock();
    open(role, source, false);
    const manager = role === 'MANAGER';
    fireEvent.press(
      await screen.findByTestId(
        manager ? 'workspace-open-leave-review' : 'workspace-open-leave'
      )
    );
    fireEvent.press(
      await screen.findByTestId(
        manager ? 'leave-queue-row-leave-1' : 'leave-list-row-leave-1'
      )
    );
    await screen.findByTestId(
      manager ? 'leave-review-status' : 'leave-detail-status'
    );
    expect(
      screen.queryByTestId(manager ? 'leave-queue-screen' : 'leave-list-screen')
    ).toBeNull();
  }
);
test('TC-P4-HOME-01, S1-01/08: Mentor entry, lazy default and status filter', async () => {
  const base = createLeaveMock(),
    read = jest.fn(base.read);
  open('MENTOR', { ...base, read });
  fireEvent.press(await screen.findByTestId('workspace-open-leave'));
  await screen.findByTestId('leave-list-row-leave-1');
  expect(read).toHaveBeenCalledWith(
    expect.objectContaining({
      kind: 'list',
      role: 'MENTOR',
      page: 1,
      pageSize: 20,
    })
  );
  expect(
    read.mock.calls.filter(([q]) => q.kind === 'list')[0]?.[0]
  ).not.toHaveProperty('status');
  fireEvent.press(screen.getByTestId('leave-list-filter-approved'));
  await screen.findByTestId('leave-list-row-leave-26');
  expect(screen.queryByTestId('leave-list-row-leave-1')).toBeNull();
});
test('TC-P4-S3-15/16: withdrawal requires reason and updates result', async () => {
  const base = createLeaveMock(),
    write = jest.fn(base.write);
  open('MENTOR', { ...base, write });
  fireEvent.press(await screen.findByTestId('workspace-open-leave'));
  fireEvent.press(await screen.findByTestId('leave-list-row-leave-1'));
  fireEvent.press(await screen.findByTestId('leave-detail-withdraw'));
  fireEvent.press(screen.getByTestId('leave-detail-withdraw-send'));
  expect(write).not.toHaveBeenCalled();
  fireEvent.changeText(
    screen.getByTestId('leave-detail-withdraw-reason'),
    'Đã thu xếp được'
  );
  fireEvent.press(screen.getByTestId('leave-detail-withdraw-send'));
  await waitFor(() =>
    expect(screen.getByTestId('leave-detail-status')).toHaveTextContent(
      'Đã rút'
    )
  );
  expect(write).toHaveBeenCalledWith(
    expect.objectContaining({
      kind: 'withdraw',
      body: { expectedVersion: 1, reason: 'Đã thu xếp được' },
    })
  );
});
test('TC-P4-S3-01: pending note is informational and the sheet can keep the request', async () => {
  const base = createLeaveMock(),
    write = jest.fn(base.write);
  open('MENTOR', { ...base, write });
  fireEvent.press(await screen.findByTestId('workspace-open-leave'));
  fireEvent.press(await screen.findByTestId('leave-list-row-leave-1'));
  expect(await screen.findByTestId('leave-detail-not-held')).toHaveProp(
    'accessibilityRole',
    'text'
  );
  fireEvent.press(screen.getByTestId('leave-detail-withdraw'));
  fireEvent.press(screen.getByTestId('leave-detail-withdraw-keep'));
  await waitFor(() =>
    expect(screen.queryByTestId('leave-detail-withdraw-sheet')).toBeNull()
  );
  expect(write).not.toHaveBeenCalled();
});
test('TC-P4-S5-03: student clashes block approval, rejection remains available', async () => {
  const source = createLeaveMock(() => 'studentConflict');
  open('MANAGER', source);
  fireEvent.press(await screen.findByTestId('workspace-open-leave-review'));
  fireEvent.press(await screen.findByTestId('leave-queue-row-leave-1'));
  expect(await screen.findByTestId('leave-review-approve')).toBeDisabled();
  expect(screen.getByTestId('leave-review-reject')).not.toBeDisabled();
  expect(screen.getByTestId('leave-review-conflict-block')).toHaveTextContent(
    /2/
  );
});
test('TC-P4-S5-09/10: approval uses false acknowledgment, shows server replacements', async () => {
  const base = createLeaveMock(),
    write = jest.fn(base.write);
  open('MANAGER', { ...base, write });
  fireEvent.press(await screen.findByTestId('workspace-open-leave-review'));
  fireEvent.press(await screen.findByTestId('leave-queue-row-leave-1'));
  fireEvent.press(await screen.findByTestId('leave-review-approve'));
  fireEvent.changeText(
    screen.getByTestId('leave-review-approve-reason'),
    'Đồng ý'
  );
  fireEvent.press(screen.getByTestId('leave-review-approve-send'));
  await screen.findByTestId('leave-review-replacement-makeup-a');
  expect(write).toHaveBeenCalledWith(
    expect.objectContaining({
      body: {
        expectedVersion: 1,
        reason: 'Đồng ý',
        acknowledgeStudentConflicts: false,
      },
    })
  );
});
test('TC-P4-S7-13/16/18: placement requires explicit content check and uses both versions', async () => {
  const base = createLeaveMock(),
    write = jest.fn(base.write);
  open('MANAGER', { ...base, write });
  fireEvent.press(await screen.findByTestId('workspace-open-makeup-conflicts'));
  fireEvent.press(
    await screen.findByTestId('makeup-conflicts-row-conflict-open')
  );
  fireEvent.press(
    await screen.findByTestId('makeup-placement-candidate-target-a')
  );
  expect(screen.getByTestId('makeup-placement-submit')).toBeDisabled();
  fireEvent.changeText(
    screen.getByTestId('makeup-placement-reason'),
    'Cùng nội dung'
  );
  expect(screen.getByTestId('makeup-placement-submit')).toBeDisabled();
  fireEvent.press(screen.getByTestId('makeup-placement-content-check'));
  fireEvent.press(screen.getByTestId('makeup-placement-submit'));
  await screen.findByTestId('makeup-placement-placed');
  expect(write).toHaveBeenCalledWith(
    expect.objectContaining({
      body: {
        reason: 'Cùng nội dung',
        expectedVersion: 1,
        expectedTargetVersion: 1,
        targetSessionId: 'target-a',
        contentMatchConfirmed: true,
      },
    })
  );
});
test('TC-P4-S7-05/29: reassign cancels old placement before loading candidates', async () => {
  const base = createLeaveMock(),
    read = jest.fn(base.read),
    write = jest.fn(base.write);
  open('MANAGER', { read, write });
  fireEvent.press(await screen.findByTestId('workspace-open-makeup-conflicts'));
  fireEvent.press(
    await screen.findByTestId('makeup-conflicts-row-conflict-reassign')
  );
  fireEvent.press(await screen.findByTestId('makeup-placement-cancel'));
  expect(read.mock.calls.some(([q]) => q.kind === 'candidates')).toBe(false);
  fireEvent.changeText(
    screen.getByTestId('makeup-placement-cancel-reason'),
    'Buổi cũ đã hủy'
  );
  fireEvent.press(screen.getByTestId('makeup-placement-cancel-send'));
  await screen.findByTestId('makeup-placement-candidate-target-a');
  expect(write).toHaveBeenCalledWith(
    expect.objectContaining({
      kind: 'cancel',
      body: { reason: 'Buổi cũ đã hủy', expectedVersion: 3 },
    })
  );
  expect(write).toHaveBeenCalledTimes(1);
});
test.each<Scenario>(['error', 'offline', 'denied'])(
  'TC-P4-S1 states %s never masquerade as empty',
  async (scenario) => {
    open(
      'MENTOR',
      createLeaveMock(() => scenario)
    );
    fireEvent.press(await screen.findByTestId('workspace-open-leave'));
    await screen.findByTestId(`leave-list-${scenario}`);
    expect(screen.queryByTestId('leave-list-empty')).toBeNull();
  }
);

function futureDay(offset: number) {
  return new Date(Date.parse(`${vietnamDay()}T00:00:00Z`) + offset * 86400000)
    .toISOString()
    .slice(0, 10);
}
async function pickDate(id: string, date: string) {
  fireEvent.press(screen.getByTestId(id));
  fireEvent.press(await screen.findByTestId(`${id}-days.day_${date}`));
}
test('TC-P4-S2-01/02/25/26/31: no prefetch, preview again before immutable submit, replace form', async () => {
  const base = createLeaveMock(),
    read = jest.fn(base.read),
    write = jest.fn(base.write);
  open('MENTOR', { read, write });
  fireEvent.press(await screen.findByTestId('workspace-open-leave'));
  fireEvent.press(await screen.findByTestId('leave-list-create'));
  await screen.findByTestId('leave-plan-preview');
  expect(
    read.mock.calls.some(([q]) => q.kind === 'preview' || q.kind === 'slots')
  ).toBe(false);
  await pickDate('leave-plan-from', futureDay(5));
  fireEvent.press(screen.getByTestId('leave-plan-preview'));
  fireEvent.press(await screen.findByTestId('leave-plan-pick-source-a'));
  await pickDate('leave-plan-target-date', futureDay(8));
  fireEvent.press(await screen.findByTestId('leave-plan-slot-18:00'));
  fireEvent.press(screen.getByTestId('leave-plan-use-slot'));
  fireEvent.changeText(
    screen.getByTestId('leave-plan-reason'),
    'Việc gia đình'
  );
  fireEvent.press(screen.getByTestId('leave-plan-submit'));
  await screen.findByTestId('leave-plan-confirm');
  expect(read.mock.calls.filter(([q]) => q.kind === 'preview')).toHaveLength(2);
  expect(write).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('leave-plan-confirm-send'));
  await screen.findByTestId('leave-detail-status');
  expect(write).toHaveBeenCalledTimes(1);
  expect(write).toHaveBeenCalledWith(
    expect.objectContaining({
      kind: 'create',
      body: expect.objectContaining({
        fromDate: futureDay(5),
        toDate: futureDay(5),
        sourceVersions: [{ sessionId: 'source-a', version: 1 }],
        sessionMappings: [
          expect.objectContaining({
            sourceSessionId: 'source-a',
            targetDate: futureDay(8),
            targetPeriod: 'EVENING',
          }),
        ],
      }),
    })
  );
  expect(write.mock.calls[0]?.[0].body).not.toHaveProperty('dayMappings');
  fireEvent.press(screen.getByTestId('leave-detail-back'));
  await screen.findByTestId('leave-list-screen');
  expect(screen.queryByTestId('leave-plan-screen')).toBeNull();
});
test.each<Scenario>(['empty', 'late'])(
  'TC-P4-S2-06/07: %s preview cannot submit a request',
  async (scenario) => {
    open(
      'MENTOR',
      createLeaveMock(() => scenario)
    );
    fireEvent.press(await screen.findByTestId('workspace-open-leave'));
    if (scenario === 'empty') await screen.findByTestId('leave-list-empty');
    fireEvent.press(await screen.findByTestId('leave-list-create'));
    await pickDate('leave-plan-from', futureDay(5));
    fireEvent.press(screen.getByTestId('leave-plan-preview'));
    await screen.findByTestId(
      scenario === 'empty' ? 'leave-plan-no-sessions' : 'leave-plan-notice-late'
    );
    expect(screen.queryByTestId('leave-plan-submit')).toBeNull();
    expect(screen.queryByTestId('leave-plan-pick-source-a')).toBeNull();
  }
);
test('TC-P4-S5-23: uncertain approval retries the identical key/body and creates once', async () => {
  const base = createLeaveMock(() => 'uncertain'),
    write = jest.fn(base.write);
  open('MANAGER', { ...base, write });
  fireEvent.press(await screen.findByTestId('workspace-open-leave-review'));
  fireEvent.press(await screen.findByTestId('leave-queue-row-leave-1'));
  fireEvent.press(await screen.findByTestId('leave-review-approve'));
  fireEvent.changeText(
    screen.getByTestId('leave-review-approve-reason'),
    'Đồng ý'
  );
  fireEvent.press(screen.getByTestId('leave-review-approve-send'));
  fireEvent.press(await screen.findByTestId('leave-review-resend'));
  await screen.findByTestId('leave-review-replacement-makeup-a');
  expect(write).toHaveBeenCalledTimes(2);
  expect(write.mock.calls[0]?.[0]).toEqual(write.mock.calls[1]?.[0]);
});
test('TC-P4-S1-09: late response cannot replace a newer selected filter', async () => {
  const base = createLeaveMock();
  let release:
    | ((value: Awaited<ReturnType<LeaveSource['read']>>) => void)
    | undefined;
  const source: LeaveSource = {
    ...base,
    read: (query) =>
      query.kind === 'list' && !query.status
        ? new Promise((resolve) => {
            release = resolve;
          })
        : base.read(query),
  };
  open('MENTOR', source);
  fireEvent.press(await screen.findByTestId('workspace-open-leave'));
  fireEvent.press(await screen.findByTestId('leave-list-filter-approved'));
  await screen.findByTestId('leave-list-row-leave-26');
  const old = await base.read({ kind: 'list', role: 'MENTOR' });
  await act(async () => {
    release?.(old);
  });
  expect(screen.queryByTestId('leave-list-row-leave-1')).toBeNull();
  expect(screen.getByTestId('leave-list-row-leave-26')).toBeTruthy();
});
