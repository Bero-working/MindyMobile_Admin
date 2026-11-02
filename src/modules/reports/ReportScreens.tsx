import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParams } from '@/modules/auth/AuthApp';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { MessageStudentButton } from '@/modules/chat/EntryPoints';
import { StatusChip } from '@/modules/teaching/components/rows';
import { ListPage } from '@/components/ui/list-page';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Chip,
  Icon,
  Text,
} from '@/components/ui/primitives';
import { useMindyTheme } from '@/components/ui/theme';
import {
  AsOfLine,
  AttendanceSummaryRow,
  CountHeading,
  CountLines,
  ListFooter,
  MeaningButton,
  Note,
  RangeFilter,
  RateText,
  ReadGate,
  ReportTabs,
  RowSkeleton,
} from './components';
import {
  useClassProgress,
  useClassSummary,
  useStudentHistory,
  useStudentProgress,
  useStudentSummary,
  useUnitNames,
} from './hooks';
import { formatAsOf, formatDay, formatPercent, type DateRange } from './model';
import type { HistoryItem, ProgressUnit } from './schema';

const rangeRow = (
  prefix: string,
  value: DateRange | undefined,
  onChange: (range: DateRange | undefined) => void
) => (
  <View className="flex-row flex-wrap items-center justify-between gap-space-8">
    <RangeFilter
      prefix={prefix}
      value={value}
      onChange={onChange}
    />
    <MeaningButton prefix={prefix} />
  </View>
);
export function MentorAttendanceReportScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'MentorAttendanceReport'>) {
  const { t } = useTranslation('reports');
  const { state } = useAuth();
  const { classId, classTitle } = route.params;
  const allowed = state.user?.role === 'MENTOR';
  const [tab, setTab] = useState<'attendance' | 'progress'>('attendance');
  const [range, setRange] = useState<DateRange>();
  const attendance = useClassSummary(
    'MENTOR',
    classId,
    range,
    allowed && tab === 'attendance'
  );
  const progress = useClassProgress(classId, allowed && tab === 'progress');
  const prefix = 'mentor-report';
  const page = {
    prefix,
    title: t('mentor.title'),
    subtitle: classTitle,
    backLabel: t('back'),
    onBack: navigation.goBack,
    headerExtra: (
      <ReportTabs
        prefix={prefix}
        value={tab}
        onChange={setTab}
        tabs={[
          ['attendance', t('mentor.tabAttendance')],
          ['progress', t('mentor.tabProgress')],
        ]}
      />
    ),
  };
  if (!allowed)
    return (
      <ListPage
        {...page}
        rowKey={String}
        renderRow={() => <></>}
        header={<Alert testID={`${prefix}-denied`}>{t('denied')}</Alert>}
      />
    );
  if (tab === 'progress')
    return (
      <ListPage
        {...page}
        refresh={progress.refresh}
        rows={progress.items}
        rowKey={(row) => row.enrollmentId}
        renderRow={(row) => (
          <Pressable
            testID={`${prefix}-progress-${row.enrollmentId}`}
            accessibilityRole="button"
            className="active:opacity-80"
            onPress={() =>
              navigation.navigate('MentorStudentReport', {
                classId,
                studentId: row.studentId,
                studentName: row.displayName,
                tab: 'progress',
                ...(classTitle ? { classTitle } : {}),
              })
            }
          >
            <Card className="mx-space-0 gap-space-8 p-space-14">
              <View className="flex-row items-center gap-space-12">
                <Avatar
                  name={row.displayName}
                  size={36}
                />
                <Text className="flex-1 text-size-15 font-bvp-semibold">
                  {row.displayName}
                </Text>
                <Icon
                  name="chevron_right"
                  size={20}
                />
              </View>
              <Text className="text-size-13 text-mdy-secondary">
                {[
                  ...(row.storedUnitCount
                    ? [t('mentor.stored', { count: row.storedUnitCount })]
                    : []),
                  ...(row.untrackedUnitCount
                    ? [t('mentor.untracked', { count: row.untrackedUnitCount })]
                    : []),
                ].join(' · ')}
              </Text>
              {row.invalidStoredUnitCount > 0 && (
                <InvalidLine>
                  {t('mentor.invalidCount', {
                    count: row.invalidStoredUnitCount,
                  })}
                </InvalidLine>
              )}
            </Card>
          </Pressable>
        )}
        header={
          <View className="gap-space-12 pb-space-12">
            <ReadGate
              prefix={prefix}
              read={progress}
              onBack={navigation.goBack}
              skeleton={<RowSkeleton />}
            >
              <Note testID={`${prefix}-progress-note`}>
                {t('mentor.progressNote')}
              </Note>
              {progress.data && (
                <>
                  <CountHeading testID={`${prefix}-count`}>
                    {t('enrollments', { count: progress.data.total })}
                  </CountHeading>
                  <AsOfLine
                    testID={`${prefix}-as-of`}
                    asOf={progress.data.asOf}
                    timeZone={progress.data.timeZone}
                  />
                  {progress.data.total === 0 && (
                    <Text testID={`${prefix}-empty`}>{t('empty')}</Text>
                  )}
                </>
              )}
            </ReadGate>
          </View>
        }
        footer={
          <ListFooter
            prefix={prefix}
            list={progress}
          />
        }
      />
    );
  return (
    <ListPage
      {...page}
      refresh={attendance.refresh}
      rows={attendance.items}
      rowKey={(row) => row.enrollmentId}
      renderRow={(row) => (
        <AttendanceSummaryRow
          item={row}
          prefix={prefix}
          onPress={() =>
            navigation.navigate('MentorStudentReport', {
              classId,
              studentId: row.student.id,
              ...(row.student.displayName
                ? { studentName: row.student.displayName }
                : {}),
              ...(classTitle ? { classTitle } : {}),
              ...(range ? { range } : {}),
            })
          }
        />
      )}
      header={
        <View className="gap-space-12 pb-space-12">
          {attendance.error?.kind !== 'denied' &&
            attendance.error?.kind !== 'notFound' &&
            rangeRow(prefix, range, setRange)}
          <ReadGate
            prefix={prefix}
            read={attendance}
            onBack={navigation.goBack}
            skeleton={<RowSkeleton />}
          >
            {attendance.data && (
              <>
                <CountHeading testID={`${prefix}-count`}>
                  {t('enrollments', { count: attendance.data.total })}
                </CountHeading>
                <AsOfLine
                  testID={`${prefix}-as-of`}
                  asOf={attendance.data.asOf}
                  timeZone={attendance.data.timeZone}
                />
                {attendance.data.readonly && (
                  <Note testID={`${prefix}-readonly`}>
                    {t('mentor.readonly')}
                  </Note>
                )}
                {attendance.data.total === 0 && (
                  <Text testID={`${prefix}-empty`}>{t('empty')}</Text>
                )}
              </>
            )}
          </ReadGate>
        </View>
      }
      footer={
        <ListFooter
          prefix={prefix}
          list={attendance}
        />
      }
    />
  );
}
function InvalidLine({ children }: { children: string }) {
  const { colors } = useMindyTheme();
  return (
    <View className="flex-row items-center gap-space-6">
      <Icon
        name="warning"
        size={16}
        color={colors.warning}
      />
      <Text className="flex-1 text-size-13 text-mdy-warning">{children}</Text>
    </View>
  );
}
const applicabilityTone = {
  NOT_STARTED: 'neutral',
  NOT_ELIGIBLE: 'neutral',
  LEGACY_NO_DATA: 'neutral',
  PAYMENT_PENDING: 'warning',
  MAKEUP_PENDING: 'warning',
  MAKEUP_CREDITED: 'success',
} as const;
function HistoryRow({
  item,
  timeZone,
  onPress,
}: {
  item: HistoryItem;
  timeZone: string;
  onPress: () => void;
}) {
  const { t } = useTranslation('reports');
  const id = `student-report-session-${item.sessionId}`;
  const physical = item.attendanceStatus
    ? t(`status.${item.attendanceStatus}`)
    : t('status.none');
  const showPhysical =
    item.attendanceStatus !== null ||
    item.attendanceApplicability === 'ELIGIBLE';
  const applicability =
    item.attendanceApplicability === 'ELIGIBLE'
      ? undefined
      : item.attendanceApplicability;
  const when = formatAsOf(item.startsAt, timeZone);
  return (
    <Pressable
      testID={id}
      accessibilityRole="button"
      accessibilityLabel={[
        item.title,
        when,
        ...(showPhysical
          ? [t('mentor.attendanceLine', { status: physical })]
          : []),
        ...(item.creditedAttendanceStatus
          ? [
              t('mentor.creditLine', {
                status: t(`status.${item.creditedAttendanceStatus}`),
              }),
            ]
          : []),
        ...(applicability ? [t(`status.${applicability}`)] : []),
      ].join(', ')}
      onPress={onPress}
      className="active:opacity-80"
    >
      <Card className="mx-space-0 gap-space-6 p-space-14">
        <View className="flex-row items-start gap-space-8">
          <Text className="flex-1 text-size-14 font-bvp-semibold">
            {item.title}
          </Text>
          <Icon
            name="chevron_right"
            size={20}
          />
        </View>
        <View className="flex-row flex-wrap items-center gap-space-8">
          <Text className="text-size-13 text-mdy-secondary">{when}</Text>
          <StatusChip
            group="mentorSessionStatus"
            value={item.sessionStatus}
          />
        </View>
        {showPhysical && (
          <Text
            testID={`${id}-attendance`}
            className="text-size-13"
          >
            {t('mentor.attendanceLine', { status: physical })}
          </Text>
        )}
        {item.creditedAttendanceStatus && (
          <Text
            testID={`${id}-credit`}
            className="text-size-13"
          >
            {t('mentor.creditLine', {
              status: t(`status.${item.creditedAttendanceStatus}`),
            })}
          </Text>
        )}
        {(applicability || item.assignmentType === 'SUBSTITUTE') && (
          <View className="flex-row flex-wrap gap-space-8">
            {applicability && (
              <Chip
                testID={`${id}-applicability`}
                variant={applicabilityTone[applicability]}
              >
                {t(`status.${applicability}`)}
              </Chip>
            )}
            {item.assignmentType === 'SUBSTITUTE' && (
              <Chip variant="neutral">{t('mentor.substitute')}</Chip>
            )}
          </View>
        )}
      </Card>
    </Pressable>
  );
}
const progressTone = {
  NOT_STARTED: 'neutral',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
} as const;
function UnitRow({
  item,
  name,
  timeZone,
}: {
  item: ProgressUnit;
  name: string;
  timeZone: string;
}) {
  const { t, i18n } = useTranslation('reports');
  const id = `student-report-unit-${item.classUnitId}`;
  const untracked = item.trackingStatus === 'UNTRACKED';
  return (
    <Card
      testID={id}
      className="mx-space-0 gap-space-6 p-space-14"
    >
      <Text className="text-size-14 font-bvp-semibold">{name}</Text>
      {untracked ? (
        <Text
          testID={`${id}-percent`}
          className="text-size-13 text-mdy-secondary"
        >
          {t('mentor.unitUntracked')}
        </Text>
      ) : (
        <View className="flex-row flex-wrap items-center gap-space-8">
          {item.status && (
            <Chip
              testID={`${id}-status`}
              variant={progressTone[item.status]}
            >
              {t(`progressStatus.${item.status}`)}
            </Chip>
          )}
          {item.dataQuality === 'INVALID_PERCENT' ? (
            <InvalidLine>{t('mentor.unitInvalid')}</InvalidLine>
          ) : (
            <Text
              testID={`${id}-percent`}
              className="text-size-13"
            >
              {item.dataQuality === 'VALID' && item.progressPercent !== null
                ? formatPercent(item.progressPercent, i18n.language)
                : t('mentor.noPercent')}
            </Text>
          )}
        </View>
      )}
      {item.completedAt && (
        <Text className="text-size-12 text-mdy-secondary">
          {t('mentor.completedAt', {
            date: formatDay(item.completedAt, timeZone),
          })}
        </Text>
      )}
    </Card>
  );
}
export function MentorStudentReportScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'MentorStudentReport'>) {
  const { t } = useTranslation('reports');
  const { state } = useAuth();
  const { classId, studentId, studentName, classTitle } = route.params;
  const allowed = state.user?.role === 'MENTOR';
  const [tab, setTab] = useState(route.params.tab ?? 'history');
  // A copy: changing it here must not move the range of the class screen.
  const [range, setRange] = useState(route.params.range);
  const onHistory = allowed && tab === 'history';
  const onProgress = allowed && tab === 'progress';
  const summary = useStudentSummary(classId, studentId, range, onHistory);
  const history = useStudentHistory(classId, studentId, range, onHistory);
  const progress = useStudentProgress(classId, studentId, onProgress);
  const units = useUnitNames(classId, onProgress);
  const prefix = 'student-report';
  const page = {
    prefix,
    title: studentName ?? t('mentor.student'),
    subtitle: classTitle,
    backLabel: t('back'),
    onBack: navigation.goBack,
    headerExtra: (
      <ReportTabs
        prefix={prefix}
        value={tab}
        onChange={setTab}
        tabs={[
          ['history', t('mentor.tabHistory')],
          ['progress', t('mentor.tabProgress')],
        ]}
      />
    ),
  };
  if (!allowed)
    return (
      <ListPage
        {...page}
        rowKey={String}
        renderRow={() => <></>}
        header={<Alert testID={`${prefix}-denied`}>{t('denied')}</Alert>}
      />
    );
  if (tab === 'progress') {
    const names = new Map(units.data?.items.map((u) => [u.id, u.title]));
    return (
      <ListPage
        {...page}
        refresh={progress.refresh}
        rows={progress.items}
        rowKey={(row) => `${row.enrollmentId}:${row.classUnitId}`}
        renderRow={(row, index) => (
          <UnitRow
            item={row}
            timeZone={progress.data?.timeZone ?? 'Asia/Ho_Chi_Minh'}
            name={
              names.get(row.classUnitId) ??
              t('mentor.unitFallback', { index: index + 1 })
            }
          />
        )}
        header={
          <View className="gap-space-12 pb-space-12">
            <ReadGate
              prefix={prefix}
              read={progress}
              onBack={navigation.goBack}
              skeleton={<RowSkeleton />}
            >
              <Note testID={`${prefix}-progress-note`}>
                {t('mentor.progressNote')}
              </Note>
              {progress.data && (
                <>
                  <CountHeading testID={`${prefix}-count`}>
                    {t('mentor.units', { count: progress.data.total })}
                  </CountHeading>
                  <AsOfLine
                    testID={`${prefix}-as-of`}
                    asOf={progress.data.asOf}
                    timeZone={progress.data.timeZone}
                  />
                  {progress.data.total === 0 && (
                    <Text testID={`${prefix}-empty`}>
                      {t('mentor.noUnits')}
                    </Text>
                  )}
                </>
              )}
            </ReadGate>
          </View>
        }
        footer={
          <ListFooter
            prefix={prefix}
            list={progress}
          />
        }
      />
    );
  }
  const lost =
    summary.error?.kind === 'denied' || summary.error?.kind === 'notFound'
      ? summary
      : history;
  const blocked =
    lost.error?.kind === 'denied' || lost.error?.kind === 'notFound';
  return (
    <ListPage
      {...page}
      refresh={() => Promise.allSettled([summary.refresh(), history.refresh()])}
      rows={blocked ? [] : history.items}
      rowKey={(row) => `${row.enrollmentId}:${row.sessionId}`}
      renderRow={(row) => (
        <HistoryRow
          item={row}
          timeZone={history.data?.timeZone ?? 'Asia/Ho_Chi_Minh'}
          onPress={() =>
            navigation.navigate('SessionContext', {
              sessionId: row.sessionId,
              ...(classTitle ? { classTitle } : {}),
            })
          }
        />
      )}
      header={
        blocked ? (
          <ReadGate
            prefix={prefix}
            read={lost}
            onBack={navigation.goBack}
          >
            {null}
          </ReadGate>
        ) : (
          <View className="gap-space-12 pb-space-12">
            <MessageStudentButton
              studentId={studentId}
              studentName={studentName}
            />
            {rangeRow(prefix, range, setRange)}
            <ReadGate
              prefix={`${prefix}-summary`}
              read={summary}
            >
              {summary.data && (
                <Card className="mx-space-0 gap-space-8 p-space-16">
                  <RateText
                    large
                    rate={summary.data.rate}
                    testID={`${prefix}-rate`}
                  />
                  <CountLines
                    counts={summary.data}
                    prefix={prefix}
                  />
                  <AsOfLine
                    testID={`${prefix}-as-of`}
                    asOf={summary.data.asOf}
                    timeZone={summary.data.timeZone}
                  />
                </Card>
              )}
            </ReadGate>
            <Note testID={`${prefix}-scope`}>{t('mentor.historyScope')}</Note>
            {(summary.data ?? history.data)?.readonly && (
              <Note testID={`${prefix}-readonly`}>{t('mentor.readonly')}</Note>
            )}
            <ReadGate
              prefix={prefix}
              read={history}
              skeleton={<RowSkeleton />}
            >
              {history.data && (
                <>
                  <CountHeading testID={`${prefix}-count`}>
                    {t('mentor.sessions', { count: history.data.total })}
                  </CountHeading>
                  {history.data.total === 0 && (
                    <View
                      testID={`${prefix}-empty`}
                      className="gap-space-8"
                    >
                      <Text>
                        {t(
                          range ? 'mentor.noSessions' : 'mentor.noSessionsAll'
                        )}
                      </Text>
                      {range && (
                        <Button
                          testID={`${prefix}-view-all`}
                          variant="text"
                          size="sm"
                          onPress={() => setRange(undefined)}
                        >
                          {t('mentor.viewAll')}
                        </Button>
                      )}
                    </View>
                  )}
                </>
              )}
            </ReadGate>
          </View>
        )
      }
      footer={
        blocked ? null : (
          <ListFooter
            prefix={prefix}
            list={history}
          />
        )
      }
    />
  );
}
export function ManagerAttendanceReportScreen({
  route,
  navigation,
}: NativeStackScreenProps<AuthStackParams, 'ManagerAttendanceReport'>) {
  const { t } = useTranslation('reports');
  const { state } = useAuth();
  const { classId, classTitle } = route.params;
  const allowed = state.user?.role === 'MANAGER';
  const [range, setRange] = useState<DateRange>();
  const report = useClassSummary('MANAGER', classId, range, allowed);
  const prefix = 'manager-report';
  const denied = !allowed || report.error?.kind === 'denied';
  return (
    <ListPage
      prefix={prefix}
      title={t('manager.title')}
      subtitle={classTitle}
      backLabel={t('back')}
      onBack={navigation.goBack}
      refresh={allowed ? report.refresh : undefined}
      rows={allowed ? report.items : []}
      rowKey={(row) => row.enrollmentId}
      renderRow={(row) => (
        <AttendanceSummaryRow
          item={row}
          prefix={prefix}
        />
      )}
      header={
        denied ? (
          <Alert testID={`${prefix}-denied`}>{t('denied')}</Alert>
        ) : (
          <View className="gap-space-12 pb-space-12">
            {report.error?.kind !== 'notFound' &&
              rangeRow(prefix, range, setRange)}
            <ReadGate
              prefix={prefix}
              read={report}
              onBack={navigation.goBack}
              skeleton={<RowSkeleton />}
            >
              {report.data && (
                <>
                  <CountHeading testID={`${prefix}-count`}>
                    {t('enrollments', { count: report.data.total })}
                  </CountHeading>
                  <AsOfLine
                    testID={`${prefix}-as-of`}
                    asOf={report.data.asOf}
                    timeZone={report.data.timeZone}
                  />
                  {report.data.total === 0 && (
                    <Text testID={`${prefix}-empty`}>{t('empty')}</Text>
                  )}
                </>
              )}
            </ReadGate>
          </View>
        )
      }
      footer={
        <ListFooter
          prefix={prefix}
          list={report}
        />
      }
    />
  );
}
