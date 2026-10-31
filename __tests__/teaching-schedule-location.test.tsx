import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MindyThemeProvider } from '@/components/ui/theme';
import { TeachingProvider } from '@/modules/teaching/TeachingProvider';
import {
  ScheduleLocation,
  ScheduleActions,
} from '@/modules/teaching/screens/TeachingScheduleScreen';
import { createTeachingMock } from '@/modules/teaching/services/mockTeaching';
import type {
  TeachingClass,
  TeachingResult,
  TeachingSession,
  TeachingSource,
} from '@/modules/teaching/types';
import i18n from '@/translations';

const Stack = createNativeStackNavigator<{ Probe: undefined }>();
let item: TeachingSession;
let classInfo: TeachingClass;
let response: TeachingResult;
beforeEach(async () => {
  await i18n.changeLanguage('vi');
  const mock = createTeachingMock();
  const result = await mock.read({
    kind: 'context',
    role: 'MENTOR',
    sessionId: 'today-primary',
  });
  const detail = await mock.read({
    kind: 'class',
    role: 'MENTOR',
    classId: 'primary',
  });
  if (
    result.kind !== 'success' ||
    !result.data.session ||
    detail.kind !== 'success' ||
    !detail.data.classInfo
  )
    throw new Error('Missing fixture');
  item = { ...result.data.session, room: null, meetingUrl: null };
  classInfo = detail.data.classInfo;
  response = {
    kind: 'success',
    data: {
      ...result.data,
      session: { ...result.data.session, room: 'Lab Python', meetingUrl: null },
    },
  };
});
function open(
  source: TeachingSource,
  actions?: { onAttend: () => void; onDetail: () => void }
) {
  render(
    <MindyThemeProvider>
      <TeachingProvider source={source}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Probe">
              {() =>
                actions ? (
                  <ScheduleActions
                    item={item}
                    {...actions}
                  />
                ) : (
                  <ScheduleLocation
                    item={item}
                    classInfo={classInfo}
                  />
                )
              }
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </TeachingProvider>
    </MindyThemeProvider>
  );
}
test('schedule card reads the room from session context even when timetable omits it', async () => {
  const read = jest.fn(async () => response);
  open({ read });
  await screen.findByText(/Lab Python/);
  expect(screen.queryByText(item.title)).toBeNull();
  expect(read).toHaveBeenCalledWith({
    kind: 'context',
    role: 'MENTOR',
    sessionId: item.id,
    page: 1,
  });
  expect(
    screen.queryByText(/Chưa cập nhật|Chưa có thông tin phòng/)
  ).toBeNull();
});
test('pending context is loading rather than a claim that the room was not provided', () => {
  open({ read: () => new Promise(() => {}) });
  expect(
    screen.getByTestId(`schedule-location-loading-${item.id}`)
  ).toBeTruthy();
  expect(screen.getByRole('progressbar').props.accessibilityState.busy).toBe(
    true
  );
  expect(
    screen.queryByText(/Chưa cập nhật|Chưa có thông tin phòng/)
  ).toBeNull();
});
test.each(['error', 'offline', 'denied', 'notFound'] as const)(
  'context %s is never presented as a missing room',
  async (kind) => {
    const read = jest.fn(async (): Promise<TeachingResult> => ({ kind }));
    open({ read });
    if (kind === 'error') await screen.findByText(/Chưa tải được phòng học/);
    else if (kind === 'offline') await screen.findByText(/Ngoại tuyến/);
    else
      await waitFor(() =>
        expect(
          screen.queryByTestId(`schedule-location-loading-${item.id}`)
        ).toBeNull()
      );
    expect(
      screen.queryByText(/Chưa cập nhật|Chưa có thông tin phòng/)
    ).toBeNull();
  }
);
test('room is unavailable only after a successful context explicitly returns null', async () => {
  if (response.kind !== 'success' || !response.data.session)
    throw new Error('Missing fixture');
  response.data.session.room = null;
  open({ read: async () => response });
  await screen.findByText(/Chưa có thông tin phòng/);
});
test('online classes are labeled online even when no meeting URL is published', async () => {
  classInfo.deliveryMode = 'ONLINE';
  if (response.kind !== 'success' || !response.data.session)
    throw new Error('Missing fixture');
  response.data.session.room = null;
  open({ read: async () => response });
  await screen.findByText(/Trực tuyến/);
  expect(screen.queryByText(/Chưa có thông tin phòng/)).toBeNull();
});
test('a cancelled session does not request private session context', () => {
  item.status = 'CANCELLED';
  const read = jest.fn(async () => response);
  open({ read });
  expect(read).not.toHaveBeenCalled();
  expect(screen.queryByTestId(`schedule-location-${item.id}`)).toBeNull();
});

test('attendance enables at start, disables at end, and detail stays available', () => {
  jest.useFakeTimers();
  try {
    item.status = 'SCHEDULED';
    const startsAt = Date.parse(item.startsAt);
    item.endsAt = new Date(startsAt + 2000).toISOString();
    jest.setSystemTime(startsAt - 1000);
    const onAttend = jest.fn();
    const onDetail = jest.fn();
    open({ read: async () => response }, { onAttend, onDetail });
    const attend = () => screen.getByTestId(`schedule-attend-${item.id}`);
    expect(attend()).toBeDisabled();
    fireEvent.press(attend());
    expect(onAttend).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId(`schedule-detail-${item.id}`));
    expect(onDetail).toHaveBeenCalledTimes(1);
    act(() => jest.advanceTimersByTime(1000));
    expect(attend()).toBeEnabled();
    fireEvent.press(attend());
    expect(onAttend).toHaveBeenCalledTimes(1);
    act(() => jest.advanceTimersByTime(2000));
    expect(attend()).toBeDisabled();
    expect(screen.getByTestId(`schedule-detail-${item.id}`)).toBeEnabled();
  } finally {
    jest.useRealTimers();
  }
});
test.each(['COMPLETED', 'CANCELLED'] as const)(
  'attendance remains disabled for %s sessions',
  (status) => {
    item.status = status;
    open(
      { read: async () => response },
      { onAttend: jest.fn(), onDetail: jest.fn() }
    );
    expect(screen.getByTestId(`schedule-attend-${item.id}`)).toBeDisabled();
    expect(screen.getByTestId(`schedule-detail-${item.id}`)).toBeEnabled();
  }
);
