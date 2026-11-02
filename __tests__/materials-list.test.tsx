import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { MindyThemeProvider } from '@/components/ui/theme';
import { MaterialProvider } from '@/modules/materials/MaterialProvider';
import { MaterialReviewQueueScreen } from '@/modules/materials/ListScreens';
import {
  createMaterialService,
  MaterialError,
} from '@/modules/materials/service';
import type { MaterialPage } from '@/modules/materials/schema';
import { materialFixture as m, fileId } from '../__mocks__/materialFixture';
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
jest.mock('@/modules/attendance/components/shared', () => ({
  ...jest.requireActual('@/modules/attendance/components/shared'),
  Page: ({ children }: PropsWithChildren) => {
    const { View } =
      jest.requireActual<typeof import('react-native')>('react-native');
    return <View>{children}</View>;
  },
}));
const props: NativeStackScreenProps<AuthStackParams, 'MaterialReviewQueue'> = {
  route: { key: 'queue', name: 'MaterialReviewQueue' },
  navigation: {} as NativeStackScreenProps<
    AuthStackParams,
    'MaterialReviewQueue'
  >['navigation'],
};
const page = (items = [m], total = items.length): MaterialPage => ({
  items,
  total,
  page: 1,
  pageSize: 20,
});
function open(service: ReturnType<typeof createMaterialService>) {
  jest.spyOn(service, 'names').mockResolvedValue({ classes: {}, mentors: {} });
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false, gcTime: 0 } },
        })
      }
    >
      <MindyThemeProvider>
        <MaterialProvider service={service}>
          <MaterialReviewQueueScreen {...props} />
        </MaterialProvider>
      </MindyThemeProvider>
    </QueryClientProvider>
  );
}
beforeEach(async () => {
  await i18n.changeLanguage('vi');
});
test('TC-P3-S4-01/02/07: default pending query, server total and no all/draft filters', async () => {
  const service = createMaterialService();
  const list = jest.spyOn(service, 'list').mockResolvedValue(page([m], 45));
  open(service);
  await screen.findByTestId(`review-queue-row-${m.id}`);
  expect(screen.getByTestId('materials-total')).toHaveTextContent(/45/);
  expect(list).toHaveBeenCalledWith(
    { role: 'MANAGER' },
    undefined,
    'PENDING_REVIEW',
    1
  );
  expect(screen.queryByTestId('materials-filter-all')).toBeNull();
  expect(screen.queryByTestId('materials-filter-DRAFT')).toBeNull();
});
test('TC-P3-S4-04/06: stale pending response cannot overwrite newly selected approved query', async () => {
  const service = createMaterialService();
  let finish: (value: MaterialPage) => void = () => {};
  jest.spyOn(service, 'list').mockImplementation((_scope, _unit, filter) =>
    filter === 'PENDING_REVIEW'
      ? new Promise((resolve) => {
          finish = resolve;
        })
      : Promise.resolve(page([{ ...m, id: fileId }]))
  );
  open(service);
  fireEvent.press(await screen.findByTestId('materials-filter-APPROVED'));
  await screen.findByTestId(`review-queue-row-${fileId}`);
  await act(async () => {
    finish(page());
  });
  expect(screen.queryByTestId(`review-queue-row-${m.id}`)).toBeNull();
  expect(screen.getByTestId(`review-queue-row-${fileId}`)).toBeTruthy();
});
test('TC-P3-S4-24: permission loss removes previously displayed rows', async () => {
  const service = createMaterialService();
  const list = jest
    .spyOn(service, 'list')
    .mockResolvedValueOnce(page())
    .mockRejectedValue(new MaterialError('denied'));
  open(service);
  await screen.findByTestId(`review-queue-row-${m.id}`);
  fireEvent.press(screen.getByText('Kiểm tra'));
  await screen.findByTestId('materials-denied');
  await waitFor(() =>
    expect(screen.queryByTestId(`review-queue-row-${m.id}`)).toBeNull()
  );
  expect(list).toHaveBeenCalledTimes(2);
});
