/**
 * Pre-configured logger entry point
 * Provides convenient access to logger without SDK initialization
 *
 * @packageDocumentation
 */

import { ZunoLogger, createNoOpLogger, type Logger, type LoggerConfig, type LogLevel, type LogMetadata } from '../utils/logger';

// Re-export types and utilities
export { ZunoLogger, createNoOpLogger };
export type { Logger, LoggerConfig, LogLevel, LogMetadata };

// Default logger instance (can be used immediately)
let _defaultLogger: Logger | null = null;

/**
 * Create and configure a global logger instance
 *
 * @param config - Logger configuration options
 * @returns Configured logger instance
 *
 * @example
 * ```typescript
 * import { createLogger } from 'zuno-marketplace-sdk/logger';
 *
 * const logger = createLogger({ level: 'debug' });
 * logger.info('Application started');
 * ```
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  return new ZunoLogger(config);
}

/**
 * Configure and set the default global logger
 *
 * @param config - Logger configuration options
 * @returns The configured logger instance
 *
 * @example
 * ```typescript
 * import { configureLogger, logger } from 'zuno-marketplace-sdk/logger';
 *
 * configureLogger({ level: 'debug', format: 'json' });
 * logger.info('Now using configured logger');
 * ```
 */
export function configureLogger(config: LoggerConfig = {}): Logger {
  _defaultLogger = new ZunoLogger(config);
  return _defaultLogger;
}

/**
 * Get the default logger instance
 * Creates a no-op logger if not configured
 *
 * @returns Default logger instance
 */
export function getDefaultLogger(): Logger {
  if (!_defaultLogger) {
    _defaultLogger = createNoOpLogger();
  }
  return _defaultLogger;
}

/**
 * Reset the default logger (useful for testing)
 */
export function resetLogger(): void {
  _defaultLogger = null;
}

/**
 * Default logger instance
 * Pre-configured as no-op, use configureLogger() to enable
 *
 * @example
 * ```typescript
 * import { logger, configureLogger } from 'zuno-marketplace-sdk/logger';
 *
 * // Configure first (optional - will be no-op if not configured)
 * configureLogger({ level: 'info' });
 *
 * // Use anywhere
 * logger.info('Message');
 * logger.error('Error occurred', { data: { reason: 'timeout' } });
 * ```
 */
export const logger: Logger = new Proxy({} as Logger, {
  get(_target, prop: keyof Logger) {
    const defaultLogger = getDefaultLogger();
    const method = defaultLogger[prop];
    if (typeof method === 'function') {
      return method.bind(defaultLogger);
    }
    return method;
  },
});
