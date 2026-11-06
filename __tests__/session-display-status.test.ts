import { sessionDisplayStatus } from '@/modules/teaching/services/sessionDisplayStatus';

const session = {
  status: 'SCHEDULED' as const,
  startsAt: '2026-11-05T15:00:00+07:00',
  endsAt: '2026-11-05T17:00:00+07:00',
  actualStart: null,
  actualEnd: null,
};

test.each([
  ['2026-11-05T14:59:59+07:00', 'SCHEDULED'],
  ['2026-11-05T15:00:00+07:00', 'IN_PROGRESS'],
  ['2026-11-05T16:59:59+07:00', 'IN_PROGRESS'],
  ['2026-11-05T17:00:00+07:00', 'COMPLETED'],
  ['2026-11-06T10:00:00+07:00', 'COMPLETED'],
])('scheduled session at %s displays %s', (now, expected) => {
  expect(sessionDisplayStatus(session, Date.parse(now))).toBe(expected);
});

test('preserves cancellations and explicit completion regardless of schedule', () => {
  const now = Date.parse('2026-11-05T14:00:00+07:00');
  for (const status of ['CANCELLED', 'COMPLETED'] as const) {
    expect(sessionDisplayStatus({ ...session, status }, now)).toBe(status);
  }
});

test('uses actual start and end times when present', () => {
  expect(
    sessionDisplayStatus(
      { ...session, actualStart: '2026-11-05T14:30:00+07:00' },
      Date.parse('2026-11-05T14:45:00+07:00')
    )
  ).toBe('IN_PROGRESS');
  expect(
    sessionDisplayStatus(
      { ...session, actualEnd: '2026-11-05T16:00:00+07:00' },
      Date.parse('2026-11-05T16:00:00+07:00')
    )
  ).toBe('COMPLETED');
  expect(
    sessionDisplayStatus(
      { ...session, status: 'IN_PROGRESS' },
      Date.parse('2026-11-05T17:00:00+07:00')
    )
  ).toBe('COMPLETED');
});
