import type {
  AttendanceRow,
  Basis,
  Draft,
  Mark,
  RecoveryStudent,
} from './types';

export const noteLength = (text: string) => Array.from(text).length;
export function changeDraft(
  draft: Draft,
  row: AttendanceRow,
  status: Mark
): Draft {
  const result = { ...draft };
  const baseStatus = draft[row.id]?.baseStatus ?? row.status;
  if (status === baseStatus) delete result[row.id];
  else {
    const count = Object.values(draft).filter(
      (item) => (item.entryType ?? 'REGULAR') === row.entryType
    ).length;
    if (!draft[row.id] && count >= 100) throw new Error('batchLimit');
    result[row.id] = {
      baseStatus,
      status,
      ...(row.entryType === 'MAKEUP' ? { entryType: row.entryType } : {}),
    };
  }
  return result;
}
export function compareDraft(draft: Draft, rows: AttendanceRow[]) {
  const result: Draft = {};
  const conflicts: string[] = [];
  let dropped = 0;
  for (const [id, item] of Object.entries(draft)) {
    const row = rows.find((value) => value.id === id);
    if (!row) {
      dropped++;
      continue;
    }
    result[id] = item;
    if (row.status !== item.baseStatus) conflicts.push(id);
  }
  return { draft: result, conflicts, dropped };
}
export function parseVietnamTime(date: string, time: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    return null;
  const [day = 0, month = 0, year = 0] = date.split('/').map(Number);
  const [hour = 99, minute = 99] = time.split(':').map(Number);
  const test = new Date(Date.UTC(year, month - 1, day));
  if (
    test.getUTCFullYear() !== year ||
    test.getUTCMonth() !== month - 1 ||
    test.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  )
    return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${time}:00+07:00`;
}
export function admissionBasis(
  status: RecoveryStudent['enrollmentStatus'],
  method: RecoveryStudent['paymentType'],
  paidAt: string | null,
  startedAt: string
): Basis | null {
  if (!['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status) || !paidAt)
    return null;
  if (Date.parse(paidAt) <= Date.parse(startedAt)) return 'PAID_BEFORE_START';
  return method === 'CASH' ? 'CASH_LATE_ADMISSION' : null;
}
export function requestBytes(body: object): number {
  return encodeURIComponent(JSON.stringify(body)).replace(/%[A-F\d]{2}/g, 'x')
    .length;
}
export function recoveryRequestBytes(
  intent: import('./types').Intent | Omit<import('./types').Intent, 'key'>
): number {
  return requestBytes({
    expectedVersion: intent.expectedVersion,
    reason: intent.reason,
    evidenceNote: intent.evidenceNote,
    actualStartedAt: intent.actualStartedAt,
    actualEndedAt: intent.actualEndedAt,
    records: intent.recoveryRecords,
  });
}
export function isoDate(value: string): string {
  const d = new Date(Date.parse(value) + 7 * 60 * 60 * 1000);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}
export function isoTime(value: string): string {
  return new Date(Date.parse(value) + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(11, 16);
}
