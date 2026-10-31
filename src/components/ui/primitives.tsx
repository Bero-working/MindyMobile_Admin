import { cssInterop } from 'nativewind';
import { ui } from './classes';
import { Text } from './text';
import { Icon, type IconName } from './icon';
export { ui } from './classes';
export { Text } from './text';
export { Button } from './button';
export { Icon, type IconName } from './icon';
import tokens from './tokens.json';
import {
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type RefObject,
} from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text as RNText,
  View,
  type TextProps,
  type ScrollViewProps,
} from 'react-native';
import Animated, {
  FadeIn,
  useReducedMotion,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { BlurView } from '@react-native-community/blur';
import { cn } from '@/utils/cn';
import mascot from '@/assets/images/mascot-login.png';
import { useMindyTheme, type Palette } from './theme';

// Third-party native containers need explicit className mappings.
cssInterop(Animated.View, { className: 'style' });
cssInterop(GestureHandlerRootView, { className: 'style' });
cssInterop(KeyboardAwareScrollView, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});

// react-native-svg ignores the alpha of stopColor; it only reads stopOpacity.
function stopPaint(color: string) {
  const match = /^rgba\((.+),\s*([\d.]+)\)$/.exec(color);
  return match
    ? { stopColor: `rgb(${match[1]})`, stopOpacity: Number(match[2]) }
    : { stopColor: color };
}

