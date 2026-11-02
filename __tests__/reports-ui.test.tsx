import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { ComponentProps } from 'react';
import { MindyThemeProvider } from '@/components/ui/theme';
import { ReportsProvider } from '@/modules/reports/ReportsProvider';
import {
  ManagerAttendanceReportScreen,
  MentorAttendanceReportScreen,
  MentorStudentReportScreen,
} from '@/modules/reports/ReportScreens';
import type { ReportsService } from '@/modules/reports/service';
import { ApiError } from '@/shared/http/apiClient';
import i18n from '@/translations';

let mockRole = 'MENTOR';
const mockService = {
  ensureDirect: jest.fn(),
};
jest.mock('@/modules/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    state: { user: { id: 'm1', role: mockRole } },
    notify: jest.fn(),
  }),
}));
jest.mock('@/modules/chat/ChatProvider', () => ({
  useChat: () => ({ service: mockService }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    addListener: () => () => {},
  }),
}));
const source = {
  asOf: '2026-11-02T07:32:00.000Z',
  timeZone: 'Asia/Ho_Chi_Minh',
};
const row = (id: string, patch = {}) => ({
  enrollmentId: id,
  student: { id: `s-${id}`, displayName: `Name ${id}` },
  present: 5,
  absent: 1,
  unmarked: 0,
  excluded: 0,
  makeupPending: 0,
  finalizedEligibleCount: 6,
  rate: 83.33,
  ...patch,
});
const page = (items: object[], total = items.length, pageNumber = 1) => ({
  classId: 'c1',
  items,
  total,
  page: pageNumber,
  pageSize: 20,
  ...source,
});
const fake = (patch: Partial<ReportsService>): ReportsService =>
  ({
    classSummary: jest.fn(),
    classProgress: jest.fn(),
    studentSummary: jest.fn(),
    studentHistory: jest.fn(),
    studentProgress: jest.fn(),
    units: jest.fn(),
    ...patch,
  }) as never;
