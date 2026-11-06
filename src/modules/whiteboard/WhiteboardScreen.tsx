import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import {
  useIsFocused,
  usePreventRemove,
  type NavigationAction,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import {
  Alert,
  Button,
  Card,
  Chip,
  Icon,
  Text,
} from '@/components/ui/primitives';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useMindyTheme } from '@/components/ui/theme';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { ApiError } from '@/shared/http/apiClient';
import { env } from '@/config/env';
import { newIntentKey } from '@/modules/attendance/services/intentKey';
import { BoardCanvas, RenderShape, type Tool, type Viewport } from './Canvas';
import { ToolIcon } from './ToolIcon';
import {
  BoardConnection,
  boardSocket,
  type ConnectionState,
} from './connection';
import { moveShape, putShape } from './document';
import { useWhiteboardService } from './WhiteboardProvider';
import type { Board, BoardContext, Snapshot } from './schema';
import type { z } from 'zod';
import type { previewSchema } from './schema';
import './messages';

const TOOLS: Tool[] = [
  'pen',
  'hand',
  'select',
  'sticky',
  'rectangle',
  'ellipse',
  'text',
  'eraser',
];
const COLORS = [
  '#1D3831',
  '#168579',
  '#4475CB',
  '#C45772',
  '#FFD978',
  '#C5B8F0',
];
type Command = {
  kind: 'create' | 'mode' | 'snapshot' | 'reset' | 'restore';
  key: string;
  board?: Board;
  mode?: Board['mode'];
  snapshotId?: string;
};

