const http = require('node:http');
const id = '11111111-1111-4111-8111-111111111111';
const clock = '2026-11-02T09:00:00+07:00';
const session = {
  sessionId: id,
  classId: id,
  classUnitId: id,
  title: 'Synthetic P4',
  startsAt: '2026-11-09T18:00:00+07:00',
  endsAt: '2026-11-09T20:00:00+07:00',
  status: 'SCHEDULED',
  assignmentType: 'PRIMARY',
  primaryMentor: { id, displayName: 'Synthetic Mentor' },
  effectiveMentor: { id, displayName: 'Synthetic Mentor' },
  version: 1,
  makeupForSessionId: null,
  makeupRootSessionId: null,
  actualStartedAt: null,
  actualEndedAt: null,
  asOf: clock,
};
let leave = {
  id,
  mentorId: id,
  fromDate: '2026-11-09',
  toDate: '2026-11-09',
  period: 'FULL_DAY',
  reason: 'Synthetic leave',
  status: 'PENDING',
  version: 1,
  submittedAt: clock,
  expiresAt: session.startsAt,
  itemCount: 1,
  page: 1,
  pageSize: 20,
  items: [
    {
      classId: id,
      sourceSessionId: id,
      sourceVersion: 1,
      sourceStartsAt: session.startsAt,
      sourceEndsAt: session.endsAt,
      startsAt: '2026-11-12T18:00:00+07:00',
      endsAt: '2026-11-12T20:00:00+07:00',
      replacementSessionId: null,
    },
  ],
  classExtensions: [],
  review: null,
  studentConflictCount: null,
  asOf: clock,
  timeZone: 'Asia/Ho_Chi_Minh',
};
const conflict = {
  id,
  version: 1,
  status: 'OPEN',
  makeupPlacementId: null,
  makeupPlacementVersion: null,
  student: { id, displayName: 'Synthetic Student' },
  sourceSession: session,
  conflictingIntervals: [],
};
let scenario = 'success',
  commits = 0;
const receipts = new Map();
http
  .createServer(async (req, res) => {
    let text = '';
    for await (const chunk of req) text += chunk;
    const input = req.body ?? (text ? JSON.parse(text) : {});
    const route = new URL(req.url, 'http://localhost').pathname;
    const send = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };
    const page = (items) => ({
      items,
      total: items.length,
      page: 1,
      pageSize: 20,
    });
    if (route.endsWith('/__control')) {
      scenario = input.scenario || 'success';
      return send(200, { commits });
    }
    if (scenario === 'denied') return send(403, { code: 'FORBIDDEN' });
    if (scenario === 'html') {
      res.writeHead(503, { 'Content-Type': 'text/html' });
      return res.end('<html>Unavailable</html>');
    }
    if (route.endsWith('/preview'))
      return send(200, {
        affectedSessions: [session],
        sourceVersions: [{ sessionId: id, version: 1 }],
        noticeEligible: true,
        noticeDeadline: clock,
        asOf: clock,
        timeZone: 'Asia/Ho_Chi_Minh',
      });
    if (route.endsWith('/makeup-slots'))
      return send(200, {
        slots: leave.items,
        sessionVersion: 1,
        asOf: clock,
        timeZone: 'Asia/Ho_Chi_Minh',
      });
    if (req.method === 'GET') {
      if (route.endsWith('/makeup-candidates'))
        return send(200, page([{ session, remainingCapacity: 2 }]));
      if (route.endsWith('/student-schedule-conflicts'))
        return send(200, page([conflict]));
      if (
        route.endsWith('/leave-requests') ||
        route.endsWith('/mentor-leave-requests')
      )
        return send(200, page([leave]));
      if (/leave-requests\/[^/]+$/.test(route))
        return send(200, {
          ...leave,
          studentConflictCount: 0,
          studentConflicts: [],
          sourcesCurrent: true,
        });
      return send(501, { code: 'UNMODELED_ROUTE' });
    }
    if (scenario === 'conflict')
      return send(409, { code: 'LEAVE_VERSION_CONFLICT' });
    const key = req.headers['idempotency-key'];
    const signature = JSON.stringify({ route, input });
    if (!key) return send(422, { code: 'INVALID_KEY' });
    const previous = receipts.get(key);
    if (previous)
      return previous.signature === signature
        ? send(200, previous.result)
        : send(409, { code: 'IDEMPOTENCY_KEY_REUSED' });
    let result;
    if (route.endsWith('/makeup-placement')) {
      conflict.status = 'MAKEUP_ASSIGNED';
      conflict.version++;
      conflict.makeupPlacementId = id;
      conflict.makeupPlacementVersion = 1;
      result = {
        placement: {
          id,
          conflictId: id,
          targetSession: session,
          status: 'ASSIGNED',
          version: 1,
        },
        conflictVersion: conflict.version,
        targetSessionVersion: 2,
      };
    } else if (
      route.includes('/makeup-placements/') &&
      route.endsWith('/cancel')
    ) {
      conflict.status = 'OPEN';
      conflict.version++;
      conflict.makeupPlacementId = null;
      conflict.makeupPlacementVersion = null;
      result = {
        id,
        conflictId: id,
        targetSession: session,
        status: 'CANCELLED',
        version: 2,
      };
    } else {
      const action = route.split('/').pop();
      leave = {
        ...leave,
        status:
          action === 'approve'
            ? 'APPROVED'
            : action === 'reject'
              ? 'REJECTED'
              : action === 'withdraw'
                ? 'WITHDRAWN'
                : 'PENDING',
        version: leave.version + 1,
      };
      result =
        action === 'approve'
          ? {
              request: leave,
              replacements: [session],
              classExtensions: [],
              studentConflictCount: 0,
            }
          : leave;
    }
    commits++;
    const copy = JSON.parse(JSON.stringify(result));
    receipts.set(key, { signature, result: copy });
    if (scenario === 'lost') return setTimeout(() => send(200, copy), 3500);
    return send(200, copy);
  })
  .listen(process.env.PORT || 3000);
