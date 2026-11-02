/** Calendar range in business dates (yyyy-MM-dd, Vietnam time). */
export type DateRange = { fromDate: string; toDate: string };
export const MAX_RANGE_DAYS = 93;
const DAY = 86_400_000;
const utc = (date: string) => Date.parse(`${date}T00:00:00Z`);
export function rangeProblem(range: DateRange): 'order' | 'max' | undefined {
  if (utc(range.fromDate) > utc(range.toDate)) return 'order';
  return (utc(range.toDate) - utc(range.fromDate)) / DAY + 1 > MAX_RANGE_DAYS
    ? 'max'
    : undefined;
}
/** `to` is exclusive at the server: the start of the day after the last date. */
export function rangeQuery(range: DateRange | undefined) {
  if (!range) return {};
  const after = new Date(utc(range.toDate) + DAY).toISOString().slice(0, 10);
  return {
    from: `${range.fromDate}T00:00:00+07:00`,
    to: `${after}T00:00:00+07:00`,
  };
}
export const rangeKey = (range: DateRange | undefined) =>
  range ? `${range.fromDate}/${range.toDate}` : 'all';
export const displayDate = (date: string) =>
  date.split('-').reverse().join('/');
const localized = (value: string, language: string) =>
  language.startsWith('vi') ? value.replace('.', ',') : value;
/** Server figures are shown as sent: separator changes, the digits never do. */
export const formatRate = (rate: number | null, language: string) =>
  rate === null ? '—' : `${localized(String(rate), language)}%`;
export const formatPercent = (percent: string, language: string) =>
  `${localized(percent, language)}%`;
const parts = (value: string, timeZone: string) => {
  const zone = (name: string) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: name,
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    });
  let format: Intl.DateTimeFormat;
  try {
    format = zone(timeZone);
  } catch {
    format = zone('Asia/Ho_Chi_Minh');
  }
  const found = format.formatToParts(new Date(value));
  const of = (type: string) => found.find((p) => p.type === type)?.value ?? '';
  return {
    time: `${of('hour')}:${of('minute')}`,
    date: `${of('day')}/${of('month')}/${of('year')}`,
  };
};
export const formatAsOf = (value: string, timeZone: string) => {
  const { time, date } = parts(value, timeZone);
  return `${time} ${date}`;
};
export const formatDay = (value: string, timeZone: string) =>
  parts(value, timeZone).date;
