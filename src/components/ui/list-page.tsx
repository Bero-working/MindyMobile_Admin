import type { ReactElement, ReactNode } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandHeader, Button, Icon, Text } from './primitives';
import { useMindyTheme } from './theme';

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: 12, paddingHorizontal: 16, paddingVertical: 28 },
});
/** Subpage header with direct back, used by read-only list screens. */
export function SubpageHeader({
  prefix,
  title,
  subtitle,
  backLabel,
  onBack,
  children,
}: {
  prefix: string;
  title: string;
  subtitle?: string | undefined;
  backLabel: string;
  onBack: () => void;
  children?: ReactNode;
}) {
  const { colors } = useMindyTheme();
  return (
    <BrandHeader subpage>
      <View className="gap-space-12">
        <View className="flex-row items-center gap-space-12">
          <Button
            testID={`${prefix}-back`}
            variant="text"
            size="sm"
            className="px-space-8"
            onPress={onBack}
            accessibilityLabel={backLabel}
          >
            <Icon
              name="arrow_back"
              color={colors.onBrand}
            />
          </Button>
          <View className="flex-1">
            <Text
              accessibilityRole="header"
              className="text-size-18 font-bvp-semibold text-mdy-onBrand"
            >
              {title}
            </Text>
            {!!subtitle && (
              <Text className="text-size-13 text-mdy-onBrandMuted">
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {children}
      </View>
    </BrandHeader>
  );
}
export function ListPage<T>({
  prefix,
  title,
  subtitle,
  backLabel,
  onBack,
  headerExtra,
  header,
  rows = [],
  rowKey,
  renderRow,
  footer,
  refresh,
  contentContainerStyle,
}: {
  prefix: string;
  title: string;
  subtitle?: string | undefined;
  backLabel: string;
  onBack: () => void;
  headerExtra?: ReactNode;
  header?: ReactElement | null;
  rows?: readonly T[] | undefined;
  rowKey: (row: T) => string;
  renderRow: (row: T, index: number) => ReactElement;
  footer?: ReactElement | null;
  refresh?: (() => void) | undefined;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const { variables } = useMindyTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      testID={`${prefix}-screen`}
      className="flex-1 bg-mdy-bg"
      style={variables}
    >
      <SubpageHeader
        prefix={prefix}
        title={title}
        subtitle={subtitle}
        backLabel={backLabel}
        onBack={onBack}
      >
        {headerExtra}
      </SubpageHeader>
      <FlatList
        className="flex-1 -mt-space-28 rounded-tl-radius-28 rounded-tr-radius-28 bg-mdy-bg"
        data={rows}
        keyExtractor={rowKey}
        renderItem={({ item, index }) => renderRow(item, index)}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        {...(refresh
          ? {
              refreshControl: (
                <RefreshControl
                  refreshing={false}
                  onRefresh={() => {
                    refresh();
                  }}
                />
              ),
            }
          : {})}
      />
    </View>
  );
}
