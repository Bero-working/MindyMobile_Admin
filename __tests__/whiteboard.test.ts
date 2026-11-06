import { EventEmitter } from 'node:events';
import axios from 'axios';
import * as Y from 'yjs';
import { io } from 'socket.io-client';
import { BoardConnection } from '@/modules/whiteboard/connection';
import {
  encode,
  decode,
  moveShape,
  putShape,
  shapesOf,
} from '@/modules/whiteboard/document';
import { createWhiteboardService } from '@/modules/whiteboard/service';
import type { BoardSync, Shape } from '@/modules/whiteboard/schema';
import { boardSchema, previewSchema } from '@/modules/whiteboard/schema';

const sessionId = '11111111-1111-4111-8111-111111111111';
const boardId = '22222222-2222-4222-8222-222222222222';
const epoch = '33333333-3333-4333-8333-333333333333';
const shape: Shape = {
  id: '44444444-4444-4444-8444-444444444444',
  type: 'sticky',
  x: 40,
  y: 80,
  width: 220,
  height: 180,
  color: '#FFD978',
  text: 'Xin chào lớp học',
};
function state(): BoardSync {
  const doc = new Y.Doc();
  doc.getMap('shapes');
  const binary = encode(Y.encodeStateAsUpdate(doc));
  doc.destroy();
  return {
    board: {
      id: boardId,
      sessionId,
      epoch,
      title: 'Buổi 1',
      mode: 'PRESENTATION',
      sequence: '0',
      controlVersion: '1',
      schemaVersion: 2,
      lastPersistedAt: null,
    },
    capabilities: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canControl: true,
      canUpload: true,
      canSnapshot: true,
      canRestore: true,
      canExport: true,
      canCollaborate: true,
    },
    binary,
    identity: { id: sessionId, name: 'Mentor' },
  };
}
function realtime() {
  const events = new EventEmitter();
  const requests: {
    event: string;
    payload: object;
    ack: (error: Error | null, reply?: object) => void;
  }[] = [];
  const socket = io('http://whiteboard.example.test', { autoConnect: false });
  jest.spyOn(socket, 'on').mockImplementation((event, listener) => {
    events.on(event, listener);
    return socket;
  });
  jest.spyOn(socket, 'timeout').mockReturnValue(socket);
  jest
    .spyOn(socket, 'emit')
    .mockImplementation(
      (
        event,
        payload: object,
        ack: (error: Error | null, reply?: object) => void
      ) => {
        requests.push({ event, payload, ack });
        return socket;
      }
    );
  jest.spyOn(socket, 'connect').mockImplementation(() => {
    socket.connected = true;
    events.emit('connect');
    return socket;
  });
  jest.spyOn(socket, 'disconnect').mockImplementation(() => {
    socket.connected = false;
    events.emit('disconnect', 'io client disconnect');
    return socket;
  });
  jest.spyOn(socket, 'removeAllListeners').mockImplementation(() => {
    events.removeAllListeners();
    return socket;
  });
  const changes = jest.fn();
  const connection = new BoardConnection(
    socket,
    boardId,
    changes,
    async () => false
  );
  connection.start();
  requests[0]!.ack(null, { ok: true, data: state() });
  return { connection, requests, events, socket, changes };
}

test.each([1, 2])(
  'metadata and snapshot previews accept supported schema v%s',
  (version) => {
    expect(
      boardSchema.parse({ ...state().board, schemaVersion: version })
        .schemaVersion
    ).toBe(version);
    expect(
      previewSchema.parse({
        id: shape.id,
        epoch,
        sequence: '0',
        reason: 'MANUAL',
        createdAt: '2026-11-05T16:44:59.384Z',
        schemaVersion: version,
        projection: [],
      }).schemaVersion
    ).toBe(version);
  }
);

test('unknown document versions remain rejected', () => {
  expect(
    boardSchema.safeParse({ ...state().board, schemaVersion: 3 }).success
  ).toBe(false);
});

test('Yjs uses native shared text and preserves relative stroke points on a move', () => {
  const doc = new Y.Doc();
  doc.transact(() => putShape(doc, shape));
  expect(
    doc.getMap<Y.Map<Y.Text>>('shapes').get(shape.id)!.get('text')
  ).toBeInstanceOf(Y.Text);
  const stroke: Shape = {
    ...shape,
    type: 'stroke',
    text: undefined,
    points: [0, 0, 20, 30],
    strokeWidth: 3,
  };
  delete stroke.text;
  doc.transact(() => putShape(doc, stroke));
  doc.transact(() => moveShape(doc, stroke.id, 300, 400));
  expect(shapesOf(doc)[0]).toMatchObject({
    x: 300,
    y: 400,
    points: [0, 0, 20, 30],
  });
  const copy = new Y.Doc();
  Y.applyUpdate(copy, decode(encode(Y.encodeStateAsUpdate(doc))));
  expect(shapesOf(copy)).toEqual(shapesOf(doc));
  doc.destroy();
  copy.destroy();
});

