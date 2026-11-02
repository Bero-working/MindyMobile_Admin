import { z } from 'zod';

const id = z.string().uuid();
const instant = z.string().datetime({ offset: true });
const sequence = z.string().regex(/^(0|[1-9]\d{0,18})$/);
const participant = z.object({ id, displayName: z.string() });
export const message = z.object({
  id,
  conversationId: id,
  sender: participant,
  clientMessageId: id.nullable(),
  sequence,
  lastChangedSequence: sequence,
  type: z.enum(['TEXT', 'FILE', 'IMAGE']),
  body: z.string().nullable(),
  file: z
    .object({
      id,
      originalFilename: z.string(),
      mimeType: z.string(),
      sizeBytes: z.number().int().nonnegative(),
      kind: z.enum(['IMAGE', 'PDF']),
    })
    .nullable(),
  replyTo: z
    .object({ id, senderDisplayName: z.string(), deleted: z.boolean() })
    .nullable(),
  version: z.number().int().positive(),
  createdAt: instant,
  editedAt: instant.nullable(),
  deletedAt: instant.nullable(),
});
export const conversation = z.object({
  id,
  type: z.enum(['GROUP', 'DIRECT']),
  classId: id.nullable(),
  name: z.string().nullable(),
  peer: participant.nullable(),
  capabilities: z.object({ canRead: z.literal(true), canSend: z.boolean() }),
  accessMode: z.enum(['ACTIVE', 'CASH_PENDING', 'HISTORY_READ_ONLY']),
  lastReadSequence: sequence,
  highWatermark: sequence,
  unreadCount: z.number().int().nonnegative(),
  lastMessage: message.nullable(),
  activityAt: instant,
});
export const notification = z.object({
  id,
  type: z.literal('CHAT_MESSAGE'),
  actorId: id,
  conversationId: id,
  messageId: id,
  title: z.string(),
  body: z.string(),
  readAt: instant.nullable(),
  createdAt: instant,
});
export const pageOf = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    meta: z.object({
      nextCursor: z.string().nullable(),
      hasMore: z.boolean(),
      highWatermark: sequence.optional(),
      throughSequence: sequence.optional(),
    }),
  });
export const messageEvent = z.object({
  eventId: id,
  conversationId: id.optional(),
  sequence,
  type: z.string(),
  message: message.nullable(),
});
export const sendResult = z.object({ message, replayed: z.boolean() });
export const directResult = z.object({ conversation, created: z.boolean() });
export const unreadCount = z.object({
  unreadCount: z.number().int().nonnegative(),
});
export const fileAccess = z.object({ url: z.string().url() });
export type ChatMessage = z.infer<typeof message>;
export type Conversation = z.infer<typeof conversation>;
export type ChatNotification = z.infer<typeof notification>;
export type MessageEvent = z.infer<typeof messageEvent>;
