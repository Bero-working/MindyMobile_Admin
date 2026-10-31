import { cssInterop } from 'nativewind';
import { createContext, forwardRef, useContext } from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import * as Slot from '@rn-primitives/slot';
import { cn } from '@/utils/cn';
import { ui } from './classes';

cssInterop(Slot.Text, { className: 'style' });

export const TextClassContext = createContext<string | undefined>(undefined);
export const Text = forwardRef<RNText, TextProps & { asChild?: boolean }>(
  ({ className, asChild = false, style, ...props }, ref) => {
    const inherited = useContext(TextClassContext);
    const Component = asChild ? Slot.Text : RNText;
    return (
      <Component
        ref={ref}
        className={cn(ui.text, 'text-mdy-ink', inherited, className)}
        style={style}
        {...props}
      />
    );
  }
);
Text.displayName = 'Text';
