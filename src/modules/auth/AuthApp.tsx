import { createLeaveService } from '@/modules/leave/services/leaveService';
import {
  OperationsProvider,
  type OperationsStackParams,
  type OperationsSource,
} from '@/modules/operations';
import { createOperationsService } from '@/modules/operations/services/operationsService';
/* eslint-disable @typescript-eslint/no-require-imports -- Native Stack getComponent defers module evaluation. */
import { TeachingProvider, type TeachingStackParams } from '@/modules/teaching';
import {
  AttendanceProvider,
  type AttendanceSource,
  type AttendanceStackParams,
} from '@/modules/attendance';
import {
  LeaveProvider,
  type LeaveSource,
  type LeaveStackParams,
} from '@/modules/leave';
import {
  MaterialProvider,
  type MaterialStackParams,
} from '@/modules/materials/MaterialProvider';
import { createMaterialService } from '@/modules/materials/service';
import { createQuizService } from '@/modules/quiz/service';
import { QuizProvider, type QuizStackParams } from '@/modules/quiz';
import {
  createReportsService,
  ReportsProvider,
  type ReportsStackParams,
} from '@/modules/reports';
import {
  ChatProvider,
  createChatService,
  type ChatStackParams,
} from '@/modules/chat';
import { cn } from '@/utils/cn';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { QueryClient } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { createAttendanceService } from '@/modules/attendance/services/attendanceService';
import { createTeachingService } from '@/modules/teaching/services/teachingService';
import type { TeachingSource } from '@/modules/teaching/types';
import { Toast } from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { AuthProvider, useAuth } from './hooks/useAuth';
import type { AuthService } from './types';

