import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import { QueryClient } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import { AuthApp, type AuthService } from '@/modules/auth';
import { MindyThemeProvider } from '@/components/ui/theme';
import i18n from '@/translations';
import localStore from '@/services/storage/localStore.service';
import {
  addDays,
  shortDate,
  vietnamDate,
  weekDates,
} from '@/modules/teaching/format';
import type { TeachingRequest } from '@/modules/teaching/types';
import * as teachingMock from '@/modules/teaching/services/mockTeaching';
function open(
  role = 'MENTOR',
  displayName = 'Trần Thị Linh',
  email = `${role}@example.test`
) {
  const service: AuthService = {
    restore: async () => ({
      kind: 'user',
      user: {
        email,
        displayName,
        role,
      },
    }),
    login: async () => ({ kind: 'signedOut' }),
    logout: async () => ({ kind: 'ok' }),
  };
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 412, height: 892 },
        insets: { top: 24, left: 0, right: 0, bottom: 24 },
      }}
    >
      <MindyThemeProvider>
        <AuthApp
          teachingMock
          service={service}
          cache={new QueryClient()}
        />
      </MindyThemeProvider>
    </SafeAreaProvider>
  );
}
beforeEach(async () => {
  localStore.clearAll();
  await i18n.changeLanguage('vi');
});
test('TC-P1-S2-04/09, S3-02/06, S4-15: substitute uses session roster only', async () => {
  open();
  fireEvent.press(await screen.findByTestId('workspace-open-classes'));
  fireEvent.press(await screen.findByTestId('classes-card-substitute'));
  await screen.findByTestId('class-detail-scope-alert');
  expect(screen.queryByTestId('class-detail-students-button')).toBeNull();
  fireEvent.press(
    await screen.findByTestId('class-detail-session-today-substitute')
  );
  fireEvent.press(await screen.findByTestId('session-tab-students'));
  await screen.findByTestId('session-student-enrollment-1');
  expect(screen.getByTestId('session-students-provisional')).toBeTruthy();
  expect(screen.queryByText('Chờ thanh toán')).toBeNull();
});
test('TC-P1-S3-01/07/08, S5-05/06: capability, legacy teacher and pending payment', async () => {
  open();
  fireEvent.press(await screen.findByTestId('workspace-open-classes'));
  fireEvent.press(await screen.findByTestId('classes-card-primary'));
  expect(
    (await screen.findByTestId('class-detail-session-assigned-other')).props
      .accessibilityRole
  ).toBeUndefined();
  fireEvent.press(screen.getByTestId('class-detail-tab-done'));
  expect(await screen.findByText('Chưa có dữ liệu người dạy')).toBeTruthy();
  fireEvent.press(screen.getByTestId('class-detail-students-button'));
  const row = within(await screen.findByTestId('students-row-enrollment-2'));
  expect(row.getByText('Đang giữ chỗ')).toBeTruthy();
  expect(row.getByText('Chờ thanh toán')).toBeTruthy();
  expect(screen.queryByText(/0900000001/)).toBeNull();
});
test('TC-P1-S6-04/16, S7-02/07/12/13: Manager overview, minimal roster and context', async () => {
  open('MANAGER');
  fireEvent.press(await screen.findByTestId('workspace-open-manager-classes'));
  fireEvent.press(await screen.findByTestId('manager-classes-card-primary'));
  await screen.findByTestId('manager-detail-enroll-COMPLETED');
  expect(screen.queryByText('Mentor chính · Toàn lớp')).toBeNull();
  fireEvent.press(screen.getByTestId('manager-detail-tab-students'));
  await screen.findByTestId('manager-detail-student-enrollment-1');
  expect(
    screen.queryByText(/ngoc@example.test|0900000001|Đã thanh toán/)
  ).toBeNull();
  expect(screen.queryByTestId('manager-detail-filter-all')).toBeNull();
  fireEvent.press(screen.getByTestId('manager-detail-tab-schedule'));
  fireEvent.press(
    await screen.findByTestId('manager-detail-session-today-primary')
  );
  await screen.findByTestId('session-title');
});
test('TC-P1-S1-09, S4-08/20: opens meeting link; denial clears the entire context', async () => {
  const link = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  open();
  fireEvent.press(await screen.findByTestId('workspace-open-schedule'));
  fireEvent.press(await screen.findByTestId('schedule-session-today-primary'));
  fireEvent.press(await screen.findByTestId('session-link'));
  expect(link).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByTestId('session-tab-students'));
  await screen.findByTestId('session-student-enrollment-1');
  fireEvent.press(screen.getByTestId('teaching-mock-badge'));
  await act(async () => {
    fireEvent.press(await screen.findByTestId('teaching-scenario-denied'));
  });
  await screen.findByTestId('session-denied');
  expect(screen.queryByTestId('session-student-enrollment-1')).toBeNull();
  link.mockRestore();
});
test('Mentor schedule: live session offers actions; attendance stays a P2 notice', async () => {
  const clock = jest
    .spyOn(Date, 'now')
    .mockReturnValue(Date.parse(`${vietnamDate()}T19:00:00+07:00`));
  try {
    open();
    fireEvent.press(await screen.findByTestId('workspace-open-schedule'));
    await screen.findByTestId('schedule-session-today-primary');
    expect(
      screen.getByTestId('schedule-session-substitute-today-substitute')
    ).toBeTruthy();
    expect(
      screen.getByTestId('schedule-attend-today-substitute')
    ).toBeEnabled();
    expect(screen.getByTestId('schedule-week-range')).toHaveTextContent(
      /^\d{2}\/\d{2} – \d{2}\/\d{2}$/
    );
    expect(screen.getByText('Tuần này')).toBeTruthy();
    fireEvent.press(screen.getByTestId('schedule-next-week'));
    expect(await screen.findByText('Tuần sau')).toBeTruthy();
    fireEvent.press(screen.getByTestId('schedule-today-button'));
    fireEvent.press(await screen.findByTestId('schedule-attend-today-primary'));
    expect(
      await screen.findByText('Điểm danh sẽ được mở ở giai đoạn sau.')
    ).toBeTruthy();
    fireEvent.press(screen.getByTestId('schedule-detail-today-primary'));
    await screen.findByTestId('session-title');
    expect(screen.getByTestId('session-stat-present')).toHaveTextContent(/—/);
  } finally {
    clock.mockRestore();
  }
});
test('Mentor classes: status tabs with counts, default teaching, substitute hides student count', async () => {
  open();
  fireEvent.press(await screen.findByTestId('workspace-open-classes'));
  const card = within(await screen.findByTestId('classes-card-primary'));
  expect(card.queryByText('2/5 buổi · Còn 3 buổi')).toBeNull();
  expect(card.getByText('Còn 4/20 chỗ · Tại lớp')).toBeTruthy();
  expect(card.getByText('01/10/2026 – 30/01/2027')).toBeTruthy();
  expect(card.queryByText(/Buổi tới:/)).toBeNull();
  expect(
    within(screen.getByTestId('classes-card-substitute')).queryByText(
      /học viên/
    )
  ).toBeNull();
  expect(screen.getByText('Đang dạy (2)')).toBeTruthy();
  expect(screen.queryByTestId('classes-card-completed')).toBeNull();
  fireEvent.press(screen.getByTestId('classes-filter-COMPLETED'));
  await screen.findByTestId('classes-card-completed');
  fireEvent.press(screen.getByTestId('classes-filter-CANCELLED'));
  await screen.findByTestId('classes-card-cancelled');
});

