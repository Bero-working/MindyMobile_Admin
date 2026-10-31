import { useCallback, useMemo, useRef, useState } from 'react';
import type { ViewToken, ViewabilityConfig } from 'react-native';

// Native equivalent for list items; FlatList owns layout and viewport tracking.
// Keys must be unique and stable. Remember visited items across virtualized remounts.
export function useIntersectionObserver<T>(
  items: readonly T[],
  keyForItem: (item: T) => string
) {
  const current = useRef({ items, keyForItem });
  current.current = { items, keyForItem };
  const [entered, setEntered] = useState<ReadonlySet<string>>(new Set());
  const viewabilityConfig = useRef<ViewabilityConfig>({
    itemVisiblePercentThreshold: 50,
    waitForInteraction: false,
  }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<T>[] }) => {
      const keys = viewableItems
        .filter((token) => token.isViewable)
        .map((token) => current.current.keyForItem(token.item));
      setEntered((previous) => {
        const validKeys = new Set(
          current.current.items.map(current.current.keyForItem)
        );
        const next = new Set([...previous].filter((key) => validKeys.has(key)));
        keys.forEach((key) => {
          if (validKeys.has(key)) next.add(key);
        });
        return next.size === previous.size &&
          [...next].every((key) => previous.has(key))
          ? previous
          : next;
      });
    },
    []
  );

  const observedKeys = useMemo(
    () => new Set(items.map(keyForItem).filter((key) => entered.has(key))),
    [items, keyForItem, entered]
  );
  return { observedKeys, onViewableItemsChanged, viewabilityConfig };
}
