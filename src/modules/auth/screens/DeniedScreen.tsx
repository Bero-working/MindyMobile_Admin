import { cn } from '@/utils/cn';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  BrandHeader,
  Button,
  Card,
  CircleIcon,
  FocusHeading,
  Screen,
  Text,
  ui,
} from '@/components/ui/primitives';
import { useAuth } from '../hooks/useAuth';
import type { AuthError } from '../types';

export function DeniedScreen() {
  const { t } = useTranslation('foundation');
  const { state, busy, logout } = useAuth();
  const [error, setError] = useState<AuthError>();
  const user = state.user;
  if (!user) return null;
  return (
    <Screen testID="denied-screen">
      <BrandHeader tagline={t('tagline')} />
      <Card
        overlap
        center
      >
        <CircleIcon
          name="lock_person"
          danger
        />
        <FocusHeading
          testID="denied-title"
          accessibilityRole="header"
          className={cn(ui.title, local.center)}
        >
          {t('deniedTitle')}
        </FocusHeading>
        <Text className={cn(ui.body, 'text-mdy-secondary')}>
          {t('deniedBody')}
        </Text>
        <View
          accessible
          accessibilityLabel={t('accountSummary', {
            email: user.email,
            role: '',
          })}
          className={cn(local.account, 'bg-mdy-muted')}
        >
          <Text
            testID="denied-email"
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {user.email}
          </Text>
        </View>
        <Text className={cn(ui.alertText, local.center, 'text-mdy-secondary')}>
          {t('deniedHelp')}
        </Text>
        {error && <Alert testID="denied-error">{t('logoutError')}</Alert>}
        <View className={cn(local.full)}>
          <Button
            testID="denied-logout-button"
            icon="logout"
            busy={busy}
            onPress={async () => {
              setError(undefined);
              setError(await logout(false));
            }}
          >
            {t(busy ? 'loggingOut' : 'deniedLogout')}
          </Button>
        </View>
      </Card>
    </Screen>
  );
}
const local = {
  account: 'items-center self-stretch rounded-radius-14 gap-space-8 p-space-12',
  center: 'text-center',
  full: 'self-stretch',
};
