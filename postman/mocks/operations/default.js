const http = require('node:http');
const id = '11111111-1111-4111-8111-111111111111';
const person = { id, displayName: 'Synthetic Manager' };
const clock = '2026-11-02T09:30:00+07:00';
const session = {
  sessionId: id,
  classId: id,
  classUnitId: id,
  title: 'Synthetic P5',
  startsAt: '2026-11-09T18:30:00+07:00',
  endsAt: '2026-11-09T20:00:00+07:00',
  status: 'SCHEDULED',
  assignmentType: 'PRIMARY',
  primaryMentor: person,
  effectiveMentor: person,
  version: 3,
  makeupForSessionId: null,
  makeupRootSessionId: null,
  actualStartedAt: null,
  actualEndedAt: null,
  asOf: clock,
  timeZone: 'Asia/Ho_Chi_Minh',
};
const order = {
  id,
  orderCode: 'MD7K3QX9PA2B4C',
  paymentType: 'CASH',
  status: 'PENDING',
  totalAmount: 6500000,
  expiresAt: '2099-11-10T00:00:00+07:00',
  createdAt: clock,
  paidAt: null,
  student: person,
  payment: null,
  details: [
    {
      id,
      classId: id,
      className: 'Synthetic class',
      courseTitle: 'Synthetic course',
      quantity: 1,
      totalAmount: 6500000,
      priceAmount: 6500000,
    },
  ],
};
let scenario = 'success',
  sessionCommits = 0,
  cashCommits = 0;
const replay = new Map();
http
  .createServer(async (req, res) => {
    let text = '';
    for await (const chunk of req) text += chunk;
    const input = req.body ?? (text ? JSON.parse(text) : {});
    const route = new URL(req.url, 'http://localhost').pathname;
    const send = (status, data) => {
      res.writeHead(status, {
        'Content-Type': 'application/json',
        Date: 'Mon, 02 Nov 2026 02:30:00 GMT',
      });
      res.end(JSON.stringify(data));
    };
    if (route.endsWith('/__control')) {
      scenario = input.scenario || 'success';
      return send(200, { sessionCommits, cashCommits });
    }
    if (scenario === 'denied')
      return send(403, { code: 'ORDER_ACCESS_DENIED' });
    if (scenario === 'html') {
      res.writeHead(503, { 'Content-Type': 'text/html' });
      return res.end('<html>Unavailable</html>');
    }
    if (req.method === 'GET') {
      if (route.endsWith('/context'))
        return send(200, { session, roomName: null, meetingUrl: null });
      if (route.endsWith('/available-mentors'))
        return send(200, {
          items: [{ ...person, isCurrent: false }],
          page: 1,
          pageSize: 20,
          total: 1,
          sessionId: id,
          sessionVersion: session.version,
          asOf: clock,
        });
      if (route.endsWith(`/orders/${id}`)) return send(200, order);
      if (route.endsWith('/orders'))
        return send(200, { items: [order], page: 1, pageSize: 20, total: 1 });
      return send(404, { code: 'NOT_FOUND' });
    }
    if (route.endsWith('/confirm')) {
      if (input.receivedAmount !== order.totalAmount)
        return send(409, { code: 'CASH_CONFIRMATION_INVALID' });
      if (order.status !== 'PAID') {
        cashCommits++;
        order.status = 'PAID';
        order.paidAt = clock;
        order.payment = { confirmedBy: { ...person, source: 'MANAGER' } };
      }
      if (scenario === 'lostCash')
        return setTimeout(() => send(200, order), 3500);
      return send(200, order);
    }
    const key = req.headers['idempotency-key'];
    if (replay.has(key)) return send(200, replay.get(key));
    if (scenario === 'conflict' || input.expectedVersion !== session.version)
      return send(409, {
        code: 'SESSION_VERSION_CONFLICT',
        requestId: 'synthetic-conflict',
      });
    sessionCommits++;
    session.version++;
    if (route.endsWith('/schedule')) {
      session.startsAt = input.startsAt;
      session.endsAt = input.endsAt;
    }
    if (route.endsWith('/cancel')) session.status = 'CANCELLED';
    if (route.endsWith('/mentor'))
      session.effectiveMentor = input.mentorId
        ? { id: input.mentorId, displayName: 'Synthetic substitute' }
        : person;
    const result = JSON.parse(JSON.stringify(session));
    replay.set(key, result);
    if (scenario === 'lostSession')
      return setTimeout(() => send(200, result), 3500);
    return send(200, result);
  })
  .listen(process.env.PORT || 3000);
