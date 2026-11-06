import { useState, type PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { Button, Card, Chip, Icon, Text } from '@/components/ui/primitives';
import { useAttendanceQuery } from '../hooks';
import { useUtilityTabs } from '../components/useUtilityTabs';
import { isoDate, isoTime } from '../model';
import { More, Page, QueryBlock } from '../components/shared';
import type { Audit } from '../types';

export function AttendanceAuditsScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'AttendanceAudits'>) {
  return (
    <AttendanceAuditsView
      params={route.params}
      onBack={navigation.goBack}
    />
  );
}
export function AttendanceAuditsView({
  params,
  onBack,
  detailTabs,
}: {
  params: AuthStackParams['AttendanceAudits'];
  onBack: () => void;
  detailTabs?: import('../components/shared').SessionDetailTabs;
}) {
  const { t } = useTranslation('attendance');
  const utility = useUtilityTabs(params, 'history');
  const [filter, setFilter] = useState({
      enrollmentId: params.enrollmentId,
      makeupPlacementId: params.makeupPlacementId,
      studentName: params.studentName,
    }),
    [invalid, setInvalid] = useState(false);
  const query = useAttendanceQuery({
    kind: 'audits',
    role: 'MANAGER',
    sessionId: params.sessionId,
    pageSize: 20,
    ...(filter.enrollmentId ? { enrollmentId: filter.enrollmentId } : {}),
    ...(filter.makeupPlacementId
      ? { makeupPlacementId: filter.makeupPlacementId }
      : {}),
  });
  const names = useAttendanceQuery(
    {
      kind: 'attendance',
      role: 'MANAGER',
      sessionId: params.sessionId,
      pageSize: 100,
    },
    !filter.studentName,
    true
  );
  const clear = () =>
    setFilter({
      enrollmentId: undefined,
      makeupPlacementId: undefined,
      studentName: undefined,
    });
  // Invalid server filters must be removed instead of being applied to a partial page.
  if (
    query.result?.kind === 'error' &&
    query.result.code === 'ATTENDANCE_ENROLLMENT_NOT_ELIGIBLE' &&
    filter.enrollmentId
  ) {
    clear();
    setInvalid(true);
  }
  return (
    <Page
      prefix="audit"
      title={t(utility.enabled ? 'utility.management' : 'audit.title')}
      {...utility.pageProps}
      {...detailTabs}
      subtitle={params.classTitle}
      onBack={onBack}
      refresh={query.refresh}
      onEnd={() => {
        if (
          (query.data?.audits.length ?? 0) < (query.data?.total ?? 0) &&
          !query.busy &&
          !query.footerError &&
          !query.offline
        )
          query.more();
      }}
    >
      {filter.enrollmentId && (
        <Button
          testID="audit-filter-chip"
          variant="secondary"
          onPress={clear}
        >
          <Text>{`${filter.studentName ?? t('nameMissing')} ×`}</Text>
        </Button>
      )}
      {invalid && (
        <Text testID="audit-filter-invalid">{t('audit.filterInvalid')}</Text>
      )}
      <QueryBlock
        query={query}
        prefix="audit"
      >
        <Text
          testID="audit-count"
          className="text-size-12 font-bvp-semibold"
        >
          {t('audit.count', { count: query.data?.total ?? 0 })}
        </Text>
        <Card
          testID="audit-results-card"
          className={
            query.data?.total === 0
              ? 'mx-space-0 p-space-24 gap-space-12'
              : 'mx-space-0 p-space-6 gap-space-0'
          }
        >
          {query.data?.audits.map((item) => {
            const row = names.data?.rows.find(
              (value) =>
                value.enrollmentId === item.enrollmentId &&
                value.entryType === item.entryType &&
                value.makeupPlacementId === item.makeupPlacementId
            );
            const name =
              filter.studentName ??
              row?.name ??
              (!names.data
                ? names.result?.kind === 'error'
                  ? t('audit.nameFailed')
                  : t('loading')
                : t('audit.unknownStudent'));
            return (
              <AuditRow
                key={item.id}
                item={item}
                name={name}
              />
            );
          })}
          {query.data?.total === 0 && (
            <View
              testID={
                filter.enrollmentId ? 'audit-empty-filter' : 'audit-empty'
              }
              className="gap-space-12"
            >
              <Text>
                {t(filter.enrollmentId ? 'audit.emptyFilter' : 'audit.empty', {
                  name: filter.studentName ?? t('nameMissing'),
                })}
              </Text>
              {filter.enrollmentId && (
                <Button
                  testID="audit-view-all"
                  variant="text"
                  onPress={clear}
                >
                  {t('audit.viewAll')}
                </Button>
              )}
            </View>
          )}
        </Card>
        {!filter.studentName &&
          names.result?.kind === 'error' &&
          !names.offline && (
            <Button
              testID="audit-name-retry"
              variant="text"
              onPress={() => names.refresh()}
            >
              {t('retry')}
            </Button>
          )}
        <More
          query={query}
          count={query.data?.audits.length ?? 0}
          prefix="audit"
        />
      </QueryBlock>
    </Page>
  );
}
function AuditRow({ item, name }: { item: Audit; name: string }) {
  const { t } = useTranslation('attendance');
  const [evidence, setEvidence] = useState(false);
  const details = item.recoveryEvidence;
  const statusName = (value: string) =>
    t(
      value === 'SCHEDULED'
        ? 'scheduled'
        : value === 'IN_PROGRESS'
          ? 'inProgress'
          : value === 'COMPLETED'
            ? 'completed'
            : 'cancelled'
    );
  const instant = (value: string | null) =>
    value ? `${isoTime(value)} ${isoDate(value)}` : '';
  return (
    <View
      testID={`audit-row-${item.id}`}
      className="p-space-16 gap-space-12 border-b border-mdy-divider"
    >
      <View className="flex-row flex-wrap justify-between gap-space-8">
        <Chip
          variant={
            item.action === 'RECOVER'
              ? 'info'
              : item.action === 'CORRECT'
                ? 'warning'
                : 'neutral'
          }
        >
          {t(`action.${item.action}`)}
        </Chip>
        <Text
          testID={`audit-row-time-${item.id}`}
          className="text-size-12 text-mdy-secondary"
        >
          {instant(item.occurredAt)}
        </Text>
      </View>
      <Text
        testID={`audit-row-student-${item.id}`}
        className="text-size-14 font-bvp-medium"
      >
        {name}
      </Text>
      {item.entryType === 'MAKEUP' && <Chip variant="info">{t('makeup')}</Chip>}
      <Text testID={`audit-row-change-${item.id}`}>
        {item.oldStatus
          ? `${t(`editor.${item.oldStatus.toLowerCase()}`)} → `
          : ''}
        {t(`editor.${item.newStatus.toLowerCase()}`)}
      </Text>
      <Text
        testID={`audit-row-actor-${item.id}`}
        className="text-size-12 text-mdy-secondary"
      >
        {t('audit.by', { name: item.actor ?? t('nameMissing') })}
      </Text>
      {item.reason && (
        <EvidenceField label={t('audit.reasonLabel')}>
          <ExpandableText
            testID={`audit-row-reason-${item.id}`}
            text={item.reason}
          />
        </EvidenceField>
      )}
      {details && (
        <>
          <Pressable
            testID={`audit-evidence-toggle-${item.id}`}
            accessibilityRole="button"
            accessibilityState={{ expanded: evidence }}
            onPress={() => setEvidence(!evidence)}
            className="flex-row items-center justify-between min-h-space-44 border-t border-mdy-divider pt-space-8"
          >
            <View className="flex-row items-center gap-space-8">
              <Icon
                name="description"
                size={18}
              />
              <Text className="text-size-13 font-bvp-semibold text-mdy-link">
                {t(evidence ? 'audit.evidenceClose' : 'audit.evidenceOpen')}
              </Text>
            </View>
            <View
              style={{ transform: [{ rotate: evidence ? '180deg' : '0deg' }] }}
            >
              <Icon
                name="expand_more"
                size={20}
              />
            </View>
          </Pressable>
          {evidence && (
            <View
              testID={`audit-evidence-${item.id}`}
              className="gap-space-16 rounded-radius-14 bg-mdy-muted2 p-space-14"
            >
              <EvidenceField label={t('audit.evidenceNote')}>
                <ExpandableText
                  testID={`audit-evidence-note-${item.id}`}
                  text={details.evidenceNote}
                />
              </EvidenceField>
              <View className="border-t border-mdy-divider pt-space-12 gap-space-12">
                <EvidenceField label={t('audit.basis')}>
                  <Text className="text-size-13 font-bvp-medium">
                    {t(`basis.${details.admissionBasis}`)}
                  </Text>
                </EvidenceField>
                <EvidenceField label={t('audit.paymentLabel')}>
                  <AuditTimestamp value={details.paidAt} />
                </EvidenceField>
              </View>
              <View className="border-t border-mdy-divider pt-space-12 gap-space-12">
                <EvidenceField label={t('audit.sessionStatus')}>
                  <View className="flex-row flex-wrap items-center gap-space-6">
                    <Chip variant="neutral">
                      {statusName(details.oldSessionStatus)}
                    </Chip>
                    <Text className="text-size-13 text-mdy-secondary">→</Text>
                    <Chip variant="info">
                      {statusName(details.newSessionStatus)}
                    </Chip>
                  </View>
                </EvidenceField>
                <View className="flex-row gap-space-12">
                  <View className="flex-1 min-w-0">
                    <EvidenceField label={t('audit.startLabel')}>
                      <AuditTimestamp
                        value={details.newActualStartedAt}
                        previous={details.oldActualStartedAt}
                      />
                    </EvidenceField>
                  </View>
                  <View className="flex-1 min-w-0 border-l border-mdy-divider pl-space-12">
                    <EvidenceField label={t('audit.endLabel')}>
                      <AuditTimestamp
                        value={details.newActualEndedAt}
                        previous={details.oldActualEndedAt}
                      />
                    </EvidenceField>
                  </View>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

function EvidenceField({
  label,
  children,
}: PropsWithChildren<{ label: string }>) {
  return (
    <View className="gap-space-6">
      <Text className="text-size-11 font-bvp-medium text-mdy-secondary">
        {label}
      </Text>
      {children}
    </View>
  );
}

function ExpandableText({ text, testID }: { text: string; testID: string }) {
  const { t } = useTranslation('attendance');
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);
  return (
    <View className="gap-space-4">
      <Text
        testID={testID}
        numberOfLines={expanded ? undefined : 3}
        onTextLayout={(event) => {
          if (!expanded) setTruncated(event.nativeEvent.lines.length > 3);
        }}
        className="text-size-13"
      >
        {text}
      </Text>
      {(truncated || expanded) && (
        <Pressable
          testID={`${testID}-expand`}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded(!expanded)}
          className="self-start min-h-space-44 justify-center"
        >
          <Text className="text-size-12 font-bvp-semibold text-mdy-link">
            {t(expanded ? 'audit.showLess' : 'audit.showMore')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function AuditTimestamp({
  value,
  previous,
}: {
  value: string | null;
  previous?: string | null;
}) {
  const { t } = useTranslation('attendance');
  return (
    <View className="gap-space-4">
      <Text className="text-size-15 font-bvp-semibold">
        {value ? isoTime(value) : '—'}
      </Text>
      {!!value && (
        <Text className="text-size-11 text-mdy-secondary">
          {isoDate(value)}
        </Text>
      )}
      {!!previous && previous !== value && (
        <Text className="text-size-11 text-mdy-tertiary">
          {t('audit.previousTime', {
            time: isoTime(previous),
            date: isoDate(previous),
          })}
        </Text>
      )}
    </View>
  );
}
