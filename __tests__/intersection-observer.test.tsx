import { act, renderHook } from '@testing-library/react-native';
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver';

const keyFor = (item: string) => item;
const token = (item: string, isViewable = true) => ({
  item,
  key: item,
  index: 0,
  isViewable,
});

test('mounts on viewport entry and retains visited items on exit with stable callbacks', () => {
  const { result, rerender } = renderHook(
    ({ items }: { items: string[] }) => useIntersectionObserver(items, keyFor),
    { initialProps: { items: ['a', 'b'] } }
  );
  const callback = result.current.onViewableItemsChanged;
  const config = result.current.viewabilityConfig;
  expect(result.current.observedKeys.size).toBe(0);
  act(() => callback({ viewableItems: [token('a'), token('b', false)] }));
  expect([...result.current.observedKeys]).toEqual(['a']);
  act(() => callback({ viewableItems: [] }));
  expect(result.current.observedKeys.has('a')).toBe(true);
  rerender({ items: ['b', 'c'] });
  expect(result.current.observedKeys.size).toBe(0);
  expect(result.current.onViewableItemsChanged).toBe(callback);
  expect(result.current.viewabilityConfig).toBe(config);
  act(() => callback({ viewableItems: [token('a'), token('c')] }));
  expect([...result.current.observedKeys]).toEqual(['c']);
});
