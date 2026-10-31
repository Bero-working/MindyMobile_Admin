import { z } from 'zod';

export const enum SupportedLanguages {
  EN = 'en',
  VI = 'vi',
}

export const languageSchema = z.enum([
  SupportedLanguages.EN,
  SupportedLanguages.VI,
]);

export type Language = z.infer<typeof languageSchema>;
