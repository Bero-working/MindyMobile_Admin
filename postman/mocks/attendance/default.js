const http = require('node:http');
const id = '11111111-1111-4111-8111-111111111111';
const guest = '22222222-2222-4222-8222-222222222222';
const person = { id, displayName: 'Synthetic user' };
const clock = '2026-11-02T09:30:00+07:00';
let scenario = 'success';
let commits = 0;
const replay = new Map();
const session = {
  sessionId: id,
  classId: id,
  classUnitId: id,
  title: 'Synthetic session',
  startsAt: '2026-11-02T09:00:00+07:00',
  endsAt: '2026-11-02T10:00:00+07:00',
  status: 'IN_PROGRESS',
  assignmentType: 'PRIMARY',
  primaryMentor: person,
  effectiveMentor: person,
  version: 1,
  makeupForSessionId: null,
  makeupRootSessionId: null,
  actualStartedAt: '2026-11-02T09:00:00+07:00',
  actualEndedAt: null,
  editableUntil: '2026-11-04T00:00:00+07:00',
  asOf: clock,
  timeZone: 'Asia/Ho_Chi_Minh',
  permissions: {
    canStart: false,
    canEditAttendance: true,
    canFinalize: true,
    canSyncRoster: true,
    canRecover: false,
    canViewAttendanceAudits: true,
  },
};
const rows = [
  {
    attendanceId: id,
    enrollmentId: id,
    entryType: 'REGULAR',
    makeupPlacementId: null,
    student: person,
    status: 'UNMARKED',
    checkedInAt: null,
    admittedAt: clock,
  },
  {
    attendanceId: guest,
    enrollmentId: id,
    entryType: 'MAKEUP',
    makeupPlacementId: guest,
    student: person,
    status: 'UNMARKED',
    checkedInAt: null,
    admittedAt: clock,
  },
];
const totals = () => ({
  eligible: rows.length,
  present: rows.filter((r) => r.status === 'PRESENT').length,
  absent: rows.filter((r) => r.status === 'ABSENT').length,
  unmarked: rows.filter((r) => r.status === 'UNMARKED').length,
});
http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const route = url.pathname;
    let text = '';
    for await (const chunk of req) text += chunk;
    const body = req.body ?? (text ? JSON.parse(text) : {});
    const send = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };
    if (route.endsWith('/__control')) {
      scenario = body.scenario || 'success';
      send(200, { commits });
      return;
    }
    if (route.endsWith('/__state')) {
      send(200, { commits, version: session.version, rows });
      return;
    }
    if (scenario === 'html') {
      res.writeHead(503, { 'Content-Type': 'text/html' });
      res.end('<html>Upstream unavailable</html>');
      return;
    }
    if (scenario === 'denied') {
      send(403, {
        code: 'SESSION_ASSIGNMENT_REQUIRED',
        requestId: 'synthetic-support',
      });
      return;
    }
    const page = (items) => {
      const n = Number(url.searchParams.get('page') || 1),
        size = Number(url.searchParams.get('pageSize') || 20);
      return {
        items: items.slice((n - 1) * size, n * size),
        total: items.length,
        page: n,
        pageSize: size,
      };
    };
    if (req.method === 'GET' && route.endsWith('/attendance')) {
      send(200, {
        ...page(rows),
        session,
        totals: totals(),
        pendingPaymentCount: 0,
      });
      return;
    }
    if (req.method === 'PUT' && route.endsWith('/attendance')) {
      const key = req.headers['idempotency-key'];
      if (!key) {
        send(422, { code: 'INVALID_KEY' });
        return;
      }
      if (replay.has(key)) {
        send(200, replay.get(key));
        return;
      }
      if (body.expectedVersion !== session.version) {
        send(409, {
          code: 'SESSION_VERSION_CONFLICT',
          requestId: 'synthetic-conflict',
        });
        return;
      }
      for (const entry of body.records || []) {
        const row = rows.find(
          (r) =>
            r.entryType === 'REGULAR' && r.enrollmentId === entry.enrollmentId
        );
        if (row) row.status = entry.status;
      }
      for (const entry of body.guestRecords || []) {
        const row = rows.find(
          (r) => r.makeupPlacementId === entry.makeupPlacementId
        );
        if (row) row.status = entry.status;
      }
      session.version++;
      commits++;
      const result = {
        session: { ...session },
        totals: totals(),
        changedEnrollmentIds: (body.records || []).map((r) => r.enrollmentId),
        changedMakeupPlacementIds: (body.guestRecords || []).map(
          (r) => r.makeupPlacementId
        ),
      };
      replay.set(key, result);
      if (scenario === 'lost-after-commit') {
        scenario = 'success';
        await new Promise((resolve) => setTimeout(resolve, 11000));
      }
      send(200, result);
      return;
    }
    send(501, { code: 'NOT_MODELLED' });
  })
  .listen(Number(process.env.PORT || 0), '127.0.0.1');
