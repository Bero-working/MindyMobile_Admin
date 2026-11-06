import type { SessionStatus, TeachingSession } from '../types';

// Presentation only: elapsed time does not mark attendance or complete a session.
export function sessionDisplayStatus(
  session: Pick<
    TeachingSession,
    'status' | 'startsAt' | 'endsAt' | 'actualStart' | 'actualEnd'
  >,
  now = Date.now()
): SessionStatus {
  if (session.status === 'CANCELLED' || session.status === 'COMPLETED') {
    return session.status;
  }
  if (Date.parse(session.actualEnd ?? session.endsAt) <= now) {
    return 'COMPLETED';
  }
  if (
    session.status === 'IN_PROGRESS' ||
    Date.parse(session.actualStart ?? session.startsAt) <= now
  ) {
    return 'IN_PROGRESS';
  }
  return 'SCHEDULED';
}