test('Mentor schedule requests only the selected day and does not mark unvisited days empty', async () => {
  const original = teachingMock.createTeachingMock;
  const requests: TeachingRequest[] = [];
  let releaseDay: (() => Promise<void>) | undefined;
  const factory = jest
    .spyOn(teachingMock, 'createTeachingMock')
    .mockImplementation((scenario) => {
      const source = original(scenario);
      return {
        read: (request) => {
          requests.push(request);
          if (
            request.kind === 'schedule' &&
            request.from === `${other}T00:00:00+07:00`
          ) {
            return new Promise((resolve) => {
              releaseDay = async () => resolve(await source.read(request));
            });
          }
          return source.read(request);
        },
      };
    });
  const today = vietnamDate();
  const other = weekDates(today).find((date) => date !== today)!;
  try {
    open();
    fireEvent.press(await screen.findByTestId('workspace-open-schedule'));
    await screen.findByTestId('schedule-session-today-primary');
    const initial = requests.filter((request) => request.kind === 'schedule');
    expect(initial.length).toBeGreaterThan(0);
    for (const request of initial) {
      expect(request.from).toBe(`${today}T00:00:00+07:00`);
      expect(request.to).toBe(`${addDays(today, 1)}T00:00:00+07:00`);
    }
    expect(screen.queryByTestId(`schedule-day-dot-${other}`)).toBeNull();
    expect(
      screen.getByTestId(`schedule-day-${other}`).props.accessibilityLabel
    ).not.toMatch(/0 buổi/);
    expect(
      requests.some(
        (request) =>
          request.kind === 'context' && request.sessionId === 'next-primary'
      )
    ).toBe(false);
    fireEvent.press(screen.getByTestId(`schedule-day-${other}`));
    expect(screen.getByTestId('schedule-day-skeleton')).toBeTruthy();
    expect(screen.queryByTestId('schedule-session-today-primary')).toBeNull();
    expect(screen.queryByTestId('schedule-empty-day')).toBeNull();
    await waitFor(() =>
      expect(
        requests.filter(
          (request) =>
            request.kind === 'schedule' &&
            request.from === `${other}T00:00:00+07:00`
        )
      ).toHaveLength(1)
    );
    await act(async () => {
      await releaseDay!();
    });
    expect(screen.queryByTestId('schedule-day-skeleton')).toBeNull();
    await screen.findByTestId('schedule-day-title');
    expect(screen.getByTestId('schedule-day-title')).toHaveTextContent(
      new RegExp(shortDate(other))
    );
    const changed = requests
      .filter((request) => request.kind === 'schedule')
      .at(-1)!;
    expect(changed.to).toBe(`${addDays(other, 1)}T00:00:00+07:00`);
    expect(screen.queryByTestId('schedule-empty-week')).toBeNull();
    fireEvent.press(screen.getByTestId('schedule-today-button'));
    await screen.findByTestId('schedule-session-today-primary');
    const restored = requests
      .filter((request) => request.kind === 'schedule')
      .at(-1)!;
    expect(restored.from).toBe(`${today}T00:00:00+07:00`);
    expect(restored.to).toBe(`${addDays(today, 1)}T00:00:00+07:00`);
  } finally {
    factory.mockRestore();
  }
});

