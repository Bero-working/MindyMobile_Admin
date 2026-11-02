import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { Button, Icon, Text } from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { useChat } from './ChatProvider';
import { useUnreadCount } from './hooks';
import './messages';

/** Floating chat entry at the bottom-right corner of the mentor home screen. */
export function ChatBubble() {
  const { t } = useTranslation('chat');
  const { colors } = useMindyTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<AuthStackParams>>();
  const unread = useUnreadCount();
  return (
    <Pressable
      testID="workspace-open-chat"
      accessibilityRole="button"
      accessibilityLabel={
        unread ? t('bubbleUnread', { count: unread }) : t('bubble')
      }
      onPress={() => navigation.navigate('ChatConversations')}
      className="absolute right-space-16 h-space-56 w-space-56 items-center justify-center rounded-radius-28 bg-mdy-primary active:opacity-80"
      style={{
        bottom: insets.bottom + 16,
        boxShadow: `0px 4px 12px ${colors.tileShadow}`,
      }}
    >
      <Icon
        name="chat"
        size={26}
        color={colors.onBrand}
      />
      {!!unread && (
        <View
          testID="workspace-open-chat-badge"
          className="absolute -right-space-2 -top-space-2 h-space-18 min-w-space-18 items-center justify-center rounded-radius-99 bg-mdy-dangerButton px-space-4"
        >
          <Text className="text-size-11 font-bvp-bold text-mdy-onBrand">
            {unread > 99 ? '99+' : String(unread)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
/** Opens the direct conversation with a student, creating it when needed. */
export function MessageStudentButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName?: string | undefined;
}) {
  const { t } = useTranslation('chat');
  const { notify } = useAuth();
  const { service } = useChat();
  const navigation = useNavigation<NavigationProp<AuthStackParams>>();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      testID="student-report-message"
      variant="secondary"
      size="sm"
      icon="chat"
      busy={busy}
      disabled={busy}
      onPress={async () => {
        setBusy(true);
        try {
          const conversation = await service.ensureDirect(studentId);
          navigation.navigate('ChatConversation', {
            conversationId: conversation.id,
            ...(studentName ? { title: studentName } : {}),
          });
        } catch {
          notify(t('openFailed'));
        } finally {
          setBusy(false);
        }
      }}
    >
      {t('message')}
    </Button>
  );
}
