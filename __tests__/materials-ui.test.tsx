import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { MindyThemeProvider } from '@/components/ui/theme';
import { MaterialProvider } from '@/modules/materials/MaterialProvider';
import { MaterialDetailScreen } from '@/modules/materials/DetailScreens';
import {
  createMaterialService,
  MaterialError,
} from '@/modules/materials/service';
import { materialFixture as m } from '../__mocks__/materialFixture';
import i18n from '@/translations';
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: (effect: () => () => void) => {
    const React = jest.requireActual<typeof import('react')>('react');
    React.useEffect(effect, [effect]);
  },
}));
jest.mock('@/modules/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    state: { user: { role: 'MANAGER', id: 'manager' } },
    notify: jest.fn(),
  }),
}));
jest.mock('@/modules/teaching/TeachingProvider', () => ({
  useTeaching: () => ({ source: { read: jest.fn() } }),
}));
jest.mock('@/modules/attendance/components/shared', () => ({
  ...jest.requireActual('@/modules/attendance/components/shared'),
  Page: ({
    children,
    footer,
  }: PropsWithChildren<{ footer?: React.ReactNode }>) => {
    const { View } =
      jest.requireActual<typeof import('react-native')>('react-native');
    return (
      <View>
        {children}
        {footer}
      </View>
    );
  },
}));
const props: NativeStackScreenProps<AuthStackParams, 'MaterialReviewDetail'> = {
  route: {
    key: 'review',
    name: 'MaterialReviewDetail',
    params: { materialId: m.id },
  },
  navigation: {} as NativeStackScreenProps<
    AuthStackParams,
    'MaterialReviewDetail'
  >['navigation'],
};
function open() {
  const service = createMaterialService();
  const detail = jest.spyOn(service, 'detail').mockResolvedValue(m);
  const command = jest.spyOn(service, 'command').mockResolvedValue({
    ...m,
    reviewStatus: 'APPROVED',
    publishedAt: m.createdAt,
  });
  render(
    <MindyThemeProvider>
      <MaterialProvider service={service}>
        <MaterialDetailScreen {...props} />
      </MaterialProvider>
    </MindyThemeProvider>
  );
  return { detail, command };
}
beforeEach(async () => {
  await i18n.changeLanguage('vi');
});
test('TC-P3-S5-02/03: approval requires confirmation for the displayed revision', async () => {
  const { command } = open();
  fireEvent.press(await screen.findByTestId('review-detail-approve'));
  expect(command).not.toHaveBeenCalled();
  fireEvent.press(await screen.findByTestId('approve-confirm'));
  await waitFor(() =>
    expect(command).toHaveBeenCalledWith(
      { role: 'MANAGER', classId: undefined },
      m.id,
      'approve',
      2,
      ''
    )
  );
});
test('TC-P3-S5-06/09: blank reason is disabled, meaningful reason is submitted through its own confirmation', async () => {
  const { command } = open();
  fireEvent.press(await screen.findByTestId('review-detail-reject'));
  fireEvent.press(await screen.findByTestId('reject-confirm'));
  expect(command).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByTestId('reject-reason'), 'Thiếu hướng dẫn');
  fireEvent.press(screen.getByTestId('reject-confirm'));
  await waitFor(() =>
    expect(command).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'MANAGER' }),
      m.id,
      'reject',
      2,
      'Thiếu hướng dẫn'
    )
  );
});
test('TC-P3-S5-20: uncertain approval needs explicit resend and preserves its original intent', async () => {
  const { command } = open();
  command.mockRejectedValueOnce(new MaterialError('uncertain'));
  fireEvent.press(await screen.findByTestId('review-detail-approve'));
  fireEvent.press(await screen.findByTestId('approve-confirm'));
  await screen.findByTestId('review-detail-resend');
  expect(command).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByTestId('review-detail-resend'));
  await waitFor(() => expect(command).toHaveBeenCalledTimes(2));
  expect(command.mock.calls[1]).toEqual(command.mock.calls[0]);
});
test('TC-P3-S5-14/15: rejected or draft material cannot be approved', async () => {
  const service = createMaterialService();
  jest
    .spyOn(service, 'detail')
    .mockResolvedValue({ ...m, reviewStatus: 'DRAFT' });
  render(
    <MindyThemeProvider>
      <MaterialProvider service={service}>
        <MaterialDetailScreen {...props} />
      </MaterialProvider>
    </MindyThemeProvider>
  );
  await screen.findByTestId('review-detail-revision');
  expect(screen.queryByTestId('review-detail-approve')).toBeNull();
  expect(screen.queryByTestId('review-detail-reject')).toBeNull();
});
