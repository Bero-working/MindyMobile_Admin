import type { TeachingSession } from './types';
const zone = 'Asia/Ho_Chi_Minh';
export const vietnamDate = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
export const calendarDate = (date: string | null) =>
  date ? date.split('-').reverse().join('/') : '—';
export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function weekDates(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const monday = addDays(date, -((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
export const weekRange = (date: string) => {
  const first = weekDates(date)[0] ?? date;
  return {
    from: `${first}T00:00:00+07:00`,
    to: `${addDays(first, 7)}T00:00:00+07:00`,
  };
};
export const shortDate = (date: string | null) =>
  date ? date.slice(5).split('-').reverse().join('/') : '—';
export const weekdayLabels = (language: string) =>
  language === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
export const weekdayName = (instant: string, language: string) =>
  new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'vi-VN', {
    timeZone: zone,
    weekday: 'long',
  }).format(new Date(instant));
export const monthLabel = (date: string, language: string) =>
  language === 'en'
    ? new Intl.DateTimeFormat('en-GB', {
        month: 'short',
        timeZone: 'UTC',
      }).format(new Date(`${date}T12:00:00Z`))
    : `Th${Number(date.slice(5, 7))}`;
export const time = (instant: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(instant));
export const fullDate = (instant: string, language: string) =>
  new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'vi-VN', {
    timeZone: zone,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(instant));
export const differentTimezone = () => new Date().getTimezoneOffset() !== -420;
export function safeMeetingLink(
  value: string | null
): { url: string; host: string } | null {
  if (!value || !/^https?:\/\/[^\s/]+/i.test(value)) return null;
  try {
    const url = new URL(value);
    return url.hostname &&
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? { url: value, host: url.hostname }
      : null;
  } catch {
    return null;
  }
}

export function selectTodaySession(sessions: TeachingSession[], date: string) {
  const today = sessions.filter(
    (item) =>
      item.status !== 'CANCELLED' &&
      vietnamDate(new Date(item.startsAt)) === date
  );
  const ascending = (a: TeachingSession, b: TeachingSession) =>
    Date.parse(a.startsAt) - Date.parse(b.startsAt);
  return (
    today.filter((item) => item.status === 'IN_PROGRESS').sort(ascending)[0] ??
    today.filter((item) => item.status === 'SCHEDULED').sort(ascending)[0] ??
    today
      .filter((item) => item.status === 'COMPLETED')
      .sort((a, b) => ascending(b, a))[0]
  );
}