export type AuthStackParams = TeachingStackParams &
  AttendanceStackParams &
  OperationsStackParams &
  LeaveStackParams &
  QuizStackParams &
  ReportsStackParams &
  ChatStackParams &
  MaterialStackParams & {
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
  attendanceMock,
  attendanceSource,
  operationsSource,
  operationsMock = false,
  leaveMock,
  leaveSource,
  onRouteChange,
}: {
  service: AuthService;
  teachingSource?: TeachingSource | undefined;
  teachingMock: boolean;
  attendanceMock: boolean;
  leaveMock: boolean;
  leaveSource?: LeaveSource | undefined;
  attendanceSource?: AttendanceSource | undefined;
  operationsSource?: OperationsSource | undefined;
  operationsMock?: boolean;
  onRouteChange?: ((name: string) => void) | undefined;
}) {
  const { state, toast, expireSession } = useAuth();
  useEffect(() => {
    if (state.screen === 'login') onRouteChange?.('Login');
    else if (state.screen === 'bootstrap') onRouteChange?.('Bootstrap');
    else if (state.screen === 'denied') onRouteChange?.('Denied');
  }, [state.screen, onRouteChange]);
  const identity = `${state.screen}:${state.user?.role ?? ''}:${state.user?.email ?? ''}`;
  const currentIdentity = useRef(identity);
  currentIdentity.current = identity;
  const mounted = useRef(true);
  // Layout effect: on Fast Refresh, children's read effects run before a parent
  // passive effect, and would otherwise see false and report a false denial.
  useLayoutEffect(() => {
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
  const liveAttendance = useMemo(
    () =>
      attendanceSource ??
      createAttendanceService({
        userId: state.user?.id,
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
    [attendanceSource, service, expireSession, identity]
  );
  const liveOperations = useMemo(
    () =>
      operationsSource ??
      createOperationsService({
        restore: async () => {
          const result = await service.restore();
          if (
            result.kind === 'user' &&
            (result.user.email !== state.user?.email ||
              result.user.role !== state.user?.role)
          )
            return { kind: 'signedOut', notice: 'sessionExpired' };
          return result;
        },
        onExpired: expireSession,
        isActive: () =>
          mounted.current &&
          currentIdentity.current === identity &&
          state.user?.role === 'MANAGER',
      }),
    [operationsSource, service, identity, expireSession]
  );
  const liveLeave = useMemo(
    () =>
      leaveSource ??
      createLeaveService({
        restore: async () => {
          const result = await service.restore();
          if (
            result.kind === 'user' &&
            (result.user.email !== state.user?.email ||
              result.user.role !== state.user?.role)
          )
            return { kind: 'signedOut', notice: 'sessionExpired' };
          return result;
        },
        getRole: () =>
          state.user?.role === 'MENTOR' || state.user?.role === 'MANAGER'
            ? state.user.role
            : undefined,
        onExpired: expireSession,
        isActive: () =>
          mounted.current &&
          currentIdentity.current === identity &&
          (state.user?.role === 'MANAGER' || state.user?.role === 'MENTOR'),
      }),
    [leaveSource, service, identity, expireSession]
  );
  const materialService = useMemo(
    () =>
      createMaterialService({
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
    [service, expireSession, identity]
  );
  const quizService = useMemo(
    () =>
      createQuizService({
        restore: async () => {
          const result = await service.restore();
          if (
            result.kind === 'user' &&
            (result.user.email !== state.user?.email ||
              result.user.role !== 'MENTOR')
          )
            return { kind: 'signedOut', notice: 'sessionExpired' };
          return result;
        },
        onExpired: expireSession,
        isActive: () =>
          mounted.current &&
          currentIdentity.current === identity &&
          state.user?.role === 'MENTOR',
      }),
    [service, expireSession, identity]
  );
  const reportsService = useMemo(
    () =>
      createReportsService({
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
    [service, expireSession, identity]
  );
  const chatService = useMemo(
    () =>
      createChatService({
        restore: async () => {
          const result = await service.restore();
          if (
            result.kind === 'user' &&
            (result.user.email !== state.user?.email ||
              result.user.role !== 'MENTOR')
          )
            return { kind: 'signedOut', notice: 'sessionExpired' };
          return result;
        },
        onExpired: expireSession,
        isActive: () =>
          mounted.current &&
          currentIdentity.current === identity &&
          state.user?.role === 'MENTOR',
      }),
    [service, expireSession, identity]
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
        <AttendanceProvider
          mock={attendanceMock}
          source={attendanceMock ? attendanceSource : liveAttendance}
        >
          <OperationsProvider
            key={identity}
            mock={operationsMock}
            source={operationsMock ? operationsSource : liveOperations}
          >
            <LeaveProvider
              mock={leaveMock}
              source={leaveMock ? leaveSource : liveLeave}
            >
              <MaterialProvider
                key={identity}
                service={materialService}
              >
                <QuizProvider
                  key={identity}
                  api={quizService}
                  mock={teachingMock}
                >
                  <ReportsProvider
                    key={identity}
                    service={reportsService}
                  >
                    <ChatProvider
                      key={identity}
                      service={chatService}
                    >
                      <NavigationContainer
                        theme={isDark ? DarkTheme : DefaultTheme}
                        onStateChange={(value) =>
                          onRouteChange?.(
                            value?.routes[value.index ?? 0]?.name ?? ''
                          )
                        }
                      >
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
                              {state.user?.role === 'MENTOR' && (
                                <Stack.Screen
                                  name="AttendanceEditor"
                                  getComponent={() =>
                                    (
                                      require('../attendance/screens/AttendanceEditorScreen') as typeof import('../attendance/screens/AttendanceEditorScreen')
                                    ).AttendanceEditorScreen
                                  }
                                />
                              )}
                              {state.user?.role === 'MENTOR' && (
                                <Stack.Screen
                                  name="TeachingNoteEditor"
                                  getComponent={() =>
                                    (
                                      require('../attendance/screens/TeachingNoteEditorScreen') as typeof import('../attendance/screens/TeachingNoteEditorScreen')
                                    ).TeachingNoteEditorScreen
                                  }
                                />
                              )}
                              {state.user?.role === 'MANAGER' && (
                                <Stack.Screen
                                  name="IncompleteSessions"
                                  getComponent={() =>
                                    (
                                      require('../attendance/screens/IncompleteSessionsScreen') as typeof import('../attendance/screens/IncompleteSessionsScreen')
                                    ).IncompleteSessionsScreen
                                  }
                                />
                              )}
                              {state.user?.role === 'MANAGER' && (
                                <>
                                  <Stack.Screen
                                    name="AttendanceManagement"
                                    getComponent={() =>
                                      (
                                        require('../attendance/screens/ManagerUtilitiesScreen') as typeof import('../attendance/screens/ManagerUtilitiesScreen')
                                      ).AttendanceManagementScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="StudentAttendanceForm"
                                    getComponent={() =>
                                      (
                                        require('../attendance/screens/StudentAttendanceFormScreen') as typeof import('../attendance/screens/StudentAttendanceFormScreen')
                                      ).StudentAttendanceFormScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="ManagerFinalizeSessions"
                                    getComponent={() =>
                                      (
                                        require('../attendance/screens/ManagerUtilitiesScreen') as typeof import('../attendance/screens/ManagerUtilitiesScreen')
                                      ).ManagerFinalizeSessionsScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="ManagerFinalize"
                                    getComponent={() =>
                                      (
                                        require('../attendance/screens/ManagerFinalizeScreen') as typeof import('../attendance/screens/ManagerFinalizeScreen')
                                      ).ManagerFinalizeScreen
                                    }
                                  />
                                </>
                              )}
                              {state.user?.role === 'MANAGER' && (
                                <Stack.Screen
                                  name="AttendanceCorrection"
                                  getComponent={() =>
                                    (
                                      require('../attendance/screens/AttendanceEditorScreen') as typeof import('../attendance/screens/AttendanceEditorScreen')
                                    ).AttendanceCorrectionScreen
                                  }
                                />
                              )}
                              {state.user?.role === 'MANAGER' && (
                                <>
                                  <Stack.Screen
                                    name="SubstituteAssignment"
                                    getComponent={() =>
                                      (
                                        require('../operations/screens/SessionScreens') as typeof import('../operations/screens/SessionScreens')
                                      ).SubstituteAssignmentScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="RescheduleSession"
                                    getComponent={() =>
                                      (
                                        require('../operations/screens/SessionScreens') as typeof import('../operations/screens/SessionScreens')
                                      ).RescheduleSessionScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="ReplacementSession"
                                    getComponent={() =>
                                      (
                                        require('../operations/screens/SessionScreens') as typeof import('../operations/screens/SessionScreens')
                                      ).ReplacementSessionScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="CashOrders"
                                    getComponent={() =>
                                      (
                                        require('../operations/screens/CashScreens') as typeof import('../operations/screens/CashScreens')
                                      ).CashOrdersScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="CashOrderDetail"
                                    getComponent={() =>
                                      (
                                        require('../operations/screens/CashScreens') as typeof import('../operations/screens/CashScreens')
                                      ).CashOrderDetailScreen
                                    }
                                  />
                                </>
                              )}
                              {state.user?.role === 'MANAGER' && (
                                <Stack.Screen
                                  name="AttendanceRecovery"
                                  getComponent={() =>
                                    (
                                      require('../attendance/screens/AttendanceRecoveryScreen') as typeof import('../attendance/screens/AttendanceRecoveryScreen')
                                    ).AttendanceRecoveryScreen
                                  }
                                />
                              )}
                              {state.user?.role === 'MANAGER' && (
                                <Stack.Screen
                                  name="AttendanceAudits"
                                  getComponent={() =>
                                    (
                                      require('../attendance/screens/AttendanceAuditsScreen') as typeof import('../attendance/screens/AttendanceAuditsScreen')
                                    ).AttendanceAuditsScreen
                                  }
                                />
                              )}
                              {state.user?.role === 'MENTOR' && (
                                <Stack.Screen
                                  name="MentorLeaveList"
                                  getComponent={() =>
                                    (
                                      require('../leave/screens/ListScreens') as typeof import('../leave/screens/ListScreens')
                                    ).MentorLeaveListScreen
                                  }
                                />
                              )}
                              {state.user?.role === 'MENTOR' && (
                                <Stack.Screen
                                  name="LeavePlanEditor"
                                  getComponent={() =>
                                    (
                                      require('../leave/screens/LeavePlanEditorScreen') as typeof import('../leave/screens/LeavePlanEditorScreen')
                                    ).LeavePlanEditorScreen
                                  }
                                />
                              )}
                              {state.user?.role === 'MENTOR' && (
                                <Stack.Screen
                                  name="MentorLeaveDetail"
                                  getComponent={() =>
                                    (
                                      require('../leave/screens/DetailScreens') as typeof import('../leave/screens/DetailScreens')
                                    ).MentorLeaveDetailScreen
                                  }
                                />
                              )}
                              {state.user?.role === 'MANAGER' && (
                                <Stack.Screen
                                  name="LeaveReviewQueue"
                                  getComponent={() =>
                                    (
                                      require('../leave/screens/ListScreens') as typeof import('../leave/screens/ListScreens')
                                    ).LeaveReviewQueueScreen
                                  }
                                />
                              )}
                              {state.user?.role === 'MANAGER' && (
                                <Stack.Screen
                                  name="LeaveReviewDetail"
                                  getComponent={() =>
                                    (
                                      require('../leave/screens/DetailScreens') as typeof import('../leave/screens/DetailScreens')
                                    ).LeaveReviewDetailScreen
                                  }
                                />
                              )}
                              {state.user?.role === 'MANAGER' && (
                                <Stack.Screen
                                  name="MakeupConflicts"
                                  getComponent={() =>
                                    (
                                      require('../leave/screens/ListScreens') as typeof import('../leave/screens/ListScreens')
                                    ).MakeupConflictsScreen
                                  }
                                />
                              )}
                              {state.user?.role === 'MANAGER' && (
                                <Stack.Screen
                                  name="MakeupPlacement"
                                  getComponent={() =>
                                    (
                                      require('../leave/screens/MakeupPlacementScreen') as typeof import('../leave/screens/MakeupPlacementScreen')
                                    ).MakeupPlacementScreen
                                  }
                                />
                              )}
                              {state.user?.role === 'MENTOR' && (
                                <>
                                  <Stack.Screen
                                    name="MentorMaterials"
                                    getComponent={() =>
                                      (
                                        require('../materials/ListScreens') as typeof import('../materials/ListScreens')
                                      ).MentorMaterialsScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="MaterialEditor"
                                    getComponent={() =>
                                      (
                                        require('../materials/EditorScreen') as typeof import('../materials/EditorScreen')
                                      ).MaterialEditorScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="MentorMaterialDetail"
                                    getComponent={() =>
                                      (
                                        require('../materials/DetailScreens') as typeof import('../materials/DetailScreens')
                                      ).MaterialDetailScreen
                                    }
                                  />
                                </>
                              )}
                              {state.user?.role === 'MANAGER' && (
                                <>
                                  <Stack.Screen
                                    name="MaterialReviewQueue"
                                    getComponent={() =>
                                      (
                                        require('../materials/ListScreens') as typeof import('../materials/ListScreens')
                                      ).MaterialReviewQueueScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="MaterialReviewDetail"
                                    getComponent={() =>
                                      (
                                        require('../materials/DetailScreens') as typeof import('../materials/DetailScreens')
                                      ).MaterialDetailScreen
                                    }
                                  />
                                </>
                              )}
                              <Stack.Screen
                                name="MaterialPreview"
                                getComponent={() =>
                                  (
                                    require('../materials/PreviewScreen') as typeof import('../materials/PreviewScreen')
                                  ).MaterialPreviewScreen
                                }
                              />
                              {state.user?.role === 'MENTOR' && (
                                <>
                                  <Stack.Screen
                                    name="MentorQuizzes"
                                    getComponent={() =>
                                      (
                                        require('../quiz/QuizListScreen') as typeof import('../quiz/QuizListScreen')
                                      ).QuizListScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="QuizEditor"
                                    getComponent={() =>
                                      (
                                        require('../quiz/QuizEditorScreen') as typeof import('../quiz/QuizEditorScreen')
                                      ).QuizEditorScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="QuizDetail"
                                    getComponent={() =>
                                      (
                                        require('../quiz/QuizDetailScreen') as typeof import('../quiz/QuizDetailScreen')
                                      ).QuizDetailScreen
                                    }
                                  />
                                </>
                              )}
                              {state.user?.role === 'MENTOR' && (
                                <>
                                  <Stack.Screen
                                    name="MentorReportClasses"
                                    getComponent={() =>
                                      (
                                        require('../reports/ReportClassPickerScreen') as typeof import('../reports/ReportClassPickerScreen')
                                      ).MentorReportClassesScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="MentorAttendanceReport"
                                    getComponent={() =>
                                      (
                                        require('../reports/ReportScreens') as typeof import('../reports/ReportScreens')
                                      ).MentorAttendanceReportScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="MentorStudentReport"
                                    getComponent={() =>
                                      (
                                        require('../reports/ReportScreens') as typeof import('../reports/ReportScreens')
                                      ).MentorStudentReportScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="ChatConversations"
                                    getComponent={() =>
                                      (
                                        require('../chat/ChatScreens') as typeof import('../chat/ChatScreens')
                                      ).ChatConversationsScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="ChatConversation"
                                    getComponent={() =>
                                      (
                                        require('../chat/ChatScreens') as typeof import('../chat/ChatScreens')
                                      ).ChatConversationScreen
                                    }
                                  />
                                  <Stack.Screen
                                    name="ChatNotifications"
                                    getComponent={() =>
                                      (
                                        require('../chat/ChatScreens') as typeof import('../chat/ChatScreens')
                                      ).ChatNotificationsScreen
                                    }
                                  />
                                </>
                              )}
                              {state.user?.role === 'MANAGER' && (
                                <Stack.Screen
                                  name="ManagerAttendanceReport"
                                  getComponent={() =>
                                    (
                                      require('../reports/ReportScreens') as typeof import('../reports/ReportScreens')
                                    ).ManagerAttendanceReportScreen
                                  }
                                />
                              )}
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
                    </ChatProvider>
                  </ReportsProvider>
                </QuizProvider>
              </MaterialProvider>
            </LeaveProvider>
          </OperationsProvider>
        </AttendanceProvider>
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
  attendanceMock = false,
  leaveMock = false,
  leaveSource,
  attendanceSource,
  operationsSource,
  operationsMock = false,
  onRouteChange,
}: {
  service: AuthService;
  cache: QueryClient;
  teachingSource?: TeachingSource | undefined;
  teachingMock?: boolean;
  attendanceMock?: boolean;
  leaveMock?: boolean;
  leaveSource?: LeaveSource | undefined;
  attendanceSource?: AttendanceSource | undefined;
  operationsSource?: OperationsSource | undefined;
  operationsMock?: boolean;
  onRouteChange?: ((name: string) => void) | undefined;
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
        attendanceMock={attendanceMock}
        leaveMock={leaveMock}
        leaveSource={leaveSource}
        attendanceSource={attendanceSource}
        operationsSource={operationsSource}
        operationsMock={operationsMock}
        onRouteChange={onRouteChange}
      />
    </AuthProvider>
  );
}
const local = {
  root: 'flex-1',
};
