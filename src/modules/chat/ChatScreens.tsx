import { useEffect, useState, type ReactNode } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  TextInput,
  View,
} from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { ListPage } from '@/components/ui/list-page';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Icon,
  Text,
} from '@/components/ui/primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { useMindyTheme } from '@/components/ui/theme';
import type { ApiError } from '@/shared/http/apiClient';
import { useChat } from './ChatProvider';
import {
  useConversationRoom,
  useConversations,
  useNotifications,
  type PendingMessage,
} from './hooks';
import {
  formatConversationTime,
  formatDividerTime,
  formatMessageTime,
  layoutMessages,
  messageProblem,
  type MessageRow,
} from './model';
import type { ChatMessage, Conversation } from './schema';
import './messages';

const conversationTitle = (item: Conversation, fallback: string): string =>
  (item.type === 'GROUP' ? item.name : item.peer?.displayName) ?? fallback;
const errorKey = (error: ApiError) =>
  error.kind === 'denied' ||
  error.kind === 'notFound' ||
  error.kind === 'unavailable'
    ? error.kind
    : 'error';
/** Loading, failure and offline of a list; never presented as an empty list. */
function ListGate({
  prefix,
  read,
  children,
}: {
  prefix: string;
  read: {
    data?: object | boolean | undefined;
    busy: boolean;
    offline: boolean;
    error?: ApiError | undefined;
    refresh: () => Promise<object | boolean | undefined>;
  };
  children?: ReactNode;
}) {
  const { t } = useTranslation('chat');
  if (read.data !== undefined) return <>{children}</>;
  if (read.error?.kind === 'offline' || (read.offline && !read.busy))
    return (
      <Text
        testID={`${prefix}-offline`}
        className="text-size-14 text-mdy-secondary"
      >
        {t('offlineEmpty')}
      </Text>
    );
  if (read.error) {
    const key = errorKey(read.error);
    return (
      <View className="gap-space-8">
        <Alert testID={`${prefix}-${key === 'notFound' ? 'not-found' : key}`}>
          {t(key)}
        </Alert>
        {key === 'error' && (
          <Button
            testID={`${prefix}-retry`}
            onPress={() => {
              read.refresh();
            }}
          >
            {t('retry')}
          </Button>
        )}
      </View>
    );
  }
  return (
    <View
      testID={`${prefix}-skeleton`}
      className="gap-space-12"
    >
      {[0, 1, 2].map((key) => (
        <Skeleton
          key={key}
          label={t('loading')}
        >
          <View className="h-space-84 rounded-radius-18 bg-mdy-muted2" />
        </Skeleton>
      ))}
    </View>
  );
}
function ListEnd({
  prefix,
  list,
}: {
  prefix: string;
  list:
    | ReturnType<typeof useNotifications>
    | ReturnType<typeof useConversations>;
}) {
  const { t } = useTranslation('chat');
  if (list.data === undefined) return null;
  return (
    <View className="gap-space-12 pt-space-4">
      {list.hasMore && !list.offline && (
        <Button
          testID={`${prefix}-more`}
          variant={list.footerError ? 'secondary' : 'text'}
          busy={list.loadingMore}
          disabled={list.loadingMore}
          onPress={() => {
            list.more();
          }}
        >
          {t(list.footerError ? 'retry' : 'more')}
        </Button>
      )}
      {list.offline || list.error?.kind === 'offline' ? (
        <Alert
          warning
          testID={`${prefix}-stale`}
        >
          {t('stale')}
        </Alert>
      ) : (
        list.error && (
          <Alert
            warning
            testID={`${prefix}-refresh-error`}
          >
            {t('refreshFailed')}
          </Alert>
        )
      )}
    </View>
  );
}
/** Header on the page background; the rest of the app keeps a brand header. */
function FlatHeader({
  prefix,
  backLabel,
  backColor,
  navigation,
  children,
}: {
  prefix: string;
  backLabel: string;
  backColor: string;
  navigation: {
    goBack: () => void;
    addListener: (type: 'focus' | 'blur', listener: () => void) => () => void;
  };
  children: ReactNode;
}) {
  const { isDark } = useMindyTheme();
  const insets = useSafeAreaInsets();
  // Screens below stay mounted, and brand-header ones need the light status
  // bar back, so this one only applies while its screen is on top.
  const [focused, setFocused] = useState(true);
  useEffect(() => {
    const offFocus = navigation.addListener('focus', () => setFocused(true));
    const offBlur = navigation.addListener('blur', () => setFocused(false));
    return () => {
      offFocus();
      offBlur();
    };
  }, [navigation]);
  return (
    <View
      className="flex-row items-center gap-space-8 px-space-8 pb-space-8"
      style={{ paddingTop: insets.top + 8 }}
    >
      {focused && (
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      )}
      <Button
        testID={`${prefix}-back`}
        variant="text"
        size="sm"
        className="px-space-8"
        onPress={navigation.goBack}
        accessibilityLabel={backLabel}
      >
        <Icon
          name="arrow_back"
          color={backColor}
        />
      </Button>
      {children}
    </View>
  );
}
export function ChatConversationsScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'ChatConversations'>) {
  const { t, i18n } = useTranslation('chat');
  const { state } = useAuth();
  const { colors, variables } = useMindyTheme();
  const insets = useSafeAreaInsets();
  const list = useConversations('');
  const prefix = 'chat-list';
  const open = (row: Conversation) =>
    navigation.navigate('ChatConversation', {
      conversationId: row.id,
      title: conversationTitle(row, t('unnamed')),
    });
  const preview = (row: Conversation) => {
    const last = row.lastMessage;
    if (!last) return t('noPreview');
    const content = last.deletedAt ? t('deleted') : (last.body ?? t('file'));
    if (last.sender.id === state.user?.id) return `${t('you')}: ${content}`;
    return row.type === 'GROUP'
      ? `${last.sender.displayName}: ${content}`
      : content;
  };
  const people = list.items?.filter((row) => row.type === 'DIRECT') ?? [];
  return (
    <View
      testID={`${prefix}-screen`}
      className="flex-1 bg-mdy-bg"
      style={variables}
    >
      <FlatHeader
        prefix={prefix}
        backLabel={t('back')}
        backColor={colors.ink}
        navigation={navigation}
      >
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          className="flex-1 text-size-28 font-bvp-bold leading-line-42"
        >
          {t('title')}
        </Text>
      </FlatHeader>
      <FlatList
        className="flex-1"
        data={list.items ?? []}
        keyExtractor={(row) => row.id}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              list.refresh();
            }}
          />
        }
        renderItem={({ item: row }) => {
          const unread = row.unreadCount > 0;
          return (
            <Pressable
              testID={`${prefix}-row-${row.id}`}
              accessibilityRole="button"
              className="flex-row items-center gap-space-12 px-space-16 py-space-8 active:opacity-80"
              onPress={() => open(row)}
            >
              <Avatar
                name={conversationTitle(row, t('unnamed'))}
                size={60}
              />
              <View className="flex-1 gap-space-2">
                <View className="flex-row items-center gap-space-8">
                  <Text
                    numberOfLines={1}
                    className={`flex-1 text-size-17 ${
                      unread ? 'font-bvp-bold' : 'font-bvp-medium'
                    }`}
                  >
                    {conversationTitle(row, t('unnamed'))}
                  </Text>
                  <Text
                    className={`text-size-13 ${
                      unread
                        ? 'font-bvp-semibold text-mdy-ink'
                        : 'text-mdy-secondary'
                    }`}
                  >
                    {formatConversationTime(row.activityAt, i18n.language)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-space-8">
                  <Text
                    numberOfLines={1}
                    className={`flex-1 text-size-15 ${
                      unread
                        ? 'font-bvp-semibold text-mdy-ink'
                        : 'text-mdy-secondary'
                    }`}
                  >
                    {preview(row)}
                  </Text>
                  {unread && (
                    <View
                      testID={`${prefix}-unread-${row.id}`}
                      className="h-space-18 min-w-space-18 items-center justify-center rounded-radius-99 bg-mdy-primary px-space-4"
                    >
                      <Text className="text-size-11 font-bvp-bold text-mdy-onBrand">
                        {row.unreadCount > 99 ? '99+' : String(row.unreadCount)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListHeaderComponent={
          <View>
            {people.length > 0 && (
              <ScrollView
                testID={`${prefix}-people`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-space-12 px-space-16 py-space-8"
              >
                {people.map((row) => {
                  const title = conversationTitle(row, t('unnamed'));
                  return (
                    <Pressable
                      key={row.id}
                      testID={`${prefix}-person-${row.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={title}
                      className="w-[72px] items-center gap-space-4 active:opacity-80"
                      onPress={() => open(row)}
                    >
                      <Avatar
                        name={title}
                        size={60}
                      />
                      <Text
                        numberOfLines={1}
                        className="text-size-13 text-mdy-secondary"
                      >
                        {title}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            {list.items?.length ? null : (
              <View className="gap-space-12 px-space-16 py-space-12">
                <ListGate
                  prefix={prefix}
                  read={list}
                >
                  <Text testID={`${prefix}-empty`}>{t('empty')}</Text>
                </ListGate>
              </View>
            )}
          </View>
        }
        ListFooterComponent={
          <View
            className="px-space-16"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <ListEnd
              prefix={prefix}
              list={list}
            />
          </View>
        }
      />
    </View>
  );
}
/** The same width as the sender avatar plus its gap, so runs stay aligned. */
const AVATAR_GUTTER = 'ml-[36px]';
function MessageBubble({
  row,
  quoted,
  me,
  showSender,
  sent,
  onOpenFile,
}: {
  row: MessageRow;
  quoted?: ChatMessage | undefined;
  me?: string | undefined;
  showSender: boolean;
  sent: boolean;
  onOpenFile: () => void;
}) {
  const { t, i18n } = useTranslation('chat');
  const { colors } = useMindyTheme();
  const { message: item, startsRun, endsRun, showTime, showUnread } = row;
  const mine = item.sender.id === me;
  const removed = !!item.deletedAt;
  const text = mine ? 'text-mdy-onBrand' : '';
  const reply = removed ? null : item.replyTo;
  const replyLabel = reply
    ? mine
      ? t('youReplied', { to: reply.senderDisplayName })
      : quoted?.sender.id === me
        ? t('repliedToYou', { name: item.sender.displayName })
        : t('replied', {
            name: item.sender.displayName,
            to: reply.senderDisplayName,
          })
    : undefined;
  const replyText = reply?.deleted
    ? t('deleted')
    : quoted && (quoted.body ?? t('file'));
  const corners = mine
    ? `${startsRun ? '' : 'rounded-tr-radius-4'} ${endsRun ? '' : 'rounded-br-radius-4'}`
    : `${startsRun ? '' : 'rounded-tl-radius-4'} ${endsRun ? '' : 'rounded-bl-radius-4'}`;
  return (
    <View
      testID={`chat-message-${item.id}`}
      className={startsRun ? 'mt-space-12' : 'mt-space-2'}
    >
      {showTime && (
        <Text className="pb-space-12 text-center text-size-12 text-mdy-secondary">
          {formatDividerTime(item.createdAt, i18n.language)}
        </Text>
      )}
      {showUnread && (
        <View
          testID="chat-room-unread"
          className="flex-row items-center gap-space-12 px-space-8 pb-space-12 pt-space-4"
        >
          <View className="h-px flex-1 bg-mdy-divider" />
          <Text className="text-size-12 text-mdy-secondary">
            {t('unreadDivider')}
          </Text>
          <View className="h-px flex-1 bg-mdy-divider" />
        </View>
      )}
      {showSender && !mine && startsRun && !reply && (
        <Text
          className={`${AVATAR_GUTTER} pb-space-2 pl-space-12 text-size-12 text-mdy-secondary`}
        >
          {item.sender.displayName}
        </Text>
      )}
      {!!replyLabel && (
        <Text
          className={`pb-space-2 text-size-12 text-mdy-secondary ${
            mine ? 'pr-space-12 text-right' : `${AVATAR_GUTTER} pl-space-12`
          }`}
        >
          {replyLabel}
        </Text>
      )}
      {!!replyText && (
        <View className={mine ? 'items-end' : `items-start ${AVATAR_GUTTER}`}>
          <View className="-mb-space-8 max-w-[75%] rounded-radius-18 bg-mdy-muted px-space-14 pb-space-14 pt-space-8">
            <Text
              numberOfLines={2}
              className="text-size-13 text-mdy-secondary"
            >
              {replyText}
            </Text>
          </View>
        </View>
      )}
      <View
        className={`flex-row items-end gap-space-8 ${
          mine ? 'justify-end' : 'justify-start'
        }`}
      >
        {!mine &&
          (endsRun ? (
            <Avatar
              name={item.sender.displayName}
              size={28}
            />
          ) : (
            <View className="w-[28px]" />
          ))}
        <View
          className={`max-w-[75%] gap-space-4 rounded-radius-18 px-space-14 py-space-8 ${corners} ${
            mine ? 'bg-mdy-primary' : 'bg-mdy-muted2'
          }`}
        >
          {!removed && item.file && (
            <Pressable
              testID={`chat-message-${item.id}-file`}
              accessibilityRole="button"
              onPress={onOpenFile}
              className="min-h-space-44 flex-row items-center gap-space-8 active:opacity-80"
            >
              <Icon
                name="attach_file"
                size={18}
                {...(mine ? { color: colors.onBrand } : {})}
              />
              <Text className={`shrink text-size-13 underline ${text}`}>
                {item.file.originalFilename}
              </Text>
            </Pressable>
          )}
          {removed ? (
            <Text
              className={`text-size-15 italic ${
                mine ? 'text-mdy-onBrandMuted' : 'text-mdy-secondary'
              }`}
            >
              {t('deleted')}
            </Text>
          ) : (
            !!item.body && (
              <Text
                selectable
                className={`text-size-15 ${text}`}
              >
                {item.body}
              </Text>
            )
          )}
        </View>
      </View>
      {((item.editedAt && !removed) || sent) && (
        <Text
          className={`pt-space-2 text-size-11 text-mdy-secondary ${
            mine ? 'pr-space-12 text-right' : `${AVATAR_GUTTER} pl-space-12`
          }`}
        >
          {[
            ...(item.editedAt && !removed ? [t('edited')] : []),
            ...(sent ? [t('sent')] : []),
          ].join(' · ')}
        </Text>
      )}
    </View>
  );
}
function PendingBubble({
  item,
  onResend,
}: {
  item: PendingMessage;
  onResend: () => void;
}) {
  const { t } = useTranslation('chat');
  const { failure } = item;
  return (
    <Pressable
      testID={`chat-pending-${item.clientMessageId}`}
      disabled={!failure}
      accessibilityRole={failure ? 'button' : 'text'}
      onPress={onResend}
      className="mt-space-2 items-end"
    >
      <View className="max-w-[75%] rounded-radius-18 bg-mdy-primary px-space-14 py-space-8 opacity-70">
        <Text className="text-size-15 text-mdy-onBrand">{item.body}</Text>
      </View>
      {failure ? (
        <Text
          testID={`chat-pending-${item.clientMessageId}-error`}
          className="pr-space-12 pt-space-2 text-size-12 text-mdy-danger"
        >
          {t(failure.kind === 'rateLimited' ? 'rateLimited' : 'sendFailed')}
        </Text>
      ) : (
        <Text className="pr-space-12 pt-space-2 text-size-11 text-mdy-secondary">
          {t('sending')}
        </Text>
      )}
    </Pressable>
  );
}
/** Grows with the keyboard so the composer stays right on top of it. */
function KeyboardSpacer() {
  const insets = useSafeAreaInsets();
  const { height } = useReanimatedKeyboardAnimation();
  const style = useAnimatedStyle(() => ({
    // The composer already keeps clear of the bottom inset.
    height: Math.max(-height.value - insets.bottom, 0),
  }));
  return <Animated.View style={style} />;
}
function Composer({ onSend }: { onSend: (body: string) => void }) {
  const { t } = useTranslation('chat');
  const { colors } = useMindyTheme();
  const insets = useSafeAreaInsets();
  const [body, setBody] = useState('');
  const problem = messageProblem(body);
  return (
    <View
      className="gap-space-4 bg-mdy-bg px-space-12 pt-space-8"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      {problem === 'tooLong' && (
        <Text
          testID="chat-composer-too-long"
          className="text-size-12 text-mdy-danger"
        >
          {t('tooLong')}
        </Text>
      )}
      <View className="flex-row items-end gap-space-8">
        <TextInput
          testID="chat-composer-input"
          multiline
          value={body}
          onChangeText={setBody}
          placeholder="Aa"
          placeholderTextColor={colors.tertiary}
          accessibilityLabel={t('placeholder')}
          className="max-h-[120px] min-h-space-44 flex-1 rounded-radius-22 bg-mdy-muted2 px-space-16 py-space-10 text-size-15 text-mdy-ink"
        />
        <Pressable
          testID="chat-composer-send"
          accessibilityRole="button"
          accessibilityLabel={t('send')}
          accessibilityState={{ disabled: !!problem }}
          disabled={!!problem}
          onPress={() => {
            onSend(body);
            setBody('');
          }}
          className="h-space-44 w-space-44 items-center justify-center rounded-radius-22 active:opacity-80"
        >
          <Icon
            name="send"
            size={24}
            color={problem ? colors.tertiary : colors.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}
export function ChatConversationScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'ChatConversation'>) {
  const { t } = useTranslation('chat');
  const { state, notify } = useAuth();
  const { service } = useChat();
  const { colors, variables } = useMindyTheme();
  const { conversationId } = route.params;
  const me = state.user?.id;
  const room = useConversationRoom(conversationId);
  const { header, history } = room;
  const title = header.data
    ? conversationTitle(header.data, t('unnamed'))
    : (route.params.title ?? t('title'));
  const ready = history.data !== undefined && header.data !== undefined;
  const [opening, setOpening] = useState<{
    lastRead: string;
    highWatermark: string;
  }>();
  if (header.data && !opening)
    setOpening({
      lastRead: header.data.lastReadSequence,
      highWatermark: header.data.highWatermark,
    });
  type Row =
    | { key: string; row: MessageRow }
    | { key: string; pending: PendingMessage };
  // The list is inverted so it opens at the newest message.
  const rows: Row[] = ready
    ? [
        ...[...room.pending]
          .reverse()
          .map((pending) => ({ key: pending.clientMessageId, pending })),
        ...layoutMessages(room.messages, me, opening)
          .reverse()
          .map((row) => ({ key: row.message.id, row })),
      ]
    : [];
  const newest = room.messages.at(-1);
  const openFile = async (message: ChatMessage) => {
    try {
      await Linking.openURL(await service.fileUrl(conversationId, message.id));
    } catch {
      notify(t('fileFailed'));
    }
  };
  return (
    <View
      testID="chat-room-screen"
      className="flex-1 bg-mdy-bg"
      style={variables}
    >
      <FlatHeader
        prefix="chat-room"
        backLabel={t('back')}
        backColor={colors.primary}
        navigation={navigation}
      >
        <Avatar
          name={title}
          size={40}
        />
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          className="flex-1 text-size-17 font-bvp-semibold"
        >
          {title}
        </Text>
      </FlatHeader>
      <FlatList<Row>
        className="flex-1"
        inverted={ready}
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerClassName="px-space-12 py-space-8"
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) =>
          'row' in item ? (
            <MessageBubble
              row={item.row}
              quoted={room.messages.find(
                (m) => m.id === item.row.message.replyTo?.id
              )}
              me={me}
              showSender={header.data?.type === 'GROUP'}
              sent={
                item.row.message.id === newest?.id &&
                newest.sender.id === me &&
                !room.pending.length
              }
              onOpenFile={() => {
                openFile(item.row.message);
              }}
            />
          ) : (
            <PendingBubble
              item={item.pending}
              onResend={() => {
                room.resend(item.pending);
              }}
            />
          )
        }
        ListEmptyComponent={
          <View className="p-space-8">
            <ListGate
              prefix="chat-room"
              read={header.data ? history : header}
            >
              {ready && (
                <Text
                  testID="chat-room-empty"
                  className="text-center text-mdy-secondary"
                >
                  {t('noMessages')}
                </Text>
              )}
            </ListGate>
          </View>
        }
        // Inverted: the footer is drawn above the oldest loaded message.
        ListFooterComponent={
          ready && room.hasOlder ? (
            <Button
              testID="chat-room-older"
              variant={room.olderError ? 'secondary' : 'text'}
              size="sm"
              busy={room.loadingOlder}
              disabled={room.loadingOlder}
              onPress={() => {
                room.loadOlder();
              }}
            >
              {t(room.olderError ? 'retry' : 'older')}
            </Button>
          ) : null
        }
        ListHeaderComponent={
          ready && (history.offline || history.error) ? (
            <Alert
              warning
              testID={
                history.offline || history.error?.kind === 'offline'
                  ? 'chat-room-stale'
                  : 'chat-room-refresh-error'
              }
            >
              {t(
                history.offline || history.error?.kind === 'offline'
                  ? 'stale'
                  : 'refreshFailed'
              )}
            </Alert>
          ) : null
        }
      />
      {ready &&
        (header.data?.capabilities.canSend ? (
          <Composer onSend={room.send} />
        ) : (
          <View className="bg-mdy-bg p-space-16">
            <Text
              testID="chat-room-read-only"
              className="text-center text-size-13 text-mdy-secondary"
            >
              {t('readOnly')}
            </Text>
          </View>
        ))}
      <KeyboardSpacer />
    </View>
  );
}
export function ChatNotificationsScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'ChatNotifications'>) {
  const { t } = useTranslation('chat');
  const { notify } = useAuth();
  const { service } = useChat();
  const { colors } = useMindyTheme();
  const list = useNotifications();
  const [marking, setMarking] = useState(false);
  const prefix = 'chat-notifications';
  const hasUnread = list.items?.some((n) => !n.readAt);
  return (
    <ListPage
      prefix={prefix}
      title={t('notifications')}
      backLabel={t('back')}
      onBack={navigation.goBack}
      refresh={list.refresh}
      rows={list.items}
      rowKey={(row) => row.id}
      renderRow={(row) => (
        <Pressable
          testID={`${prefix}-row-${row.id}`}
          accessibilityRole="button"
          accessibilityLabel={[
            row.title,
            row.body,
            ...(row.readAt ? [] : [t('unread')]),
          ].join(', ')}
          className="active:opacity-80"
          onPress={() => {
            // Opening is what matters; the read mark must never block it.
            if (!row.readAt) service.readNotification(row.id).catch(() => {});
            navigation.navigate('ChatConversation', {
              conversationId: row.conversationId,
            });
          }}
        >
          <Card className="mx-space-0 flex-row items-center gap-space-12 p-space-14">
            <Icon
              name="chat"
              size={22}
              {...(row.readAt ? {} : { color: colors.primary })}
            />
            <View className="flex-1 gap-space-2">
              <Text
                className={
                  row.readAt ? 'text-size-14' : 'text-size-14 font-bvp-semibold'
                }
              >
                {row.title}
              </Text>
              <Text className="text-size-13 text-mdy-secondary">
                {row.body}
              </Text>
              <Text className="text-size-11 text-mdy-secondary">
                {formatMessageTime(row.createdAt)}
              </Text>
            </View>
            {!row.readAt && (
              <View
                testID={`${prefix}-unread-${row.id}`}
                className="h-space-8 w-space-8 rounded-radius-99 bg-mdy-dangerButton"
              />
            )}
          </Card>
        </Pressable>
      )}
      header={
        <View className="gap-space-12 pb-space-12">
          <ListGate
            prefix={prefix}
            read={list}
          >
            {hasUnread && (
              <Button
                testID={`${prefix}-read-all`}
                variant="text"
                size="sm"
                busy={marking}
                disabled={marking}
                onPress={async () => {
                  setMarking(true);
                  try {
                    await service.readAllNotifications();
                    await list.refresh();
                  } catch {
                    notify(t('error'));
                  } finally {
                    setMarking(false);
                  }
                }}
              >
                {t('readAll')}
              </Button>
            )}
            {list.items?.length === 0 && (
              <Text testID={`${prefix}-empty`}>{t('notificationsEmpty')}</Text>
            )}
          </ListGate>
        </View>
      }
      footer={
        <ListEnd
          prefix={prefix}
          list={list}
        />
      }
    />
  );
}
