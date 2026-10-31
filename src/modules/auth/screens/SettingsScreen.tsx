import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  Button,
  Card,
  Icon,
  Row,
  Text,
} from '@/components/ui/primitives';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import type { AuthError } from '../types';
import { ThemeCard } from '@/components/ui/theme-card';
import { useMindyTheme, type ThemeChoice } from '@/components/ui/theme';
import localStore from '@/services/storage/localStore.service';
import i18n from '@/translations';
import { AccountPage, accountStyles } from '../components/AccountPage';
import { useAuth } from '../hooks/useAuth';
import type { AuthStackParams } from '../AuthApp';

export function SettingsScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'Settings'>) {
  const { t } = useTranslation('foundation');
  const { notify, state, busy, logout } = useAuth();
  const [confirm, setConfirm] = useState<'one' | 'all'>();
  const [error, setError] = useState<AuthError>();
  const logoutRef = useRef<View>(null);
  const logoutAllRef = useRef<View>(null);
  const user = state.user;
  const close = () => {
    if (!busy) {
      setConfirm(undefined);
      setError(undefined);
    }
  };
  const { colors, choice, setChoice } = useMindyTheme();
  const language = async (value: 'vi' | 'en') => {
    if (i18n.language === value) return;
    try {
      localStore.setSystemLanguage(value);
    } catch {
      /* Apply for the current session. */
    }
    await i18n.changeLanguage(value);
    notify(i18n.t('languageChanged', { ns: 'foundation' }));
  };
  const appearance = (value: ThemeChoice) => {
    if (choice === value) return;
    setChoice(value);
    notify(t('themeChanged', { name: t(value) }));
  };
  if (!user) return null;
  return (
    <AccountPage
      page="settings"
      title={t('settingsTitle')}
      subtitle={t('settingsSubtitle')}
      onBack={() => navigation.goBack()}
    >
      <View className="gap-space-8">
        <Text className={accountStyles.groupLabel}>{t('language')}</Text>
        <Card className={accountStyles.list}>
          <View accessibilityRole="radiogroup">
            <Row
              compact
              code="VI"
              testID="settings-language-vi"
              label="Tiếng Việt"
              subtitle={t('languageViSub')}
              checked={i18n.language === 'vi'}
              onPress={() => language('vi')}
            />
            <Row
              compact
              code="EN"
              testID="settings-language-en"
              label="English"
              subtitle={t('languageEnSub')}
              checked={i18n.language === 'en'}
              onPress={() => language('en')}
            />
          </View>
        </Card>
      </View>
      <View className={accountStyles.group}>
        <Text className={accountStyles.groupLabel}>{t('appearance')}</Text>
        <View
          accessibilityRole="radiogroup"
          className="flex-row gap-space-8"
        >
          {(['light', 'dark', 'system'] as const).map((value) => (
            <ThemeCard
              key={value}
              value={value}
              label={t(value)}
              checked={choice === value}
              onPress={() => appearance(value)}
            />
          ))}
        </View>
        <View className="flex-row items-start gap-space-6 px-space-4">
          <Icon
            name="info"
            size={16}
            color={colors.link}
          />
          <Text
            testID="settings-theme-note"
            className="flex-1 text-size-12 text-mdy-secondary leading-line-18"
          >
            {t(choice === 'system' ? 'themeNoteSystem' : 'themeNoteFixed')}
          </Text>
        </View>
      </View>
      <View className={accountStyles.group}>
        <Text className={accountStyles.groupLabel}>{t('sessions')}</Text>
        <Card className={accountStyles.list}>
          <Row
            compact
            chevron={false}
            triggerRef={logoutRef}
            testID="settings-logout-row"
            icon="logout"
            label={t('logout')}
            subtitle={t('logoutSub')}
            onPress={() => setConfirm('one')}
          />
          <Row
            compact
            chevron={false}
            triggerRef={logoutAllRef}
            testID="settings-logout-all-row"
            icon="devices"
            label={t('logoutAll')}
            subtitle={t('logoutAllSub')}
            danger
            onPress={() => setConfirm('all')}
          />
        </Card>
      </View>
      {confirm && (
        <ConfirmationDialog
          testID="logout-sheet"
          title={t(confirm === 'all' ? 'logoutAllTitle' : 'logoutTitle')}
          icon={confirm === 'all' ? 'devices' : 'logout'}
          onClose={close}
          busy={busy}
          returnFocusRef={confirm === 'all' ? logoutAllRef : logoutRef}
        >
          <Text className="-mt-space-8 text-center text-mdy-secondary">
            {t(confirm === 'all' ? 'logoutAllBody' : 'logoutBody', {
              email: user.email,
            })}
          </Text>
          {error && (
            <Alert testID="logout-sheet-error">{t('logoutError')}</Alert>
          )}
          <View className="gap-space-8">
            <Button
              testID="logout-sheet-confirm"
              variant="danger"
              className="bg-mdy-dangerButton"
              busy={busy}
              onPress={async () => {
                setError(undefined);
                setError(await logout(confirm === 'all'));
              }}
            >
              {t(
                busy ? 'loggingOut' : confirm === 'all' ? 'logoutAll' : 'logout'
              )}
            </Button>
            <Button
              testID="logout-sheet-cancel"
              variant="secondary"
              className="border-mdy-disabled"
              disabled={busy}
              onPress={close}
            >
              <Text className="text-mdy-primary">{t('cancel')}</Text>
            </Button>
          </View>
        </ConfirmationDialog>
      )}
    </AccountPage>
  );
}