const navigation = { navigate: jest.fn(), goBack: jest.fn() };
const params = { classId: 'c1', classTitle: 'IELTS' };
function mentor(service: ReportsService) {
  return render(
    <MindyThemeProvider>
      <ReportsProvider service={service}>
        <MentorAttendanceReportScreen
          {...({ route: { params }, navigation } as object as ComponentProps<
            typeof MentorAttendanceReportScreen
          >)}
        />
      </ReportsProvider>
    </MindyThemeProvider>
  );
}
function manager(service: ReportsService) {
  return render(
    <MindyThemeProvider>
      <ReportsProvider service={service}>
        <ManagerAttendanceReportScreen
          {...({ route: { params }, navigation } as object as ComponentProps<
            typeof ManagerAttendanceReportScreen
          >)}
        />
      </ReportsProvider>
    </MindyThemeProvider>
  );
}
function student(service: ReportsService, tab?: 'progress') {
  return render(
    <MindyThemeProvider>
      <ReportsProvider service={service}>
        <MentorStudentReportScreen
          {...({
            route: {
              params: {
                classId: 'c1',
                studentId: 's1',
                studentName: 'An',
                tab,
              },
            },
            navigation,
          } as object as ComponentProps<typeof MentorStudentReportScreen>)}
        />
      </ReportsProvider>
    </MindyThemeProvider>
  );
}
beforeEach(async () => {
  mockRole = 'MENTOR';
  navigation.navigate.mockClear();
  await i18n.changeLanguage('vi');
});
test('first load calls one attendance page; progress waits for its tab', async () => {
  const classSummary = jest.fn().mockResolvedValue(page([row('e1')], 1));
  const classProgress = jest.fn().mockResolvedValue({
    items: [
      {
        enrollmentId: 'e1',
        studentId: 's1',
        displayName: 'An',
        storedUnitCount: 3,
        untrackedUnitCount: 9,
        invalidStoredUnitCount: 1,
      },
    ],
    total: 1,
    page: 1,
    pageSize: 20,
    ...source,
  });
  mentor(fake({ classSummary, classProgress }));
  await screen.findByTestId('mentor-report-row-e1');
  expect(classSummary).toHaveBeenCalledTimes(1);
  expect(classSummary).toHaveBeenCalledWith('MENTOR', 'c1', 1, undefined);
  expect(classProgress).not.toHaveBeenCalled();
  expect(screen.getByTestId('mentor-report-count')).toHaveTextContent(
    '1 lượt ghi danh'
  );
  expect(screen.getByTestId('mentor-report-as-of')).toHaveTextContent(
    'Số liệu lúc 14:32 02/11/2026'
  );
  fireEvent.press(screen.getByTestId('mentor-report-tab-progress'));
  await screen.findByTestId('mentor-report-progress-e1');
  expect(classProgress).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Có dữ liệu 3 · Chưa theo dõi 9')).toBeTruthy();
  expect(screen.getByText('1 chương dữ liệu không hợp lệ')).toBeTruthy();
  expect(screen.getByTestId('mentor-report-progress-note')).toBeTruthy();
  expect(screen.queryByTestId('mentor-report-range')).toBeNull();
});
test('null rate is a dash with no counts; zero rate is a real 0%', async () => {
  mentor(
    fake({
      classSummary: jest.fn().mockResolvedValue(
        page([
          row('e1', {
            rate: null,
            present: 0,
            absent: 0,
            finalizedEligibleCount: 0,
            excluded: 10,
          }),
          row('e2', {
            rate: 0,
            present: 0,
            absent: 3,
            finalizedEligibleCount: 3,
          }),
        ])
      ),
    })
  );
  expect(
    await screen.findByTestId('mentor-report-row-e1-rate')
  ).toHaveTextContent('—');
  expect(
    screen.getByTestId('mentor-report-row-e1-denominator')
  ).toHaveTextContent('Chưa có buổi đã chốt');
  expect(screen.queryByText('Có mặt 0 · Vắng 0')).toBeNull();
  expect(screen.getByTestId('mentor-report-row-e1-excluded')).toHaveTextContent(
    'Không tính 10'
  );
  expect(screen.getByTestId('mentor-report-row-e2-rate')).toHaveTextContent(
    '0%'
  );
  expect(
    screen.getByTestId('mentor-report-row-e2-denominator')
  ).toHaveTextContent('0/3 buổi đã chốt');
  expect(screen.queryByTestId('mentor-report-row-e2-makeup')).toBeNull();
  expect(screen.queryByTestId('mentor-report-row-e2-excluded')).toBeNull();
});
test('rows open the student with the current data, not their figures', async () => {
  mentor(
    fake({ classSummary: jest.fn().mockResolvedValue(page([row('e1')])) })
  );
  fireEvent.press(await screen.findByTestId('mentor-report-row-e1'));
  expect(navigation.navigate).toHaveBeenCalledWith('MentorStudentReport', {
    classId: 'c1',
    classTitle: 'IELTS',
    studentId: 's-e1',
    studentName: 'Name e1',
  });
});
test('more loads on demand, removes duplicates and retries the failed page', async () => {
  const classSummary = jest
    .fn()
    .mockResolvedValueOnce(page([row('e1'), row('e2')], 3))
    .mockRejectedValueOnce(new ApiError('error'))
    .mockResolvedValueOnce(page([row('e2'), row('e3')], 3, 2));
  mentor(fake({ classSummary }));
  await screen.findByTestId('mentor-report-row-e2');
  expect(classSummary).toHaveBeenCalledTimes(1);
  await act(async () => {
    fireEvent.press(screen.getByTestId('mentor-report-more'));
  });
  expect(classSummary).toHaveBeenLastCalledWith('MENTOR', 'c1', 2, undefined);
  expect(screen.getByTestId('mentor-report-row-e1')).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('mentor-report-more'));
  });
  expect(classSummary).toHaveBeenLastCalledWith('MENTOR', 'c1', 2, undefined);
  expect(await screen.findByTestId('mentor-report-row-e3')).toBeTruthy();
  expect(screen.getAllByTestId('mentor-report-row-e2')).toHaveLength(1);
  expect(screen.queryByTestId('mentor-report-more')).toBeNull();
});
test('a first-load failure offers retry and shows neither zero nor empty', async () => {
  const classSummary = jest
    .fn()
    .mockRejectedValueOnce(new ApiError('error', 'X', 'req-1'))
    .mockResolvedValueOnce(page([row('e1')]));
  mentor(fake({ classSummary }));
  expect(await screen.findByTestId('mentor-report-error')).toBeTruthy();
  expect(screen.queryByTestId('mentor-report-empty')).toBeNull();
  expect(screen.queryByTestId('mentor-report-count')).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByTestId('mentor-report-retry'));
  });
  expect(await screen.findByTestId('mentor-report-row-e1')).toBeTruthy();
});
test('offline before any data is not an empty report', async () => {
  mentor(
    fake({
      classSummary: jest.fn().mockRejectedValue(new ApiError('offline')),
    })
  );
  expect(await screen.findByTestId('mentor-report-offline')).toBeTruthy();
  expect(screen.queryByTestId('mentor-report-retry')).toBeNull();
  expect(screen.queryByTestId('mentor-report-empty')).toBeNull();
});
test('403 shows denied with no figures', async () => {
  mentor(
    fake({ classSummary: jest.fn().mockRejectedValue(new ApiError('denied')) })
  );
  expect(await screen.findByTestId('mentor-report-denied')).toBeTruthy();
  expect(screen.queryByTestId('mentor-report-count')).toBeNull();
  expect(screen.queryByTestId('mentor-report-range')).toBeNull();
});
test('a mentor opening the manager route is denied without a request', async () => {
  const classSummary = jest.fn();
  manager(fake({ classSummary }));
  expect(await screen.findByTestId('manager-report-denied')).toBeTruthy();
  expect(classSummary).not.toHaveBeenCalled();
});
test('manager rows cannot be pressed and no progress tab exists', async () => {
  mockRole = 'MANAGER';
  const classSummary = jest.fn().mockResolvedValue(page([row('e1')]));
  manager(fake({ classSummary }));
  const item = await screen.findByTestId('manager-report-row-e1');
  fireEvent.press(item);
  expect(navigation.navigate).not.toHaveBeenCalled();
  expect(classSummary).toHaveBeenCalledWith('MANAGER', 'c1', 1, undefined);
  expect(screen.queryByTestId('manager-report-tab-progress')).toBeNull();
  expect(screen.queryByTestId('mentor-report-readonly')).toBeNull();
});
const history = (patch: object) => ({
  sessionId: 'x1',
  enrollmentId: 'e1',
  title: 'Buổi 8',
  startsAt: source.asOf,
  sessionStatus: 'COMPLETED',
  attendanceStatus: 'ABSENT',
  attendanceApplicability: 'ELIGIBLE',
  assignmentType: 'PRIMARY',
  creditedAttendanceStatus: null,
  ...patch,
});
const historyService = (item: object, summary?: jest.Mock) =>
  fake({
    studentSummary:
      summary ??
      jest.fn().mockResolvedValue({
        ...row('e1'),
        classId: 'c1',
        ...source,
        readonly: false,
        aggregationScope: 'STUDENT_CLASS_HISTORY',
      }),
    studentHistory: jest
      .fn()
      .mockResolvedValue({ ...page([item]), readonly: false }),
    studentProgress: jest.fn(),
    units: jest.fn(),
  });
