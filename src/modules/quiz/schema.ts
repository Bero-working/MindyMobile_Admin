import { z } from 'zod';
import { scoreHundredths } from './model';
import type { Quiz } from './types';
export const uuid = z.string().uuid();
const label = z.enum(['A', 'B', 'C', 'D']);
const instant = z.string().datetime({ offset: true });
export const questionSchema = z.object({
  id: uuid,
  position: z.number().int().positive(),
  prompt: z.string().trim().min(1).max(5000),
  options: z
    .array(z.object({ label, text: z.string().trim().min(1).max(2000) }))
    .length(4)
    .refine((options) => new Set(options.map((o) => o.label)).size === 4),
  correctOption: label,
});
export const quizSchema = z
  .object({
    id: uuid,
    sessionId: uuid,
    type: z.literal('QUIZ'),
    purpose: z.enum(['TEST', 'HOMEWORK']),
    title: z.string().min(1).max(250),
    description: z.string().max(20000),
    maxScore: z.string().refine((s) => scoreHundredths(s) !== null),
    dueAt: instant.nullable(),
    timeLimitMinutes: z.number().int().min(1).max(240).nullable(),
    maxAttempts: z.literal(1),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    revision: z.number().int().positive(),
    publishedAt: instant.nullable(),
    questions: z.array(questionSchema).max(200).optional(),
  })
  .refine(
    (q) =>
      !q.questions ||
      new Set(q.questions.map((item) => item.id)).size === q.questions.length
  );
export const detailSchema = quizSchema.refine((q) => q.questions !== undefined);
export const pageSchema = z.object({
  items: z.array(quizSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
});
export function fromWire(wire: z.infer<typeof quizSchema>): Quiz {
  const { type: _type, maxAttempts: _attempts, questions, ...metadata } = wire;
  // The wire discriminators have already been validated, never defaulted.
  if (_type !== 'QUIZ' || _attempts !== 1)
    throw new Error('INVALID_QUIZ_PROJECTION');
  return {
    ...metadata,
    ...(questions === undefined
      ? {}
      : {
          questions: [...questions]
            .sort((a, b) => a.position - b.position)
            .map((q) => ({
              key: q.id,
              id: q.id,
              prompt: q.prompt,
              options: q.options,
              correctOption: q.correctOption,
            })),
        }),
  };
}
