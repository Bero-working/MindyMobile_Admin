import type routes from '@/navigation/routes';
import type {
  NativeStackScreenProps,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';

export type RootScreenProps<
  S extends keyof RootStackParamList = keyof RootStackParamList,
> = NativeStackScreenProps<RootStackParamList, S>;

export type RootStackParamList = {
  [routes.splash]: undefined;
  [routes.example]: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