test('Mentor session defers roster and unit requests until their tabs are opened', async () => {
  const original = teachingMock.createTeachingMock;
  const requests: { kind: string; sessionId?: string }[] = [];
  const factory = jest
    .spyOn(teachingMock, 'createTeachingMock')
    .mockImplementation((scenario) => {
      const source = original(scenario);
      return {
        read: (request) => {
          requests.push(request);
          return source.read(request);
        },
      };
    });
  try {
    open();
    fireEvent.press(await screen.findByTestId('workspace-open-schedule'));
    fireEvent.press(
      await screen.findByTestId('schedule-session-today-primary')
    );
    await screen.findByTestId('session-class-code');
    expect(requests.some((request) => request.kind === 'sessionStudents')).toBe(
      false
    );
    expect(requests.some((request) => request.kind === 'units')).toBe(false);
    fireEvent.press(screen.getByTestId('session-tab-students'));
    await screen.findByTestId('session-student-enrollment-1');
    expect(
      requests.filter((request) => request.kind === 'sessionStudents')
    ).toHaveLength(1);
    expect(requests.some((request) => request.kind === 'units')).toBe(false);
    fireEvent.press(screen.getByTestId('session-tab-materials'));
    await screen.findByTestId('session-content');
    expect(requests.filter((request) => request.kind === 'units')).toHaveLength(
      1
    );
  } finally {
    factory.mockRestore();
  }
});

