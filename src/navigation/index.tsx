/* eslint-disable @typescript-eslint/no-require-imports -- Native Stack getComponent defers module evaluation. */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useTheme } from '@sohantalukder/rn-kit';
import type { RootStackParamList } from './types';
import routes from './routes';
import { screenOptions } from './screenOptions';
const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation = () => {
  const { navigationTheme, variant } = useTheme();

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={routes.splash}
        key={variant}
        screenOptions={screenOptions}
      >
        <Stack.Screen
          getComponent={() =>
            (
              require('@/modules/splash/SplashIndex') as typeof import('@/modules/splash/SplashIndex')
            ).default
          }
          name={routes.splash}
        />
        <Stack.Screen
          getComponent={() =>
            (
              require('@/modules/example/Example') as typeof import('@/modules/example/Example')
            ).default
          }
          name={routes.example}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
