import { cn } from '@/utils/cn';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Avatar,
  BrandHeader,
  Card,
  Icon,
  CircleIcon,
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
  const { state } = useAuth();
  const { colors } = useMindyTheme();
  const user = state.user;
  if (!user) return null;
  const mentor = user.role === 'MENTOR';
  return (
    <Screen
      testID={mentor ? 'workspace-mentor-root' : 'workspace-manager-root'}
      variant="app"
    >
      <BrandHeader>
        <View className={cn(ui.buttonRow)}>
          <Pressable
            testID="workspace-account-button"
            accessibilityRole="button"
            accessibilityLabel={t('profileTitle')}
            onPress={() => navigation.navigate('Profile')}
          >
            <Avatar name={user.displayName} />
          </Pressable>
          <View className={cn(ui.flex)}>
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
            className="h-space-44 w-space-44 rounded-radius-22 bg-mdy-headerGlass items-center justify-center active:opacity-80"
          >
            <Icon
              name="settings"
              size={22}
              color={colors.onBrand}
            />
          </Pressable>
        </View>
      </BrandHeader>
      <View className={cn(local.overlap)}>
        <Card>
          <CircleIcon name={mentor ? 'school' : 'dashboard'} />
          <Text
            accessibilityRole="header"
            className={cn(ui.title)}
          >
            {t(mentor ? 'workspaceMentor' : 'workspaceManager')}
          </Text>
          <Text className={cn('text-mdy-secondary')}>
            {t(mentor ? 'workspaceMentorBody' : 'workspaceManagerBody')}
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
const local = {
  email: 'text-size-13 my-space-4',
  overlap: '-mt-space-50',
};
