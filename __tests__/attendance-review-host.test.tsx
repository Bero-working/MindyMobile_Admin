import { act, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient } from '@tanstack/react-query';
import { MindyThemeProvider } from '@/components/ui/theme';
import { AuthApp } from '@/modules/auth/AuthApp';
import { AttendanceReviewHost } from '@/modules/attendance/AttendanceReviewHost';
import type { AuthService } from '@/modules/auth/types';
jest.mock('@/modules/auth/AuthApp', () => ({ AuthApp: jest.fn(() => null) }));
test('live business forms have no floating review control to intercept their Save buttons', () => {
  const service: AuthService = {
    restore: async () => ({ kind: 'signedOut' }),
    login: async () => ({ kind: 'signedOut' }),
    logout: async () => ({ kind: 'ok' }),
  };
  render(
    <SafeAreaProvider>
      <MindyThemeProvider>
        <AttendanceReviewHost
          service={service}
          cache={new QueryClient()}
        />
      </MindyThemeProvider>
    </SafeAreaProvider>
  );
  expect(screen.queryByTestId('phase-2-review-open')).toBeNull();
  const calls = jest.mocked(AuthApp).mock.calls;
  const change = calls[calls.length - 1]?.[0].onRouteChange;
  expect(change).toBeDefined();
  act(() => change?.('Login'));
  expect(screen.getByTestId('phase-2-review-open')).toBeTruthy();
  for (const name of [
    'Workspace',
    'TeachingNoteEditor',
    'AttendanceEditor',
    'StudentAttendanceForm',
    'ManagerFinalize',
    'SessionContext',
  ]) {
    act(() => change?.(name));
    expect(screen.queryByTestId('phase-2-review-open')).toBeNull();
  }
  act(() => change?.('Login'));
  expect(screen.getByTestId('phase-2-review-open')).toBeTruthy();
});
