import { z } from 'zod';

export const id = z.string().uuid();
// The backend's WhiteboardShapes migration upgrades metadata to v2 for
// rectangle/ellipse/text shapes; both versions use the same native Yjs root.
export const schemaVersion = z.union([z.literal(1), z.literal(2)]);
export const boardSchema = z.object({
  id,
  sessionId: id,
  title: z.string(),
  mode: z.enum(['PRESENTATION', 'COLLABORATIVE']),
  epoch: id,
  controlVersion: z.string().regex(/^[1-9]\d*$/),
  sequence: z.string().regex(/^\d+$/),
  schemaVersion,
  lastPersistedAt: z.string().nullable(),
});
export const capabilitiesSchema = z.object({
  canView: z.boolean(),
  canCreate: z.boolean(),
  canEdit: z.boolean(),
  canControl: z.boolean(),
  canUpload: z.boolean(),
  canSnapshot: z.boolean(),
  canRestore: z.boolean(),
  canExport: z.boolean(),
  canCollaborate: z.boolean(),
});
export const contextSchema = z.object({
  sessionId: id.optional(),
  board: boardSchema.nullable(),
  context: z.object({
    sessionId: id,
    sessionTitle: z.string(),
    classId: id,
    className: z.string(),
    sessionStatus: z.string(),
  }),
  capabilities: capabilitiesSchema,
});
export const syncSchema = z.object({
  board: boardSchema,
  capabilities: capabilitiesSchema,
  binary: z.string(),
  identity: z.object({ id, name: z.string() }),
});
export const snapshotSchema = z.object({
  id,
  epoch: id,
  sequence: z.string(),
  reason: z.enum(['MANUAL', 'SESSION_END', 'BEFORE_RESET']),
  createdAt: z.string(),
});
export const snapshotsSchema = z.object({
  items: z.array(snapshotSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export const shapeSchema = z.object({
  id,
  type: z.enum([
    'stroke',
    'sticky',
    'text',
    'rectangle',
    'ellipse',
    'image',
    'code',
  ]),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().min(1).max(10000),
  height: z.number().min(1).max(10000),
  color: z.string().regex(/^#[\da-f]{6}$/i),
  text: z.string().max(5000).optional(),
  points: z.array(z.number().finite()).max(20000).optional(),
  strokeWidth: z.number().optional(),
  fill: z.string().optional(),
  fontSize: z.number().min(10).max(96).optional(),
  assetId: id.optional(),
  language: z.enum(['javascript', 'java21']).optional(),
});
export const previewSchema = snapshotSchema.extend({
  schemaVersion,
  projection: z.array(shapeSchema).max(2000),
});
export type Board = z.infer<typeof boardSchema>;
export type Capabilities = z.infer<typeof capabilitiesSchema>;
export type BoardContext = z.infer<typeof contextSchema>;
export type BoardSync = z.infer<typeof syncSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type Shape = {
  id: string;
  type:
    | 'stroke'
    | 'sticky'
    | 'text'
    | 'rectangle'
    | 'ellipse'
    | 'image'
    | 'code';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text?: string | undefined;
  fontSize?: number | undefined;
  strokeWidth?: number | undefined;
  fill?: string | undefined;
  points?: number[] | undefined;
  assetId?: string | undefined;
  language?: 'javascript' | 'java21' | undefined;
};
