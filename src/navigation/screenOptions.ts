import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

// Screen navigation is immediate in both directions.
export const screenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'none',
  gestureEnabled: false,
  fullScreenGestureEnabled: false,
};
