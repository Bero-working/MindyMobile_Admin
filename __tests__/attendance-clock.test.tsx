import { act, renderHook } from '@testing-library/react-native';
import { useServerNow } from '@/modules/attendance/hooks';
test('server-relative form time advances while open and reanchors on a fresh server response', () => {
  jest.useFakeTimers();
  try {
    jest.setSystemTime(new Date('2026-11-02T13:00:00Z'));
    const server = '2026-11-02T12:55:00Z';
    const { result, rerender, unmount } = renderHook(
      ({ asOf }: { asOf: string }) => useServerNow(asOf),
      { initialProps: { asOf: server } }
    );
    expect(result.current).toBe(Date.parse(server));
    act(() => jest.advanceTimersByTime(120000));
    expect(result.current).toBe(Date.parse(server) + 120000);
    rerender({ asOf: '2026-11-02T12:57:01Z' });
    expect(result.current).toBe(Date.parse('2026-11-02T12:57:01Z'));
    unmount();
  } finally {
    jest.useRealTimers();
  }
});