test('Manager session opens without fetching its roster until requested', async () => {
  const original = teachingMock.createTeachingMock;
  const reads = jest.fn();
  const factory = jest
    .spyOn(teachingMock, 'createTeachingMock')
    .mockImplementation((scenario) => {
      const source = original(scenario);
      return {
        read: (request) => {
          reads(request);
          return source.read(request);
        },
      };
    });
  try {
    open('MANAGER');
    fireEvent.press(
      await screen.findByTestId('workspace-open-manager-classes')
    );
    fireEvent.press(await screen.findByTestId('manager-classes-card-primary'));
    fireEvent.press(await screen.findByTestId('manager-detail-tab-schedule'));
    fireEvent.press(
      await screen.findByTestId('manager-detail-session-today-primary')
    );
    await screen.findByTestId('session-title');
    expect(
      reads.mock.calls.some(([request]) => request.kind === 'sessionStudents')
    ).toBe(false);
    fireEvent.press(screen.getByTestId('session-tab-students'));
    await screen.findByTestId('session-student-enrollment-1');
    expect(screen.queryByText('Chưa điểm danh')).toBeNull();
    fireEvent.press(screen.getByTestId('session-tab-overview'));
    expect(
      screen.getByTestId('session-date-tile', { includeHiddenElements: true })
    ).toBeTruthy();
    expect(screen.queryByTestId('session-primary-mentor')).toBeNull();
    fireEvent.press(screen.getByTestId('session-tab-students'));
    await screen.findByTestId('session-student-enrollment-1');
    expect(
      reads.mock.calls.filter(([request]) => request.kind === 'sessionStudents')
    ).toHaveLength(1);
  } finally {
    factory.mockRestore();
  }
});
test('Mentor class detail: sessions split into upcoming and taught', async () => {
  const original = teachingMock.createTeachingMock;
  const read = jest.fn();
  const factory = jest
    .spyOn(teachingMock, 'createTeachingMock')
    .mockImplementation((scenario) => {
      const source = original(scenario);
      return {
        read: async (request) => {
          read(request);
          return source.read(request);
        },
      };
    });
  try {
    open();
    fireEvent.press(await screen.findByTestId('workspace-open-classes'));
    fireEvent.press(await screen.findByTestId('classes-card-primary'));
    await screen.findByTestId('class-detail-session-next-primary');
    expect(screen.queryByText('2/5 buổi · Còn 3 buổi')).toBeNull();
    expect(screen.queryByText('14 học viên')).toBeNull();
    expect(
      screen.getByTestId('class-detail-students-button')
    ).toHaveTextContent('Học viên');
    await screen.findByTestId('class-detail-enter-button');
    expect(
      read.mock.calls.filter(([request]) => request.kind === 'students')
    ).toHaveLength(0);
    expect(
      read.mock.calls.filter(
        ([request]) =>
          request.kind === 'sessions' && request.classId === 'primary'
      )
    ).toHaveLength(1);
    expect(
      screen.queryByTestId('class-detail-session-past-primary')
    ).toBeNull();
    expect(screen.getByTestId('class-detail-sessions-done')).toHaveTextContent(
      '2/5 buổi'
    );
    fireEvent.press(screen.getByTestId('class-detail-tab-done'));
    await screen.findByTestId('class-detail-session-past-primary');
    expect(
      screen.queryByTestId('class-detail-session-next-primary')
    ).toBeNull();
    fireEvent.press(screen.getByTestId('class-detail-students-button'));
    await screen.findByTestId('students-row-enrollment-2');
    expect(
      read.mock.calls.some(([request]) => request.kind === 'students')
    ).toBe(true);
  } finally {
    factory.mockRestore();
  }
});
test('TC-P1-S6-08/14/21: English search and reset', async () => {
  await i18n.changeLanguage('en');
  open('MANAGER');
  fireEvent.press(await screen.findByTestId('workspace-open-manager-classes'));
  fireEvent.changeText(
    await screen.findByTestId('manager-classes-search'),
    'missing'
  );
  await screen.findByTestId('manager-classes-no-results');
  fireEvent.press(screen.getByTestId('manager-classes-clear-all'));
  await screen.findByTestId('manager-classes-card-primary');
  expect(
    screen.getByPlaceholderText('Search by class name or code')
  ).toBeTruthy();
});
test('TC-P1-S2-18: denied never leaves previous cards visible', async () => {
  open();
  fireEvent.press(await screen.findByTestId('workspace-open-classes'));
  await screen.findByTestId('classes-card-primary');
  fireEvent.press(screen.getByTestId('teaching-mock-badge'));
  await act(async () => {
    fireEvent.press(await screen.findByTestId('teaching-scenario-denied'));
  });
  await screen.findByTestId('classes-denied');
  expect(screen.queryByTestId('classes-card-primary')).toBeNull();
});

