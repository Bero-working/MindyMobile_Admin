import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import axios from 'axios';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MindyThemeProvider } from '@/components/ui/theme';
import { TeachingProvider } from '@/modules/teaching/TeachingProvider';
import {
  ManagerClassesScreen,
  MentorClassesScreen,
} from '@/modules/teaching/screens/ClassesScreens';
import { createTeachingService } from '@/modules/teaching/services/teachingService';
import { ManagerClassDetailScreen } from '@/modules/teaching/screens/ManagerClassDetailScreen';
import { createTeachingMock } from '@/modules/teaching/services/mockTeaching';
import type {
  TeachingRequest,
  TeachingResult,
  TeachingSource,
} from '@/modules/teaching/types';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import i18n from '@/translations';
const Stack = createNativeStackNavigator<AuthStackParams>();
function open(source: TeachingSource, detail = false, mentor = false) {
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 800 },
        insets: { top: 24, left: 0, right: 0, bottom: 24 },
      }}
    >
      <MindyThemeProvider>
        <TeachingProvider source={source}>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName={
                detail
                  ? 'ManagerClassDetail'
                  : mentor
                    ? 'MentorClasses'
                    : 'ManagerClasses'
              }
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen
                name="MentorClasses"
                component={MentorClassesScreen}
              />
              <Stack.Screen
                name="ManagerClasses"
                component={ManagerClassesScreen}
              />
              <Stack.Screen
                name="ManagerClassDetail"
                component={ManagerClassDetailScreen}
                initialParams={{ classId: 'primary' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </TeachingProvider>
      </MindyThemeProvider>
    </SafeAreaProvider>
  );
}
beforeEach(async () => {
  await i18n.changeLanguage('vi');
});

test.each(['MENTOR', 'MANAGER'] as const)(
  '%s reserves the subtitle and replaces initial content with skeletons while loading',
  async (role) => {
    const base = createTeachingMock();
    const finish: (() => Promise<void>)[] = [];
    const read = jest.fn(
      (request: TeachingRequest): Promise<TeachingResult> =>
        new Promise((resolve) => {
          finish.push(async () => resolve(await base.read(request)));
        })
    );
    open({ read }, false, role === 'MENTOR');
    const prefix = role === 'MENTOR' ? 'classes' : 'manager-classes';
    expect(screen.getByTestId(`${prefix}-heading-skeleton`)).toBeTruthy();
    expect(screen.getByTestId(`${prefix}-subtitle-slot`)).toHaveStyle({
      minHeight: 21,
    });
    expect(screen.getByTestId(`${prefix}-loading`)).toBeTruthy();
    expect(screen.queryByTestId(`${prefix}-empty-filter`)).toBeNull();
    expect(screen.queryByTestId(`${prefix}-empty`)).toBeNull();
    expect(read).toHaveBeenCalledTimes(2);
    await act(async () => {
      await Promise.all(finish.map((resolve) => resolve()));
    });
    await screen.findByTestId(`${prefix}-card-primary`);
    expect(screen.queryByTestId(`${prefix}-heading-skeleton`)).toBeNull();
    expect(screen.queryByTestId(`${prefix}-loading`)).toBeNull();
    expect(screen.getByTestId(`${prefix}-count`)).toHaveTextContent(/2/);
    expect(screen.getByTestId(`${prefix}-subtitle-slot`)).toHaveStyle({
      minHeight: 21,
    });
    expect(read).toHaveBeenCalledTimes(2);
  }
);

