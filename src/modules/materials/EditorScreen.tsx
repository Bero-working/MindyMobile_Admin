import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  pick,
  keepLocalCopy,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';
import BlobUtil from 'react-native-blob-util';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import {
  Button,
  Icon,
  Text,
  Alert,
  type IconName,
} from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import { Field, Page } from '@/modules/attendance/components/shared';
import { useMaterials } from './MaterialProvider';
import { useRead } from './hooks';
import { MaterialError, type Draft } from './service';
import { Problem, ReadBlock } from './components';
import {
  canEdit,
  codePoints,
  plainArticleHtml,
  utf8Bytes,
  validateFile,
} from './model';
import type { Detail, FileStatus } from './schema';
const kindIcons: Record<'FILE' | 'VIDEO' | 'ARTICLE', IconName> = {
  FILE: 'description',
  VIDEO: 'movie',
  ARTICLE: 'article',
};
export function MaterialEditorScreen({
  navigation,
  route,
}: NativeStackScreenProps<AuthStackParams, 'MaterialEditor'>) {
  const params = route.params,
    { classId, classUnitId, courseUnitId, materialId } = params;
  const service = useMaterials();
  const { notify, state: auth } = useAuth();
  const { t } = useTranslation('materials');
  const { colors } = useMindyTheme();
  const scope = { role: 'MENTOR' as const, classId };
  const initial = useRead(
    `edit:${materialId}`,
    () => service.detail(scope, materialId!),
    !!materialId
  );
  const [base, setBase] = useState<Detail>(),
    [type, setType] = useState<'FILE' | 'VIDEO' | 'ARTICLE'>(),
    [title, setTitle] = useState(''),
    [description, setDescription] = useState(''),
    [article, setArticle] = useState('');
  const [file, setFile] = useState<FileStatus>(),
    [fileName, setFileName] = useState(''),
    [stage, setStage] = useState(''),
    [percent, setPercent] = useState(0);
  const [error, setError] = useState<MaterialError>(),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [unknown, setUnknown] = useState<Draft>(),
    [conflict, setConflict] = useState<Detail>();
  const initialized = useRef(false),
    locked = useRef(false),
    version = useRef(0),
    task = useRef<ReturnType<typeof BlobUtil.fetch> | undefined>(undefined),
    paths = useRef<string[]>([]),
    allowLeave = useRef(false);
  const focused = useIsFocused();
  const accept = (m: Detail) => {
    setBase(m);
    setType(m.contentType);
    setTitle(m.title);
    setDescription(m.description ?? '');
    setArticle('');
    setDirty(false);
  };
  useEffect(() => {
    if (initial.data && !initialized.current) {
      initialized.current = true;
      accept(initial.data);
    }
  }, [initial.data]);
  useEffect(
    () => () => {
      version.current++;
      task.current?.cancel();
      for (const p of paths.current) BlobUtil.fs.unlink(p).catch(() => {});
    },
    []
  );
  const revoked =
    (initial.error && ['denied', 'notFound'].includes(initial.error.kind)) ||
    (error && ['denied', 'notFound'].includes(error.kind));
  useEffect(() => {
    if (revoked) {
      setTitle('');
      setDescription('');
      setArticle('');
      setFile(undefined);
      version.current++;
      task.current?.cancel();
    }
  }, [revoked]);
  // Poll only while this editor is foreground/focused; never replay writes.
  useEffect(() => {
    if (
      !file ||
      !['PROCESSING', 'PENDING_UPLOAD'].includes(file.status) ||
      !focused
    )
      return;
    const started = Date.now();
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (!active || AppState.currentState !== 'active') {
        if (active)
          timer = setTimeout(() => {
            poll();
          }, 5000);
        return;
      }
      try {
        const next = await service.file(file.id);
        if (!active) return;
        if (next.id !== file.id || next.courseUnitId !== courseUnitId)
          throw new MaterialError('error', 'RESOURCE_MISMATCH');
        setFile(next);
        if (next.status === 'READY') {
          setStage('ready');
          return;
        }
        if (['FAILED', 'DELETED'].includes(next.status)) {
          setStage('fileFailed');
          return;
        }
      } catch (e) {
        if (active)
          setError(e instanceof MaterialError ? e : new MaterialError('error'));
        return;
      }
      if (Date.now() - started > 180000) {
        setStage('slow');
        return;
      }
      timer = setTimeout(
        () => {
          poll();
        },
        Date.now() - started < 30000 ? 2000 : 5000
      );
    };
    timer = setTimeout(() => {
      poll();
    }, 2000);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [file?.id, file?.status, focused, service, courseUnitId]);
  const choose = async (content: 'FILE' | 'VIDEO') => {
    if (locked.current) return;
    const token = ++version.current;
    task.current?.cancel();
    setError(undefined);
    try {
      const [picked] = await pick({
        allowMultiSelection: false,
        mode: 'import',
      });
      if (version.current !== token) return;
      const validated = validateFile(picked.name ?? '', picked.size, content);
      if ('error' in validated)
        throw new MaterialError('error', validated.error);
      const [copy] = await keepLocalCopy({
        destination: 'cachesDirectory',
        files: [
          { uri: picked.uri, fileName: `mindy-${Date.now()}-${picked.name!}` },
        ],
      });
      if (copy.status !== 'success')
        throw new MaterialError('error', 'unreadable');
      const localPath = decodeURI(copy.localUri.replace(/^file:\/\//, ''));
      paths.current.push(localPath);
      if (version.current !== token) {
        BlobUtil.fs.unlink(localPath).catch(() => {});
        return;
      }
      setDirty(true);
      setType(content);
      setFile(undefined);
      setFileName(picked.name!);
      setTitle((v) => v || picked.name!.replace(/\.[^.]+$/, ''));
      setStage('preparing');
      setBusy(true);
      locked.current = true;
      const intent = await service.uploadIntent({
        classId,
        classUnitId,
        courseUnitId,
        originalFilename: picked.name!,
        declaredMimeType: validated.mime!,
        declaredSizeBytes: validated.size!,
      });
      if (version.current !== token) return;
      const url = service.storageUrl(intent.uploadUrl);
      if (
        Object.keys(intent.requiredHeaders).some((h) =>
          /^(cookie|authorization|origin)$/i.test(h)
        )
      )
        throw new MaterialError('error', 'STORAGE_HOST_UNSAFE');
      setStage('uploading');
      setPercent(0);
      task.current = BlobUtil.config({
        followRedirect: false,
        timeout: 120000,
      }).fetch('PUT', url, intent.requiredHeaders, BlobUtil.wrap(localPath));
      task.current.uploadProgress({ interval: 250 }, (sent, total) => {
        if (version.current === token)
          setPercent(total > 0 ? Math.round((sent / total) * 100) : 0);
      });
      const response = await task.current;
      if (version.current !== token) return;
      if (response.info().status < 200 || response.info().status >= 300)
        throw new MaterialError('error', 'cannotOpen');
      setStage('complete');
      const completed = await service.complete(intent.fileId);
      if (version.current !== token) return;
      if (
        completed.id !== intent.fileId ||
        completed.courseUnitId !== courseUnitId
      )
        throw new MaterialError('error', 'RESOURCE_MISMATCH');
      setFile(completed);
      setStage(
        completed.status === 'READY'
          ? 'ready'
          : completed.status === 'PROCESSING'
            ? 'processing'
            : 'fileFailed'
      );
    } catch (e) {
      if (
        version.current === token &&
        !(isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED)
      ) {
        setStage('');
        setError(e instanceof MaterialError ? e : new MaterialError('error'));
      }
    } finally {
      if (version.current === token) {
        locked.current = false;
        setBusy(false);
      }
    }
  };
  const finish = (m: Detail) => {
    setUnknown(undefined);
    setDirty(false);
    allowLeave.current = true;
    notify(t('saved'));
    navigation.replace('MentorMaterialDetail', { classId, materialId: m.id });
  };
  const save = async () => {
    if (locked.current || unknown) return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    const body: Draft = {
      title: title.trim(),
      description: description || null,
      ...(base ? { expectedRevision: base.revision } : { contentType: type! }),
      ...(type !== 'ARTICLE' && file?.status === 'READY'
        ? { fileId: file.id }
        : !base && type !== 'ARTICLE'
          ? {}
          : {}),
      ...(type === 'ARTICLE' && (!base || article.length > 0)
        ? { contentText: article }
        : {}),
    };
    try {
      finish(await service.save(scope, classUnitId, body, materialId));
    } catch (e) {
      const failure =
        e instanceof MaterialError ? e : new MaterialError('error');
      setError(failure);
      if (failure.kind === 'uncertain') setUnknown(body);
      if (failure.kind === 'conflict') {
        try {
          setConflict(await service.detail(scope, materialId!));
        } catch {
          await initial.refresh();
        }
      }
      if (['denied', 'notFound'].includes(failure.kind))
        await initial.refresh();
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const check = async () => {
    if (locked.current || !unknown) return;
    locked.current = true;
    setBusy(true);
    try {
      if (materialId) {
        const latest = await service.detail(scope, materialId);
        if (latest.revision === unknown.expectedRevision) {
          setUnknown(undefined);
          setError(undefined);
        } else if (
          latest.revision === (unknown.expectedRevision ?? 0) + 1 &&
          latest.title === unknown.title &&
          latest.description === unknown.description &&
          (!unknown.fileId || latest.file?.id === unknown.fileId) &&
          (!unknown.contentText ||
            latest.contentHtml === plainArticleHtml(unknown.contentText))
        )
          finish(latest);
        else {
          setUnknown(undefined);
          setConflict(latest);
        }
      } else if (unknown.fileId) {
        for (let page = 1; ; page++) {
          const result = await service.list(
            scope,
            classUnitId,
            'DRAFT',
            page,
            100
          );
          const found = result.items.find((m) => m.file?.id === unknown.fileId);
          if (found) {
            finish(await service.detail(scope, found.id));
            break;
          }
          if (page * result.pageSize >= result.total) {
            setUnknown(undefined);
            setError(undefined);
            break;
          }
        }
      } else {
        const matches: Detail[] = [];
        for (let page = 1; ; page++) {
          const result = await service.list(
            scope,
            classUnitId,
            'DRAFT',
            page,
            100
          );
          for (const candidate of result.items) {
            if (
              candidate.contentType !== 'ARTICLE' ||
              candidate.title !== unknown.title ||
              candidate.createdBy !== auth.user?.id
            )
              continue;
            const detail = await service.detail(scope, candidate.id);
            if (
              detail.description === unknown.description &&
              detail.contentHtml === plainArticleHtml(unknown.contentText ?? '')
            )
              matches.push(detail);
          }
          if (page * result.pageSize >= result.total) break;
        }
        if (matches.length === 1) finish(matches[0]!);
        else if (matches.length === 0) {
          setUnknown(undefined);
          setError(undefined);
        }
        // Multiple identical drafts need user review; never pick an arbitrary resource.
      }
    } catch (e) {
      setError(e instanceof MaterialError ? e : new MaterialError('error'));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const allowed = !base || canEdit(base);
  const valid =
    allowed &&
    !!type &&
    !!title.trim() &&
    codePoints(title.trim()) <= 250 &&
    codePoints(description) <= 5000 &&
    (type === 'ARTICLE'
      ? ((base && !article) || !!article.trim()) &&
        utf8Bytes(plainArticleHtml(article)) <= 49152
      : (!!file && file.status === 'READY') || (!!base?.file && !fileName)) &&
    (dirty || base?.reviewStatus === 'REJECTED');
  const pickDisabled = busy || !!unknown || !allowed || !initial.online;
  const pickedName = fileName || base?.file?.originalFilename;
  return (
    <Page
      prefix="editor"
      title={t(materialId ? 'edit' : 'upload')}
      subtitle={params.unitTitle}
      onBack={() => navigation.goBack()}
      dirty={dirty}
      busy={busy}
      uncertain={!!unknown}
      allowLeaveRef={allowLeave}
      showMockControls={false}
    >
      <ReadBlock
        data={materialId ? (revoked ? undefined : initial.data) : {}}
        busy={initial.busy}
        error={initial.error}
        retry={() => {
          initial.refresh();
        }}
      >
        {!revoked && (
          <>
            <View className="gap-space-12">
              {!base && (
                <View
                  accessibilityRole="radiogroup"
                  className="flex-row gap-space-8"
                >
                  {(['FILE', 'VIDEO', 'ARTICLE'] as const).map((v) => (
                    <Pressable
                      key={v}
                      testID={`editor-kind-${v.toLowerCase()}`}
                      accessibilityRole="radio"
                      accessibilityState={{
                        selected: v === type,
                        disabled: busy || !!unknown,
                      }}
                      disabled={busy || !!unknown}
                      onPress={() => {
                        setType(v);
                        setFile(undefined);
                        setFileName('');
                        setStage('');
                        setDirty(true);
                      }}
                      className={`flex-1 min-h-[72px] items-center justify-center gap-space-6 rounded-radius-14 border px-space-8 py-space-12 ${v === type ? 'border-mdy-primary bg-mdy-tint2' : 'border-mdy-border bg-mdy-surface active:bg-mdy-muted2'} ${busy || unknown ? 'opacity-50' : ''}`}
                    >
                      <Icon
                        name={kindIcons[v]}
                        color={v === type ? colors.primary : colors.secondary}
                      />
                      <Text
                        numberOfLines={1}
                        className={
                          v === type
                            ? 'text-size-13 font-bvp-semibold text-mdy-link'
                            : 'text-size-13 font-bvp-medium text-mdy-ink'
                        }
                      >
                        {t(v)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {type && type !== 'ARTICLE' && (
                <Pressable
                  testID="editor-upload-change"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: pickDisabled }}
                  disabled={pickDisabled}
                  onPress={() => {
                    choose(type);
                  }}
                  className={`flex-row items-center gap-space-12 rounded-radius-14 border border-mdy-border bg-mdy-surface p-space-12 active:bg-mdy-muted2 ${pickDisabled ? 'opacity-50' : ''}`}
                >
                  <View className="h-space-44 w-space-44 items-center justify-center rounded-radius-12 bg-mdy-tint2">
                    <Icon
                      name={pickedName ? kindIcons[type] : 'upload_file'}
                      color={colors.primary}
                    />
                  </View>
                  <View className="flex-1 gap-space-2">
                    <Text
                      numberOfLines={2}
                      className="text-size-14 font-bvp-semibold text-mdy-ink"
                    >
                      {pickedName || t('pick')}
                    </Text>
                    <Text className="text-size-12 text-mdy-secondary">
                      {t(type === 'VIDEO' ? 'pickHintVideo' : 'pickHintFile')}
                    </Text>
                  </View>
                  {!!pickedName && (
                    <Text className="text-size-13 font-bvp-semibold text-mdy-link">
                      {t('change')}
                    </Text>
                  )}
                </Pressable>
              )}
              {!!stage && (
                <Text
                  testID="editor-upload-status"
                  className="text-size-13 text-mdy-secondary"
                  accessibilityRole="progressbar"
                  accessibilityValue={{ now: percent, min: 0, max: 100 }}
                >
                  {t(stage)}
                  {stage === 'uploading' ? ` ${percent}%` : ''}
                </Text>
              )}
              {busy && stage === 'uploading' && (
                <Button
                  testID="editor-upload-cancel"
                  variant="text"
                  onPress={() => {
                    version.current++;
                    task.current?.cancel();
                    setFile(undefined);
                    setStage('');
                    setBusy(false);
                    locked.current = false;
                  }}
                >
                  {t('cancel')}
                </Button>
              )}
              {file && file.status !== 'READY' && !busy && (
                <Button
                  disabled={!initial.online}
                  onPress={async () => {
                    try {
                      const next = await service.file(file.id);
                      setFile(next);
                      setStage(
                        next.status === 'READY'
                          ? 'ready'
                          : next.status === 'PROCESSING'
                            ? 'processing'
                            : 'fileFailed'
                      );
                    } catch (e) {
                      setError(
                        e instanceof MaterialError
                          ? e
                          : new MaterialError('error')
                      );
                    }
                  }}
                >
                  {t('check')}
                </Button>
              )}
              <Field
                id="editor-title"
                label={t('fieldTitle')}
                value={title}
                max={250}
                multiline={false}
                disabled={busy || !!unknown || !allowed}
                onChange={(v) => {
                  setTitle(v);
                  setDirty(true);
                }}
              />
              <Field
                id="editor-description"
                label={t('description')}
                value={description}
                max={5000}
                disabled={busy || !!unknown || !allowed}
                onChange={(v) => {
                  setDescription(v);
                  setDirty(true);
                }}
              />
              {type === 'ARTICLE' && (
                <>
                  {base?.contentHtml && (
                    <Text>
                      {t('article')} · {t('edit')}
                    </Text>
                  )}
                  <Field
                    id="editor-article"
                    label={t('article')}
                    value={article}
                    disabled={busy || !!unknown || !allowed}
                    onChange={(v) => {
                      setArticle(v);
                      setDirty(true);
                    }}
                  />
                  <Text>{utf8Bytes(article)} / 49152 bytes</Text>
                </>
              )}
              {!allowed && (
                <Alert
                  testID="material-warning"
                  warning
                >
                  {t('denied')}
                </Alert>
              )}
              <Button
                testID="editor-save"
                icon="check"
                disabled={
                  !valid || busy || !!unknown || !!conflict || !initial.online
                }
                busy={busy}
                onPress={() => {
                  save();
                }}
              >
                {t('save')}
              </Button>
              {type !== 'ARTICLE' && !valid && (
                <View className="flex-row justify-center gap-space-6">
                  <Icon
                    name="info"
                    size={16}
                  />
                  <Text className="shrink text-size-12 text-mdy-secondary">
                    {t('pendingFile')}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ReadBlock>
      <Problem
        error={error}
        prefix="editor"
      />
      {unknown && (
        <Button
          testID="editor-check"
          disabled={busy || !initial.online}
          onPress={() => {
            check();
          }}
        >
          {t('check')}
        </Button>
      )}
      {conflict && (
        <View className="gap-space-8">
          <Alert
            testID="material-warning"
            warning
          >
            {t('conflict') + ' ' + conflict.title}
          </Alert>
          <Button
            onPress={() => {
              accept(conflict);
              setConflict(undefined);
              setUnknown(undefined);
              setError(undefined);
            }}
          >
            {t('useLatest')}
          </Button>
          {materialId && canEdit(conflict) && (
            <Button
              onPress={() => {
                setBase(conflict);
                setConflict(undefined);
                setError(undefined);
              }}
            >
              {t('keepMine')}
            </Button>
          )}
        </View>
      )}
    </Page>
  );
}