test('TC-P1-S4-18/19: student group fails independently and handles unavailable preview', async () => {
  open();
  fireEvent.press(await screen.findByTestId('workspace-open-schedule'));
  fireEvent.press(await screen.findByTestId('schedule-session-today-primary'));
  await screen.findByTestId('session-title');
  fireEvent.press(screen.getByTestId('teaching-mock-badge'));
  await act(async () => {
    fireEvent.press(
      await screen.findByTestId('teaching-scenario-studentsError')
    );
  });
  fireEvent.press(screen.getByTestId('session-tab-students'));
  await screen.findByTestId('session-students-error');
  fireEvent.press(screen.getByTestId('teaching-mock-badge'));
  await act(async () => {
    fireEvent.press(await screen.findByTestId('teaching-scenario-unavailable'));
  });
  await screen.findByTestId('session-students-unavailable');
  fireEvent.press(screen.getByTestId('session-tab-overview'));
  expect(await screen.findByTestId('session-title')).toBeTruthy();
  expect(screen.getByTestId('session-room')).toBeTruthy();
});
test('TC-P1-S3-03: CLASS with revoked roster capability hides students action', async () => {
  open();
  fireEvent.press(await screen.findByTestId('workspace-open-classes'));
  fireEvent.press(await screen.findByTestId('classes-card-primary'));
  await screen.findByTestId('class-detail-students-button');
  fireEvent.press(screen.getByTestId('teaching-mock-badge'));
  await act(async () => {
    fireEvent.press(await screen.findByTestId('teaching-scenario-noRoster'));
  });
  await screen.findByTestId('class-detail-course');
  expect(screen.queryByTestId('class-detail-students-button')).toBeNull();
});
test('TC-P1-S2-17: failed refresh preserves loaded cards with support code', async () => {
  open();
  fireEvent.press(await screen.findByTestId('workspace-open-classes'));
  await screen.findByTestId('classes-card-primary');
  fireEvent.press(screen.getByTestId('teaching-mock-badge'));
  await act(async () => {
    fireEvent.press(
      await screen.findByTestId('teaching-scenario-refreshError')
    );
  });
  expect(await screen.findByTestId('classes-refresh-alert')).toHaveTextContent(
    /mock-refresh/
  );
  expect(screen.getByTestId('classes-card-primary')).toBeTruthy();
});
test('TC-P1-S7-10, S4-14/31: cancelled class retains read access, cancelled session hides roster and link', async () => {
  open('MANAGER');
  fireEvent.press(await screen.findByTestId('workspace-open-manager-classes'));
  fireEvent.press(
    await screen.findByTestId('manager-classes-filter-CANCELLED')
  );
  fireEvent.press(await screen.findByTestId('manager-classes-card-cancelled'));
  await screen.findByTestId('manager-detail-cancelled-alert');
  fireEvent.press(screen.getByTestId('manager-detail-tab-schedule'));
  fireEvent.press(
    await screen.findByTestId('manager-detail-session-cancelled-session')
  );
  await screen.findByTestId('session-title');
  expect(screen.queryByTestId('session-students-group')).toBeNull();
  expect(screen.queryByTestId('session-link')).toBeNull();
  expect(screen.queryByTestId('session-effective-mentor')).toBeNull();
  expect(screen.getByTestId('session-primary-mentor')).toBeTruthy();
  fireEvent.press(screen.getByTestId('session-tab-students'));
  expect(
    await screen.findByTestId('session-students-cancelled')
  ).toHaveTextContent('Buổi đã hủy nên không có danh sách học viên.');
  expect(screen.queryByTestId('session-students-group')).toBeNull();
});

