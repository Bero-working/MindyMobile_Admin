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
  const { t: teaching } = useTranslation('teaching');
  const { state } = useAuth();
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
              className={cn(local.email, 'text-mdy-onBrandMuted')}
            >
              {t(mentor ? 'MENTOR' : 'MANAGER')} · {user.email}
            </Text>
          </View>
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
          <TodayCard
            mentor={mentor}
            navigation={navigation}
          />
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
                ? 'flex-row gap-space-16'
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
                  testID="workspace-open-schedule"
                  label={teaching('schedule')}
                  icon="calendar_month"
                  compact
                  onPress={() => navigation.navigate('TeachingSchedule')}
                />
              </>
            ) : (
              <HomeTile
                testID="workspace-open-manager-classes"
                label={teaching('managerClasses')}
                icon="school"
                onPress={() => navigation.navigate('ManagerClasses')}
              />
            )}
          </View>
        </View>
      }
    </Screen>
  );
}
const local = {
  email: 'text-size-13 mt-[2px]',
  overlap: '-mt-space-50 mx-space-16',
};
