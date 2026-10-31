import { cn } from '@/utils/cn';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  BrandHeader,
  Button,
  Card,
  CircleIcon,
  FocusHeading,
  Screen,
  Text,
  ui,
} from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { useAuth } from '../hooks/useAuth';

export function BootstrapScreen() {
  const { t } = useTranslation('foundation');
  const { state, busy, retry } = useAuth();
  const { colors } = useMindyTheme();
  const [showChecking, setShowChecking] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowChecking(true), 600);
    return () => clearTimeout(timer);
  }, []);
  const error = state.error;
  const category =
    error?.code === 'offline'
      ? 'offline'
      : error?.code === 'timeout'
        ? 'timeout'
        : error?.code === 'config'
          ? 'config'
          : 'server';
  return (
    <Screen testID="bootstrap-screen">
      <BrandHeader tagline={t('tagline')} />
      {error ? (
        <Card
          overlap
          center
          testID="bootstrap-error-card"
        >
          <CircleIcon
            name={
              category === 'config'
                ? 'settings_alert'
                : category === 'server'
                  ? 'dns'
                  : 'cloud_off'
            }
          />
          <FocusHeading
            testID="bootstrap-error-title"
            accessibilityRole="header"
            className={cn(ui.title)}
          >
            {t(`${category}Title`)}
          </FocusHeading>
          <Text className={cn(ui.body, 'text-mdy-secondary')}>
            {t(`${category}Body`)}
          </Text>
          {error.requestId && (
            <Text
              selectable
              testID="bootstrap-support-code"
              className={cn(ui.caption, 'text-mdy-secondary')}
            >
              {t('supportCode', { code: error.requestId })}
            </Text>
          )}
          {category !== 'config' && (
            <View className={cn(local.full)}>
              <Button
                testID="bootstrap-retry-button"
                icon="refresh"
                busy={busy}
                onPress={retry}
              >
                {t(busy ? 'retrying' : 'retry')}
              </Button>
            </View>
          )}
        </Card>
      ) : showChecking ? (
        <View
          testID="bootstrap-checking"
          accessibilityLiveRegion="polite"
          className={cn(local.checking)}
        >
          <ActivityIndicator
            size={18}
            color={colors.primary}
          />
          <Text className={cn('text-mdy-secondary')}>{t('checking')}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
const local = {
  checking: 'items-center gap-space-8 mt-space-48',
  full: 'self-stretch',
};
