import { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { QueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthApp } from '@/modules/auth/AuthApp';
import type { AuthService } from '@/modules/auth/types';
import { createMockAuthService } from '@/modules/auth/services/mockAuthService';
import { Button, Sheet, Text } from '@/components/ui/primitives';
import { env } from '@/config/env';

// Opt-in development review only; normal authentication and P0/P1 stay live.
export function AttendanceReviewHost({
  service,
  cache,
}: {
  service: AuthService;
  cache: QueryClient;
}) {
  const [currentRoute, setCurrentRoute] = useState('Workspace');
  const [revision, setRevision] = useState(0);
  const [mode, setMode] = useState<'live' | 'MENTOR' | 'MANAGER'>('live');
  const [open, setOpen] = useState(false);
  const [leaveReview, setLeaveReview] = useState(false);
  const insets = useSafeAreaInsets();
  const review = useMemo(() => {
    const value = createMockAuthService();
    if (mode !== 'live') value.select(mode);
    return value;
  }, [mode, revision]);
  const development = __DEV__ && env.DEBUG_MODE;
  const showSwitcher =
    development &&
    ![
      'RescheduleSession',
      'SubstituteAssignment',
      'ReplacementSession',
      'CashOrderDetail',
      'MentorQuizzes',
      'QuizEditor',
      'QuizDetail',
    ].includes(currentRoute) &&
    (mode !== 'live' || ['Login', 'Bootstrap'].includes(currentRoute));
  return (
    <View className="flex-1">
      <AuthApp
        key={`${mode}:${revision}`}
        onRouteChange={setCurrentRoute}
        service={development && mode !== 'live' ? review.service : service}
        cache={cache}
        teachingMock={development && mode !== 'live'}
        operationsMock={development && mode !== 'live'}
        attendanceMock={development && mode !== 'live'}
        leaveMock={development && mode !== 'live' && leaveReview}
      />
      {showSwitcher && (
        <View
          className="absolute right-space-8"
          style={
            mode === 'live'
              ? { bottom: Math.max(insets.bottom, 8) }
              : {
                  top:
                    insets.top +
                    ([
                      'StudentAttendanceForm',
                      'AttendanceCorrection',
                      'AttendanceAudits',
                    ].includes(currentRoute)
                      ? 2
                      : 100),
                }
          }
        >
          <Button
            testID="phase-2-review-open"
            size="sm"
            variant="secondary"
            onPress={() => setOpen(true)}
          >
            {mode === 'live' ? 'Review UI' : leaveReview ? 'P4' : 'P2'}
          </Button>
        </View>
      )}
      {development && open && (
        <Sheet
          testID="phase-2-review-menu"
          title="Phase 2 — UI mock"
          onClose={() => setOpen(false)}
        >
          <Text>
            {
              'Dữ liệu giả chỉ giữ trong bộ nhớ. Không gửi thay đổi lên máy chủ.'
            }
          </Text>
          {(['MENTOR', 'MANAGER', 'live'] as const).map((role) => (
            <Button
              key={role}
              testID={`phase-2-review-${role}`}
              variant="secondary"
              onPress={() => {
                setCurrentRoute('Workspace');
                setRevision((value) => value + 1);
                setMode(role);
                setLeaveReview(false);
                setOpen(false);
              }}
            >
              {role === 'live' ? 'Trở về ứng dụng' : role}
            </Button>
          ))}
          {(['MENTOR', 'MANAGER'] as const).map((role) => (
            <Button
              key={`p4-${role}`}
              testID={`phase-4-review-${role}`}
              variant="secondary"
              onPress={() => {
                setCurrentRoute('Workspace');
                setRevision((value) => value + 1);
                setMode(role);
                setLeaveReview(true);
                setOpen(false);
              }}
            >
              <Text>{`P4 · ${role}`}</Text>
            </Button>
          ))}
        </Sheet>
      )}
    </View>
  );
}