export function Gradient({
  variant = 'header',
  id,
  app = false,
}: {
  app?: boolean;
  variant?: 'header' | 'glass' | 'background';
  id: string;
}) {
  const { colors } = useMindyTheme();
  // Percent sizes don't repaint on Android when async content grows the parent.
  const [size, setSize] = useState<{ width: number; height: number }>();
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={({ nativeEvent: { layout } }) =>
        setSize({ width: layout.width, height: layout.height })
      }
    >
      <Svg
        width={size?.width ?? '100%'}
        height={size?.height ?? '100%'}
        accessible={false}
      >
        <Defs>
          <LinearGradient
            id={`${id}-linear`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <Stop
              offset="0"
              {...stopPaint(
                variant === 'header' ? colors.headerStart : colors.glass
              )}
            />
            <Stop
              offset="0.55"
              {...stopPaint(
                variant === 'header' ? colors.headerMid : colors.glass
              )}
            />
            <Stop
              offset="1"
              {...stopPaint(
                variant === 'header' ? colors.headerEnd : colors.glassEnd
              )}
            />
          </LinearGradient>
          <RadialGradient
            id={`${id}-teal`}
            cx="0"
            cy={app ? '45%' : '60%'}
            rx="1"
            ry="0.65"
          >
            <Stop
              offset="0"
              stopColor={colors.glow}
              stopOpacity="0.7"
            />
            <Stop
              offset="1"
              stopColor={colors.bg}
              stopOpacity="0"
            />
          </RadialGradient>
          <RadialGradient
            id={`${id}-warm`}
            cx="1"
            cy={app ? '75%' : '90%'}
            rx="1"
            ry="0.6"
          >
            <Stop
              offset="0"
              stopColor={colors.warm}
              stopOpacity="0.5"
            />
            <Stop
              offset="1"
              stopColor={colors.bg}
              stopOpacity="0"
            />
          </RadialGradient>
        </Defs>
        <Rect
          width="100%"
          height="100%"
          fill={variant === 'background' ? colors.bg : `url(#${id}-linear)`}
        />
        {variant === 'background' && (
          <>
            <Rect
              width="100%"
              height="100%"
              fill={`url(#${id}-teal)`}
            />
            <Rect
              width="100%"
              height="100%"
              fill={`url(#${id}-warm)`}
            />
          </>
        )}
      </Svg>
    </View>
  );
}
export function Screen({
  children,
  testID,
  variant = 'login',
  keyboardAware = false,
  flushBottom = false,
  refreshControl,
  onScroll,
}: PropsWithChildren<{
  testID: string;
  variant?: 'login' | 'app';
  keyboardAware?: boolean;
  flushBottom?: boolean;
  refreshControl?: ScrollViewProps['refreshControl'];
  onScroll?: ScrollViewProps['onScroll'];
}>) {
  const { variables } = useMindyTheme();
  const insets = useSafeAreaInsets();
  const ContentScroll = keyboardAware ? KeyboardAwareScrollView : ScrollView;
  return (
    <View
      testID={testID}
      className={cn(ui.flex, 'bg-mdy-bg')}
      style={variables}
    >
      <StatusBar barStyle="light-content" />
      <Gradient
        id={testID}
        variant="background"
        app={variant === 'app'}
      />
      <ContentScroll
        refreshControl={refreshControl}
        onScroll={onScroll}
        scrollEventThrottle={200}
        className={cn(ui.flex)}
        bottomOffset={tokens.layout.keyboardOffset}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName={cn(ui.scroll)}
        contentContainerStyle={[
          { paddingLeft: insets.left, paddingRight: insets.right },
          {
            paddingBottom: flushBottom
              ? tokens.spacing['space-0']
              : Math.max(insets.bottom, tokens.spacing['space-24']),
          },
        ]}
      >
        {children}
      </ContentScroll>
    </View>
  );
}
export function BrandHeader({
  tagline,
  children,
  subpage = false,
  flush = false,
}: PropsWithChildren<{
  tagline?: string;
  subpage?: boolean;
  flush?: boolean;
}>) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className={cn(
        ui.header,
        subpage
          ? cn(ui.subpageHeader, 'rounded-none', flush && 'pb-space-0')
          : tagline
            ? ui.authHeader
            : ui.workspaceHeader
      )}
      style={{
        paddingTop:
          insets.top +
          (tagline
            ? tokens.spacing['space-32']
            : subpage
              ? tokens.spacing['space-16']
              : tokens.spacing['space-20']),
      }}
    >
      <Gradient id="brand-header" />
      {tagline ? (
        <>
          <Text
            maxFontSizeMultiplier={1.3}
            className={cn(ui.wordmark, 'text-mdy-onBrand')}
          >
            {'Mindy'}
          </Text>
          <Text className={cn(ui.tagline, 'text-mdy-onBrandMuted')}>
            {tagline}
          </Text>
          <Image
            source={mascot}
            className={cn(ui.mascot)}
            accessible={false}
          />
        </>
      ) : (
        children
      )}
    </View>
  );
}
export function Card({
  children,
  overlap = false,
  testID,
  center = false,
  animate = false,
  frosted = false,
  className,
  skeletonLabel,
}: PropsWithChildren<{
  animate?: boolean;
  frosted?: boolean;
  skeletonLabel?: string;
  overlap?: boolean;
  testID?: string;
  center?: boolean;
  className?: string;
}>) {
  const { colors, isDark } = useMindyTheme();
  const reduced = useReducedMotion();
  return (
    <Animated.View
      {...(animate && !reduced
        ? { entering: FadeIn.duration(tokens.motion.base) }
        : {})}
      testID={testID}
      className={cn(
        ui.card,
        'border-mdy-glassBorder',
        overlap && ui.overlap,
        center && ui.center,
        className
      )}
      style={{
        boxShadow: `0px ${tokens.layout.cardShadowY}px ${tokens.layout.cardShadowBlur}px ${colors.shadow}`,
      }}
    >
      {(frosted || overlap) && (
        <BlurView
          testID={testID ? `${testID}-blur` : undefined}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={tokens.layout.glassBlur}
          overlayColor={colors.transparent}
          reducedTransparencyFallbackColor={colors.glass}
        />
      )}
      <Gradient
        id={testID ?? 'glass-card'}
        variant="glass"
      />
      {skeletonLabel ? (
        <View
          testID={testID ? `${testID}-checking` : undefined}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={skeletonLabel}
          accessibilityState={{ busy: true }}
          accessibilityLiveRegion="polite"
        >
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="opacity-0 gap-space-16"
          >
            {children}
          </View>
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="absolute inset-0 gap-space-16"
          >
            <View className="h-space-24 w-1/2 rounded-radius-7 bg-mdy-muted" />
            <View className="h-space-16 w-3/4 rounded-radius-7 bg-mdy-muted" />
            <View className="flex-1 rounded-radius-12 bg-mdy-muted" />
            <View className="flex-1 rounded-radius-12 bg-mdy-muted" />
            <View className="h-space-44 w-1/2 self-end rounded-radius-7 bg-mdy-muted" />
            <View className="h-space-52 rounded-radius-99 bg-mdy-muted" />
          </View>
        </View>
      ) : (
        children
      )}
    </Animated.View>
  );
}
export function Alert({
  children,
  warning = false,
  testID,
}: {
  children: string;
  warning?: boolean;
  testID: string;
}) {
  const { colors } = useMindyTheme();
  return (
    <View
      testID={testID}
      accessibilityRole={warning ? 'text' : 'alert'}
      accessibilityLiveRegion="polite"
      className={cn(
        ui.alert,
        warning ? 'bg-mdy-warningBg' : 'bg-mdy-dangerSoft'
      )}
    >
      <Icon
        size={18}
        name={warning ? 'warning' : 'error'}
        color={warning ? colors.warning : colors.danger}
      />
      <View className={cn(ui.flex)}>
        <Text
          className={cn(
            ui.alertText,
            warning ? 'text-mdy-warning' : 'text-mdy-danger'
          )}
        >
          {children}
        </Text>
      </View>
    </View>
  );
}
export function CircleIcon({
  name,
  danger = false,
}: {
  name: IconName;
  danger?: boolean;
}) {
  const { colors } = useMindyTheme();
  return (
    <View
      className={cn(ui.circle, danger ? 'bg-mdy-dangerBg' : 'bg-mdy-tint2')}
    >
      <Icon
        name={name}
        size={26}
        color={danger ? colors.danger : colors.primary}
      />
    </View>
  );
}
export function Avatar({
  name,
  profile = false,
  testID,
  size,
}: {
  name: string;
  profile?: boolean;
  testID?: string;
  size?: 36 | 40 | 52;
}) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1
      ? (words[0]?.[0] ?? '') + (words[words.length - 1]?.[0] ?? '')
      : (words[0]?.[0] ?? '');
  return (
    <View
      testID={testID}
      {...(size
        ? { style: { width: size, height: size, borderRadius: size / 2 } }
        : {})}
      className={cn(
        ui.avatar,
        'bg-mdy-avatar',
        profile && 'h-space-84 w-space-84 rounded-radius-99'
      )}
    >
      <Text
        className={cn(
          ui.title,
          'text-mdy-avatarText',
          profile && 'text-size-28 leading-line-42'
        )}
      >
        {initials.toLocaleUpperCase()}
      </Text>
    </View>
  );
}
export function Chip({
  children,
  testID,
  variant = 'brand',
}: PropsWithChildren<{
  testID?: string;
  variant?:
    | 'brand'
    | 'neutral'
    | 'header'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';
}>) {
  return (
    <View
      testID={testID}
      className={cn(
        ui.chip,
        variant === 'header'
          ? 'bg-mdy-headerGlass'
          : variant === 'neutral'
            ? 'bg-mdy-muted'
            : variant === 'success'
              ? 'bg-mdy-successBg'
              : variant === 'warning'
                ? 'bg-mdy-warningBg'
                : variant === 'danger'
                  ? 'bg-mdy-dangerBg'
                  : variant === 'info'
                    ? 'bg-mdy-infoBg'
                    : 'bg-mdy-tint2'
      )}
    >
      <Text
        className={cn(
          ui.chipText,
          variant === 'header'
            ? 'text-mdy-onBrand'
            : variant === 'neutral'
              ? 'text-mdy-secondary'
              : variant === 'success'
                ? 'text-mdy-success'
                : variant === 'warning'
                  ? 'text-mdy-warning'
                  : variant === 'danger'
                    ? 'text-mdy-danger'
                    : variant === 'info'
                      ? 'text-mdy-info'
                      : 'text-mdy-link'
        )}
      >
        {children}
      </Text>
    </View>
  );
}
export function Sheet({
  children,
  title,
  testID,
  onClose,
  busy = false,
  returnFocusRef,
}: PropsWithChildren<{
  title: string;
  testID: string;
  onClose: () => void;
  returnFocusRef?: RefObject<View | null>;
  busy?: boolean;
}>) {
  const { variables } = useMindyTheme();
  const insets = useSafeAreaInsets();
  const titleRef = useRef<RNText>(null);
  useEffect(
    () => () => {
      const target = returnFocusRef?.current;
      if (target) {
        const tag = findNodeHandle(target);
        if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
      }
    },
    [returnFocusRef]
  );
  const dismissGesture = Gesture.Pan()
    .enabled(!busy)
    .onEnd((event) => {
      if (event.translationY > tokens.spacing['space-40']) runOnJS(onClose)();
    });
  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
      onShow={() => {
        const tag = findNodeHandle(titleRef.current);
        if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
      }}
    >
      <GestureHandlerRootView
        className={cn(ui.modal)}
        style={variables}
        accessibilityViewIsModal
      >
        <Pressable
          testID={`${testID}-scrim`}
          disabled={busy}
          accessibilityLabel={title}
          onPress={onClose}
          className={cn('bg-mdy-scrim')}
          style={StyleSheet.absoluteFill}
        />
        <View
          testID={testID}
          className={cn(ui.sheet, 'bg-mdy-sheet')}
          style={{
            paddingBottom: Math.max(insets.bottom, tokens.spacing['space-24']),
          }}
        >
          <GestureDetector gesture={dismissGesture}>
            <View
              testID={`${testID}-handle`}
              accessible={false}
              className={cn(ui.handleTouch)}
            >
              <View className={cn(ui.handle, 'bg-mdy-handle')} />
            </View>
          </GestureDetector>
          <RNText
            ref={titleRef}
            accessibilityRole="header"
            className={cn(ui.title, 'text-mdy-ink')}
          >
            {title}
          </RNText>
          {children}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
export function Toast({ text }: { text: string }) {
  const { colors } = useMindyTheme();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(text);
  }, [text]);
  return (
    <View
      pointerEvents="none"
      testID="toast"
      className={cn(ui.toast, 'bg-mdy-toast')}
      style={{ bottom: Math.max(insets.bottom, tokens.spacing['space-24']) }}
    >
      <Icon
        name="check_circle"
        size={20}
        color={colors.toastIcon}
      />
      <Text className={cn(ui.alertText, 'text-mdy-onBrand')}>{text}</Text>
    </View>
  );
}
const rowDivider = { borderBottomWidth: StyleSheet.hairlineWidth };
export function Row({
  label,
  subtitle,
  icon,
  testID,
  onPress,
  checked,
  danger = false,
  triggerRef,
  code,
  compact = false,
  chevron = true,
}: {
  code?: string;
  compact?: boolean;
  chevron?: boolean;
  triggerRef?: RefObject<View | null>;
  label: string;
  subtitle?: string;
  icon?: IconName;
  testID: string;
  onPress: () => void;
  checked?: boolean;
  danger?: boolean;
}) {
  const { colors } = useMindyTheme();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      ref={triggerRef}
      testID={testID}
      onPress={onPress}
      accessibilityRole={checked === undefined ? 'button' : 'radio'}
      accessibilityLabel={subtitle ? `${label}. ${subtitle}` : label}
      accessibilityState={checked === undefined ? undefined : { checked }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={compact ? undefined : rowDivider}
      className={cn(
        ui.row,
        checked === undefined && ui.actionRow,
        pressed
          ? 'bg-mdy-muted'
          : checked
            ? 'bg-mdy-tint'
            : 'bg-mdy-transparent',
        'border-b-mdy-divider',
        compact && 'rounded-radius-14 mx-space-0 px-space-10'
      )}
    >
      {code && (
        <View className={cn(ui.actionIcon, 'bg-mdy-tint2')}>
          <Text className="text-size-12 font-bvp-bold text-mdy-primary tracking-group">
            {code}
          </Text>
        </View>
      )}
      {icon &&
        (checked === undefined ? (
          <View
            className={cn(
              ui.actionIcon,
              danger ? 'bg-mdy-dangerSoft' : 'bg-mdy-tint2'
            )}
          >
            <Icon
              name={icon}
              size={22}
              color={danger ? colors.danger : colors.primary}
            />
          </View>
        ) : (
          <Icon
            name={icon}
            size={22}
            color={colors.secondary}
          />
        ))}
      <View className={cn(ui.flex)}>
        <Text
          className={cn(
            ui.rowLabel,
            (checked === undefined || compact) && ui.actionLabel,
            danger ? 'text-mdy-danger' : 'text-mdy-ink'
          )}
        >
          {label}
        </Text>
        {subtitle && (
          <Text className={cn(ui.caption, 'text-mdy-secondary')}>
            {subtitle}
          </Text>
        )}
      </View>
      {(checked !== undefined || chevron) && (
        <Icon
          name={
            checked === undefined
              ? 'chevron_right'
              : checked
                ? 'radio_button_checked'
                : 'radio_button_unchecked'
          }
          size={checked === undefined ? 20 : 22}
          color={
            checked === undefined
              ? colors.tertiary
              : checked
                ? colors.primary
                : colors.iconDisabled
          }
        />
      )}
    </Pressable>
  );
}
export function FocusHeading({
  children,
  testID,
  style,
  className,
}: TextProps) {
  const heading = useRef<RNText>(null);
  return (
    <RNText
      testID={testID}
      ref={heading}
      accessibilityRole="header"
      onLayout={() => {
        const tag = findNodeHandle(heading.current);
        if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
      }}
      className={cn(ui.text, ui.title, 'text-mdy-ink', className)}
      style={style}
    >
      {children}
    </RNText>
  );
}

export const secondaryText = (colors: Palette) => ({ color: colors.secondary });
