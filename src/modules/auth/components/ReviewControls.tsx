import { cn } from '@/utils/cn';
import { lazy, Suspense, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@/components/ui/primitives';
import { DeferredBoundary } from '@/components/loading/DeferredBoundary';
import type {
  MockLogoutOutcome,
  ReviewScenario,
} from '../services/mockAuthService';
const loadPanel = () => import('./ReviewPanel');
export function ReviewControls({
  onSelect,
  setLogoutOutcome,
}: {
  onSelect: (value: ReviewScenario) => void;
  setLogoutOutcome: (value: MockLogoutOutcome) => void;
}) {
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<MockLogoutOutcome>('ok');
  const Panel = useMemo(() => lazy(loadPanel), [attempt]);
  const insets = useSafeAreaInsets();
  return (
    <>
      <Pressable
        testID="mock-review-button"
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="UI MOCK — mở kịch bản kiểm tra"
        className={cn(local.badge, 'bg-mdy-warningBg')}
        style={{ top: insets.top + 4 }}
      >
        <Text className={cn(local.label, 'text-mdy-warning')}>
          {'UI MOCK · P0'}
        </Text>
      </Pressable>
      {open && (
        <DeferredBoundary
          key={attempt}
          onRetry={() => setAttempt((value) => value + 1)}
          onClose={() => setOpen(false)}
        >
          <Suspense
            fallback={
              <View className="absolute inset-0 bg-mdy-bg justify-center">
                <ActivityIndicator
                  testID="review-loading"
                  accessibilityLabel="Đang tải"
                />
                <Button onPress={() => setOpen(false)}>{String('Đóng')}</Button>
              </View>
            }
          >
            <Panel
              onSelect={onSelect}
              outcome={outcome}
              setLogoutOutcome={(value) => {
                setOutcome(value);
                setLogoutOutcome(value);
              }}
              onClose={() => setOpen(false)}
            />
          </Suspense>
        </DeferredBoundary>
      )}
    </>
  );
}
const local = {
  badge:
    'rounded-radius-12 justify-center min-h-space-44 px-space-10 absolute right-space-8',
  label: 'font-bvp-semibold text-size-11',
};
