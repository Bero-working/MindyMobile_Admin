import { z } from 'zod';
export const id = z.string().uuid();
const instant = z.string().datetime({ offset: true });
export const status = z.enum([
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
]);
export const contentType = z.enum(['FILE', 'VIDEO', 'ARTICLE']);
export const fileKind = z.enum([
  'PDF',
  'IMAGE',
  'DOCUMENT',
  'PRESENTATION',
  'SPREADSHEET',
  'AUDIO',
  'VIDEO',
  'SOURCE_CODE',
]);
export const file = z.object({
  id,
  originalFilename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  kind: fileKind,
});
export const material = z.object({
  id,
  courseUnitId: id,
  contentType,
  title: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  availableAt: instant.nullable(),
  sessionId: id.nullable(),
  createdBy: id,
  createdInClassId: id.nullable(),
  revision: z.number().int().positive(),
  reviewStatus: status,
  approvedRevision: z.number().int().positive().nullable(),
  reviewedBy: id.nullable(),
  reviewedAt: instant.nullable(),
  firstApprovedAt: instant.nullable(),
  rejectionReason: z.string().nullable(),
  publishedAt: instant.nullable(),
  createdAt: instant,
  updatedAt: instant,
  canEdit: z.boolean(),
  file: file.nullable(),
});
export const detail = material.extend({
  contentHtml: z.string().nullable(),
  contentSchemaVersion: z.number().int().nullable(),
  inlineImages: z.array(file),
  attachments: z.array(file),
});
export const page = z
  .object({
    items: z.array(material),
    page: z.number().int().positive(),
    pageSize: z.number().int().min(1).max(100),
    total: z.number().int().nonnegative(),
  })
  .refine((p) => p.items.length <= p.pageSize && p.items.length <= p.total);
export const access = z.object({
  materialId: id,
  fileId: id,
  revision: z.number().int().positive(),
  role: z.enum(['PRIMARY', 'INLINE_IMAGE', 'ATTACHMENT']),
  url: z
    .string()
    .url()
    .regex(/^https?:\/\//),
  expiresAt: instant,
});
export const intent = z.object({
  fileId: id,
  uploadUrl: z
    .string()
    .url()
    .regex(/^https?:\/\//),
  requiredHeaders: z.record(z.string()),
  uploadUrlExpiresAt: instant,
  intentExpiresAt: instant,
});
export const fileStatus = z.object({
  id,
  courseUnitId: id,
  status: z.enum([
    'PENDING_UPLOAD',
    'PROCESSING',
    'READY',
    'FAILED',
    'DELETED',
  ]),
  originalFilename: z.string(),
  declaredSizeBytes: z.number().int().positive(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  mimeType: z.string().nullable(),
  kind: fileKind.nullable(),
  intentExpiresAt: instant,
  readyAt: instant.nullable(),
  metadataStatus: z.string().nullable(),
  errorCode: z.string().nullable(),
});
export type Material = z.infer<typeof material>;
export type Detail = z.infer<typeof detail>;
export type MaterialPage = z.infer<typeof page>;
export type FileStatus = z.infer<typeof fileStatus>;
export type FileAccess = z.infer<typeof access>;
export type UploadIntent = z.infer<typeof intent>;
export type Role = 'MENTOR' | 'MANAGER';
