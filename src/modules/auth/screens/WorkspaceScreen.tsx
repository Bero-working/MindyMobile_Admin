import { useLeave } from '@/modules/leave';
import { LeavePendingBadge } from '@/modules/leave/components/EntryPoints';
import { useWords } from '@/modules/leave/components/shared';
import { useOperations } from '@/modules/operations';
import '@/modules/materials/messages';
import '@/modules/quiz/messages';
import '@/modules/reports/messages';
import { ChatBubble } from '@/modules/chat/EntryPoints';
import { useAttendance } from '@/modules/attendance';
import { ManagerOverviewCard } from '../components/ManagerOverviewCard';
import { useCallback, useRef, useState } from 'react';
import { RefreshContext } from '@/modules/teaching/TeachingProvider';
import { cn } from '@/utils/cn';
import mascot from '@/assets/images/mascot-home.png';
import { TodayCard } from '../components/TodayCard';
import { HomeTile } from '../components/HomeTile';
import { Image, Pressable, RefreshControl, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Avatar,
  BrandHeader,
  Icon,
  Screen,
  Text,
  ui,
} from '@/components/ui/primitives';
import { useAuth } from '../hooks/useAuth';
import { useMindyTheme } from '@/components/ui/theme';
import type { AuthStackParams } from '../AuthApp';

