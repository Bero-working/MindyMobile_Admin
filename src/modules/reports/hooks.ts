import { useRemoteRead, useAppendedList } from '@/shared/hooks/useRemoteRead';
import { rangeKey, type DateRange } from './model';
import { useReports } from './ReportsProvider';
import type { ReportRole } from './service';
import type {
  EnrollmentSummary,
  HistoryItem,
  ProgressSummary,
  ProgressUnit,
} from './schema';

const fetched = <
  T extends { items: object[]; total: number; page: number; pageSize: number },
>(
  data: T
) => ({
  ...data,
  hasMore:
    data.items.length > 0 &&
    (data.page - 1) * data.pageSize + data.items.length < data.total,
  next: data.page + 1,
});
export function useClassSummary(
  role: ReportRole,
  classId: string,
  range: DateRange | undefined,
  enabled = true
) {
  const service = useReports();
  return useAppendedList(
    `summary:${role}:${classId}:${rangeKey(range)}`,
    async (next) =>
      fetched(
        await service.classSummary(role, classId, Number(next ?? 1), range)
      ),
    (row: EnrollmentSummary) => row.enrollmentId,
    enabled
  );
}
export function useClassProgress(classId: string, enabled: boolean) {
  const service = useReports();
  return useAppendedList(
    `progress:${classId}`,
    async (next) =>
      fetched(await service.classProgress(classId, Number(next ?? 1))),
    (row: ProgressSummary) => row.enrollmentId,
    enabled
  );
}
export function useStudentSummary(
  classId: string,
  studentId: string,
  range: DateRange | undefined,
  enabled: boolean
) {
  const service = useReports();
  return useRemoteRead(
    `student-summary:${classId}:${studentId}:${rangeKey(range)}`,
    () => service.studentSummary(classId, studentId, range),
    enabled
  );
}
export function useStudentHistory(
  classId: string,
  studentId: string,
  range: DateRange | undefined,
  enabled: boolean
) {
  const service = useReports();
  return useAppendedList(
    `student-history:${classId}:${studentId}:${rangeKey(range)}`,
    async (next) =>
      fetched(
        await service.studentHistory(
          classId,
          studentId,
          Number(next ?? 1),
          range
        )
      ),
    (row: HistoryItem) => `${row.enrollmentId}:${row.sessionId}`,
    enabled
  );
}
export function useStudentProgress(
  classId: string,
  studentId: string,
  enabled: boolean
) {
  const service = useReports();
  return useAppendedList(
    `student-progress:${classId}:${studentId}`,
    async (next) =>
      fetched(
        await service.studentProgress(classId, studentId, Number(next ?? 1))
      ),
    (row: ProgressUnit) => `${row.enrollmentId}:${row.classUnitId}`,
    enabled
  );
}
export function useUnitNames(classId: string, enabled: boolean) {
  const service = useReports();
  return useRemoteRead(
    `units:${classId}`,
    () => service.units(classId),
    enabled
  );
}
