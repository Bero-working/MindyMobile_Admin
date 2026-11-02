import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import {
  Gradient,
  Icon,
  Text,
  type IconName,
} from '@/components/ui/primitives';
import tokens from '@/components/ui/tokens.json';
import { useMindyTheme } from '@/components/ui/theme';

export function HomeTile({
  label,
  icon,
  testID,
  onPress,
  featured = false,
  compact = false,
  badge,
  accessibilityLabel,
}: {
  label: string;
  icon: IconName;
  testID: string;
  onPress: () => void;
  featured?: boolean;
  compact?: boolean;
  badge?: number | undefined;
  accessibilityLabel?: string | undefined;
}) {
  const { colors } = useMindyTheme();
  const reduced = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className="items-center gap-space-8 min-h-space-44"
      style={[
        compact ? styles.compact : styles.tile,
        pressed && (reduced ? styles.reduced : styles.pressed),
      ]}
    >
      <View
        className={
          featured
            ? 'h-space-56 w-space-56 rounded-radius-18 bg-mdy-primary items-center justify-center'
            : 'h-space-56 w-space-56 rounded-radius-28 overflow-hidden border border-mdy-glassBorder items-center justify-center'
        }
        style={
          featured
            ? undefined
            : {
                boxShadow: `0px ${tokens.layout.tileShadowY}px ${tokens.layout.tileShadowBlur}px ${colors.tileShadow}`,
              }
        }
      >
        {!featured && (
          <Gradient
            id={`${testID}-glass`}
            variant="glass"
          />
        )}
        <Icon
          name={icon}
          size={26}
          color={featured ? colors.onBrand : colors.link}
        />
      </View>
      {!!badge && badge > 0 && (
        <View
          testID={`${testID}-badge`}
          className="absolute top-space-0 right-space-0 min-w-space-18 h-space-18 rounded-radius-99 bg-mdy-dangerButton items-center justify-center px-space-4"
        >
          <Text className="text-size-11 font-bvp-bold text-mdy-onBrand">
            {badge > 99 ? '99+' : String(badge)}
          </Text>
        </View>
      )}
      <Text className="text-size-12 text-center leading-[16.2px] w-full">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compact: { width: 60 },
  pressed: { transform: [{ scale: 0.94 }] },
  reduced: { opacity: 0.8 },
  tile: { paddingHorizontal: 2, width: '25%' },
});
