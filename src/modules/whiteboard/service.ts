import {
  createApiClient,
  safeSegment,
  type ApiClientOptions,
} from '@/shared/http/apiClient';
import {
  boardSchema,
  contextSchema,
  snapshotSchema,
  snapshotsSchema,
  previewSchema,
  type Board,
} from './schema';
import { z } from 'zod';
import { env } from '@/config/env';
import { storageUrl } from '@/modules/materials/model';

export function createWhiteboardService(options: ApiClientOptions = {}) {
  const api = createApiClient(options);
  const path = (boardId: string) => `/whiteboards/${safeSegment(boardId)}`;
  return {
    renew: api.renew,
    async asset(boardId: string, assetId: string) {
      const value = await api.read(
        z.object({ url: z.string().url(), expiresAt: z.string() }),
        `${path(boardId)}/assets/${safeSegment(assetId)}/access`,
        { method: 'POST', data: {} }
      );
      return {
        ...value,
        url: storageUrl(value.url, options.baseURL ?? env.API_URL ?? ''),
      };
    },
    preview: (boardId: string, snapshotId: string) =>
      api.read(
        previewSchema,
        `${path(boardId)}/snapshots/${safeSegment(snapshotId)}`
      ),
    context: (sessionId: string) =>
      api.read(
        contextSchema,
        `/class-sessions/${safeSegment(sessionId)}/whiteboard`
      ),
    create: (sessionId: string, key: string) =>
      api.read(
        contextSchema,
        `/class-sessions/${safeSegment(sessionId)}/whiteboard`,
        {
          method: 'POST',
          data: {},
          idempotencyKey: key,
        }
      ),
    control: (board: Board, mode: Board['mode'], key: string) =>
      api.read(boardSchema, `${path(board.id)}/control`, {
        method: 'PATCH',
        data: { expectedControlVersion: board.controlVersion, mode },
        idempotencyKey: key,
      }),
    snapshots: (boardId: string, page = 1) =>
      api.read(snapshotsSchema, `${path(boardId)}/snapshots`, {
        params: { page, pageSize: 20 },
      }),
    snapshot: (board: Board, key: string) =>
      api.read(snapshotSchema, `${path(board.id)}/snapshots`, {
        method: 'POST',
        data: { expectedEpoch: board.epoch },
        idempotencyKey: key,
      }),
    reset: (board: Board, key: string, snapshotId?: string) =>
      api.read(
        boardSchema,
        `${path(board.id)}/${snapshotId ? 'restores' : 'resets'}`,
        {
          method: 'POST',
          data: {
            expectedEpoch: board.epoch,
            expectedSequence: board.sequence,
            expectedControlVersion: board.controlVersion,
            ...(snapshotId ? { snapshotId: safeSegment(snapshotId) } : {}),
          },
          idempotencyKey: key,
        }
      ),
  };
}
export type WhiteboardService = ReturnType<typeof createWhiteboardService>;