test.each([
  ['MENTOR', 'vi', 'light', 'Tiện ích yêu thích'],
  ['MENTOR', 'en', 'dark', 'Favorite utilities'],
  ['MANAGER', 'vi', 'dark', 'Điều phối giảng dạy'],
  ['MANAGER', 'en', 'light', 'Teaching coordination'],
])(
  'H-A/B/E: %s Home in %s/%s contains only supported tiles',
  async (role, language, theme, heading) => {
    await i18n.changeLanguage(language);
    localStore.setTheme(theme);
    open(role);
    expect(await screen.findByRole('header', { name: heading })).toBeTruthy();
    const mentor = role === 'MENTOR';
    expect(screen.queryByTestId('workspace-open-schedule') !== null).toBe(
      mentor
    );
    expect(screen.queryByTestId('workspace-open-classes') !== null).toBe(
      mentor
    );
    expect(
      screen.queryByTestId('workspace-open-manager-classes') !== null
    ).toBe(!mentor);
    const mascot = screen.getByTestId('workspace-mascot', {
      includeHiddenElements: true,
    });
    expect(mascot.props.accessible).toBe(false);
    expect(mascot.props.pointerEvents).toBe('none');
    expect(screen.queryByText(/Xem tất cả|Xem buổi dạy theo tuần/)).toBeNull();
  }
);

test('H-C/E: Settings applies English/dark immediately on returning Home', async () => {
  open('MANAGER');
  fireEvent.press(await screen.findByTestId('workspace-settings-button'));
  fireEvent.press(await screen.findByTestId('settings-language-en'));
  fireEvent.press(screen.getByTestId('settings-theme-dark'));
  fireEvent.press(screen.getByTestId('settings-back-button'));
  expect(
    await screen.findByRole('header', { name: 'Teaching coordination' })
  ).toBeTruthy();
  expect(screen.getByTestId('workspace-manager-root')).toHaveStyle({
    backgroundColor: '#101615',
  });
  expect(screen.getByRole('button', { name: 'Classes' })).toBeTruthy();
});

test('H-F: long verified identity wraps independently of account controls', async () => {
  const name = 'Nguyễn Trần Hoàng Minh Anh Phương Linh';
  const email = 'mentor.with.a.very.long.verified.address@example.test';
  open('MENTOR', name, email);
  await screen.findByTestId('workspace-mentor-root');
  expect(screen.getByText(name).props.numberOfLines).toBeUndefined();
  expect(screen.getByText(`Mentor · ${email}`).props.numberOfLines).toBe(1);
  expect(screen.getByTestId('workspace-account-button')).toHaveStyle({
    flexShrink: 0,
  });
  expect(screen.getByTestId('workspace-settings-button')).toHaveStyle({
    width: 44,
    height: 44,
    flexShrink: 0,
  });
});