test('physical and credited status stay separate for a counted make-up', async () => {
  const service = historyService(
    history({
      attendanceApplicability: 'MAKEUP_CREDITED',
      creditedAttendanceStatus: 'PRESENT',
    })
  );
  student(service);
  const id = 'student-report-session-x1';
  expect(await screen.findByTestId(`${id}-attendance`)).toHaveTextContent(
    'Điểm danh: Vắng'
  );
  expect(screen.getByTestId(`${id}-credit`)).toHaveTextContent(
    'Tính chuyên cần: Có mặt'
  );
  expect(screen.getByTestId(`${id}-applicability`)).toHaveTextContent(
    'Đã tính học bù'
  );
  expect(screen.getByTestId('student-report-scope')).toBeTruthy();
  expect(service.studentProgress).not.toHaveBeenCalled();
});
test('a session not started shows only its applicability', async () => {
  student(
    historyService(
      history({
        attendanceStatus: null,
        attendanceApplicability: 'NOT_STARTED',
      })
    )
  );
  const id = 'student-report-session-x1';
  expect(await screen.findByTestId(`${id}-applicability`)).toHaveTextContent(
    'Chưa diễn ra'
  );
  expect(screen.queryByTestId(`${id}-attendance`)).toBeNull();
  expect(screen.queryByTestId(`${id}-credit`)).toBeNull();
});
test('a failed summary does not hide the history', async () => {
  student(
    historyService(
      history({}),
      jest.fn().mockRejectedValue(new ApiError('error'))
    )
  );
  expect(await screen.findByTestId('student-report-session-x1')).toBeTruthy();
  expect(screen.getByTestId('student-report-summary-error')).toBeTruthy();
});
test('404 for a student shows not found and drops the data', async () => {
  student(
    fake({
      studentSummary: jest
        .fn()
        .mockRejectedValue(new ApiError('notFound', 'CLASS_STUDENT_NOT_FOUND')),
      studentHistory: jest
        .fn()
        .mockRejectedValue(new ApiError('notFound', 'CLASS_STUDENT_NOT_FOUND')),
    })
  );
  expect(await screen.findByTestId('student-report-not-found')).toBeTruthy();
  expect(screen.queryByTestId('student-report-scope')).toBeNull();
});
const unit = (id: string, patch: object) => ({
  enrollmentId: 'e1',
  classUnitId: id,
  trackingStatus: 'STORED',
  status: 'IN_PROGRESS',
  progressPercent: '40.50',
  completedAt: null,
  dataQuality: 'VALID',
  ...patch,
});
test('stored progress keeps every data-quality case distinct', async () => {
  const studentProgress = jest.fn().mockResolvedValue({
    items: [
      unit('u1', {}),
      unit('u2', {
        trackingStatus: 'UNTRACKED',
        status: null,
        progressPercent: null,
        dataQuality: 'UNTRACKED',
      }),
      unit('u3', { progressPercent: null, dataQuality: 'INVALID_PERCENT' }),
      unit('u4', { progressPercent: null, dataQuality: 'UNTRACKED' }),
    ],
    total: 4,
    page: 1,
    pageSize: 20,
    ...source,
  });
  student(
    fake({
      studentProgress,
      units: jest.fn().mockRejectedValue(new ApiError('error')),
    }),
    'progress'
  );
  expect(
    await screen.findByTestId('student-report-unit-u1-percent')
  ).toHaveTextContent('40,50%');
  expect(
    screen.getByTestId('student-report-unit-u2-percent')
  ).toHaveTextContent('Chưa theo dõi');
  expect(screen.queryByTestId('student-report-unit-u2-status')).toBeNull();
  expect(screen.getByText('Dữ liệu không hợp lệ')).toBeTruthy();
  expect(screen.queryByTestId('student-report-unit-u3-percent')).toBeNull();
  expect(
    screen.getByTestId('student-report-unit-u4-percent')
  ).toHaveTextContent('Chưa có %');
  // The chapter lookup failed: rows still render, with no raw ids.
  await waitFor(() => expect(screen.getByText('Chương 1')).toBeTruthy());
  expect(screen.queryByText('u1')).toBeNull();
  expect(screen.queryByTestId('student-report-range')).toBeNull();
});
