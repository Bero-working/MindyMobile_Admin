import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'emailRequired').email('emailInvalid'),
  // Password whitespace is significant; do not trim it.
  password: z.string().min(1, 'passwordRequired'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export function validateEmail(email: string) {
  const result = loginSchema.shape.email.safeParse(email);
  return result.success ? undefined : result.error.issues[0]?.message;
}
