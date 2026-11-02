import {
  conflictMode,
  dateRangeError,
  validReason,
  slotAllowed,
  reconcileMappings,
  requestBytes,
} from '@/modules/leave/model';
import type { Preview, Conflict } from '@/modules/leave/types';

test('TC-P4-S6-03/04/05/06/07: infer placement mode without guessing invalid states', () => {
  const value = (status: Conflict['status'], placementId: string | null) => ({
    status,
    placementId,
  });
  expect(conflictMode(value('OPEN', null))).toBe('NEEDS_PLACEMENT');
  expect(conflictMode(value('OPEN', 'old'))).toBe('NEEDS_REASSIGNMENT');
  expect(conflictMode(value('MAKEUP_ASSIGNED', 'p'))).toBe('MAKEUP_ASSIGNED');
  expect(conflictMode(value('RESOLVED', 'p'))).toBe('RESOLVED');
  expect(() => conflictMode(value('MAKEUP_ASSIGNED', null))).toThrow();
});
test('TC-P4-S2-03/04: valid calendar ranges, inclusive 93 day boundary', () => {
  expect(dateRangeError('2026-11-02', '2026-11-01')).toBe('before');
  expect(dateRangeError('2026-02-30', '2026-03-01')).toBe('invalid');
  expect(dateRangeError('2026-11-02', '2027-02-02')).toBeUndefined();
  expect(dateRangeError('2026-11-02', '2027-02-03')).toBe('max');
});
test('TC-P4-S2-16/17/18: half-open slots filter Vietnam leave periods and other mappings', () => {
  const range = {
    fromDate: '2026-11-06',
    toDate: '2026-11-06',
    period: 'MORNING' as const,
  };
  expect(
    slotAllowed(
      {
        startsAt: '2026-11-06T11:30:00+07:00',
        endsAt: '2026-11-06T13:00:00+07:00',
      },
      range,
      []
    )
  ).toBe(false);
  const afternoon = {
    startsAt: '2026-11-06T12:00:00+07:00',
    endsAt: '2026-11-06T13:30:00+07:00',
  };
  expect(slotAllowed(afternoon, range, [])).toBe(true);
  expect(
    slotAllowed(afternoon, range, [
      {
        startsAt: '2026-11-06T13:00:00+07:00',
        endsAt: '2026-11-06T14:00:00+07:00',
      },
    ])
  ).toBe(false);
});
test('TC-P4-S2-27/28: new preview preserves only unchanged source mappings', () => {
  const preview = {
    sources: [
      { id: 'a', version: 2 },
      { id: 'b', version: 1 },
      { id: 'c', version: 1 },
    ],
  } as Preview;
  const slot = {
    startsAt: '2026-11-10T12:00:00+07:00',
    endsAt: '2026-11-10T13:00:00+07:00',
  };
  expect(
    reconcileMappings(
      {
        a: { ...slot, version: 1 },
        b: { ...slot, version: 1 },
        removed: { ...slot, version: 1 },
      },
      preview
    )
  ).toEqual({ b: { ...slot, version: 1 } });
});
test('reason and request UTF-8 size guard, including Vietnamese', () => {
  expect(validReason('   ')).toBe(false);
  expect(validReason('  Đồng ý  ')).toBe(true);
  expect(validReason('a'.repeat(1001))).toBe(false);
  expect(requestBytes({ reason: 'ế' })).toBe(16);
});
