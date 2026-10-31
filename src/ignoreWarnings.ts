import { env } from '@/config/env';

// Log only when both the native build and environment enable development logs.
class LoggingService {
  private readonly isDev = __DEV__ && env.DEBUG_MODE;

  warn(...args: (string | number | boolean | null | undefined | Error)[]) {
    if (this.isDev) {
      console.warn(...args);
    }
  }

  error(...args: (string | number | boolean | null | undefined | Error)[]) {
    if (this.isDev) {
      console.error(...args);
    }
  }

  info(...args: (string | number | boolean | null | undefined | Error)[]) {
    if (this.isDev) {
      console.warn('[INFO]', ...args);
    }
  }

  log(...args: (string | number | boolean | null | undefined | Error)[]) {
    if (this.isDev) {
      console.warn('[LOG]', ...args);
    }
  }
}

export const logger = new LoggingService();
