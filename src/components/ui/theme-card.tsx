import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './text';
import { Icon } from './icon';
import { useMindyTheme, type ThemeChoice } from './theme';
import { cn } from '@/utils/cn';

const preview = {
  light: { background: '#f6f5f2', header: '#1f4f55', line: '#ffffff' },
  dark: { background: '#1a1d1d', header: '#0f2a2d', line: '#2c3131' },
  system: { background: '#f6f5f2', header: '#1f4f55', line: '#b9c4c2' },
} as const;
const styles = StyleSheet.create({
  card: { boxShadow: '0px 6px 18px rgba(31,79,85,.08)' },
});

export function ThemeCard({
  value,
  label,
  checked,
  onPress,
}: {
  value: ThemeChoice;
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  const { colors } = useMindyTheme();
  const image = preview[value];
  return (
    <Pressable
      testID={`settings-theme-${value}`}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={onPress}
      className={cn(
        'flex-1 min-w-0 border-2 rounded-radius-18 p-space-8 pb-space-10 gap-space-10 bg-mdy-surface active:scale-[0.97]',
        checked ? 'border-mdy-primary' : 'border-transparent'
      )}
      style={styles.card}
    >
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="h-space-84 rounded-radius-12 overflow-hidden border border-mdy-border"
        style={{ backgroundColor: image.background }}
      >
        {value === 'system' && (
          <View
            className="absolute right-0 inset-y-0 w-1/2"
            style={{ backgroundColor: preview.dark.background }}
          />
        )}
        <View
          className="h-space-24"
          style={{ backgroundColor: image.header }}
        />
        <View className="m-space-8 gap-space-6">
          <View
            className="h-space-14 rounded-radius-7"
            style={{ backgroundColor: image.line }}
          />
          <View
            className="h-space-8 w-3/5 rounded-radius-4"
            style={{ backgroundColor: image.line }}
          />
        </View>
      </View>
      <View className="flex-row items-start justify-center gap-space-4">
        <Icon
          name={
            value === 'light'
              ? 'light_mode'
              : value === 'dark'
                ? 'dark_mode'
                : 'contrast'
          }
          size={18}
          filled={checked}
          color={checked ? colors.primary : colors.secondary}
        />
        <Text
          maxFontSizeMultiplier={1.3}
          className={cn(
            'shrink text-center text-size-13 font-bvp-semibold',
            checked ? 'text-mdy-primary' : 'text-mdy-secondary'
          )}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
