const http = require('node:http');
const { randomUUID } = require('node:crypto');
const quizRows = new Map();
let quizScenario = 'success',
  quizCommits = 0,
  quizWrites = 0;
const clone = (q) => {
  const { questions: _questions, ...metadata } = q;
  return metadata;
};
http
  .createServer(async (req, res) => {
    let text = '';
    for await (const chunk of req) text += chunk;
    const body = req.body ?? (text ? JSON.parse(text) : {});
    const url = new URL(req.url, 'http://local');
    const send = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(data === undefined ? undefined : JSON.stringify(data));
    };
    if (url.pathname === '/__control') {
      quizScenario = body.scenario;
      send(200, {});
      return;
    }
    if (url.pathname === '/__state') {
      send(200, { commits: quizCommits, writes: quizWrites });
      return;
    }
    if (quizScenario === 'denied') {
      send(403, { code: 'ASSIGNMENT_SCOPE_REQUIRED', requestId: 'sim-denied' });
      return;
    }
    if (quizScenario === 'html') {
      res.writeHead(503, { 'Content-Type': 'text/html' });
      res.end('<html>Unavailable</html>');
      return;
    }
    const collection =
      /^\/mentor\/(class-sessions|classes)\/([^/]+)\/assignments$/.exec(
        url.pathname
      );
    if (collection && req.method === 'POST') {
      if (
        body.type !== 'QUIZ' ||
        !body.title ||
        !body.purpose ||
        typeof body.maxScore !== 'string'
      ) {
        send(422, { code: 'INVALID_ASSIGNMENT_CONFIG' });
        return;
      }
      const q = {
        id: randomUUID(),
        sessionId: collection[2],
        type: 'QUIZ',
        purpose: body.purpose,
        title: body.title,
        description: body.description ?? '',
        maxScore: body.maxScore,
        dueAt: body.dueAt ?? null,
        timeLimitMinutes: body.timeLimitMinutes ?? null,
        maxAttempts: 1,
        status: 'DRAFT',
        revision: 1,
        publishedAt: null,
        questions: [],
      };
      quizRows.set(q.id, q);
      quizCommits++;
      quizWrites++;
      send(201, clone(q));
      return;
    }
    if (collection && req.method === 'GET') {
      if (url.searchParams.get('type') !== 'QUIZ') {
        send(400, { code: 'QUIZ_FILTER_REQUIRED' });
        return;
      }
      const page = Number(url.searchParams.get('page') || 1),
        pageSize = Number(url.searchParams.get('pageSize') || 20);
      const rows = [...quizRows.values()].filter(
        (q) =>
          (collection[1] !== 'class-sessions' ||
            q.sessionId === collection[2]) &&
          (!url.searchParams.get('status') ||
            q.status === url.searchParams.get('status'))
      );
      send(200, {
        items: rows.slice((page - 1) * pageSize, page * pageSize).map(clone),
        total: rows.length,
        page,
        pageSize,
      });
      return;
    }
    const match =
      /^\/mentor\/assignments\/([^/]+)(?:\/(questions|publish|archive))?$/.exec(
        url.pathname
      );
    if (match) {
      const q = quizRows.get(match[1]);
      if (!q) {
        send(404, { code: 'ASSIGNMENT_NOT_FOUND' });
        return;
      }
      if (req.method === 'GET') {
        send(200, q);
        return;
      }
      quizWrites++;
      if (req.headers.origin !== 'https://mobile.example.com') {
        send(403, { code: 'ORIGIN_NOT_ALLOWED' });
        return;
      }
      if (body.expectedRevision !== q.revision) {
        send(409, { code: 'ASSIGNMENT_VERSION_CONFLICT' });
        return;
      }
      if (match[2] === 'archive') {
        if (q.status !== 'PUBLISHED') {
          send(409, { code: 'ASSIGNMENT_STATE_CONFLICT' });
          return;
        }
        if (!body.reason?.trim()) {
          send(422, { code: 'REASON_REQUIRED' });
          return;
        }
        q.status = 'ARCHIVED';
      } else {
        if (q.status !== 'DRAFT') {
          send(409, { code: 'ASSIGNMENT_CONTENT_FROZEN' });
          return;
        }
        if (req.method === 'DELETE') {
          quizRows.delete(q.id);
          quizCommits++;
          send(204);
          return;
        }
        if (match[2] === 'questions') {
          if (
            !body.questions?.length ||
            body.questions.some((item) => 'key' in item)
          ) {
            send(422, { code: 'INVALID_QUIZ_QUESTIONS' });
            return;
          }
          q.questions = body.questions.map((item, index) => ({
            ...item,
            id: item.id ?? randomUUID(),
            position: index + 1,
          }));
        } else if (match[2] === 'publish') {
          if (!q.questions.length) {
            send(422, { code: 'QUIZ_QUESTIONS_REQUIRED' });
            return;
          }
          q.status = 'PUBLISHED';
          q.publishedAt = new Date().toISOString();
        } else if (req.method === 'PATCH') {
          for (const key of ['purpose', 'type', 'maxScore', 'maxAttempts'])
            if (key in body) {
              send(400, { code: 'IMMUTABLE_FIELD' });
              return;
            }
          for (const key of [
            'title',
            'description',
            'dueAt',
            'timeLimitMinutes',
          ])
            if (key in body) q[key] = body[key];
        } else {
          send(501, { code: 'NOT_MODELLED' });
          return;
        }
      }
      q.revision++;
      quizCommits++;
      if (quizScenario === 'lost-after-commit') {
        quizScenario = 'success';
        send(503, { code: 'PROXY_LOST_RESPONSE' });
        return;
      }
      send(200, match[2] === 'questions' ? q : clone(q));
      return;
    }
    send(501, { code: 'NOT_MODELLED' });
  })
  .listen(Number(process.env.PORT || 0), '127.0.0.1');
