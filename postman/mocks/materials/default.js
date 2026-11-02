const http = require('node:http');
const id = '11111111-1111-4111-8111-111111111111';
const instant = '2026-11-02T09:00:00+07:00';
let scenario = 'success',
  commits = 0;
const m = {
  id,
  courseUnitId: id,
  contentType: 'ARTICLE',
  title: 'Synthetic material',
  description: null,
  sortOrder: 0,
  availableAt: null,
  sessionId: null,
  createdBy: id,
  createdInClassId: id,
  revision: 2,
  reviewStatus: 'PENDING_REVIEW',
  approvedRevision: null,
  reviewedBy: null,
  reviewedAt: null,
  firstApprovedAt: null,
  rejectionReason: null,
  publishedAt: null,
  createdAt: instant,
  updatedAt: instant,
  canEdit: false,
  file: null,
  contentHtml: '<p>Fixture</p>',
  contentSchemaVersion: 1,
  inlineImages: [],
  attachments: [],
};
http
  .createServer(async (req, res) => {
    let text = '';
    for await (const chunk of req) text += chunk;
    const body = req.body ?? (text ? JSON.parse(text) : {});
    const url = new URL(req.url, 'http://local');
    const send = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };
    if (url.pathname === '/__control') {
      scenario = body.scenario;
      send(200, {});
      return;
    }
    if (url.pathname === '/__state') {
      send(200, { commits, reviewStatus: m.reviewStatus });
      return;
    }
    if (scenario === 'denied') {
      send(403, { code: 'MATERIAL_ACCESS_DENIED' });
      return;
    }
    if (scenario === 'html') {
      res.writeHead(503, { 'Content-Type': 'text/html' });
      res.end('<html>Unavailable</html>');
      return;
    }
    if (req.method === 'GET' && url.pathname === '/manager/materials') {
      send(200, { items: [m], page: 1, pageSize: 20, total: 1 });
      return;
    }
    if (req.method === 'GET' && url.pathname === `/manager/materials/${id}`) {
      send(200, m);
      return;
    }
    if (
      req.method === 'POST' &&
      url.pathname === `/manager/materials/${id}/approve`
    ) {
      if (body.expectedRevision !== m.revision) {
        send(409, { code: 'MATERIAL_REVIEW_CONFLICT' });
        return;
      }
      if (m.reviewStatus !== 'APPROVED') {
        commits++;
        m.reviewStatus = 'APPROVED';
        m.approvedRevision = m.revision;
        m.publishedAt = instant;
        m.firstApprovedAt = instant;
      }
      if (scenario === 'lost-after-commit') {
        scenario = 'success';
        send(503, { code: 'PROXY_LOST_RESPONSE' });
        return;
      }
      send(200, m);
      return;
    }
    send(501, { code: 'NOT_MODELLED' });
  })
  .listen(Number(process.env.PORT || 0), '127.0.0.1');
