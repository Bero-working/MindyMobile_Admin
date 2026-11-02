import {
  changeDraft,
  compareDraft,
  noteLength,
  parseVietnamTime,
  admissionBasis,
  requestBytes,
} from '@/modules/attendance/model';
import type { AttendanceRow } from '@/modules/attendance/types';

const row: AttendanceRow = {
  id: 'a1',
  enrollmentId: 'e1',
  makeupPlacementId: null,
  name: 'Ngọc',
  entryType: 'REGULAR',
  status: 'UNMARKED',
  checkedInAt: null,
};
test('TC-P2-S1: draft does not change server; selecting base removes draft', () => {
  const draft = changeDraft({}, row, 'PRESENT');
  expect(row.status).toBe('UNMARKED');
  expect(draft.a1).toEqual({ baseStatus: 'UNMARKED', status: 'PRESENT' });
  expect(changeDraft(draft, row, 'UNMARKED')).toEqual({});
});
test('TC-P2-S1/S5: regular and guest limits are independent; no silent splitting', () => {
  let draft = {};
  for (let n = 0; n < 100; n++)
    draft = changeDraft(draft, { ...row, id: `a${n}` }, 'PRESENT');
  expect(() =>
    changeDraft(draft, { ...row, id: 'overflow' }, 'PRESENT')
  ).toThrow('batchLimit');
  expect(
    Object.keys(
      changeDraft(
        draft,
        { ...row, id: 'guest', entryType: 'MAKEUP', makeupPlacementId: 'm1' },
        'ABSENT'
      )
    )
  ).toHaveLength(101);
});
test('TC-P2-S1/S5: conflicts compare each base, retaining only existing rows', () => {
  const draft = changeDraft({}, row, 'PRESENT');
  expect(compareDraft(draft, [row]).conflicts).toEqual([]);
  expect(compareDraft(draft, [{ ...row, status: 'ABSENT' }]).conflicts).toEqual(
    ['a1']
  );
  expect(compareDraft(draft, [])).toEqual({
    draft: {},
    conflicts: [],
    dropped: 1,
  });
});
test('TC-P2-S2-08/09/10: count code points including emoji; do not trim', () => {
  expect(noteLength(' 😀 ')).toBe(3);
  expect(noteLength('😀'.repeat(10000))).toBe(10000);
});
test('TC-P2-S6-06/08: strict dates and times use fixed Vietnam offset', () => {
  expect(parseVietnamTime('31/02/2026', '18:30')).toBeNull();
  expect(parseVietnamTime('01/11/2026', '24:00')).toBeNull();
  expect(parseVietnamTime('01/11/2026', '18:30')).toBe(
    '2026-11-01T18:30:00+07:00'
  );
});
test('TC-P2-S6-14–18: payment basis and real start-time comparisons', () => {
  const start = '2026-11-01T18:30:00+07:00';
  expect(admissionBasis('ACTIVE', 'PAYOS', null, start)).toBeNull();
  expect(admissionBasis('PENDING_PAYMENT', 'CASH', start, start)).toBeNull();
  expect(admissionBasis('ACTIVE', 'PAYOS', start, start)).toBe(
    'PAID_BEFORE_START'
  );
  expect(
    admissionBasis('CANCELLED', 'CASH', '2026-11-01T19:00:00+07:00', start)
  ).toBe('CASH_LATE_ADMISSION');
  expect(
    admissionBasis('ACTIVE', 'PAYOS', '2026-11-01T19:00:00+07:00', start)
  ).toBeNull();
});
test('TC-P2-S6-22: limit measures UTF-8 JSON, including multibyte evidence', () => {
  expect(requestBytes({ evidenceNote: '😀' })).toBe(
    Buffer.byteLength(JSON.stringify({ evidenceNote: '😀' }), 'utf8')
  );
  expect(requestBytes({ evidenceNote: 'ọ'.repeat(100000) })).toBeGreaterThan(
    256 * 1024
  );
});
