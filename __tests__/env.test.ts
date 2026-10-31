import { envSchema, requireApiUrl } from '@/config/env';

const development = { APP_ENV: 'development', API_URL: '', DEBUG_MODE: 'true' };

describe('environment configuration', () => {
  it('allows UI work without an API host but blocks requests', () => {
    expect(envSchema.parse(development).API_URL).toBeUndefined();
    expect(requireApiUrl).toThrow('Configure API_URL');
  });

  it.each(['invalid', 'ftp://example.com'])(
    'rejects invalid API URL %s',
    (API_URL) => {
      expect(envSchema.safeParse({ ...development, API_URL }).success).toBe(
        false
      );
    }
  );

  it.each(['', 'http://example.com'])(
    'rejects production API URL %s',
    (API_URL) => {
      expect(
        envSchema.safeParse({
          APP_ENV: 'production',
          API_URL,
          DEBUG_MODE: 'false',
        }).success
      ).toBe(false);
    }
  );

  it('requires debug off in production', () => {
    const production = {
      APP_ENV: 'production',
      API_URL: 'https://example.com',
      DEBUG_MODE: 'false',
    };
    expect(envSchema.parse(production).DEBUG_MODE).toBe(false);
    expect(
      envSchema.safeParse({ ...production, DEBUG_MODE: 'true' }).success
    ).toBe(false);
  });
});
