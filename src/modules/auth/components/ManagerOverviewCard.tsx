import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Text } from '@/components/ui/primitives';
import { vietnamDate } from '@/modules/teaching/format';

// Temporary fixture until the manager overview API is available. Revenue is VND/month.
const mockOverview = {
  students: 248,
  openClasses: 18,
  monthlyRevenue: 125000000,
};

export function ManagerOverviewCard() {
  const { t, i18n } = useTranslation('foundation');
  const [year, month] = vietnamDate().split('-');
  const locale = i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US';
  const revenue = `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(mockOverview.monthlyRevenue / 1000000)}tr`;
  const stats = [
    { key: 'students', value: mockOverview.students.toLocaleString(locale) },
    {
      key: 'openClasses',
      value: mockOverview.openClasses.toLocaleString(locale),
    },
    {
      key: 'revenue',
      value: revenue,
      spokenValue: new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'VND',
      }).format(mockOverview.monthlyRevenue),
    },
  ];

  return (
    <Card
      testID="workspace-today-card"
      frosted
      className="mx-space-0 p-space-24 gap-space-16"
    >
      <View className="flex-row items-stretch">
        {stats.map((stat, index) => (
          <View
            key={stat.key}
            testID={`workspace-stat-${stat.key}`}
            accessible
            accessibilityLabel={`${t(`managerOverview.${stat.key}`)}: ${stat.spokenValue ?? stat.value}`}
            className={`flex-1 min-w-0 items-center justify-center gap-space-8 px-space-4 py-space-8 ${index ? 'border-l border-mdy-divider' : ''}`}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              className="text-[26px] font-bvp-bold text-mdy-link"
            >
              {stat.value}
            </Text>
            <Text className="text-center text-size-12 font-bvp-medium text-mdy-secondary">
              {t(`managerOverview.${stat.key}`)}
            </Text>
          </View>
        ))}
      </View>
      <Text className="text-center text-size-11 text-mdy-secondary">
        {t('managerOverview.mockPeriod', { month: Number(month), year })}
      </Text>
    </Card>
  );
}