test('TC-P1-S6-01/14/23: default status and counts survive searching and clearing', async () => {
  open('MANAGER');
  fireEvent.press(await screen.findByTestId('workspace-open-manager-classes'));
  await screen.findByText('Đang học (2)');
  expect(screen.getByTestId('manager-classes-count')).toHaveTextContent(
    '2 lớp'
  );
  expect(
    screen.getByTestId('manager-classes-filter-IN_PROGRESS').props
      .accessibilityState.selected
  ).toBe(true);
  expect(screen.queryByTestId('manager-classes-filter-all')).toBeNull();
  fireEvent.press(screen.getByTestId('manager-classes-filter-CANCELLED'));
  await screen.findByTestId('manager-classes-card-cancelled');
  fireEvent.changeText(screen.getByTestId('manager-classes-search'), 'missing');
  await screen.findByTestId('manager-classes-no-results');
  expect(screen.getByTestId('manager-classes-count')).toHaveTextContent(
    '1 lớp'
  );
  expect(screen.getByText('Đang học (2)')).toBeTruthy();
  fireEvent.press(screen.getByTestId('manager-classes-clear-all'));
  await screen.findByTestId('manager-classes-card-cancelled');
  expect(
    screen.getByTestId('manager-classes-filter-CANCELLED').props
      .accessibilityState.selected
  ).toBe(true);
});
test('TC-P1-S7-01/02/15/16: default overview and simple students', async () => {
  open('MANAGER');
  fireEvent.press(await screen.findByTestId('workspace-open-manager-classes'));
  fireEvent.press(await screen.findByTestId('manager-classes-card-primary'));
  expect(await screen.findByTestId('manager-detail-code')).toHaveTextContent(
    'IF-K12'
  );
  expect(
    screen.getByTestId('manager-detail-tab-overview').props.accessibilityState
      .selected
  ).toBe(true);
  expect(
    screen.queryByTestId('manager-detail-session-today-primary')
  ).toBeNull();
  expect(
    screen.queryByTestId('manager-detail-student-enrollment-1')
  ).toBeNull();
  expect(
    within(screen.getByTestId('manager-detail-enroll-COMPLETED')).getByText('0')
  ).toBeTruthy();
  fireEvent.press(screen.getByTestId('manager-detail-tab-students'));
  const held = within(
    await screen.findByTestId('manager-detail-student-enrollment-2')
  );
  expect(held.getByText('Đang giữ chỗ')).toBeTruthy();
  expect(held.getByText('Chờ xác minh')).toBeTruthy();
  expect(held.queryByText('Đang học')).toBeNull();
  expect(
    screen.queryByText(/@example.test|Chờ thanh toán|Tiền mặt/)
  ).toBeNull();
});
test('Home: Mentor today card opens Meet separately from session navigation', async () => {
  const link = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  open();
  expect(await screen.findByTestId('workspace-today-session')).toBeTruthy();
  fireEvent.press(await screen.findByTestId('workspace-today-meet'));
  expect(link).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('session-screen')).toBeNull();
  fireEvent.press(screen.getByTestId('workspace-today-session'));
  await screen.findByTestId('session-title');
  link.mockRestore();
});
test('Home: Manager rest card has no schedule action', async () => {
  open('MANAGER');
  expect(await screen.findByText('Bạn được nghỉ ngơi')).toBeTruthy();
  expect(screen.getByText('Hiện chưa có việc cần xử lý')).toBeTruthy();
  expect(screen.queryByTestId('workspace-today-schedule')).toBeNull();
});

