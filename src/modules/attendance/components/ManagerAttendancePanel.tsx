import { useTranslation } from 'react-i18next';
import { Alert, Card, Text } from '@/components/ui/primitives';
import { useAttendanceQuery } from '../hooks';
import { AttendanceRowView, More, QueryBlock } from './shared';
import { useVisited } from './EntryPoints';

export function ManagerAttendancePanel({
  sessionId,
  active,
}: {
  sessionId: string;
  active: boolean;
}) {
  const { t } = useTranslation('attendance');
  const summary = useAttendanceQuery({
    kind: 'attendance',
    role: 'MANAGER',
    sessionId,
    pageSize: 1,
  });
  const session = summary.data?.session,
    visited = useVisited(active);
  const list = useAttendanceQuery(
    {
      kind: session?.status === 'SCHEDULED' ? 'candidates' : 'attendance',
      role: 'MANAGER',
      sessionId,
      pageSize: 20,
    },
    visited &&
      !!session &&
      !(session.status === 'CANCELLED' && !session.actualStartedAt)
  );
  if (active && session?.status === 'CANCELLED' && !session.actualStartedAt)
    return <Text testID="manager-att-empty">{t('cancelledEmpty')}</Text>;
  if (active)
    return (
      <QueryBlock
        query={summary}
        prefix="manager-att"
      >
        <QueryBlock
          query={list}
          prefix="manager-att"
        >
          {session?.status === 'SCHEDULED' && (
            <Alert
              testID="manager-att-provisional"
              warning
            >
              {t('editor.provisional')}
            </Alert>
          )}
          {!!list.data?.totals?.pendingPaymentCount && (
            <Text>
              {t('editor.pending', {
                count: list.data.totals.pendingPaymentCount,
              })}
            </Text>
          )}
          <Text className="text-size-12 font-bvp-semibold">
            {t(
              session?.status === 'SCHEDULED'
                ? 'editor.expected'
                : 'editor.students',
              { count: list.data?.total ?? 0 }
            )}
          </Text>
          <Card className="mx-space-0 p-space-6 gap-space-0">
            {list.data?.rows.map((row) => (
              <AttendanceRowView
                key={row.id}
                row={row}
                prefix="manager-att"
                provisional={session?.status === 'SCHEDULED'}
                hideUnmarked
              />
            ))}
            {list.data?.total === 0 && (
              <Text testID="manager-att-empty">
                {t(
                  session?.status === 'SCHEDULED'
                    ? 'editor.previewEmpty'
                    : 'correction.empty'
                )}
              </Text>
            )}
          </Card>
          <More
            query={list}
            count={list.data?.rows.length ?? 0}
            prefix="manager-att"
          />
        </QueryBlock>
      </QueryBlock>
    );
  return (
    <QueryBlock
      query={summary}
      prefix="manager-att"
    />
  );
}
