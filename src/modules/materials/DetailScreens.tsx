import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { Alert, Button, Card, Icon, Text } from '@/components/ui/primitives';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Page, Field } from '@/modules/attendance/components/shared';
import { useTeaching } from '@/modules/teaching/TeachingProvider';
import { useMaterials } from './MaterialProvider';
import { useRead } from './hooks';
import {
  fileSize,
  instantLabel,
  MaterialStatus,
  MaterialTile,
  Notice,
  Problem,
  ReadBlock,
} from './components';
import { canEdit, codePoints } from './model';
import { MaterialError, type Scope } from './service';
type DetailProps =
  | NativeStackScreenProps<AuthStackParams, 'MentorMaterialDetail'>
  | NativeStackScreenProps<AuthStackParams, 'MaterialReviewDetail'>;
export function MaterialDetailScreen({ navigation, route }: DetailProps) {
  const { t, i18n } = useTranslation('materials');
  const { state, notify } = useAuth();
  const service = useMaterials();
  const { source } = useTeaching();
  const classId = 'classId' in route.params ? route.params.classId : undefined;
  const scope: Scope = {
    role: state.user?.role === 'MENTOR' ? 'MENTOR' : 'MANAGER',
    classId,
  };
  const manager = scope.role === 'MANAGER',
    prefix = manager ? 'review-detail' : 'material-detail';
  const { materialId } = route.params;
  const query = useRead(`${scope.role}:${classId}:${materialId}`, () =>
    service.detail(scope, materialId)
  );
  const m = query.data;
  const [command, setCommand] = useState<{
    action: 'submit' | 'approve' | 'reject';
    revision: number;
    reason: string;
  }>();
  const [reason, setReason] = useState(''),
    [dialog, setDialog] = useState<'submit' | 'approve' | 'reject'>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<MaterialError>();
  const locked = useRef(false);
  const dialogRevision = useRef(0);
  const openDialog = (action: 'submit' | 'approve' | 'reject') => {
    if (!m) return;
    dialogRevision.current = m.revision;
    setDialog(action);
  };
  useEffect(() => {
    if (dialog && m && m.revision !== dialogRevision.current) {
      setDialog(undefined);
      setError(new MaterialError('conflict'));
    }
  }, [dialog, m]);
  const run = async (intent: NonNullable<typeof command>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setDialog(undefined);
    setError(undefined);
    try {
      await service.command(
        scope,
        materialId,
        intent.action,
        intent.revision,
        intent.reason
      );
      setCommand(undefined);
      setReason('');
      await query.refresh();
      notify(t('done'));
    } catch (e) {
      const failure =
        e instanceof MaterialError ? e : new MaterialError('error');
      setError(failure);
      if (failure.kind === 'uncertain') setCommand(intent);
      else {
        setCommand(undefined);
        if (['conflict', 'denied', 'notFound'].includes(failure.kind))
          await query.refresh();
      }
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const edit = async () => {
    if (!m || !classId || locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      for (let page = 1; ; page++) {
        const r = await source.read({
          kind: 'units',
          classId,
          role: 'MENTOR',
          page,
          pageSize: 100,
        });
        if (r.kind !== 'success')
          throw new MaterialError(r.kind === 'unavailable' ? 'error' : r.kind);
        const unit = r.data.units.find(
          (u) => u.courseUnitId === m.courseUnitId
        );
        if (unit) {
          navigation.navigate('MaterialEditor', {
            classId,
            classUnitId: unit.id,
            courseUnitId: m.courseUnitId,
            materialId: m.id,
            unitTitle: unit.title,
          });
          return;
        }
        if (page * 100 >= r.data.total) throw new MaterialError('notFound');
      }
    } catch (e) {
      setError(e instanceof MaterialError ? e : new MaterialError('error'));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const openPreview = (fileId?: string) => {
    if (!m) return;
    navigation.navigate('MaterialPreview', {
      materialId: m.id,
      revision: m.revision,
      title: m.title,
      ...(classId ? { classId } : {}),
      ...(fileId ? { fileId } : {}),
    });
  };
  const language = i18n.language;
  const mine = !manager && m?.createdBy === state.user?.id;
  const actionsDisabled = busy || !!command || !query.online;
  const mentorEdit = !manager && !!m && canEdit(m);
  const canSubmit = mentorEdit && m?.reviewStatus === 'DRAFT';
  const canReview = manager && m?.reviewStatus === 'PENDING_REVIEW';
  const infoRows: { key: string; label: string; value: string }[] = m
    ? [
        { key: 'kind', label: t('kindLabel'), value: t(m.contentType) },
        ...(m.file
          ? [
              {
                key: 'file',
                label: t('fileLabel'),
                value: m.file.originalFilename,
              },
              {
                key: 'size',
                label: t('sizeLabel'),
                value: fileSize(m.file.sizeBytes, language),
              },
            ]
          : []),
        { key: 'revision', label: t('revision'), value: String(m.revision) },
        {
          key: 'updated',
          label: t('updated'),
          value: instantLabel(m.updatedAt, language),
        },
        ...(m.availableAt
          ? [
              {
                key: 'available',
                label: t('availableFrom'),
                value: instantLabel(m.availableAt, language),
              },
            ]
          : []),
      ]
    : [];
  return (
    <Page
      prefix={prefix}
      title={t(manager ? 'review' : 'detailTitle')}
      onBack={() => navigation.goBack()}
      busy={busy}
      uncertain={!!command}
      showMockControls={false}
      footer={
        mentorEdit || canReview ? (
          <>
            {canSubmit && (
              <Button
                testID="material-detail-submit"
                icon="send"
                disabled={actionsDisabled}
                onPress={() => openDialog('submit')}
              >
                {t('submit')}
              </Button>
            )}
            {mentorEdit && (
              <Button
                testID="material-detail-edit"
                icon="edit"
                variant={canSubmit ? 'secondary' : 'primary'}
                disabled={actionsDisabled}
                onPress={() => {
                  edit();
                }}
              >
                {t(canSubmit ? 'edit' : 'editResubmit')}
              </Button>
            )}
            {canReview && (
              <>
                <Button
                  testID="review-detail-approve"
                  icon="task_alt"
                  disabled={actionsDisabled}
                  onPress={() => openDialog('approve')}
                >
                  {t('approve')}
                </Button>
                <Button
                  testID="review-detail-reject"
                  icon="close"
                  variant="danger"
                  disabled={actionsDisabled}
                  onPress={() => openDialog('reject')}
                >
                  {t('reject')}
                </Button>
              </>
            )}
          </>
        ) : undefined
      }
    >
      <ReadBlock
        data={m}
        busy={query.busy}
        error={query.error}
        retry={() => {
          query.refresh();
        }}
      >
        {m && (
          <>
            {m.reviewStatus === 'REJECTED' && m.rejectionReason && (
              <Alert testID={`${prefix}-rejected`}>
                {`${t('REJECTED')}: ${m.rejectionReason}` +
                  (m.reviewedAt
                    ? `\n${t('rejectedAt')} ${instantLabel(m.reviewedAt, language)}`
                    : '')}
              </Alert>
            )}
            {mine && m.reviewStatus === 'PENDING_REVIEW' && (
              <Notice testID="material-detail-pending">
                {t('pendingMine')}
              </Notice>
            )}
            {mine && m.reviewStatus === 'APPROVED' && (
              <Notice testID="material-detail-approved">
                {t('approvedMine')}
              </Notice>
            )}
            {manager && (
              <Alert
                testID="review-detail-impact"
                warning
              >
                {t('impact')}
              </Alert>
            )}
            <Card className="mx-space-0 px-space-16 py-space-16">
              <View className="flex-row gap-space-12">
                <MaterialTile item={m} />
                <View className="flex-1 gap-space-6">
                  <Text
                    accessibilityRole="header"
                    className="text-size-16 font-bvp-semibold text-mdy-ink"
                  >
                    {m.title}
                  </Text>
                  <MaterialStatus
                    item={m}
                    testID={`${prefix}-status`}
                  />
                </View>
              </View>
              <View className="gap-space-8">
                {infoRows.map((row) => (
                  <View
                    key={row.key}
                    testID={`${prefix}-${row.key}`}
                    accessible
                    className="flex-row justify-between gap-space-16"
                  >
                    <Text className="text-size-13 text-mdy-secondary">
                      {row.label}
                    </Text>
                    <Text
                      numberOfLines={2}
                      className="flex-1 text-right text-size-13 font-bvp-medium text-mdy-ink"
                    >
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
              {m.description && (
                <View className="border-t border-mdy-divider pt-space-12">
                  <Text className="text-size-14 leading-line-20 text-mdy-ink">
                    {m.description}
                  </Text>
                </View>
              )}
              {m.file || m.contentType === 'ARTICLE' ? (
                <Button
                  testID={`${prefix}-view`}
                  icon="visibility"
                  variant="secondary"
                  disabled={!query.online || busy}
                  onPress={() => openPreview(m.file?.id)}
                >
                  {t('view')}
                </Button>
              ) : (
                <Text
                  testID={`${prefix}-file-missing`}
                  className="text-size-13 text-mdy-danger"
                >
                  {t('fileMissing')}
                </Text>
              )}
            </Card>
            {m.attachments.length > 0 && (
              <View className="gap-space-8">
                <Text
                  accessibilityRole="header"
                  className="text-size-12 font-bvp-semibold text-mdy-secondary"
                >
                  {t('attachments')}
                </Text>
                {m.attachments.map((f) => (
                  <Pressable
                    key={f.id}
                    testID={`${prefix}-attachment-${f.id}`}
                    accessibilityRole="button"
                    onPress={() => openPreview(f.id)}
                    className="min-h-space-48 flex-row items-center gap-space-12 rounded-radius-14 border border-mdy-border bg-mdy-surface px-space-12 py-space-10 active:bg-mdy-muted2"
                  >
                    <Icon
                      name="attach_file"
                      size={20}
                    />
                    <Text
                      numberOfLines={2}
                      className="flex-1 text-size-14 text-mdy-ink"
                    >
                      {f.originalFilename}
                    </Text>
                    <Icon
                      name="open_in_new"
                      size={18}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ReadBlock>
      {!query.online && (
        <Alert
          testID="material-warning"
          warning
        >
          {t('offline')}
        </Alert>
      )}
      <Problem
        error={error}
        prefix={prefix}
      />
      {command && query.online && (
        <Button
          testID={`${prefix}-resend`}
          disabled={busy}
          onPress={() => {
            run(command);
          }}
        >
          {t('resend')}
        </Button>
      )}
      {dialog && m && (
        <ConfirmationDialog
          testID={`${dialog}-dialog`}
          title={`${t(dialog)} · ${t('revision')} ${m.revision}`}
          icon={
            dialog === 'submit'
              ? 'send'
              : dialog === 'approve'
                ? 'task_alt'
                : 'warning'
          }
          onClose={() => setDialog(undefined)}
        >
          <Text>{t(dialog === 'submit' ? 'submitBody' : 'impact')}</Text>
          {dialog === 'reject' && (
            <Field
              id="reject-reason"
              label={t('reason')}
              value={reason}
              onChange={setReason}
              max={2000}
            />
          )}
          <Button
            testID={`${dialog}-confirm`}
            disabled={
              !query.online ||
              (dialog === 'reject' &&
                (!reason.trim() || codePoints(reason.trim()) > 2000))
            }
            onPress={() => {
              run({ action: dialog, revision: dialogRevision.current, reason });
            }}
          >
            {t('confirm')}
          </Button>
          <Button
            variant="text"
            onPress={() => setDialog(undefined)}
          >
            {t('later')}
          </Button>
        </ConfirmationDialog>
      )}
    </Page>
  );
}
