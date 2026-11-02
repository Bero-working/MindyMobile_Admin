import axios, { type AxiosInstance } from 'axios';
import {
  displayDate,
  formatAsOf,
  formatPercent,
  formatRate,
  rangeProblem,
  rangeQuery,
} from '@/modules/reports/model';
import { createReportsService } from '@/modules/reports/service';
import { ApiError } from '@/shared/http/apiClient';

const classId = '11111111-1111-4111-8111-111111111111';
const studentId = '22222222-2222-4222-8222-222222222222';
const enrollmentId = '33333333-3333-4333-8333-333333333333';
const source = {
  asOf: '2026-11-02T07:32:00.000Z',
  timeZone: 'Asia/Ho_Chi_Minh',
};
const counts = {
  present: 5,
  absent: 1,
  unmarked: 0,
  excluded: 4,
  makeupPending: 1,
  finalizedEligibleCount: 6,
  rate: 83.33,
};
const summaryPage = {
  classId,
  items: [
    { ...counts, enrollmentId, student: { id: studentId, displayName: 'An' } },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
  ...source,
};
function setup(data: object = summaryPage, status = 200) {
  const client: AxiosInstance = axios.create();
  const request = jest
    .spyOn(client, 'request')
    .mockResolvedValue({ status, data, headers: {} });
  const onExpired = jest.fn();
  const api = createReportsService({
    baseURL: 'https://example.test/api',
    origin: 'https://mobile.test',
    client,
    onExpired,
  });
  return { api, request };
}
describe('range', () => {
  test('sends the Vietnam day start and the exclusive next day', () => {
    expect(
      rangeQuery({ fromDate: '2026-10-01', toDate: '2026-10-31' })
    ).toEqual({
      from: '2026-10-01T00:00:00+07:00',
      to: '2026-11-01T00:00:00+07:00',
    });
    expect(rangeQuery(undefined)).toEqual({});
  });
  test('allows exactly 93 days and rejects 94 or a reversed range', () => {
    expect(
      rangeProblem({ fromDate: '2026-08-01', toDate: '2026-11-01' })
    ).toBeUndefined();
    expect(rangeProblem({ fromDate: '2026-08-01', toDate: '2026-11-02' })).toBe(
      'max'
    );
    expect(rangeProblem({ fromDate: '2026-11-02', toDate: '2026-11-01' })).toBe(
      'order'
    );
    expect(
      rangeProblem({ fromDate: '2026-11-01', toDate: '2026-11-01' })
    ).toBeUndefined();
  });
});
describe('figures', () => {
  test('null is a dash and never 0%; digits are not rounded', () => {
    expect(formatRate(null, 'vi')).toBe('—');
    expect(formatRate(0, 'vi')).toBe('0%');
    expect(formatRate(83.33, 'vi')).toBe('83,33%');
    expect(formatRate(83.33, 'en')).toBe('83.33%');
    expect(formatRate(100, 'en')).toBe('100%');
    expect(formatPercent('40.50', 'vi')).toBe('40,50%');
    expect(formatPercent('0.00', 'en')).toBe('0.00%');
  });
  test('as-of follows the response time zone', () => {
    expect(formatAsOf(source.asOf, source.timeZone)).toBe('14:32 02/11/2026');
    expect(displayDate('2026-11-02')).toBe('02/11/2026');
  });
});
describe('service', () => {
  test('first load sends only paging', async () => {
    const { api, request } = setup();
    const page = await api.classSummary('MENTOR', classId, 1);
    expect(page.items[0]?.rate).toBe(83.33);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `/mentor/classes/${classId}/attendance-summary`,
        params: { page: 1, pageSize: 20 },
      })
    );
  });
  test('manager uses the management route and keeps the range', async () => {
    const { api, request } = setup();
    await api.classSummary('MANAGER', classId, 1, {
      fromDate: '2026-10-01',
      toDate: '2026-10-31',
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `/management/classes/${classId}/attendance-summary`,
        params: {
          page: 1,
          pageSize: 20,
          from: '2026-10-01T00:00:00+07:00',
          to: '2026-11-01T00:00:00+07:00',
        },
      })
    );
  });
  test('progress sends no attendance range or unit filter', async () => {
    const { api, request } = setup({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      completionPolicy: 'UNDEFINED',
      policyVersion: null,
      assignmentSummary: { availability: 'NOT_IMPLEMENTED', counts: null },
      readonly: true,
      ...source,
    });
    await api.classProgress(classId, 1);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `/mentor/classes/${classId}/progress`,
        params: { page: 1, pageSize: 20 },
      })
    );
  });
  test.each([
    ['unknown applicability', { attendanceApplicability: 'WHATEVER' }],
    ['unknown session status', { sessionStatus: 'WHATEVER' }],
  ])('%s is a malformed response', async (_name, patch) => {
    const { api } = setup({
      classId,
      items: [
        {
          sessionId: studentId,
          enrollmentId,
          rootSessionId: studentId,
          title: 'S',
          startsAt: source.asOf,
          endsAt: source.asOf,
          sessionStatus: 'COMPLETED',
          attendanceStatus: null,
          attendanceApplicability: 'ELIGIBLE',
          assignmentType: 'PRIMARY',
          creditedAttendanceStatus: null,
          ...patch,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      readonly: false,
      ...source,
    });
    await expect(
      api.studentHistory(classId, studentId, 1)
    ).rejects.toMatchObject({ kind: 'error', code: 'INVALID_RESPONSE' });
  });
  test('a response of another class or page is rejected', async () => {
    await expect(
      setup({ ...summaryPage, classId: studentId }).api.classSummary(
        'MENTOR',
        classId,
        1
      )
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      setup({ ...summaryPage, page: 2 }).api.classSummary('MENTOR', classId, 1)
    ).rejects.toBeInstanceOf(ApiError);
  });
  test.each([
    [403, 'denied'],
    [404, 'notFound'],
    [422, 'invalid'],
    [500, 'error'],
  ])('HTTP %i maps to %s', async (status, kind) => {
    await expect(
      setup({ code: 'X', requestId: 'r1' }, status).api.classSummary(
        'MENTOR',
        classId,
        1
      )
    ).rejects.toMatchObject({ kind, requestId: 'r1' });
  });
  test('a malformed id never reaches the network', async () => {
    const { api, request } = setup();
    await expect(api.classSummary('MENTOR', '../x', 1)).rejects.toBeInstanceOf(
      ApiError
    );
    expect(request).not.toHaveBeenCalled();
  });
});
