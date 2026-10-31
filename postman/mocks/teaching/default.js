const http = require('node:http');
const classId = '11111111-1111-4111-8111-111111111111';
const sessionId = '22222222-2222-4222-8222-222222222222';
const mentor = { id: classId, displayName: 'Synthetic mentor' };
const summary = {
  id: classId,
  code: 'TEST',
  name: 'Synthetic class',
  status: 'IN_PROGRESS',
  startDate: '2026-10-01',
  endDate: '2026-12-31',
  deliveryMode: 'OFFLINE',
  maxStudents: 20,
  availableSeats: 10,
  mentor,
  assignmentType: 'PRIMARY',
  accessScope: 'CLASS',
};
const shell = {
  id: classId,
  classId,
  code: summary.code,
  name: summary.name,
  status: summary.status,
  course: { id: classId, title: 'English' },
  accessScope: 'CLASS',
  assignmentType: 'PRIMARY',
  capabilities: { readClass: true, readClassRoster: true },
  visibleUnitCount: 1,
  visibleSessionCount: 1,
};
const session = {
  sessionId,
  classId,
  classUnitId: classId,
  title: 'Synthetic session',
  startsAt: '2026-10-31T11:00:00Z',
  endsAt: '2026-10-31T12:00:00Z',
  status: 'SCHEDULED',
  primaryMentor: mentor,
  effectiveMentor: null,
  assignmentType: 'PRIMARY',
  version: 1,
  makeupForSessionId: null,
  makeupRootSessionId: null,
  actualStartedAt: null,
  actualEndedAt: null,
  capabilities: { readSessionContext: true },
};
http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;
    const page = (items) => ({
      items,
      total: items.length,
      page: Number(url.searchParams.get('page') || 1),
      pageSize: Number(url.searchParams.get('pageSize') || 20),
    });
    let body;
    if (pathname.endsWith('/context')) {
      res.writeHead(503, { 'Content-Type': 'text/html' });
      res.end('<html>Upstream unavailable</html>');
      return;
    }
    if (pathname === '/mentor/classes') body = page([summary]);
    else if (pathname === `/mentor/classes/${classId}`) body = shell;
    else if (pathname === `/mentor/classes/${classId}/units`)
      body = page([{ id: classId, title: 'Unit', position: 1 }]);
    else if (pathname === `/mentor/classes/${classId}/students`)
      body = page([]);
    else if (
      pathname === `/mentor/classes/${classId}/sessions` ||
      pathname === '/mentor/schedule'
    )
      body = page([session]);
    else {
      res.writeHead(501);
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  })
  .listen(process.env.PORT);
