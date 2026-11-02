import type { Conflict, Mapping, Period, Preview, Slot } from './types';

export const statuses = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'EXPIRED',
] as const;
export const periods: Period[] = [
  'MORNING',
  'AFTERNOON',
  'EVENING',
  'FULL_DAY',
];
export function conflictMode(value: Pick<Conflict, 'status' | 'placementId'>) {
  if (value.status === 'OPEN')
    return value.placementId ? 'NEEDS_REASSIGNMENT' : 'NEEDS_PLACEMENT';
  if (!value.placementId) throw new Error('Invalid placement state');
  return value.status;
}
export function day(value: string) {
  if (!Number.isFinite(Date.parse(`${value}T00:00:00Z`))) return false;
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function dateRangeError(from: string, to: string) {
  if (!day(from) || !day(to)) return 'invalid';
  const diff = (Date.parse(to) - Date.parse(from)) / 86400000;
  return diff < 0 ? 'before' : diff >= 93 ? 'max' : undefined;
}
export function validReason(value: string) {
  return value.trim().length > 0 && value.trim().length <= 1000;
}
export function dateLabel(value: string) {
  const date = value.slice(0, 10);
  return date.split('-').reverse().join('/');
}
export function timeLabel(value: string) {
  return new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(11, 16);
}
export function vietnamDay(value = new Date().toISOString()) {
  return new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 10);
}
export function instantLabel(value: string) {
  return `${timeLabel(value)} ${dateLabel(vietnamDay(value))}`;
}
export function rangeLabel(from: string, to: string) {
  return from === to
    ? dateLabel(from)
    : `${dateLabel(from)} – ${dateLabel(to)}`;
}
export function slotLabel(value: Slot) {
  return `${dateLabel(vietnamDay(value.startsAt))} · ${timeLabel(value.startsAt)}–${timeLabel(value.endsAt)}`;
}
const hours: Record<Period, [number, number]> = {
  MORNING: [0, 12],
  AFTERNOON: [12, 18],
  EVENING: [18, 24],
  FULL_DAY: [0, 24],
};
export function overlaps(a: Slot, b: Slot) {
  return (
    Date.parse(a.startsAt) < Date.parse(b.endsAt) &&
    Date.parse(a.endsAt) > Date.parse(b.startsAt)
  );
}
export function slotAllowed(
  slot: Slot,
  range: { fromDate: string; toDate: string; period: Period },
  others: Slot[]
) {
  if (others.some((other) => overlaps(slot, other))) return false;
  const [start, end] = hours[range.period];
  for (
    let date = Date.parse(`${range.fromDate}T00:00:00Z`);
    date <= Date.parse(`${range.toDate}T00:00:00Z`);
    date += 86400000
  ) {
    const midnight = date - 7 * 3600000;
    if (
      overlaps(slot, {
        startsAt: new Date(midnight + start * 3600000).toISOString(),
        endsAt: new Date(midnight + end * 3600000).toISOString(),
      })
    )
      return false;
  }
  return true;
}
export function reconcileMappings(
  mappings: Record<string, Mapping>,
  preview: Preview
) {
  return Object.fromEntries(
    Object.entries(mappings).filter(([id, mapping]) =>
      preview.sources.some(
        (source) => source.id === id && source.version === mapping.version
      )
    )
  );
}
export function requestBytes(body: object) {
  return encodeURIComponent(JSON.stringify(body)).replace(/%[A-F\d]{2}/gi, 'x')
    .length;
}