test.each(['MENTOR', 'MANAGER'] as const)(
  '%s list opens with exactly two HTTP requests and loads other statuses on selection',
  async (role) => {
    const id = '11111111-1111-4111-8111-111111111111';
    const client = axios.create();
    const request = jest
      .spyOn(client, 'request')
      .mockImplementation(async (config) => ({
        status: 200,
        data: {
          items: [
            {
              id,
              code: 'C1',
              name: 'Class',
              status: config.params.status ?? 'IN_PROGRESS',
              startDate: '2026-10-01',
              endDate: '2026-12-31',
              deliveryMode: 'OFFLINE',
              maxStudents: 20,
              availableSeats: 4,
              mentor: { id, displayName: 'Mentor' },
              assignmentType: 'PRIMARY',
              accessScope: 'CLASS',
            },
          ],
          page: config.params.page,
          pageSize: config.params.pageSize,
          total: 1,
        },
      }));
    open(
      createTeachingService({
        baseURL: 'https://test.mindy.vn/api/v1',
        client,
      }),
      false,
      role === 'MENTOR'
    );
    const prefix = role === 'MENTOR' ? 'classes' : 'manager-classes';
    await screen.findByTestId(`${prefix}-card-${id}`);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls.map(([config]) => config.url)).toEqual([
      `/${role.toLowerCase()}/classes`,
      `/${role.toLowerCase()}/classes`,
    ]);
    expect(request.mock.calls.map(([config]) => config.params.status)).toEqual([
      'IN_PROGRESS',
      'IN_PROGRESS',
    ]);
    fireEvent.press(screen.getByTestId(`${prefix}-filter-OPEN`));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(4));
    expect(request.mock.calls[2]?.[0].params.status).toBe('OPEN');
    expect(
      request.mock.calls.filter(([config]) => config.params.pageSize === 1)
    ).toHaveLength(2);
  }
);
test('TC-P1-S6-22/23: count failure is isolated; searching never repeats count requests', async () => {
  const base = createTeachingMock();
  const read = jest.fn(
    async (request: TeachingRequest): Promise<TeachingResult> =>
      request.pageSize === 1 && request.status === 'IN_PROGRESS'
        ? { kind: 'error' }
        : base.read(request)
  );
  open({ read });
  await screen.findByTestId('manager-classes-card-primary');
  expect(screen.getByText('Đang mở')).toBeTruthy();
  expect(screen.queryByTestId('manager-classes-count')).toBeNull();
  expect(
    read.mock.calls.filter(([request]) => request.pageSize === 1)
  ).toHaveLength(1);
  fireEvent.changeText(
    screen.getByTestId('manager-classes-search'),
    '  IELTS  '
  );
  await waitFor(() =>
    expect(read.mock.calls.some(([request]) => request.q === 'IELTS')).toBe(
      true
    )
  );
  expect(
    read.mock.calls.filter(([request]) => request.pageSize === 1)
  ).toHaveLength(1);
  expect(
    read.mock.calls.filter(([request]) => request.q === 'IELTS')
  ).toHaveLength(1);
});
test('TC-P1-S7-01/12: child tabs load only when visited and reuse data when switching', async () => {
  const base = createTeachingMock();
  const read = jest.fn((request: TeachingRequest) => base.read(request));
  open({ read }, true);
  await screen.findByTestId('manager-detail-code');
  expect(read.mock.calls.map(([request]) => request.kind)).toEqual(['class']);
  fireEvent.press(screen.getByTestId('manager-detail-tab-schedule'));
  await screen.findByTestId('manager-detail-session-today-primary');
  fireEvent.press(screen.getByTestId('manager-detail-tab-students'));
  await screen.findByTestId('manager-detail-student-enrollment-1');
  fireEvent.press(screen.getByTestId('manager-detail-tab-overview'));
  fireEvent.press(screen.getByTestId('manager-detail-tab-schedule'));
  expect(read.mock.calls.map(([request]) => request.kind)).toEqual([
    'class',
    'sessions',
    'students',
  ]);
});
test('TC-P1-S7-22: summary error leaves the other tabs accessible', async () => {
  const base = createTeachingMock();
  open(
    {
      read: async (request) =>
        request.kind === 'class' ? { kind: 'error' } : base.read(request),
    },
    true
  );
  await screen.findByTestId('manager-detail-error');
  fireEvent.press(screen.getByTestId('manager-detail-tab-students'));
  await screen.findByTestId('manager-detail-student-enrollment-1');
  expect(screen.queryByTestId('manager-detail-error')).toBeNull();
});
