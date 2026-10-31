/* eslint-disable @typescript-eslint/no-require-imports -- Native Stack getComponent defers module evaluation. */
import { TeachingProvider, type TeachingStackParams } from '@/modules/teaching';
import { cn } from '@/utils/cn';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { QueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { createTeachingService } from '@/modules/teaching/services/teachingService';
import type { TeachingSource } from '@/modules/teaching/types';
import { Toast } from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { AuthProvider, useAuth } from './hooks/useAuth';
import type { AuthService } from './types';

export type AuthStackParams = TeachingStackParams & {
  Bootstrap: undefined;
  Login: undefined;
  Denied: undefined;
  Workspace: undefined;
  Settings: undefined;
  Profile: undefined;
};
const Stack = createNativeStackNavigator<AuthStackParams>();
function AuthNavigation({
  service,
  teachingSource,
  teachingMock,
}: {
  service: AuthService;
  teachingSource?: TeachingSource | undefined;
  teachingMock: boolean;
}) {
  const { state, toast, expireSession } = useAuth();
  const identity = `${state.screen}:${state.user?.role ?? ''}:${state.user?.email ?? ''}`;
  const currentIdentity = useRef(identity);
  currentIdentity.current = identity;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const source = useMemo(
    () =>
      teachingSource ??
      createTeachingService({
        restore: async () => {
          const result = await service.restore();
          if (
            result.kind === 'user' &&
            (result.user.email !== state.user?.email ||
              result.user.role !== state.user.role)
          )
            return { kind: 'signedOut', notice: 'sessionExpired' };
          return result;
        },
        onExpired: expireSession,
        isActive: () => mounted.current && currentIdentity.current === identity,
      }),
    [teachingSource, service, expireSession, identity]
  );
  const { isDark, colors, variables } = useMindyTheme();
  return (
    <View
      className={cn(local.root, 'bg-mdy-bg')}
      style={variables}
    >
      <TeachingProvider
        key={identity}
        source={teachingMock ? undefined : source}
        mock={teachingMock}
      >
        <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
          <Stack.Navigator
            key={state.screen}
            screenOptions={{
              headerShown: false,
              animation: 'none',
              gestureEnabled: false,
              fullScreenGestureEnabled: false,
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
                {state.user?.role === 'MENTOR' && (
                  <Stack.Screen
                    name="TeachingSchedule"
                    getComponent={() =>
                      (
                        require('../teaching/screens/TeachingScheduleScreen') as typeof import('../teaching/screens/TeachingScheduleScreen')
                      ).TeachingScheduleScreen
                    }
                  />
                )}
                {state.user?.role === 'MENTOR' && (
                  <Stack.Screen
                    name="MentorClasses"
                    getComponent={() =>
                      (
                        require('../teaching/screens/ClassesScreens') as typeof import('../teaching/screens/ClassesScreens')
                      ).MentorClassesScreen
                    }
                  />
                )}
                {state.user?.role === 'MENTOR' && (
                  <Stack.Screen
                    name="MentorClassDetail"
                    getComponent={() =>
                      (
                        require('../teaching/screens/MentorClassDetailScreen') as typeof import('../teaching/screens/MentorClassDetailScreen')
                      ).MentorClassDetailScreen
                    }
                  />
                )}
                {state.user?.role === 'MENTOR' && (
                  <Stack.Screen
                    name="MentorStudents"
                    getComponent={() =>
                      (
                        require('../teaching/screens/MentorStudentsScreen') as typeof import('../teaching/screens/MentorStudentsScreen')
                      ).MentorStudentsScreen
                    }
                  />
                )}
                {state.user?.role === 'MANAGER' && (
                  <Stack.Screen
                    name="ManagerClasses"
                    getComponent={() =>
                      (
                        require('../teaching/screens/ClassesScreens') as typeof import('../teaching/screens/ClassesScreens')
                      ).ManagerClassesScreen
                    }
                  />
                )}
                {state.user?.role === 'MANAGER' && (
                  <Stack.Screen
                    name="ManagerClassDetail"
                    getComponent={() =>
                      (
                        require('../teaching/screens/ManagerClassDetailScreen') as typeof import('../teaching/screens/ManagerClassDetailScreen')
                      ).ManagerClassDetailScreen
                    }
                  />
                )}
                {
                  <Stack.Screen
                    name="SessionContext"
                    getComponent={() =>
                      (
                        require('../teaching/screens/SessionContextScreen') as typeof import('../teaching/screens/SessionContextScreen')
                      ).SessionContextScreen
                    }
                  />
                }
                <Stack.Screen
                  name="Profile"
                  getComponent={() =>
                    (
                      require('./screens/ProfileScreen') as typeof import('./screens/ProfileScreen')
                    ).ProfileScreen
                  }
                />
                <Stack.Screen
                  name="Settings"
                  getComponent={() =>
                    (
                      require('./screens/SettingsScreen') as typeof import('./screens/SettingsScreen')
                    ).SettingsScreen
                  }
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </TeachingProvider>
      {toast && <Toast text={toast} />}
    </View>
  );
}
export function AuthApp({
  service,
  cache,
  teachingSource,
  teachingMock = false,
}: {
  service: AuthService;
  cache: QueryClient;
  teachingSource?: TeachingSource | undefined;
  teachingMock?: boolean;
}) {
  return (
    <AuthProvider
      service={service}
      cache={cache}
    >
      <AuthNavigation
        service={service}
        teachingSource={teachingSource}
        teachingMock={teachingMock}
      />
    </AuthProvider>
  );
}
const local = {
  root: 'flex-1',
};
