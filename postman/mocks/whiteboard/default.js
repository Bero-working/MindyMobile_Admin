/* global pm */
// Mindy-BE origin/dev 0d87a0f: REST contract fixture, not a realtime server.
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const sessionId = '11111111-1111-4111-8111-111111111111';
const boardId = '22222222-2222-4222-8222-222222222222';
const capabilities = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canControl: true,
  canUpload: true,
  canSnapshot: true,
  canRestore: true,
  canExport: true,
  canCollaborate: true,
};
const context = {
  sessionId,
  sessionTitle: 'Buổi 1',
  classId: sessionId,
  className: 'HTML & CSS Foundation',
  sessionStatus: 'IN_PROGRESS',
};
const read = async (key, fallback) =>
  (await pm.state.get(`whiteboard.${key}`)) ?? fallback;
const write = (key, value) => pm.state.set(`whiteboard.${key}`, value);
http
  .createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    const send = (status, body) => {
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      res.end(JSON.stringify(body));
    };
    if (!req.headers.cookie?.includes('access_token=test'))
      return send(401, { code: 'AUTHENTICATION_REQUIRED' });
    if (
      req.method !== 'GET' &&
      req.headers.origin !== 'https://mobile.example.test'
    )
      return send(403, { code: 'ORIGIN_NOT_ALLOWED' });
    const board = await read('board', null);
    const envelope = async () => ({
      sessionId,
      board: await read('board', null),
      context,
      capabilities: { ...capabilities, canEdit: !!(await read('board', null)) },
    });
    if (
      req.method === 'GET' &&
      path === `/class-sessions/${sessionId}/whiteboard`
    )
      return send(200, await envelope());
    if (req.method === 'GET' && path === `/whiteboards/${boardId}/snapshots`) {
      const items = await read('snapshots', []);
      return send(200, { items, total: items.length, page: 1, pageSize: 20 });
    }
    const preview = path.match(/^\/whiteboards\/[^/]+\/snapshots\/([^/]+)$/);
    if (req.method === 'GET' && preview) {
      const snapshot = (await read('snapshots', [])).find(
        (item) => item.id === preview[1]
      );
      return snapshot
        ? send(200, { ...snapshot, schemaVersion: 1, projection: [] })
        : send(404, { code: 'BOARD_SNAPSHOT_NOT_FOUND' });
    }
    const supported =
      (req.method === 'POST' &&
        [
          `/class-sessions/${sessionId}/whiteboard`,
          `/whiteboards/${boardId}/snapshots`,
          `/whiteboards/${boardId}/resets`,
          `/whiteboards/${boardId}/restores`,
        ].includes(path)) ||
      (req.method === 'PATCH' && path === `/whiteboards/${boardId}/control`);
    if (!supported) return send(501, { code: 'NOT_MODELED_IN_THIS_FIXTURE' });
    const key = req.headers['idempotency-key'];
    if (!key) return send(422, { code: 'BOARD_IDEMPOTENCY_KEY_REQUIRED' });
    const body = req.body ?? {};
    const signature = JSON.stringify({ path, body });
    const receipt = await read(`receipt.${key}`, null);
    if (receipt)
      return receipt.signature === signature
        ? send(receipt.status, receipt.body)
        : send(409, { code: 'BOARD_IDEMPOTENCY_CONFLICT' });
    const commit = async (status, result) => {
      await write(`receipt.${key}`, { signature, status, body: result });
      send(status, result);
    };
    if (path.startsWith('/class-sessions/')) {
      if (board) return send(409, { code: 'BOARD_ALREADY_EXISTS' });
      await write('board', {
        id: boardId,
        sessionId,
        title: context.sessionTitle,
        mode: 'PRESENTATION',
        epoch: randomUUID(),
        controlVersion: '1',
        sequence: '0',
        schemaVersion: 1,
        lastPersistedAt: null,
      });
      return commit(201, await envelope());
    }
    if (!board) return send(404, { code: 'BOARD_NOT_FOUND' });
    if (path.endsWith('/control')) {
      if (body.expectedControlVersion !== board.controlVersion)
        return send(409, { code: 'BOARD_VERSION_CONFLICT' });
      const next = {
        ...board,
        mode: body.mode,
        controlVersion: String(Number(board.controlVersion) + 1),
      };
      await write('board', next);
      return commit(200, next);
    }
    if (body.expectedEpoch !== board.epoch)
      return send(409, { code: 'BOARD_EPOCH_CHANGED' });
    if (path.endsWith('/snapshots')) {
      const snapshot = {
        id: randomUUID(),
        epoch: board.epoch,
        sequence: board.sequence,
        reason: 'MANUAL',
        createdAt: new Date().toISOString(),
      };
      await write('snapshots', [snapshot, ...(await read('snapshots', []))]);
      return commit(201, snapshot);
    }
    if (
      body.expectedSequence !== board.sequence ||
      body.expectedControlVersion !== board.controlVersion
    )
      return send(409, { code: 'BOARD_VERSION_CONFLICT' });
    if (
      path.endsWith('/restores') &&
      !(await read('snapshots', [])).some((item) => item.id === body.snapshotId)
    )
      return send(404, { code: 'BOARD_SNAPSHOT_NOT_FOUND' });
    const next = {
      ...board,
      epoch: randomUUID(),
      sequence: '0',
      controlVersion: String(Number(board.controlVersion) + 1),
      lastPersistedAt: new Date().toISOString(),
    };
    await write('board', next);
    return commit(201, next);
  })
  .listen(Number(process.env.PORT || 4317));
