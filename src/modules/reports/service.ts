import { z } from 'zod';
import {
  ApiError,
  createApiClient,
  safeSegment,
  type ApiClientOptions,
} from '@/shared/http/apiClient';
import { rangeQuery, type DateRange } from './model';
import {
  classSummaryPage,
  historyPage,
  progressPage,
  progressUnitPage,
  studentSummary,
  unitLookup,
} from './schema';

export const REPORT_PAGE_SIZE = 20;
export type ReportRole = 'MENTOR' | 'MANAGER';
export function createReportsService(options: ApiClientOptions = {}) {
  const api = createApiClient(options);
  const mentor = (classId: string) => `/mentor/classes/${safeSegment(classId)}`;
  const student = (classId: string, studentId: string) =>
    `${mentor(classId)}/students/${safeSegment(studentId)}`;
  const paged = async <T extends { page: number; pageSize: number }>(
    schema: z.ZodType<T>,
    url: string,
    page: number,
    extra: Record<string, string> = {}
  ) => {
    const data = await api.read(schema, url, {
      params: { page, pageSize: REPORT_PAGE_SIZE, ...extra },
    });
    if (data.page !== page || data.pageSize !== REPORT_PAGE_SIZE)
      throw new ApiError('error', 'INVALID_RESPONSE');
    return data;
  };
  const sameClass = <T extends { classId: string }>(
    data: T,
    classId: string
  ) => {
    if (data.classId !== classId)
      throw new ApiError('error', 'INVALID_RESPONSE');
    return data;
  };
  return {
    async classSummary(
      role: ReportRole,
      classId: string,
      page: number,
      range?: DateRange
    ) {
      const root =
        role === 'MENTOR'
          ? mentor(classId)
          : `/management/classes/${safeSegment(classId)}`;
      return sameClass(
        await paged(
          classSummaryPage,
          `${root}/attendance-summary`,
          page,
          rangeQuery(range)
        ),
        classId
      );
    },
    async studentSummary(
      classId: string,
      studentId: string,
      range?: DateRange
    ) {
      return sameClass(
        await api.read(
          studentSummary,
          `${student(classId, studentId)}/attendance-summary`,
          { params: rangeQuery(range) }
        ),
        classId
      );
    },
    async studentHistory(
      classId: string,
      studentId: string,
      page: number,
      range?: DateRange
    ) {
      return sameClass(
        await paged(
          historyPage,
          `${student(classId, studentId)}/attendance`,
          page,
          rangeQuery(range)
        ),
        classId
      );
    },
    classProgress: (classId: string, page: number) =>
      paged(progressPage, `${mentor(classId)}/progress`, page),
    studentProgress: (classId: string, studentId: string, page: number) =>
      paged(progressUnitPage, `${student(classId, studentId)}/progress`, page),
    /** Lookup for chapter names only; a failure never blocks the progress rows. */
    units: (classId: string) =>
      api.read(unitLookup, `${mentor(classId)}/units`, {
        params: { page: 1, pageSize: 100 },
      }),
  };
}
export type ReportsService = ReturnType<typeof createReportsService>;
