import { cn } from '@/utils/cn';
import type { ReactNode, RefObject } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { Icon, Text, ui, type IconName } from './primitives';
import { useMindyTheme } from './theme';

// Reusable input wrapper: native autofill/focus remain on TextInput.
export function TextField({
  label,
  error,
  invalid = false,
  icon,
  fieldId,
  inputRef,
  trailing,
  ...props
}: TextInputProps & {
  label: string;
  error?: string | undefined;
  invalid?: boolean;
  icon: IconName;
  fieldId: string;
  inputRef: RefObject<TextInput | null>;
  trailing?: ReactNode;
}) {
  const { colors } = useMindyTheme();
  return (
    <View className={cn(local.field)}>
      <Text className={cn(local.label)}>{label}</Text>
      <View
        className={cn(
          local.shell,
          'bg-mdy-surface',
          error || invalid ? 'border-mdy-dangerBorder' : 'border-mdy-border'
        )}
      >
        <Icon
          name={icon}
          size={20}
        />
        <TextInput
          {...props}
          ref={inputRef}
          testID={`${fieldId}-input`}
          accessibilityLabel={label}
          accessibilityHint={error}
          className={cn(local.input, 'text-mdy-ink')}
          placeholderTextColor={colors.placeholder}
        />
        {trailing}
      </View>
      {error && (
        <Text
          testID={`${fieldId}-error`}
          accessibilityLiveRegion="polite"
          className={cn(ui.caption, 'text-mdy-danger')}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
const local = {
  field: 'gap-space-6',
  input: 'flex-1 font-bvp-regular text-size-14 min-h-space-50 py-space-12',
  label: 'font-bvp-medium text-size-13',
  shell:
    'items-center rounded-radius-99 border flex-row gap-space-10 min-h-space-52 pl-space-16 pr-space-4',
};
