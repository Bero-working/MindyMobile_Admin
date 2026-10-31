import { useEffect, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// The content owns the dimensions; the loading layer never enters layout.
export function Skeleton({
  children,
  label,
}: PropsWithChildren<{ label: string }>) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = reduced
      ? 1
      : withRepeat(withTiming(0.55, { duration: 600 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      pointerEvents="none"
    >
      <View
        className="opacity-0"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {children}
      </View>
      <Animated.View
        style={style}
        className="absolute inset-0 rounded-radius-12 bg-mdy-muted"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  );
}
