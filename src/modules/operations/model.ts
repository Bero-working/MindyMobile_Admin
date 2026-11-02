import { parseVietnamTime } from '@/modules/attendance/model';
import type { SessionStatus } from '@/modules/teaching/types';
export function formatMoney(value: number) {
  return Number.isSafeInteger(value) && value >= 0
    ? `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`
    : '—';
}
export function moneyValue(value: string): number | null {
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  const number = Number(digits);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}
export function sessionActions(
  status: SessionStatus,
  startsAt: string,
  asOf: string
) {
  if (status === 'CANCELLED') return ['replace'] as const;
  if (status === 'COMPLETED') return [];
  if (status === 'IN_PROGRESS' || Date.parse(startsAt) <= Date.parse(asOf))
    return ['cancel'] as const;
  return ['reschedule', 'assign', 'cancel'] as const;
}
export function replacementEnd(start: string, duration: number): string | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)) return null;
  const [hour, minute] = start.split(':').map(Number);
  const end = hour! * 60 + minute! + duration;
  return Number.isInteger(end) && end < 1440 && end >= 0
    ? `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`
    : null;
}
export function validSchedule(
  date: string,
  start: string,
  end: string,
  asOf: string
) {
  const from = parseVietnamTime(date, start),
    to = parseVietnamTime(date, end);
  return (
    !!from &&
    !!to &&
    Date.parse(to) > Date.parse(from) &&
    Date.parse(from) > Date.parse(asOf)
  );
}
export function canCollect(
  order: { paymentType: string; status: string; expiresAt: string },
  asOf: string
) {
  return (
    order.paymentType === 'CASH' &&
    order.status === 'PENDING' &&
    Date.parse(order.expiresAt) > Date.parse(asOf)
  );
}
