import { cn } from '@/utils/cn';
import { View } from 'react-native';
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
import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from './LoginScreen';

export function BootstrapScreen() {
  const { t } = useTranslation('foundation');
  const { state, busy, retry } = useAuth();
  const error = state.error;
  const category =
    error?.code === 'offline'
      ? 'offline'
      : error?.code === 'timeout'
        ? 'timeout'
        : error?.code === 'config'
          ? 'config'
          : 'server';
  if (!error) return <LoginScreen skeleton />;
  return (
    <Screen testID="bootstrap-screen">
      <BrandHeader tagline={t('tagline')} />
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
    </Screen>
  );
}
const local = {
  full: 'self-stretch',
};
