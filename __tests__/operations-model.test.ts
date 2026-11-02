import {
  formatMoney,
  moneyValue,
  canCollect,
  sessionActions,
  replacementEnd,
  validSchedule,
} from '@/modules/operations/model';

test('TC-P5-S4-04, S5-15: VND stays integral and formats identically in either locale', () => {
  expect(formatMoney(6500000)).toBe('6.500.000 ₫');
  expect(moneyValue('6.500.000 ₫abc')).toBe(6500000);
  expect(formatMoney(Number.MAX_SAFE_INTEGER + 1)).toBe('—');
  expect(moneyValue('999999999999999999999')).toBeNull();
});
test('TC-P5-OPS-01–06: operations use server time and keep started teacher immutable', () => {
  const now = '2026-11-02T00:00:00Z';
  expect(sessionActions('SCHEDULED', '2026-11-03T00:00:00Z', now)).toEqual([
    'reschedule',
    'assign',
    'cancel',
  ]);
  expect(sessionActions('SCHEDULED', now, now)).toEqual(['cancel']);
  expect(sessionActions('IN_PROGRESS', now, now)).toEqual(['cancel']);
  expect(sessionActions('COMPLETED', now, now)).toEqual([]);
  expect(sessionActions('CANCELLED', now, now)).toEqual(['replace']);
});
test('TC-P5-S3-15/16: replacement keeps duration without rolling past midnight', () => {
  expect(replacementEnd('18:30', 90)).toBe('20:00');
  expect(replacementEnd('23:00', 90)).toBeNull();
  expect(replacementEnd('25:00', 90)).toBeNull();
});
test('TC-P5-S2-08/09/11: Vietnam times must be future and within one day', () => {
  expect(
    validSchedule('03/11/2026', '18:30', '20:00', '2026-11-02T00:00:00Z')
  ).toBe(true);
  expect(
    validSchedule('03/11/2026', '25:00', '26:00', '2026-11-02T00:00:00Z')
  ).toBe(false);
  expect(
    validSchedule('01/11/2026', '18:30', '20:00', '2026-11-02T00:00:00Z')
  ).toBe(false);
});
test('TC-P5-S5-04/10: collection requires CASH/PENDING and unexpired response clock', () => {
  const order = {
    paymentType: 'CASH',
    status: 'PENDING',
    expiresAt: '2026-11-03T00:00:00Z',
  };
  expect(canCollect(order, '2026-11-02T00:00:00Z')).toBe(true);
  expect(canCollect(order, order.expiresAt)).toBe(false);
  expect(
    canCollect({ ...order, paymentType: 'PAYOS' }, '2026-11-02T00:00:00Z')
  ).toBe(false);
  expect(canCollect({ ...order, status: 'PAID' }, '2026-11-02T00:00:00Z')).toBe(
    false
  );
});
