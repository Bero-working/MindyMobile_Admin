/* eslint-disable @typescript-eslint/no-require-imports -- Native Stack getComponent defers module evaluation. */
import tokens from '@/components/ui/tokens.json';
import { cn } from '@/utils/cn';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { QueryClient } from '@tanstack/react-query';
import { useReducedMotion } from 'react-native-reanimated';
import { View } from 'react-native';
import { Toast } from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { AuthProvider, useAuth } from './hooks/useAuth';
import type { AuthService } from './types';

export type AuthStackParams = {
  Bootstrap: undefined;
  Login: undefined;
  Denied: undefined;
  Workspace: undefined;
  Settings: undefined;
  Profile: undefined;
};
const Stack = createNativeStackNavigator<AuthStackParams>();
function AuthNavigation() {
  const { state, toast, busy } = useAuth();
  const { isDark, colors, variables } = useMindyTheme();
  const reduced = useReducedMotion();
  return (
    <View
      className={cn(local.root, 'bg-mdy-bg')}
      style={variables}
    >
      <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
        <Stack.Navigator
          key={state.screen}
          screenOptions={{
            headerShown: false,
            animation: 'none',
            animationDuration: tokens.motion.base,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          {state.screen === 'bootstrap' ? (
            <Stack.Screen
              name="Bootstrap"
              getComponent={() =>
                (
                  require('./screens/BootstrapScreen') as typeof import('./screens/BootstrapScreen')
                ).BootstrapScreen
              }
            />
          ) : state.screen === 'login' ? (
            <Stack.Screen
              name="Login"
              getComponent={() =>
                (
                  require('./screens/LoginScreen') as typeof import('./screens/LoginScreen')
                ).LoginScreen
              }
            />
          ) : state.screen === 'denied' ? (
            <Stack.Screen
              name="Denied"
              getComponent={() =>
                (
                  require('./screens/DeniedScreen') as typeof import('./screens/DeniedScreen')
                ).DeniedScreen
              }
            />
          ) : (
            <>
              <Stack.Screen
                name="Workspace"
                getComponent={() =>
                  (
                    require('./screens/WorkspaceScreen') as typeof import('./screens/WorkspaceScreen')
                  ).WorkspaceScreen
                }
              />
              <Stack.Screen
                name="Profile"
                getComponent={() =>
                  (
                    require('./screens/ProfileScreen') as typeof import('./screens/ProfileScreen')
                  ).ProfileScreen
                }
                options={{
                  animation: reduced ? 'none' : 'slide_from_right',
                  animationDuration: tokens.motion.slide,
                  gestureEnabled: !busy,
                }}
              />
              <Stack.Screen
                name="Settings"
                getComponent={() =>
                  (
                    require('./screens/SettingsScreen') as typeof import('./screens/SettingsScreen')
                  ).SettingsScreen
                }
                options={{
                  animation: reduced ? 'none' : 'slide_from_right',
                  animationDuration: tokens.motion.slide,
                  gestureEnabled: !busy,
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {toast && <Toast text={toast} />}
    </View>
  );
}
export function AuthApp({
  service,
  cache,
}: {
  service: AuthService;
  cache: QueryClient;
}) {
  return (
    <AuthProvider
      service={service}
      cache={cache}
    >
      <AuthNavigation />
    </AuthProvider>
  );
}
const local = {
  root: 'flex-1',
};