test.each(['loading', 'error', 'offline'])(
  'fresh classes show %s without a premature empty state; offline has no retry',
  async (scenario) => {
    open();
    fireEvent.press(await screen.findByTestId('workspace-open-classes'));
    await screen.findByTestId('classes-card-primary');
    fireEvent.press(screen.getByTestId('teaching-mock-badge'));
    await act(async () => {
      fireEvent.press(
        await screen.findByTestId(`teaching-scenario-${scenario}`)
      );
    });
    // A new filter has no cached rows, unlike a refresh of the current filter.
    fireEvent.press(screen.getByTestId('classes-filter-OPEN'));
    expect(screen.queryByTestId('classes-empty-filter')).toBeNull();
    expect(screen.queryByTestId('classes-card-primary')).toBeNull();
    if (scenario === 'loading') {
      expect(
        within(screen.getByTestId('classes-query-block')).getByRole(
          'progressbar'
        )
      ).toBeTruthy();
      expect(screen.queryByTestId('classes-feedback')).toBeNull();
    } else {
      expect(await screen.findByTestId('classes-error')).toBeTruthy();
      expect(screen.queryByTestId('classes-retry') !== null).toBe(
        scenario !== 'offline'
      );
      if (scenario === 'offline')
        expect(screen.getByTestId('classes-error')).toHaveTextContent(
          'Không có kết nối mạng'
        );
    }
    const rendered = screen
      .getByTestId('classes-query-block')
      .findAll(
        (node) =>
          !!node.props.testID || node.props.accessibilityRole === 'progressbar'
      )
      .map((node) => node.props.testID ?? node.props.accessibilityRole);
    expect(rendered.indexOf('classes-content')).toBeLessThan(
      rendered.indexOf(
        scenario === 'loading' ? 'progressbar' : 'classes-feedback'
      )
    );
  }
);

test('offline refresh keeps class cards and shows warning without retry', async () => {
  open();
  fireEvent.press(await screen.findByTestId('workspace-open-classes'));
  await screen.findByTestId('classes-card-primary');
  fireEvent.press(screen.getByTestId('teaching-mock-badge'));
  await act(async () => {
    fireEvent.press(await screen.findByTestId('teaching-scenario-offline'));
  });
  expect(await screen.findByTestId('classes-refresh-alert')).toHaveTextContent(
    'Không có kết nối mạng'
  );
  expect(screen.getByTestId('classes-card-primary')).toBeTruthy();
  expect(screen.queryByTestId('classes-retry')).toBeNull();
});

test.each(['offline', 'error', 'refreshError'])(
  'Home %s has one padded warning, hides cached session/actions and recovers',
  async (scenario) => {
    const warning =
      scenario === 'offline'
        ? 'Không có kết nối mạng'
        : 'Chưa tải được lịch hôm nay.';
    const warningId =
      scenario === 'offline'
        ? 'workspace-today-offline'
        : 'workspace-today-error';
    open();
    await screen.findByTestId('workspace-today-session');
    fireEvent.press(screen.getByTestId('workspace-open-classes'));
    await screen.findByTestId('classes-card-primary');
    fireEvent.press(screen.getByTestId('teaching-mock-badge'));
    await act(async () => {
      fireEvent.press(
        await screen.findByTestId(`teaching-scenario-${scenario}`)
      );
    });
    fireEvent.press(screen.getByTestId('classes-back-button'));
    await screen.findByTestId(warningId);
    const card = screen.getByTestId('workspace-today-card');
    expect(card).toHaveStyle({ padding: 24 });
    expect(within(card).getAllByText(warning)).toHaveLength(1);
    expect(within(card).queryByText('Thử lại')).toBeNull();
    expect(within(card).queryByRole('button')).toBeNull();
    expect(screen.queryByTestId('workspace-today-session')).toBeNull();
    expect(screen.queryByTestId('workspace-today-schedule')).toBeNull();
    expect(screen.queryByTestId('workspace-today-context-error')).toBeNull();
    expect(screen.queryByTestId('workspace-today-refresh-alert')).toBeNull();
    fireEvent.press(screen.getByTestId('workspace-open-classes'));
    fireEvent.press(await screen.findByTestId('teaching-mock-badge'));
    await act(async () => {
      fireEvent.press(await screen.findByTestId('teaching-scenario-success'));
    });
    fireEvent.press(screen.getByTestId('classes-back-button'));
    await screen.findByTestId('workspace-today-session');
    expect(screen.queryByTestId(warningId)).toBeNull();
    expect(screen.getByTestId('workspace-today-schedule')).toBeTruthy();
  }
);