export function WhiteboardScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'SessionWhiteboard'>) {
  const { sessionId } = route.params;
  const { t } = useTranslation('whiteboard');
  const { colors } = useMindyTheme();
  const insets = useSafeAreaInsets();
  const { notify } = useAuth();
  const api = useWhiteboardService();
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(
    AppState.currentState === 'active'
  );
  const [context, setContext] = useState<BoardContext>();
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<string>();
  const [live, setLive] = useState<ConnectionState>({
    status: 'connecting',
    shapes: [],
    people: [],
  });
  const connection = useRef<BoardConnection | undefined>(undefined);
  const mounted = useRef(true);
  const loadSequence = useRef(0);
  const command = useRef<Command | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [commandProblem, setCommandProblem] = useState<string>();
  const [options, setOptions] = useState(false);
  const [history, setHistory] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [confirm, setConfirm] = useState<'reset' | Snapshot>();
  const confirmBoard = useRef<Board | undefined>(undefined);
  const [preview, setPreview] = useState<z.infer<typeof previewSchema>>();
  const [previewError, setPreviewError] = useState(false);
  const [previewRetry, setPreviewRetry] = useState(0);
  const [leaveAction, setLeaveAction] = useState<NavigationAction>();
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(COLORS[0]!);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const size = useRef({ width: 320, height: 480 });
  const [canvasSize, setCanvasSize] = useState({ width: 320, height: 480 });
  const presentedView = useRef({ viewport, canvasSize });
  useEffect(() => {
    presentedView.current = { viewport, canvasSize };
  }, [viewport, canvasSize]);
  const [note, setNote] = useState<{
    x: number;
    y: number;
    type: 'sticky' | 'text';
  }>();
  const [text, setText] = useState('');
  const board = live.sync?.board ?? context?.board;
  const capabilities = live.sync?.capabilities ?? context?.capabilities;
  const ready = live.status === 'ready';
  // The student's screen fits these world bounds to its own aspect ratio.
  useEffect(() => {
    if (
      !focused ||
      !foreground ||
      !capabilities?.canControl ||
      !['ready', 'saving'].includes(live.status)
    )
      return;
    let previous = '';
    const timer = setInterval(() => {
      const current = presentedView.current;
      const signature = JSON.stringify(current);
      if (signature === previous) return;
      previous = signature;
      connection.current?.present({
        x: current.viewport.x,
        y: current.viewport.y,
        width: current.canvasSize.width / current.viewport.zoom,
        height: current.canvasSize.height / current.viewport.zoom,
      });
    }, 150);
    return () => clearInterval(timer);
  }, [
    focused,
    foreground,
    capabilities?.canControl,
    live.status,
    board?.epoch,
  ]);
  const editable = ready && !busy && !commandProblem && !!capabilities?.canEdit;
  const pending =
    live.status === 'saving' ||
    (live.status === 'offline' && connection.current?.hasPending === true);
  usePreventRemove(pending, ({ data }) => setLeaveAction(data.action));

  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', (state) =>
      setForeground(state === 'active')
    );
    return () => {
      mounted.current = false;
      loadSequence.current++;
      subscription.remove();
    };
  }, []);
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setProblem(undefined);
    try {
      const value = await api.context(sessionId);
      if (mounted.current && sequence === loadSequence.current)
        setContext(value);
    } catch (e) {
      if (mounted.current && sequence === loadSequence.current) {
        if (e instanceof ApiError && e.kind === 'denied') {
          setContext(undefined);
          setLive({ status: 'revoked', shapes: [], people: [] });
        }
        setProblem(
          e instanceof ApiError && e.code === 'BOARD_DISABLED'
            ? 'unavailable'
            : e instanceof ApiError && e.kind === 'denied'
              ? 'denied'
              : 'failed'
        );
      }
    } finally {
      if (mounted.current && sequence === loadSequence.current)
        setLoading(false);
    }
  }, [api, sessionId]);
  useEffect(() => {
    if (focused && foreground) load();
  }, [focused, foreground, load]);
  const boardId = context?.board?.id;
  useEffect(() => {
    if (!boardId || !confirm || confirm === 'reset') return;
    let active = true;
    setPreview(undefined);
    setPreviewError(false);
    api.preview(boardId, confirm.id).then(
      (value) => {
        if (active) setPreview(value);
      },
      () => {
        if (active) setPreviewError(true);
      }
    );
    return () => {
      active = false;
    };
  }, [api, boardId, confirm, previewRetry]);
  useEffect(() => {
    if (!boardId || !focused) return;
    if (!env.API_URL || !env.API_ORIGIN) {
      setLive({
        status: 'offline',
        shapes: [],
        people: [],
        notice: 'connection',
      });
      return;
    }
    const next = new BoardConnection(
      boardSocket(env.API_URL, env.API_ORIGIN),
      boardId,
      setLive,
      api.renew
    );
    connection.current = next;
    setLive(next.state);
    next.start();
    return () => {
      next.close();
      connection.current = undefined;
    };
  }, [api, boardId, focused]);
  useEffect(() => {
    setNote(undefined);
    setText('');
  }, [live.sync?.board.epoch]);
  useEffect(() => {
    const current = connection.current;
    if (!current) return;
    if (foreground) current.reconnect();
    else current.pause();
  }, [foreground]);
  useEffect(() => {
    if (live.status === 'revoked') {
      setContext(undefined);
      setProblem('denied');
      setNote(undefined);
      setOptions(false);
      setHistory(false);
    }
  }, [live.status]);
  const lastNotice = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (live.notice && lastNotice.current !== live.notice)
      notify(t(live.notice));
    lastNotice.current = live.notice;
  }, [live.notice, notify, t]);

  const run = async (next: Command) => {
    if (busy) return;
    command.current = next;
    setBusy(true);
    setCommandProblem(undefined);
    try {
      if (next.kind === 'create') {
        const value = await api.create(sessionId, next.key);
        if (mounted.current) setContext(value);
      } else if (next.board) {
        if (next.kind === 'mode' && next.mode)
          await api.control(next.board, next.mode, next.key);
        if (next.kind === 'snapshot') {
          await api.snapshot(next.board, next.key);
          if (mounted.current) notify(t('snapshotSaved'));
        }
        if (next.kind === 'reset' || next.kind === 'restore')
          await api.reset(next.board, next.key, next.snapshotId);
        if (mounted.current) connection.current?.reconnect();
      }
      command.current = undefined;
      if (mounted.current) {
        setConfirm(undefined);
        setOptions(false);
        setHistory(false);
      }
    } catch (e) {
      if (!mounted.current) return;
      if (
        e instanceof ApiError &&
        (e.kind === 'uncertain' || e.code === 'INVALID_RESPONSE')
      ) {
        setCommandProblem('uncertain');
      } else {
        command.current = undefined;
        if (e instanceof ApiError && e.kind === 'denied') {
          connection.current?.close();
          setLive({ status: 'revoked', shapes: [], people: [] });
          setProblem('denied');
          setContext(undefined);
        } else if (
          e instanceof ApiError &&
          (e.code.includes('CONFLICT') ||
            e.code === 'BOARD_EPOCH_CHANGED' ||
            e.code === 'BOARD_ALREADY_EXISTS')
        ) {
          setConfirm(undefined);
          setOptions(false);
          setHistory(false);
          notify(t('conflict'));
          connection.current?.reconnect();
          load();
        } else setCommandProblem('commandFailed');
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  const act = (kind: Command['kind'], extra: Partial<Command> = {}) => {
    if (command.current || busy) return;
    run({
      kind,
      key: newIntentKey(),
      ...(board ? { board: { ...board } } : {}),
      ...extra,
    });
  };
  const loadHistory = async (nextPage = 1) => {
    if (!board || historyBusy) return;
    setHistory(true);
    setHistoryBusy(true);
    setHistoryError(false);
    try {
      const value = await api.snapshots(board.id, nextPage);
      if (mounted.current) {
        setSnapshots((current) =>
          nextPage === 1 ? value.items : [...current, ...value.items]
        );
        setPage(value.page);
        setTotal(value.total);
      }
    } catch {
      if (mounted.current) setHistoryError(true);
    } finally {
      if (mounted.current) setHistoryBusy(false);
    }
  };
  const fit = () => {
    if (!live.shapes.length) {
      setViewport({ x: 0, y: 0, zoom: 1 });
      return;
    }
    const x = Math.min(...live.shapes.map((s) => s.x)) - 32,
      y = Math.min(...live.shapes.map((s) => s.y)) - 32;
    const width = Math.max(...live.shapes.map((s) => s.x + s.width)) - x + 32;
    const height = Math.max(...live.shapes.map((s) => s.y + s.height)) - y + 32;
    setViewport({
      x,
      y,
      zoom: Math.max(
        0.1,
        Math.min(2, size.current.width / width, size.current.height / height)
      ),
    });
  };
  const zoom = (factor: number) =>
    setViewport((current) => {
      const value = Math.max(0.1, Math.min(3, current.zoom * factor));
      return {
        zoom: value,
        x:
          current.x + (size.current.width / 2) * (1 / current.zoom - 1 / value),
        y:
          current.y +
          (size.current.height / 2) * (1 / current.zoom - 1 / value),
      };
    });
  const addNote = () => {
    if (!note || !text.trim() || !editable) return;
    const added = connection.current?.edit((doc) =>
      putShape(doc, {
        id: newIntentKey(),
        type: note.type,
        x: note.x,
        y: note.y,
        width: note.type === 'sticky' ? 220 : 300,
        height: Math.min(
          2000,
          Math.max(
            note.type === 'sticky' ? 180 : 80,
            (Math.ceil(text.length / 22) + text.split('\n').length) * 28 + 30
          )
        ),
        color:
          note.type === 'sticky' && color === COLORS[0] ? '#FFD978' : color,
        text: text.trim(),
        ...(note.type === 'text' ? { fontSize: 20 } : {}),
      })
    );
    if (added) {
      setNote(undefined);
      setText('');
    }
  };
  const hint =
    tool === 'hand' || !editable
      ? 'handHint'
      : tool === 'select'
        ? 'selectHint'
        : tool === 'eraser'
          ? 'eraserHint'
          : tool === 'sticky' || tool === 'text'
            ? 'noteHint'
            : 'hint';
  const commandFeedback = commandProblem ? (
    <View className="gap-space-8">
      <Alert
        testID="whiteboard-dialog-error"
        warning
      >
        {t(commandProblem)}
      </Alert>
      <Button
        busy={busy}
        onPress={() =>
          command.current ? run(command.current) : setCommandProblem(undefined)
        }
      >
        {t('retry')}
      </Button>
    </View>
  ) : null;
  return (
    <View
      testID="whiteboard-screen"
      className="flex-1 bg-mdy-bg"
      style={{
        paddingTop: insets.top,
        paddingBottom: Math.max(12, insets.bottom),
      }}
    >
      <View className="flex-row items-center gap-space-12 px-space-16 py-space-12">
        <Pressable
          testID="whiteboard-back"
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          onPress={navigation.goBack}
          className="w-space-44 h-space-44 items-center justify-center rounded-radius-14 bg-mdy-surface border border-mdy-border"
        >
          <Icon name="arrow_back" />
        </Pressable>
        <View className="flex-1 gap-space-3">
          <Text
            numberOfLines={1}
            className="text-size-17 font-bvp-bold"
          >
            {board?.title ?? t('title')}
          </Text>
          <Text
            numberOfLines={1}
            className="text-size-12 text-mdy-secondary"
          >
            {context?.context.className ??
              route.params.classTitle ??
              t('subtitle')}
          </Text>
        </View>
        {board && (
          <Pressable
            testID="whiteboard-options"
            accessibilityRole="button"
            accessibilityLabel={t('actions')}
            disabled={!ready || busy || !!commandProblem}
            onPress={() => setOptions(true)}
            className="w-space-44 h-space-44 items-center justify-center rounded-radius-14 bg-mdy-surface"
          >
            <Icon name="more_vert" />
          </Pressable>
        )}
      </View>
      {loading && !context ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : problem ? (
        <View className="flex-1 px-space-24 justify-center gap-space-16">
          <Icon
            name="co_present"
            size={48}
          />
          <Text className="text-size-17 font-bvp-semibold">{t('title')}</Text>
          <Text className="text-size-14 text-mdy-secondary">{t(problem)}</Text>
          {problem !== 'denied' && (
            <Button onPress={() => load()}>{t('retry')}</Button>
          )}
        </View>
      ) : !context?.board ? (
        <View className="flex-1 px-space-24 justify-center gap-space-20">
          <View className="w-space-72 h-space-72 rounded-radius-22 bg-mdy-tint items-center justify-center">
            <Icon
              name="edit_note"
              size={36}
              color={colors.primary}
            />
          </View>
          <Text className="text-size-24 font-bvp-bold">{t('empty')}</Text>
          <Text className="text-size-14 text-mdy-secondary">
            {t('emptyBody')}
          </Text>
          {commandProblem && (
            <Alert
              testID="whiteboard-create-error"
              warning
            >
              {t(commandProblem)}
            </Alert>
          )}
          {context?.capabilities.canCreate && (
            <Button
              testID="whiteboard-create"
              busy={busy}
              onPress={() =>
                command.current ? run(command.current) : act('create')
              }
            >
              {t(commandProblem === 'uncertain' ? 'retry' : 'create')}
            </Button>
          )}
        </View>
      ) : (
        <>
          <View className="flex-row items-center justify-between px-space-16 pb-space-10 gap-space-8">
            <View className="flex-row items-center gap-space-6">
              <View
                className={
                  ready
                    ? 'w-space-6 h-space-6 rounded-radius-99 bg-mdy-primary'
                    : 'w-space-6 h-space-6 rounded-radius-99 bg-mdy-tertiary'
                }
              />
              <Text
                testID="whiteboard-sync-status"
                className="text-size-12 text-mdy-secondary"
              >
                {t(live.status)}
              </Text>
            </View>
            <Chip variant="neutral">
              {t(
                board?.mode === 'COLLABORATIVE'
                  ? 'collaborative'
                  : 'presentation'
              )}
            </Chip>
            <View className="flex-row gap-space-3 items-center">
              <Icon
                name="groups"
                size={20}
              />
              <Text
                accessibilityLabel={t('people', { count: live.people.length })}
                className="text-size-12 text-mdy-secondary"
              >
                {live.people.length}
              </Text>
            </View>
          </View>
          {(live.status === 'offline' || !env.API_URL || !env.API_ORIGIN) && (
            <View className="mx-space-16 mb-space-8 gap-space-6">
              <Text className="text-size-12 text-mdy-secondary">
                {t('offlineBody')}
              </Text>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => connection.current?.reconnect()}
              >
                {t('retry')}
              </Button>
            </View>
          )}
          {commandProblem && (
            <View className="mx-space-16 mb-space-8 gap-space-6">
              <Alert
                testID="whiteboard-command-error"
                warning
              >
                {t(commandProblem)}
              </Alert>
              <Button
                size="sm"
                onPress={() =>
                  command.current
                    ? run(command.current)
                    : setCommandProblem(undefined)
                }
              >
                {t('retry')}
              </Button>
            </View>
          )}
          <View className="flex-1 mx-space-12 border border-mdy-border rounded-radius-22 overflow-hidden">
            <BoardCanvas
              key={live.sync?.board.epoch ?? context.board.epoch}
              boardId={context.board.id}
              shapes={live.shapes}
              editable={editable}
              tool={tool}
              color={color}
              viewport={viewport}
              onViewport={setViewport}
              onLayout={(width, height) => {
                size.current = { width, height };
                if (width > 0 && height > 0) setCanvasSize({ width, height });
              }}
              onAdd={(shape) => {
                connection.current?.edit((doc) => putShape(doc, shape));
              }}
              onMove={(id, x, y) => {
                connection.current?.edit((doc) => moveShape(doc, id, x, y));
              }}
              onDelete={(id) => {
                connection.current?.edit((doc) =>
                  doc.getMap('shapes').delete(id)
                );
              }}
              onText={(point, type) => {
                setText('');
                setNote({ ...point, type });
              }}
            />
            {ready && live.shapes.length === 0 && (
              <View
                pointerEvents="none"
                className="absolute inset-0 items-center justify-center gap-space-8 px-space-24"
              >
                <Text className="text-size-17 font-bvp-semibold text-[#74877E]">
                  {t('paperEmpty')}
                </Text>
                <Text className="text-size-12 text-[#74877E]">
                  {t('paperHint')}
                </Text>
              </View>
            )}
            <View className="absolute right-space-12 bottom-space-12 flex-row items-center rounded-radius-14 bg-mdy-surface border border-mdy-border">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('zoomOut')}
                onPress={() => zoom(1 / 1.25)}
                className="w-space-44 h-space-44 items-center justify-center"
              >
                <Text className="text-size-20">−</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('fit')}
                onPress={fit}
                className="min-w-space-44 h-space-44 items-center justify-center"
              >
                <Text className="text-size-12 font-bvp-semibold">
                  {Math.round(viewport.zoom * 100)}%
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('zoomIn')}
                onPress={() => zoom(1.25)}
                className="w-space-44 h-space-44 items-center justify-center"
              >
                <Text className="text-size-20">+</Text>
              </Pressable>
            </View>
          </View>
          <View className="mx-space-12 mt-space-10">
            <View className="w-full p-[7px] rounded-[20px] bg-mdy-surface border border-mdy-border gap-[5px]">
              <View className="flex-row flex-wrap">
                {TOOLS.map((value) => (
                  <View
                    key={value}
                    className="w-1/4 p-space-2"
                  >
                    <Pressable
                      testID={`whiteboard-tool-${value}`}
                      accessibilityRole="button"
                      accessibilityLabel={t(value)}
                      accessibilityState={{
                        selected: tool === value,
                        disabled: value !== 'hand' && !editable,
                      }}
                      disabled={value !== 'hand' && !editable}
                      onPress={() => setTool(value)}
                      className={
                        tool === value
                          ? 'min-h-[65px] rounded-[13px] bg-mdy-tint items-center justify-center gap-[5px] py-[7px]'
                          : 'min-h-[65px] rounded-[13px] items-center justify-center gap-[5px] py-[7px]'
                      }
                    >
                      <ToolIcon
                        tool={value}
                        color={
                          value !== 'hand' && !editable
                            ? colors.disabledInk
                            : tool === value
                              ? colors.primary
                              : colors.ink
                        }
                      />
                      <Text
                        className={
                          tool === value
                            ? 'text-size-11 font-bvp-semibold text-mdy-link text-center'
                            : 'text-size-11 font-bvp-medium text-mdy-secondary text-center'
                        }
                      >
                        {t(value === 'rectangle' ? 'rectangleShort' : value)}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
              <View className="flex-row items-center justify-between px-space-4">
                <View className="flex-row gap-space-4">
                  {COLORS.map((value) => (
                    <Pressable
                      key={value}
                      accessibilityRole="button"
                      accessibilityLabel={t('color', { color: value })}
                      accessibilityState={{ selected: color === value }}
                      onPress={() => setColor(value)}
                      className="w-[32px] h-[40px] items-center justify-center"
                      hitSlop={2}
                    >
                      <View
                        style={{
                          backgroundColor: value,
                          borderColor: color === value ? colors.ink : value,
                        }}
                        className={
                          color === value
                            ? 'w-[22px] h-[22px] rounded-radius-99 border-[3px]'
                            : 'w-[22px] h-[22px] rounded-radius-99 border'
                        }
                      />
                    </Pressable>
                  ))}
                </View>
                <Text className="text-size-11 font-bvp-semibold text-mdy-link">
                  {t(editable ? tool : 'readOnly')}
                </Text>
              </View>
            </View>
          </View>
          <Text className="text-center text-size-11 text-mdy-tertiary px-space-16 pt-space-8">
            {t(hint)}
          </Text>
        </>
      )}
      {note && (
        <ConfirmationDialog
          testID="whiteboard-note-dialog"
          title={t('noteTitle')}
          icon="edit_note"
          onClose={() => setNote(undefined)}
        >
          <View className="gap-space-16">
            <TextInput
              testID="whiteboard-note-input"
              accessibilityLabel={t('notePlaceholder')}
              placeholder={t('notePlaceholder')}
              placeholderTextColor={colors.tertiary}
              value={text}
              onChangeText={setText}
              maxLength={5000}
              multiline
              autoFocus
              style={{
                color: colors.ink,
              }}
              textAlignVertical="top"
              className="min-h-[140px] bg-mdy-muted rounded-radius-14 p-space-12 text-size-16"
            />
            <Button
              testID="whiteboard-note-add"
              disabled={!text.trim() || !editable}
              onPress={addNote}
            >
              {t('add')}
            </Button>
            <Button
              variant="text"
              onPress={() => setNote(undefined)}
            >
              {t('cancel')}
            </Button>
          </View>
        </ConfirmationDialog>
      )}
      {options && (
        <ConfirmationDialog
          testID="whiteboard-options-dialog"
          title={t('actions')}
          icon="co_present"
          busy={busy}
          onClose={() => setOptions(false)}
        >
          <View className="gap-space-12">
            {commandFeedback}
            {capabilities?.canControl && (
              <>
                <Text className="text-size-13 text-mdy-secondary">
                  {t(
                    board?.mode === 'COLLABORATIVE'
                      ? 'collaborativeBody'
                      : 'presentationBody'
                  )}
                </Text>
                <Button
                  variant="secondary"
                  disabled={
                    !ready ||
                    busy ||
                    (board?.mode === 'PRESENTATION' &&
                      !capabilities.canCollaborate)
                  }
                  onPress={() =>
                    act('mode', {
                      mode:
                        board?.mode === 'COLLABORATIVE'
                          ? 'PRESENTATION'
                          : 'COLLABORATIVE',
                    })
                  }
                >
                  {t(
                    board?.mode === 'COLLABORATIVE'
                      ? 'presentation'
                      : 'collaborative'
                  )}
                </Button>
              </>
            )}
            {capabilities?.canSnapshot && (
              <Button
                icon="task_alt"
                variant="secondary"
                disabled={!ready || busy}
                onPress={() => act('snapshot')}
              >
                {t('snapshot')}
              </Button>
            )}
            {capabilities?.canRestore && (
              <Button
                icon="history"
                variant="secondary"
                disabled={!ready || busy}
                onPress={() => {
                  setOptions(false);
                  loadHistory();
                }}
              >
                {t('snapshots')}
              </Button>
            )}
            {capabilities?.canRestore && (
              <Button
                icon="delete"
                variant="text"
                disabled={!ready || busy}
                onPress={() => {
                  setOptions(false);
                  confirmBoard.current = board ? { ...board } : undefined;
                  setConfirm('reset');
                }}
              >
                {t('reset')}
              </Button>
            )}
            <Button
              variant="text"
              onPress={() => setOptions(false)}
            >
              {t('cancel')}
            </Button>
          </View>
        </ConfirmationDialog>
      )}
      {history && !confirm && (
        <ConfirmationDialog
          testID="whiteboard-history-dialog"
          title={t('snapshots')}
          icon="history"
          onClose={() => setHistory(false)}
        >
          <View className="gap-space-12">
            {historyBusy && <ActivityIndicator color={colors.primary} />}
            {historyError && (
              <Button
                variant="secondary"
                onPress={() => loadHistory(page || 1)}
              >
                {t('retry')}
              </Button>
            )}
            {!historyBusy && !historyError && !snapshots.length && (
              <Text className="text-size-14 text-mdy-secondary">
                {t('noSnapshots')}
              </Text>
            )}
            {snapshots.map((snapshot) => (
              <Card
                key={snapshot.id}
                className="mx-space-0 p-space-12 gap-space-6"
              >
                <Text className="text-size-14 font-bvp-semibold">
                  {t(snapshot.reason)}
                </Text>
                <Text className="text-size-12 text-mdy-secondary">
                  {new Date(snapshot.createdAt).toLocaleString()}
                </Text>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!ready || busy}
                  onPress={() => {
                    confirmBoard.current = board ? { ...board } : undefined;
                    setConfirm(snapshot);
                  }}
                >
                  {t('restore')}
                </Button>
              </Card>
            ))}
            {snapshots.length < total && (
              <Button
                disabled={historyBusy}
                variant="text"
                onPress={() => loadHistory(page + 1)}
              >
                {t('more')}
              </Button>
            )}
          </View>
        </ConfirmationDialog>
      )}
      {confirm && (
        <ConfirmationDialog
          testID="whiteboard-confirm-dialog"
          title={t(confirm === 'reset' ? 'resetTitle' : 'restoreTitle')}
          icon="restore"
          busy={busy}
          onClose={() => setConfirm(undefined)}
        >
          <View className="gap-space-16">
            {commandFeedback}
            {confirm !== 'reset' && !preview && !previewError && (
              <ActivityIndicator color={colors.primary} />
            )}
            {confirm !== 'reset' && previewError && (
              <Button
                variant="secondary"
                onPress={() => setPreviewRetry((value) => value + 1)}
              >
                {t('retry')}
              </Button>
            )}
            {confirm !== 'reset' && preview && (
              <View className="h-[180px] rounded-radius-14 bg-white overflow-hidden">
                <Svg
                  width="100%"
                  height="100%"
                  viewBox={previewBounds(preview.projection)}
                >
                  {preview.projection.map((shape) => (
                    <RenderShape
                      key={shape.id}
                      boardId={board?.id}
                      shape={shape}
                    />
                  ))}
                </Svg>
              </View>
            )}
            <Text className="text-size-14 text-mdy-secondary">
              {t(confirm === 'reset' ? 'resetBody' : 'restoreBody')}
            </Text>
            <Button
              testID="whiteboard-confirm"
              busy={busy}
              disabled={
                !ready || !!commandProblem || (confirm !== 'reset' && !preview)
              }
              variant="danger"
              onPress={() => {
                if (!confirmBoard.current) return;
                act(confirm === 'reset' ? 'reset' : 'restore', {
                  board: confirmBoard.current,
                  ...(confirm !== 'reset' ? { snapshotId: confirm.id } : {}),
                });
              }}
            >
              {t('confirm')}
            </Button>
            <Button
              variant="text"
              disabled={busy}
              onPress={() => setConfirm(undefined)}
            >
              {t('cancel')}
            </Button>
          </View>
        </ConfirmationDialog>
      )}
      {leaveAction && (
        <ConfirmationDialog
          testID="whiteboard-pending-dialog"
          title={t('pendingLeave')}
          icon="sync"
          onClose={() => setLeaveAction(undefined)}
        >
          <View className="gap-space-16">
            <Text className="text-size-14 text-mdy-secondary">
              {t('pendingLeaveBody')}
            </Text>
            <Button
              onPress={() => {
                setLeaveAction(undefined);
                connection.current?.reconnect();
              }}
            >
              {t('retry')}
            </Button>
            <Button
              variant="text"
              onPress={() => {
                const action = leaveAction;
                setLeaveAction(undefined);
                navigation.dispatch(action);
              }}
            >
              {t('back')}
            </Button>
          </View>
        </ConfirmationDialog>
      )}
    </View>
  );
}

function previewBounds(shapes: z.infer<typeof previewSchema>['projection']) {
  if (!shapes.length) return '0 0 320 180';
  const x = Math.min(...shapes.map((s) => s.x)) - 24;
  const y = Math.min(...shapes.map((s) => s.y)) - 24;
  return `${x} ${y} ${Math.max(...shapes.map((s) => s.x + s.width)) - x + 24} ${Math.max(...shapes.map((s) => s.y + s.height)) - y + 24}`;
}
