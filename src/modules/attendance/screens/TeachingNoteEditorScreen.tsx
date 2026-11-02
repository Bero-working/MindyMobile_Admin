import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { Alert, Button, Text } from '@/components/ui/primitives';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useAttendanceMutation, useAttendanceQuery } from '../hooks';
import { isoDate, isoTime, noteLength } from '../model';
import {
  Field,
  FocusPanel,
  IntentBanner,
  MutationError,
  Page,
  QueryBlock,
  SessionHeading,
} from '../components/shared';
import type { AttendanceData } from '../types';

export function TeachingNoteEditorScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'TeachingNoteEditor'>) {
  const { t } = useTranslation('attendance'),
    { notify } = useAuth();
  const id = route.params.sessionId;
  const context = useAttendanceQuery({
    kind: 'context',
    role: 'MENTOR',
    sessionId: id,
  });
  const query = useAttendanceQuery({
    kind: 'note',
    role: 'MENTOR',
    sessionId: id,
  });
  const mutation = useAttendanceMutation();
  const [content, setContent] = useState(''),
    [nextSteps, setNextSteps] = useState(''),
    [baseline, setBaseline] = useState({
      content: '',
      nextSteps: '',
      version: 0,
    });
  const [conflict, setConflict] = useState<AttendanceData>(),
    [replace, setReplace] = useState(false),
    [closed, setClosed] = useState(false),
    [expanded, setExpanded] = useState(false);
  const dirty =
    content !== baseline.content || nextSteps !== baseline.nextSteps;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const denied =
    query.result?.kind === 'denied' ||
    context.result?.kind === 'denied' ||
    mutation.result?.kind === 'denied';
  const load = (data: AttendanceData) => {
    setContent(data.note?.content ?? '');
    setNextSteps(data.note?.nextSteps ?? '');
    setBaseline({
      content: data.note?.content ?? '',
      nextSteps: data.note?.nextSteps ?? '',
      version: data.noteVersion,
    });
  };
  useEffect(() => {
    if (query.data && !dirtyRef.current) load(query.data);
  }, [query.data]);
  useEffect(() => {
    if (denied) {
      setContent('');
      setNextSteps('');
      setBaseline({ content: '', nextSteps: '', version: 0 });
      setConflict(undefined);
    }
  }, [denied]);
  const session = context.data?.session;
  const editable =
    !!session &&
    ['IN_PROGRESS', 'COMPLETED'].includes(session.status) &&
    session.isEffectiveMentor &&
    Date.parse(session.asOf) < Date.parse(session.editableUntil) &&
    !closed &&
    !denied;
  const invalid = noteLength(content) > 10000 || noteLength(nextSteps) > 5000;
  const submit = async (retry = false) => {
    const result = await mutation.submit(
      {
        kind: 'note',
        sessionId: id,
        role: 'MENTOR',
        expectedVersion: baseline.version,
        content,
        nextSteps,
      },
      retry
    );
    if (result?.kind === 'success') {
      load(result.data);
      setConflict(undefined);
      notify(t('note.saved'));
    } else if (
      result?.kind === 'error' &&
      result.code === 'TEACHING_VERSION_CONFLICT'
    ) {
      const fresh = await query.refresh();
      if (fresh?.kind === 'success') setConflict(fresh.data);
    } else if (
      result?.kind === 'error' &&
      ['TEACHING_NOTE_WINDOW_CLOSED', 'TEACHING_NOTE_STATE_CONFLICT'].includes(
        result.code ?? ''
      )
    )
      setClosed(true);
  };
  const locked = mutation.busy || mutation.uncertain;
  const readonlyReason = closed
    ? 'note.closedUnsaved'
    : session?.status === 'SCHEDULED'
      ? 'note.notStarted'
      : session?.status === 'CANCELLED'
        ? 'note.cancelled'
        : !session?.isEffectiveMentor
          ? 'note.notTeacher'
          : 'note.expired';
  return (
    <Page
      prefix="note"
      title={t('note.title')}
      subtitle={route.params.classTitle ?? session?.classTitle}
      onBack={navigation.goBack}
      dirty={dirty}
      busy={mutation.busy}
      uncertain={mutation.uncertain}
      refresh={query.refresh}
      footer={
        dirty && editable ? (
          <View className="flex-row gap-space-12 items-center">
            <Text
              testID="note-unsaved"
              className="flex-1"
            >
              {t('note.unsaved')}
            </Text>
            <Button
              testID="note-save"
              disabled={query.offline || locked || invalid || !!conflict}
              busy={mutation.busy}
              onPress={() => submit()}
            >
              {t('note.save')}
            </Button>
          </View>
        ) : undefined
      }
    >
      <QueryBlock
        query={context}
        prefix="note-context"
      >
        <QueryBlock
          query={query}
          prefix="note"
        >
          {denied ? (
            <Alert testID="note-denied">
              {t('denied') + ' ' + t('note.deniedExtra')}
            </Alert>
          ) : (
            <>
              {session && <SessionHeading session={session} />}
              <Text
                testID="note-internal"
                className="text-size-12 text-mdy-secondary"
              >
                {t('note.internal')}
              </Text>
              {conflict && (
                <FocusPanel testID="note-conflict">
                  <Text accessibilityRole="header">
                    {t('note.conflictTitle')}
                  </Text>
                  <Text numberOfLines={expanded ? undefined : 6}>
                    {conflict.note?.content}
                  </Text>
                  <Text numberOfLines={expanded ? undefined : 6}>
                    {conflict.note?.nextSteps}
                  </Text>
                  <Button
                    variant="text"
                    onPress={() => setExpanded(!expanded)}
                  >
                    {t('audit.more')}
                  </Button>
                  <Button
                    testID="note-use-latest"
                    variant="secondary"
                    onPress={() => setReplace(true)}
                  >
                    {t('note.useLatest')}
                  </Button>
                  <Button
                    testID="note-keep-mine"
                    variant="secondary"
                    onPress={() => {
                      setBaseline({
                        content: conflict.note?.content ?? '',
                        nextSteps: conflict.note?.nextSteps ?? '',
                        version: conflict.noteVersion,
                      });
                      setConflict(undefined);
                      mutation.clear();
                    }}
                  >
                    {t('note.keepMine')}
                  </Button>
                </FocusPanel>
              )}
              {editable ? (
                <>
                  {session?.status === 'COMPLETED' && (
                    <Text testID="note-edit-until">
                      {t('note.editUntil', {
                        deadline: `${isoTime(session.editableUntil)} ${isoDate(session.editableUntil)}`,
                      })}
                    </Text>
                  )}
                  <Field
                    id="note-content"
                    label={t('note.content')}
                    value={content}
                    onChange={setContent}
                    max={10000}
                    disabled={locked}
                  />
                  <Field
                    id="note-next-steps"
                    label={t('note.nextSteps')}
                    value={nextSteps}
                    onChange={setNextSteps}
                    max={5000}
                    disabled={locked}
                  />
                </>
              ) : (
                <View
                  testID="note-readonly"
                  className="gap-space-12"
                >
                  <Alert
                    testID={closed ? 'note-closed-unsaved' : 'note-locked'}
                    warning
                  >
                    {t(readonlyReason)}
                  </Alert>
                  {content || nextSteps ? (
                    <>
                      <Text>{t('note.content')}</Text>
                      <Text selectable>{content}</Text>
                      <Text>{t('note.nextSteps')}</Text>
                      <Text selectable>{nextSteps}</Text>
                    </>
                  ) : (
                    <Text testID="note-empty">{t('note.empty')}</Text>
                  )}
                  {closed && (
                    <Button
                      testID="note-copy"
                      variant="secondary"
                      onPress={() => {
                        Clipboard.setString(`${content}\n\n${nextSteps}`);
                        notify(t('copied'));
                      }}
                    >
                      {t('note.copy')}
                    </Button>
                  )}
                </View>
              )}
              {query.data?.note && (
                <Text
                  testID="note-updated-at"
                  className="text-size-12 text-mdy-secondary"
                >
                  {t('note.updatedAt', {
                    time: isoTime(query.data.note.updatedAt),
                    date: isoDate(query.data.note.updatedAt),
                  })}
                </Text>
              )}
              {query.offline && (
                <Alert
                  testID="note-offline"
                  warning
                >
                  {t('note.offline')}
                </Alert>
              )}
              {mutation.uncertain && (
                <IntentBanner
                  prefix="note"
                  offline={query.offline}
                  busy={mutation.busy}
                  onRetry={() => submit(true)}
                />
              )}
              <MutationError
                result={mutation.result}
                prefix="note"
              />
            </>
          )}
        </QueryBlock>
      </QueryBlock>
      {replace && conflict && (
        <ConfirmationDialog
          testID="note-replace-dialog"
          title={t('note.useLatest')}
          icon="warning"
          onClose={() => setReplace(false)}
        >
          <Text>{t('note.useLatestConfirm')}</Text>
          <Button
            testID="note-replace-confirm"
            onPress={() => {
              load(conflict);
              setConflict(undefined);
              setReplace(false);
              mutation.clear();
            }}
          >
            {t('confirm')}
          </Button>
          <Button
            variant="text"
            onPress={() => setReplace(false)}
          >
            {t('cancel')}
          </Button>
        </ConfirmationDialog>
      )}
    </Page>
  );
}
