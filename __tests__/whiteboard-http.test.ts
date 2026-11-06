import axios from 'axios';
import { createWhiteboardService } from '@/modules/whiteboard/service';
import { newIntentKey } from '@/modules/attendance/services/intentKey';
const nodeAxios = jest.requireActual<typeof axios>(
  require
    .resolve('axios/package.json')
    .replace('package.json', 'dist/node/axios.cjs')
);

// Run against the local Postman whiteboard.sim.yaml on port 4317.
const run = process.env.WHITEBOARD_SIM_URL ? test : test.skip;
run(
  'real HTTP: context → create/replay → mode → snapshot/preview → reset/conflict',
  async () => {
    const api = createWhiteboardService({
      baseURL: process.env.WHITEBOARD_SIM_URL,
      origin: 'https://mobile.example.test',
      client: nodeAxios.create({
        adapter: 'http',
        headers: {
          Cookie: 'access_token=test',
          'x-mock-session': newIntentKey(),
        },
      }),
    });
    const sessionId = '11111111-1111-4111-8111-111111111111';
    expect((await api.context(sessionId)).board).toBeNull();
    const createKey = newIntentKey();
    const created = await api.create(sessionId, createKey);
    expect((await api.create(sessionId, createKey)).board?.id).toBe(
      created.board?.id
    );
    const board = created.board!;
    const controlled = await api.control(
      board,
      'COLLABORATIVE',
      newIntentKey()
    );
    expect((await api.context(sessionId)).board?.mode).toBe('COLLABORATIVE');
    const saved = await api.snapshot(controlled, newIntentKey());
    expect((await api.snapshots(board.id)).items[0]?.id).toBe(saved.id);
    expect((await api.preview(board.id, saved.id)).projection).toEqual([]);
    const key = newIntentKey();
    const reset = await api.reset(controlled, key);
    expect(reset.epoch).not.toBe(board.epoch);
    expect((await api.reset(controlled, key)).epoch).toBe(reset.epoch);
    await expect(api.reset(controlled, newIntentKey())).rejects.toMatchObject({
      code: 'BOARD_EPOCH_CHANGED',
    });
    const unauthorized = createWhiteboardService({
      baseURL: process.env.WHITEBOARD_SIM_URL,
      client: nodeAxios.create({ adapter: 'http' }),
    });
    await expect(unauthorized.context(sessionId)).rejects.toMatchObject({
      kind: 'denied',
    });
  }
);