export function WorkspaceScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'Workspace'>) {
  const { t } = useTranslation('foundation');
  const { t: ops } = useTranslation('operations');
  const operations = useOperations();
  const { t: teaching } = useTranslation('teaching');
  const { state } = useAuth();
  const attendance = useAttendance();
  const leave = useLeave();
  const words = useWords();
  const { t: mat } = useTranslation('materials');
  const { t: quiz } = useTranslation('quiz');
  const { t: report } = useTranslation('reports');
  const { t: att } = useTranslation('attendance');
  const { t: chat } = useTranslation('chat');
  const { colors } = useMindyTheme();
  const refreshers = useRef(new Map<string, () => Promise<void>>());
  const [refreshing, setRefreshing] = useState(false);
  const registerRefresh = useCallback(
    (key: string, refresh: (() => Promise<void>) | null) => {
      if (refresh) refreshers.current.set(key, refresh);
      else refreshers.current.delete(key);
    },
    []
  );
  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.allSettled(
      Array.from(refreshers.current.values()).map((refresh) => refresh())
    );
    setRefreshing(false);
  };
  const user = state.user;
  if (!user) return null;
  const mentor = user.role === 'MENTOR';
  return (
    <View className="flex-1">
      <Screen
        testID={mentor ? 'workspace-mentor-root' : 'workspace-manager-root'}
        variant="app"
        {...(mentor
          ? {
              refreshControl: (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refreshAll}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              ),
            }
          : {})}
      >
        <BrandHeader>
          <View className={cn(ui.buttonRow)}>
            <Pressable
              testID="workspace-account-button"
              accessibilityRole="button"
              accessibilityLabel={t('profileTitle')}
              className="shrink-0 active:opacity-80"
              onPress={() => navigation.navigate('Profile')}
            >
              <Avatar
                name={user.displayName}
                size={52}
              />
            </Pressable>
            <View className="flex-1 min-w-0">
              <Text
                maxFontSizeMultiplier={1.3}
                className={cn(ui.title, 'text-mdy-onBrand')}
              >
                {user.displayName}
              </Text>
              <Text
                numberOfLines={1}
                className={cn(local.role, 'text-mdy-onBrandMuted')}
              >
                {t(mentor ? 'MENTOR' : 'MANAGER')}
              </Text>
            </View>
            {mentor && (
              <Pressable
                testID="workspace-open-notifications"
                accessibilityRole="button"
                accessibilityLabel={chat('notifications')}
                onPress={() => navigation.navigate('ChatNotifications')}
                className="h-space-44 w-space-44 shrink-0 rounded-radius-22 border border-mdy-onBrandMuted bg-mdy-headerGlass items-center justify-center active:bg-mdy-headerPressed"
              >
                <Icon
                  name="notifications"
                  size={24}
                  color={colors.onBrand}
                />
              </Pressable>
            )}
            <Pressable
              testID="workspace-settings-button"
              accessibilityRole="button"
              accessibilityLabel={t('settingsTitle')}
              onPress={() => navigation.navigate('Settings')}
              className="h-space-44 w-space-44 shrink-0 rounded-radius-22 border border-mdy-onBrandMuted bg-mdy-headerGlass items-center justify-center active:bg-mdy-headerPressed"
            >
              <Icon
                name="settings"
                size={24}
                color={colors.onBrand}
              />
            </Pressable>
          </View>
        </BrandHeader>
        <View className={cn(local.overlap)}>
          <RefreshContext.Provider value={registerRefresh}>
            {!mentor ? (
              <ManagerOverviewCard />
            ) : (
              <TodayCard
                mentor={mentor}
                navigation={navigation}
              />
            )}
          </RefreshContext.Provider>
          {
            <View
              testID="workspace-mascot"
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              pointerEvents="none"
              className="absolute w-[125px] h-[88px] -left-[17px] -top-[57px]"
            >
              <Image
                source={mascot}
                accessible={false}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
          }
        </View>
        {
          <View className="pt-space-24 px-space-16 gap-space-14">
            <Text
              accessibilityRole="header"
              className="text-size-17 font-bvp-semibold"
            >
              {teaching(mentor ? 'home.utilities' : 'homeCoordination')}
            </Text>
            <View
              className={
                mentor
                  ? 'flex-row flex-wrap gap-space-16'
                  : 'flex-row flex-wrap gap-y-space-18 items-start'
              }
            >
              {mentor ? (
                <>
                  <HomeTile
                    testID="workspace-open-classes"
                    label={teaching('myClasses')}
                    icon="co_present"
                    compact
                    onPress={() => navigation.navigate('MentorClasses')}
                  />
                  <HomeTile
                    testID="workspace-open-materials"
                    label={mat('title')}
                    icon="menu_book"
                    compact
                    onPress={() => navigation.navigate('MentorMaterials')}
                  />
                  <HomeTile
                    testID="workspace-open-quizzes"
                    label={quiz('title')}
                    icon="edit_note"
                    compact
                    onPress={() => navigation.navigate('MentorQuizzes')}
                  />
                  <HomeTile
                    testID="workspace-open-schedule"
                    label={teaching('schedule')}
                    icon="calendar_month"
                    compact
                    onPress={() => navigation.navigate('TeachingSchedule')}
                  />
                  <HomeTile
                    testID="workspace-open-reports"
                    label={report('mentorLink')}
                    icon="monitoring"
                    compact
                    onPress={() => navigation.navigate('MentorReportClasses')}
                  />
                  {leave.enabled && (
                    <HomeTile
                      testID="workspace-open-leave"
                      label={words('leave.tile')}
                      icon="event_note"
                      compact
                      onPress={() => navigation.navigate('MentorLeaveList')}
                    />
                  )}
                </>
              ) : (
                <>
                  <HomeTile
                    testID="workspace-open-manager-classes"
                    label={teaching('managerClasses')}
                    icon="school"
                    onPress={() => navigation.navigate('ManagerClasses')}
                  />
                  {operations.source && (
                    <HomeTile
                      testID="workspace-open-cash-orders"
                      label={ops('tile')}
                      icon="payments"
                      onPress={() => navigation.navigate('CashOrders')}
                    />
                  )}
                  <HomeTile
                    testID="workspace-open-material-review"
                    label={mat('review')}
                    icon="fact_check"
                    onPress={() => navigation.navigate('MaterialReviewQueue')}
                  />
                  {attendance.enabled && (
                    <>
                      <HomeTile
                        testID="workspace-open-attendance-management"
                        label={att('utility.management')}
                        icon="fact_check"
                        onPress={() =>
                          navigation.navigate('AttendanceManagement')
                        }
                      />
                      <HomeTile
                        testID="workspace-open-manager-finalize"
                        label={att('finalize.title')}
                        icon="task_alt"
                        onPress={() =>
                          navigation.navigate('ManagerFinalizeSessions')
                        }
                      />
                    </>
                  )}
                  {leave.enabled && (
                    <>
                      <LeavePendingBadge
                        onPress={() => navigation.navigate('LeaveReviewQueue')}
                      />
                      <HomeTile
                        testID="workspace-open-makeup-conflicts"
                        label={words('leave.conflictsTile')}
                        icon="event_busy"
                        onPress={() => navigation.navigate('MakeupConflicts')}
                      />
                    </>
                  )}
                </>
              )}
            </View>
          </View>
        }
      </Screen>
      {mentor && <ChatBubble />}
    </View>
  );
}
const local = {
  role: 'text-size-13 mt-[2px]',
  overlap: '-mt-space-50 mx-space-16',
};
