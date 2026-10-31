import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, Icon, Row, Text } from '@/components/ui/primitives';
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
  const { notify } = useAuth();
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
    </AccountPage>
  );
}
