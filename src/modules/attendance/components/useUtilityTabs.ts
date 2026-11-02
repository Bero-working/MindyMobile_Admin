import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { AuthStackParams } from '@/modules/auth/AuthApp';

export function useUtilityTabs(
  params: {
    sessionId: string;
    classTitle?: string;
    classId?: string;
    utilityTabs?: boolean;
  },
  mode: 'correction' | 'history'
) {
  const { t } = useTranslation('attendance');
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParams>>();
  return {
    enabled: !!params.utilityTabs,
    pageProps: params.utilityTabs
      ? {
          tabs: [
            {
              value: 'correction',
              label: t('utility.edit'),
              testID: 'attendance-tools-mode-correction',
            },
            {
              value: 'history',
              label: t('utility.history'),
              testID: 'attendance-tools-mode-history',
            },
          ],
          tab: mode,
          onTab: (next: string) => {
            if (next === mode) return;
            navigation.replace(
              next === 'history' ? 'AttendanceAudits' : 'AttendanceCorrection',
              params
            );
          },
        }
      : {},
  };
}
