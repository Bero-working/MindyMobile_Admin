import { HomeTile } from '@/modules/auth/components/HomeTile';
import { useLeaveQuery } from '../hooks';
import { useWords } from './shared';

export function LeavePendingBadge({ onPress }: { onPress: () => void }) {
  const w = useWords();
  const query = useLeaveQuery({
    kind: 'list',
    role: 'MANAGER',
    status: 'PENDING',
    pageSize: 1,
  });
  const count =
    !query.offline && query.result?.kind === 'success'
      ? query.data?.total
      : undefined;
  return (
    <HomeTile
      testID="workspace-open-leave-review"
      label={w('leave.tile')}
      accessibilityLabel={
        count ? w('leave.tilePending', { count }) : w('leave.tile')
      }
      icon="event_note"
      badge={count}
      onPress={onPress}
    />
  );
}
