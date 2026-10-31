import {
  useEffect,
  useRef,
  type PropsWithChildren,
  type RefObject,
} from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from './icon';
import { Text } from './text';
import { useMindyTheme } from './theme';
import tokens from './tokens.json';
import { useReducedMotion } from 'react-native-reanimated';

const styles = StyleSheet.create({
  card: { boxShadow: '0px 16px 48px rgba(20,24,24,.18)' },
  scroll: { flexGrow: 0 },
});

export function ConfirmationDialog({
  children,
  title,
  icon = 'logout',
  testID,
  onClose,
  busy = false,
  returnFocusRef,
}: PropsWithChildren<{
  title: string;
  icon?: IconName;
  testID: string;
  onClose: () => void;
  busy?: boolean;
  returnFocusRef?: RefObject<View | null>;
}>) {
  const { colors, variables } = useMindyTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const heading = useRef<RNText>(null);
  const reduced = useReducedMotion();
  const close = () => {
    if (!busy) onClose();
  };
  useEffect(
    () => () => {
      const tag =
        returnFocusRef?.current && findNodeHandle(returnFocusRef.current);
      if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
    },
    [returnFocusRef]
  );
  return (
    <Modal
      transparent
      visible
      animationType={reduced ? 'none' : 'fade'}
      onRequestClose={close}
      onShow={() => {
        const tag = findNodeHandle(heading.current);
        if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
      }}
    >
      <View
        className="flex-1 items-center justify-center px-space-24"
        style={[
          variables,
          {
            paddingTop: insets.top + tokens.spacing['space-24'],
            paddingBottom: insets.bottom + tokens.spacing['space-24'],
          },
        ]}
        accessibilityViewIsModal
        onAccessibilityEscape={close}
      >
        <Pressable
          testID={`${testID}-scrim`}
          accessible={false}
          disabled={busy}
          onPress={close}
          className="bg-mdy-scrim"
          style={StyleSheet.absoluteFill}
        />
        <View
          testID={testID}
          className="w-full max-w-[360px] rounded-radius-28 bg-mdy-surface overflow-hidden"
          style={[
            styles.card,
            {
              maxHeight: Math.max(
                tokens.spacing['space-120'],
                height - insets.top - insets.bottom - tokens.spacing['space-48']
              ),
            },
          ]}
        >
          <ScrollView
            bounces={false}
            style={styles.scroll}
            contentContainerClassName="p-space-20 gap-space-16"
          >
            <View className="self-center h-space-56 w-space-56 rounded-radius-28 bg-mdy-dangerSoft items-center justify-center">
              <Icon
                name={icon}
                size={26}
                color={colors.danger}
              />
            </View>
            <Text
              ref={heading}
              accessibilityRole="header"
              className="text-size-18 font-bvp-semibold text-center"
            >
              {title}
            </Text>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
