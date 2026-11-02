import type { ChatMessage } from './schema';

export const MAX_MESSAGE_CHARACTERS = 4000;
/** Sequences are int64 decimal strings; compare without losing precision. */
export const compareSequence = (a: string, b: string) =>
  a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);
export const maxSequence = (a: string, b: string) =>
  compareSequence(a, b) >= 0 ? a : b;
/** Keeps ascending creation order; an older version never replaces a newer one. */
export function upsertMessages(
  current: readonly ChatMessage[],
  incoming: readonly ChatMessage[]
): ChatMessage[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  for (const next of incoming) {
    const known = byId.get(next.id);
    if (!known || next.version >= known.version) byId.set(next.id, next);
  }
  return [...byId.values()].sort((a, b) =>
    compareSequence(a.sequence, b.sequence)
  );
}
export const messageProblem = (body: string) =>
  !body.trim()
    ? 'empty'
    : [...body].length > MAX_MESSAGE_CHARACTERS
      ? 'tooLong'
      : undefined;
export function formatMessageTime(value: string, now = Date.now()) {
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
      ...options,
    }).format(new Date(value));
  const day = { day: '2-digit', month: '2-digit', year: 'numeric' } as const;
  const time = format({ hour: '2-digit', minute: '2-digit' });
  const today =
    format(day) ===
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      ...day,
    }).format(new Date(now));
  return today ? time : `${time} ${format(day)}`;
}
/** A quiet gap this long starts a new time-stamped block of messages. */
const TIME_BREAK_MS = 15 * 60_000;
export type MessageRow = {
  message: ChatMessage;
  startsRun: boolean;
  endsRun: boolean;
  showTime: boolean;
  showUnread: boolean;
};
/**
 * Groups consecutive messages of one sender. `opening` is the read position
 * when the room opened, so the unread line stays put while new messages arrive.
 */
export function layoutMessages(
  messages: readonly ChatMessage[],
  me: string | undefined,
  opening?: { lastRead: string; highWatermark: string }
): MessageRow[] {
  let unreadPlaced = false;
  const rows = messages.map((message, index) => {
    const previous = messages[index - 1];
    const showUnread =
      !unreadPlaced &&
      !!opening &&
      message.sender.id !== me &&
      compareSequence(message.sequence, opening.lastRead) > 0 &&
      compareSequence(message.sequence, opening.highWatermark) <= 0;
    unreadPlaced ||= showUnread;
    const showTime =
      !showUnread &&
      (!previous ||
        Date.parse(message.createdAt) - Date.parse(previous.createdAt) >=
          TIME_BREAK_MS);
    return {
      message,
      showUnread,
      showTime,
      startsRun:
        showUnread || showTime || previous?.sender.id !== message.sender.id,
    };
  });
  return rows.map((row, index) => ({
    ...row,
    endsRun: rows[index + 1]?.startsRun ?? true,
  }));
}
/** Vietnam has no daylight saving, so a calendar day is a fixed UTC+7 span. */
const vietnamDay = (time: number) =>
  Math.floor((time + 7 * 3_600_000) / 86_400_000);
/** Compact list time: today's clock, a weekday this week, otherwise the date. */
export function formatConversationTime(
  value: string,
  locale: string,
  now = Date.now()
) {
  const date = new Date(value);
  const format = (lang: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(lang, {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
      ...options,
    }).format(date);
  const days = vietnamDay(now) - vietnamDay(date.getTime());
  if (days === 0)
    return format('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (days > 0 && days < 7) return format(locale, { weekday: 'short' });
  const thisYear =
    format('en-GB', { year: 'numeric' }) ===
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
    }).format(new Date(now));
  return format('en-GB', {
    day: '2-digit',
    month: '2-digit',
    ...(thisYear ? {} : { year: 'numeric' }),
  });
}
/** Centered divider time: the clock, plus the day unless it is today. */
export function formatDividerTime(
  value: string,
  locale: string,
  now = Date.now()
) {
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
  const day = formatConversationTime(value, locale, now);
  return day === clock ? clock : `${clock}, ${day}`;
}
