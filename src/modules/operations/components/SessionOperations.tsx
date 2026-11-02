import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { Button, Card, Text } from '@/components/ui/primitives';
import type { TeachingSession } from '@/modules/teaching/types';
import { useOperations } from '../provider';
import { sessionActions } from '../model';
export function SessionOperations({
  session,
  offline = false,
}: {
  session: TeachingSession;
  offline?: boolean;
}) {
  const { t } = useTranslation('operations');
  const { source } = useOperations();
  const { state } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParams>>();
  if (state.user?.role !== 'MANAGER' || !source) return null;
  const actions = sessionActions(
    session.status,
    session.startsAt,
    session.asOf ?? ''
  );
  return (
    <>
      {session.makeupForSessionId && (
        <Button
          testID="session-makeup-source"
          variant="text"
          onPress={() =>
            navigation.push('SessionContext', {
              sessionId: session.makeupForSessionId!,
            })
          }
        >
          {t('makeupSource')}
        </Button>
      )}
      {actions.length > 0 && (
        <Card
          testID="session-ops-group"
          className="gap-space-10"
        >
          <Text className="font-bvp-semibold">{t('group')}</Text>
          {actions.map((action) => (
            <Button
              key={action}
              testID={`session-ops-${action}`}
              variant={action === 'cancel' ? 'danger' : 'secondary'}
              disabled={offline || !session.asOf}
              onPress={() =>
                navigation.navigate(
                  action === 'assign'
                    ? 'SubstituteAssignment'
                    : action === 'reschedule'
                      ? 'RescheduleSession'
                      : 'ReplacementSession',
                  { sessionId: session.id }
                )
              }
            >
              {t(
                action === 'assign' && session.assignment === 'SUBSTITUTE'
                  ? 'changeSubstitute'
                  : action
              )}
            </Button>
          ))}
          {offline && <Text>{t('needOnline')}</Text>}
        </Card>
      )}
    </>
  );
}
