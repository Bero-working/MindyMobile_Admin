import { cssInterop } from 'nativewind';
import { forwardRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type PressableProps,
} from 'react-native';
import * as Slot from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { useMindyTheme } from './theme';
import { Text, TextClassContext } from './text';
import { Icon, type IconName } from './icon';
import { ui } from './classes';

cssInterop(Slot.Pressable, { className: 'style' });

export const buttonVariants = cva(ui.button, {
  variants: {
    variant: {
      primary: 'border-mdy-transparent bg-mdy-primary',
      secondary: 'border-mdy-border bg-mdy-surface',
      danger: 'border-mdy-transparent bg-mdy-dangerButton',
      text: 'border-mdy-transparent bg-mdy-transparent',
    },
    size: { lg: '', sm: ui.smallButton },
  },
  defaultVariants: { variant: 'primary', size: 'lg' },
});
export type ButtonProps = Omit<PressableProps, 'children'> &
  VariantProps<typeof buttonVariants> & {
    children: ReactNode;
    asChild?: boolean;
    busy?: boolean;
    icon?: IconName;
  };
export const Button = forwardRef<View, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'lg',
      asChild = false,
      busy = false,
      icon,
      disabled,
      className,
      style,
      onPressIn,
      onPressOut,
      ...props
    },
    ref
  ) => {
    const { colors } = useMindyTheme();
    const [pressed, setPressed] = useState(false);
    const Component = asChild ? Slot.Pressable : Pressable;
    const foreground =
      disabled && !busy && variant === 'primary'
        ? colors.disabledInk
        : variant === 'primary' || variant === 'danger'
          ? colors.onBrand
          : variant === 'text'
            ? colors.link
            : colors.ink;
    const foregroundClass =
      disabled && !busy && variant === 'primary'
        ? 'text-mdy-disabledInk'
        : variant === 'primary' || variant === 'danger'
          ? 'text-mdy-onBrand'
          : variant === 'text'
            ? 'text-mdy-link'
            : 'text-mdy-ink';
    return (
      <TextClassContext.Provider value={cn(ui.buttonText, foregroundClass)}>
        <Component
          ref={ref}
          {...props}
          disabled={disabled || busy}
          accessibilityRole="button"
          accessibilityState={{ busy, disabled: !!disabled || busy }}
          className={cn(
            buttonVariants({ variant, size }),
            disabled && !busy && variant === 'primary' && 'bg-mdy-disabled',
            busy && 'bg-mdy-loading',
            !disabled &&
              !busy &&
              pressed &&
              (variant === 'primary'
                ? 'bg-mdy-pressed'
                : variant === 'secondary'
                  ? 'bg-mdy-muted2'
                  : variant === 'danger'
                    ? 'bg-mdy-dangerButton'
                    : 'bg-mdy-tint2'),
            className
          )}
          style={typeof style === 'function' ? style({ pressed }) : style}
          onPressIn={(event) => {
            setPressed(true);
            onPressIn?.(event);
          }}
          onPressOut={(event) => {
            setPressed(false);
            onPressOut?.(event);
          }}
        >
          {asChild ? (
            children
          ) : (
            <>
              {busy ? (
                <ActivityIndicator
                  size={18}
                  color={foreground}
                />
              ) : icon ? (
                <Icon
                  name={icon}
                  size={20}
                  color={foreground}
                />
              ) : null}
              <Text maxFontSizeMultiplier={1.3}>{children}</Text>
            </>
          )}
        </Component>
      </TextClassContext.Provider>
    );
  }
);
Button.displayName = 'Button';
