/**
 * Logging utility for the AutoInfra Agent
 */

export interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error, meta?: Record<string, any>): void;
}

/**
 * Simple console logger implementation
 */
export class ConsoleLogger implements Logger {
  debug(message: string, meta?: Record<string, any>): void {
    console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  info(message: string, meta?: Record<string, any>): void {
    console.info(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  error(message: string, error?: Error, meta?: Record<string, any>): void {
    console.error(`[ERROR] ${message}`, error?.stack || error?.message || '', meta ? JSON.stringify(meta) : '');
  }
}

// Default logger instance
export const logger = new ConsoleLogger();