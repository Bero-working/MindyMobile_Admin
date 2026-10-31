import { time, vietnamDate } from '../format';
import type { TeachingSession } from '../types';

// Call only with all pages of the sessions visible to the current mentor.
export function classSessionSummary(
  sessions: TeachingSession[],
  now = Date.now()
) {
  const active = sessions
    .filter((item) => item.status !== 'CANCELLED')
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const elapsedSessions = active.filter(
    (item) => Date.parse(item.actualEnd ?? item.endsAt) <= now
  ).length;
  const upcoming = active.filter(
    (item) =>
      item.status !== 'COMPLETED' &&
      Date.parse(item.actualEnd ?? item.endsAt) > now
  );
  const schedule = upcoming.length ? upcoming : active;
  const scheduleDays = Array.from(
    new Set(
      schedule.map((item) => {
        const date = vietnamDate(new Date(item.startsAt));
        return (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
      })
    )
  ).sort((a, b) => a - b);
  const times = Array.from(
    new Set(schedule.map((item) => time(item.startsAt)))
  );
  return {
    sessionCount: active.length,
    elapsedSessions,
    scheduleDays,
    scheduleTime: times.join(' / ') || null,
    nextSessionAt: upcoming[0]?.startsAt ?? null,
  };
}
