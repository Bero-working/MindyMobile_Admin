import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MindyThemeProvider } from '@/components/ui/theme';
import { ReviewControls } from '@/modules/auth/components/ReviewControls';

const mockPanelLoaded = jest.fn();
jest.mock('@/modules/auth/components/ReviewPanel', () => {
  mockPanelLoaded();
  return jest.requireActual('@/modules/auth/components/ReviewPanel');
});

test('loads panel only when opened, mounts visible scenarios and closes after selection', async () => {
  const select = jest.fn();
  render(
    <SafeAreaProvider>
      <MindyThemeProvider>
        <ReviewControls
          onSelect={select}
          setLogoutOutcome={jest.fn()}
        />
      </MindyThemeProvider>
    </SafeAreaProvider>
  );
  expect(mockPanelLoaded).not.toHaveBeenCalled();
  expect(screen.queryByTestId('mock-review-sheet')).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByTestId('mock-review-button'));
  });
  await screen.findByTestId('mock-review-sheet');
  expect(mockPanelLoaded).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId('mock-scenario-MENTOR')).toBeNull();
  fireEvent(screen.getByTestId('mock-scenarios'), 'viewableItemsChanged', {
    viewableItems: [
      { item: 'MENTOR', key: 'MENTOR', index: 1, isViewable: true },
    ],
    changed: [],
  });
  expect(screen.getByTestId('mock-scenario-MENTOR')).toBeTruthy();
  expect(screen.queryByTestId('mock-scenario-MANAGER')).toBeNull();
  fireEvent.press(screen.getByTestId('mock-scenario-MENTOR'));
  expect(select).toHaveBeenCalledWith('MENTOR');
  expect(screen.queryByTestId('mock-review-sheet')).toBeNull();
});
