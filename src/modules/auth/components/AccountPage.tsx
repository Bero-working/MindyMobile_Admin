import type { PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tokens from '@/components/ui/tokens.json';
import {
  BrandHeader,
  Gradient,
  Icon,
  Screen,
  Text,
  ui,
} from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { useAuth } from '../hooks/useAuth';
import { cn } from '@/utils/cn';

export const accountStyles = {
  group: 'gap-space-8 pt-space-12',
  groupLabel:
    'px-space-4 font-bvp-semibold text-size-12 tracking-group text-mdy-tertiary',
  list: 'mx-space-0 p-space-6 gap-space-0',
};

export function AccountPage({
  children,
  page,
  title,
  subtitle,
  onBack,
}: PropsWithChildren<{
  page: 'settings' | 'profile';
  title: string;
  subtitle: string;
  onBack: () => void;
}>) {
  const { t } = useTranslation('foundation');
  const { colors } = useMindyTheme();
  const { busy } = useAuth();
  const insets = useSafeAreaInsets();
  return (
    <Screen
      testID={`${page}-screen`}
      variant="app"
      flushBottom
    >
      <BrandHeader subpage>
        <View className={cn(ui.buttonRow)}>
          <Pressable
            testID={`${page}-back-button`}
            accessibilityRole="button"
            accessibilityLabel={t('back')}
            disabled={busy}
            onPress={onBack}
            className="h-space-44 w-space-44 -ml-space-10 rounded-radius-22 items-center justify-center active:bg-mdy-headerPressed"
          >
            <Icon
              name="arrow_back"
              size={22}
              color={colors.onBrand}
            />
          </Pressable>
          <View className="flex-1 gap-space-2">
            <Text
              maxFontSizeMultiplier={1.3}
              className="text-size-18 font-bvp-semibold text-mdy-onBrand"
            >
              {title}
            </Text>
            <Text className="text-size-13 text-mdy-onBrandMuted">
              {subtitle}
            </Text>
          </View>
        </View>
      </BrandHeader>
      <View className="grow -mt-space-28 rounded-tl-radius-28 rounded-tr-radius-28 overflow-hidden">
        <Gradient
          id={`${page}-panel`}
          variant="background"
          app
        />
        <View
          className="px-space-16 pt-space-20 gap-space-12"
          style={{
            paddingBottom: Math.max(insets.bottom, tokens.spacing['space-32']),
          }}
        >
          {children}
        </View>
      </View>
    </Screen>
  );
}