test('editing locks until durable ACK, even after receiving a state broadcast', () => {
  const { connection, requests, events } = realtime();
  expect(connection.edit((doc) => putShape(doc, shape))).toBe(true);
  expect(connection.state.status).toBe('saving');
  expect(connection.edit((doc) => putShape(doc, shape))).toBe(false);
  const payload = requests[1]!.payload as {
    epoch: string;
    updateId: string;
    binary: string;
  };
  const server = new Y.Doc();
  Y.applyUpdate(server, decode(payload.binary));
  events.emit('board:state', {
    ...state(),
    binary: encode(Y.encodeStateAsUpdate(server)),
  });
  expect(connection.state.status).toBe('saving');
  requests[1]!.ack(null, {
    ok: true,
    data: { epoch, updateId: payload.updateId, sequence: '1' },
  });
  expect(connection.state.status).toBe('ready');
  expect(connection.state.shapes).toEqual([shape]);
  server.destroy();
  connection.close();
});

test('ACK timeout replays the same update ID and bytes after canonical rejoin', () => {
  const { connection, requests } = realtime();
  connection.edit((doc) => putShape(doc, shape));
  const pending = requests[1]!.payload;
  requests[1]!.ack(new Error('timeout'));
  expect(connection.state.status).toBe('offline');
  expect(connection.hasPending).toBe(true);
  expect(connection.edit((doc) => putShape(doc, shape))).toBe(false);
  connection.reconnect();
  requests[2]!.ack(null, { ok: true, data: state() });
  expect(requests[3]!.payload).toEqual(pending);
  connection.close();
});

test('new epoch drops pending edits and old ACK cannot unlock or alter it', () => {
  const { connection, requests, events } = realtime();
  connection.edit((doc) => putShape(doc, shape));
  const payload = requests[1]!.payload as { updateId: string };
  const next = state();
  next.board.epoch = '55555555-5555-4555-8555-555555555555';
  events.emit('board:state', next);
  requests[1]!.ack(null, {
    ok: true,
    data: { epoch, updateId: payload.updateId, sequence: '1' },
  });
  expect(connection.state.shapes).toEqual([]);
  expect(connection.state.sync?.board.epoch).toBe(next.board.epoch);
  expect(connection.state.notice).toBe('epoch');
  expect(connection.hasPending).toBe(false);
  connection.close();
});

test('rejected edits roll back to canonical state; revocation clears private content', () => {
  const { connection, requests, events } = realtime();
  connection.edit((doc) => putShape(doc, shape));
  requests[1]!.ack(null, {
    ok: false,
    error: { statusCode: 422, code: 'BOARD_SCHEMA_INVALID' },
  });
  requests[2]!.ack(null, { ok: true, data: state() });
  expect(connection.state.shapes).toEqual([]);
  events.emit('board:revoked');
  expect(connection.state.status).toBe('revoked');
  expect(connection.state.sync).toBeUndefined();
  events.emit('board:state', state());
  expect(connection.state.status).toBe('revoked');
  connection.close();
});

test('read-only capabilities reject local edits', () => {
  const { connection, events } = realtime();
  const value = state();
  value.capabilities.canEdit = false;
  events.emit('board:state', value);
  expect(connection.edit((doc) => putShape(doc, shape))).toBe(false);
  connection.close();
});

test('REST sends cookies, Origin, persistent intent key and exact version guards', async () => {
  const client = axios.create();
  const request = jest.spyOn(client, 'request');
  const api = createWhiteboardService({
    client,
    baseURL: 'https://api.example.test/api/v1',
    origin: 'https://mobile.example.test',
  });
  request.mockResolvedValue({ status: 201, data: state().board });
  await api.reset(state().board, shape.id);
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({
      url: `/whiteboards/${boardId}/resets`,
      method: 'POST',
      withCredentials: true,
      headers: {
        Origin: 'https://mobile.example.test',
        'Idempotency-Key': shape.id,
      },
      data: {
        expectedEpoch: epoch,
        expectedSequence: '0',
        expectedControlVersion: '1',
      },
    })
  );
  request.mockResolvedValueOnce({
    status: 403,
    data: { code: 'BOARD_ACCESS_DENIED' },
  });
  await expect(api.context(sessionId)).rejects.toMatchObject({
    kind: 'denied',
  });
  request.mockResolvedValueOnce({
    status: 404,
    data: { code: 'BOARD_DISABLED' },
  });
  await expect(api.context(sessionId)).rejects.toMatchObject({
    code: 'BOARD_DISABLED',
  });
});
