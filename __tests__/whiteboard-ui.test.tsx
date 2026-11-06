import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState } from 'react-native';
import { io } from 'socket.io-client';
import * as Y from 'yjs';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { MindyThemeProvider } from '@/components/ui/theme';
import { WhiteboardProvider } from '@/modules/whiteboard/WhiteboardProvider';
import { WhiteboardScreen } from '@/modules/whiteboard/WhiteboardScreen';
import { createWhiteboardService } from '@/modules/whiteboard/service';
import * as realtime from '@/modules/whiteboard/connection';
import { decode, encode, shapesOf } from '@/modules/whiteboard/document';
import { ApiError } from '@/shared/http/apiClient';
import type { BoardContext } from '@/modules/whiteboard/schema';
import i18n from '@/translations';
import { env } from '@/config/env';

const mockNotify = jest.fn();
jest.mock('@/modules/auth/hooks/useAuth', () => ({
  useAuth: () => ({ notify: mockNotify }),
}));
const Stack = createNativeStackNavigator<AuthStackParams>();
const sessionId = '11111111-1111-4111-8111-111111111111';
const boardId = '22222222-2222-4222-8222-222222222222';
const value: BoardContext = {
  sessionId,
  board: null,
  context: {
    sessionId,
    sessionTitle: 'Buổi 1',
    classId: sessionId,
    className: 'HTML & CSS',
    sessionStatus: 'IN_PROGRESS',
  },
  capabilities: {
    canView: true,
    canCreate: true,
    canEdit: false,
    canControl: true,
    canUpload: true,
    canSnapshot: true,
    canRestore: true,
    canExport: true,
    canCollaborate: true,
  },
};
function open(api: ReturnType<typeof createWhiteboardService>) {
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 412, height: 892 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <MindyThemeProvider>
        <WhiteboardProvider service={api}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen
                name="SessionWhiteboard"
                component={WhiteboardScreen}
                initialParams={{ sessionId }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </WhiteboardProvider>
      </MindyThemeProvider>
    </SafeAreaProvider>
  );
}
beforeEach(async () => {
  env.API_URL = 'https://api.example.test/api/v1';
  env.API_ORIGIN = 'https://mobile.example.test';
  AppState.currentState = 'active';
  await i18n.changeLanguage('vi');
  mockNotify.mockClear();
});
afterEach(() => jest.restoreAllMocks());

test('opening an empty board does not create it; the create action is explicit', async () => {
  const api = createWhiteboardService();
  jest.spyOn(api, 'context').mockResolvedValue(value);
  const create = jest.spyOn(api, 'create').mockResolvedValue(value);
  open(api);
  await screen.findByText('Bắt đầu từ một ý tưởng');
  expect(create).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('whiteboard-create'));
  await waitFor(() =>
    expect(create).toHaveBeenCalledWith(
      sessionId,
      expect.stringMatching(/^[\da-f-]{36}$/)
    )
  );
});

test('disabled feature and denied scope show recoverable or closed states', async () => {
  const api = createWhiteboardService();
  jest
    .spyOn(api, 'context')
    .mockRejectedValueOnce(new ApiError('notFound', 'BOARD_DISABLED'))
    .mockRejectedValueOnce(new ApiError('denied'));
  open(api);
  await screen.findByText('Bảng tương tác chưa được bật trên máy chủ.');
  fireEvent.press(screen.getByText('Thử lại'));
  await screen.findByText(
    'Bạn không còn quyền truy cập bảng của buổi học này.'
  );
  expect(screen.queryByTestId('whiteboard-create')).toBeNull();
  expect(screen.queryByTestId('whiteboard-canvas')).toBeNull();
});

test('native note tool writes shared text and renders only after joining the session board', async () => {
  const api = createWhiteboardService();
  const doc = new Y.Doc();
  doc.getMap('shapes');
  const context = {
    ...value,
    board: {
      id: boardId,
      sessionId,
      epoch: '33333333-3333-4333-8333-333333333333',
      title: 'Buổi 1',
      mode: 'PRESENTATION' as const,
      sequence: '0',
      controlVersion: '1',
      schemaVersion: 2 as const,
      lastPersistedAt: null,
    },
  };
  jest.spyOn(api, 'context').mockResolvedValue(context);
  const socket = io('http://whiteboard.example.test', { autoConnect: false });
  jest.spyOn(realtime, 'boardSocket').mockReturnValue(socket);
  jest.spyOn(socket, 'connect').mockImplementation(() => {
    socket.connected = true;
    socket.listeners('connect').forEach((listener) => listener());
    return socket;
  });
  jest.spyOn(socket, 'disconnect').mockImplementation(() => {
    socket.connected = false;
    return socket;
  });
  jest.spyOn(socket, 'timeout').mockReturnValue(socket);
  jest
    .spyOn(socket, 'emit')
    .mockImplementation(
      (
        event,
        payload: { binary?: string; epoch?: string; updateId?: string },
        ack: (error: null, reply: object) => void
      ) => {
        const sync = () => ({
          board: context.board,
          capabilities: { ...value.capabilities, canEdit: true },
          binary: encode(Y.encodeStateAsUpdate(doc)),
          identity: { id: sessionId, name: 'Mentor' },
        });
        if (event === 'board:join') ack(null, { ok: true, data: sync() });
        if (event === 'board:update') {
          Y.applyUpdate(doc, decode(payload.binary!));
          socket
            .listeners('board:state')
            .forEach((listener) => listener(sync()));
          ack(null, {
            ok: true,
            data: {
              epoch: payload.epoch,
              updateId: payload.updateId,
              sequence: '1',
            },
          });
        }
        return socket;
      }
    );
  open(api);
  await screen.findByText('Đã lưu');
  fireEvent.press(screen.getByTestId('whiteboard-tool-sticky'));
  fireEvent(screen.getByTestId('whiteboard-canvas'), 'responderGrant', {
    nativeEvent: { locationX: 50, locationY: 80 },
  });
  fireEvent.changeText(
    screen.getByTestId('whiteboard-note-input'),
    'Ý tưởng từ lớp học'
  );
  fireEvent.press(screen.getByTestId('whiteboard-note-add'));
  await waitFor(() =>
    expect(shapesOf(doc)[0]?.text).toBe('Ý tưởng từ lớp học')
  );
  expect(screen.queryByTestId('whiteboard-note-dialog')).toBeNull();
  doc.destroy();
});
