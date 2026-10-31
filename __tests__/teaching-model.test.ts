import {
  calendarDate,
  vietnamDate,
  weekDates,
  weekRange,
  safeMeetingLink,
  selectTodaySession,
} from '@/modules/teaching/format';
import { createTeachingMock } from '@/modules/teaching/services/mockTeaching';

test('TC-P1-S1-01/02/04: Vietnam midnight and Monday-exclusive week boundaries', () => {
  expect(vietnamDate(new Date('2026-11-01T17:30:00Z'))).toBe('2026-11-02');
  expect(weekDates('2026-11-04')).toEqual([
    '2026-11-02',
    '2026-11-03',
    '2026-11-04',
    '2026-11-05',
    '2026-11-06',
    '2026-11-07',
    '2026-11-08',
  ]);
  expect(weekRange('2026-11-04')).toEqual({
    from: '2026-11-02T00:00:00+07:00',
    to: '2026-11-09T00:00:00+07:00',
  });
  expect(calendarDate('2026-11-02')).toBe('02/11/2026');
});
test('TC-P1-S4-08/09: only http(s) meeting links can be opened', () => {
  expect(safeMeetingLink('https://meet.google.com/abc')).toEqual({
    url: 'https://meet.google.com/abc',
    host: 'meet.google.com',
  });
  for (const url of [
    ['javascript', 'alert(1)'].join(':'),
    'file:///tmp/test',
    'https://',
    null,
  ])
    expect(safeMeetingLink(url)).toBeNull();
});
test('TC-P1-S5-02/03: current capability gates class roster at the mock boundary', async () => {
  const mock = createTeachingMock('success');
  const detail = await mock.read({
    kind: 'class',
    role: 'MENTOR',
    classId: 'substitute',
  });
  expect(detail.kind).toBe('success');
  expect(
    await mock.read({ kind: 'students', role: 'MENTOR', classId: 'substitute' })
  ).toEqual({ kind: 'denied' });
});
test('mock supports loading/empty/error/offline/denied/not found without network', async () => {
  for (const scenario of [
    'empty',
    'offline',
    'error',
    'denied',
    'notFound',
  ] as const) {
    const response = await createTeachingMock(scenario).read({
      kind: 'classes',
      role: 'MENTOR',
    });
    expect(response.kind).toBe(scenario === 'empty' ? 'success' : scenario);
    if (scenario === 'empty' && response.kind === 'success')
      expect(response.data.classes).toHaveLength(0);
  }
});
test('TC-P1-S2-10/12, S6-08: pagination totals, filters and manager search belong to mock boundary', async () => {
  const mock = createTeachingMock('success');
  const result = await mock.read({
    kind: 'classes',
    role: 'MANAGER',
    q: ' IF-K12 ',
    status: 'IN_PROGRESS',
    page: 1,
  });
  expect(result.kind).toBe('success');
  if (result.kind === 'success') {
    expect(result.data.total).toBe(1);
    expect(result.data.classes[0]?.id).toBe('primary');
  }
});

test('H-O/P/AE: today session priority, cancelled exclusion and Vietnam midnight', async () => {
  const response = await createTeachingMock().read({
    kind: 'schedule',
    role: 'MENTOR',
  });
  if (response.kind !== 'success' || !response.data.sessions[0])
    throw new Error('Missing fixture');
  const base = response.data.sessions[0];
  const session = (
    id: string,
    status: typeof base.status,
    startsAt: string
  ) => ({ ...base, id, status, startsAt });
  const rows = [
    session('cancelled', 'CANCELLED', '2026-11-01T17:00:00Z'),
    session('yesterday', 'IN_PROGRESS', '2026-11-01T16:59:59Z'),
    session('late', 'SCHEDULED', '2026-11-02T12:00:00Z'),
    session('early', 'SCHEDULED', '2026-11-01T17:00:00Z'),
    session('live', 'IN_PROGRESS', '2026-11-02T13:00:00Z'),
    session('doneEarly', 'COMPLETED', '2026-11-02T02:00:00Z'),
    session('doneLate', 'COMPLETED', '2026-11-02T04:00:00Z'),
  ];
  expect(selectTodaySession(rows, '2026-11-02')?.id).toBe('live');
  expect(
    selectTodaySession(
      rows.filter((item) => item.id !== 'live'),
      '2026-11-02'
    )?.id
  ).toBe('early');
  expect(
    selectTodaySession(
      rows.filter((item) => item.status === 'COMPLETED'),
      '2026-11-02'
    )?.id
  ).toBe('doneLate');
  expect(
    selectTodaySession(
      rows.filter((item) => item.status === 'CANCELLED'),
      '2026-11-02'
    )
  ).toBeUndefined();
});
