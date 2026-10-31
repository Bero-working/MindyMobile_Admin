import { cn } from '@/utils/cn';
import { FlatList, Pressable, View } from 'react-native';
import { Button, Sheet, Text } from '@/components/ui/primitives';
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver';
import {
  loginErrors,
  type MockLogoutOutcome,
  type ReviewScenario,
} from '../services/mockAuthService';
const scenarios: ReviewScenario[] = [
  'signedOut',
  'MENTOR',
  'MANAGER',
  'accessDenied',
  'sessionExpired',
  'accountInactive',
  'offline',
  'timeout',
  'server',
  'invalidResponse',
  'config',
  ...loginErrors.map((code) => `login-${code}` as const),
];
const scenarioKey = (value: ReviewScenario) => value;
export default function ReviewPanel({
  onSelect,
  setLogoutOutcome,
  onClose,
  outcome,
}: {
  onSelect: (value: ReviewScenario) => void;
  setLogoutOutcome: (value: MockLogoutOutcome) => void;
  onClose: () => void;
  outcome: MockLogoutOutcome;
}) {
  const { observedKeys, onViewableItemsChanged, viewabilityConfig } =
    useIntersectionObserver(scenarios, scenarioKey);
  return (
    <Sheet
      title="UI MOCK — kịch bản kiểm tra"
      testID="mock-review-sheet"
      onClose={onClose}
    >
      <Text>
        {
          'Chỉ dữ liệu giả. Không kết nối máy chủ. Mật khẩu bất kỳ; email mentor@mindy.vn hoặc manager@mindy.vn. Chưa đăng nhập là trạng thái phiên, không phải vai trò.'
        }
      </Text>
      <FlatList
        testID="mock-scenarios"
        className={cn(local.scenarios)}
        data={scenarios}
        keyExtractor={scenarioKey}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={false}
        extraData={observedKeys}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={({ item: value }) => (
          <View
            collapsable={false}
            className="min-h-space-52 mb-space-8"
          >
            {observedKeys.has(value) && (
              <Button
                testID={`mock-scenario-${value}`}
                variant="secondary"
                onPress={() => {
                  onSelect(value);
                  onClose();
                }}
              >
                {value === 'signedOut'
                  ? 'Chưa đăng nhập'
                  : value === 'accessDenied'
                    ? 'Phiên không hợp lệ'
                    : value}
              </Button>
            )}
          </View>
        )}
      />
      <Text>{`Logout mock: ${outcome}`}</Text>
      <View className={cn(local.outcomes)}>
        {(['ok', 'expired', 'offline', 'timeout', 'server'] as const).map(
          (value) => (
            <Pressable
              key={value}
              testID={`mock-logout-${value}`}
              accessibilityRole="button"
              onPress={() => {
                setLogoutOutcome(value);
              }}
              className={cn(
                local.outcome,
                outcome === value ? 'bg-mdy-tint2' : 'bg-mdy-muted'
              )}
            >
              <Text>{value}</Text>
            </Pressable>
          )
        )}
      </View>
      <Button onPress={onClose}>{String('Đóng')}</Button>
    </Sheet>
  );
}
const local = {
  outcome: 'rounded-radius-12 justify-center min-h-space-44 px-space-12',
  outcomes: 'flex-row flex-wrap gap-space-8',
  scenarios: 'h-space-280',
};
