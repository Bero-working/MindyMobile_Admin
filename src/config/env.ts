import Config from 'react-native-config';
import { z } from 'zod';

export const envSchema = z
  .object({
    APP_ENV: z.enum(['development', 'production']),
    API_URL: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z
        .string()
        .url()
        .regex(/^https?:\/\//)
        .optional()
    ),
    DEBUG_MODE: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true'),
  })
  .superRefine((value, context) => {
    if (value.APP_ENV === 'production') {
      if (!value.API_URL?.startsWith('https://')) {
        context.addIssue({
          code: 'custom',
          path: ['API_URL'],
          message: 'Production requires an HTTPS API_URL.',
        });
      }
      if (value.DEBUG_MODE) {
        context.addIssue({
          code: 'custom',
          path: ['DEBUG_MODE'],
          message: 'Production debug mode must be disabled.',
        });
      }
    }
  });

export const env = envSchema.parse({
  APP_ENV: Config.APP_ENV,
  API_URL: Config.API_URL,
  DEBUG_MODE: Config.DEBUG_MODE,
});

export function requireApiUrl(): string {
  if (!env.API_URL) {
    throw new Error(
      'Configure API_URL in the environment file before making API requests (Q-ENV-01).'
    );
  }
  return env.API_URL;
}
