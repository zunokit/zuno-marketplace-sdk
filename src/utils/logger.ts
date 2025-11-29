/**
 * Logger utility for Zuno SDK
 * Provides structured logging with multiple levels and custom logger support
 */

import { logStore } from './logStore';

/**
 * Log levels in priority order
 */
export type LogLevel = 'none' | 'error' | 'warn' | 'info' | 'debug';

/**
 * Log metadata for structured logging
 */
export interface LogMetadata {
  module?: string;
  action?: string;
  timestamp?: number;
  data?: any;
  [key: string]: any;
}

/**
 * Logger interface for custom implementations
 */
export interface Logger {
  debug(message: string, meta?: LogMetadata): void;
  info(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  error(message: string, meta?: LogMetadata): void;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /**
   * Log level threshold
   * @default 'none'
   */
  level?: LogLevel;

  /**
   * Custom logger implementation (e.g., Sentry, Datadog, Winston)
   * @optional
   */
  customLogger?: Logger;

  /**
   * Include timestamp in logs
   * @default true
   */
  timestamp?: boolean;

  /**
   * Enable console colors (browser/Node.js)
   * @default true
   */
  colors?: boolean;

  /**
   * Include module prefix [ModuleName]
   * @default true
   */
  modulePrefix?: boolean;

  /**
   * Output format: 'text' or 'json'
   * @default 'text'
   */
  format?: 'text' | 'json';

  /**
   * Only log from these modules
   * @optional
   */
  includeModules?: string[];

  /**
   * Exclude logs from these modules
   * @optional
   */
  excludeModules?: string[];

  /**
   * Only log these actions
   * @optional
   */
  includeActions?: string[];

  /**
   * Auto-log all transactions
   * @default true
   */
  logTransactions?: boolean;

  /**
   * Include SDK state in error logs
   * @default true
   */
  includeErrorContext?: boolean;
}

/**
 * Log level priority mapping
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: Required<Omit<LoggerConfig, 'customLogger' | 'includeModules' | 'excludeModules' | 'includeActions'>> = {
  level: 'none',
  timestamp: true,
  colors: true,
  modulePrefix: true,
  format: 'text',
  logTransactions: true,
  includeErrorContext: true,
};

/**
 * Zuno Logger implementation
 */
export class ZunoLogger implements Logger {
  private config: Required<LoggerConfig>;
  private customLogger?: Logger;
  private _sdkContext?: unknown;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      includeModules: config.includeModules,
      excludeModules: config.excludeModules,
      includeActions: config.includeActions,
    } as Required<LoggerConfig>;
    this.customLogger = config.customLogger;
  }

  /**
   * Set SDK context for error logging
   */
  setContext(context: unknown): void {
    this._sdkContext = context;
  }

  /**
   * Get SDK context
   */
  getContext(): unknown {
    return this._sdkContext;
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel, meta?: LogMetadata): boolean {
    // Check level threshold
    if (LOG_LEVELS[level] > LOG_LEVELS[this.config.level]) {
      return false;
    }

    // Check module filters
    if (meta?.module) {
      if (this.config.includeModules && !this.config.includeModules.includes(meta.module)) {
        return false;
      }
      if (this.config.excludeModules && this.config.excludeModules.includes(meta.module)) {
        return false;
      }
    }

    // Check action filters
    if (meta?.action) {
      if (this.config.includeActions && !this.config.includeActions.includes(meta.action)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Log a message
   */
  private log(level: LogLevel, message: string, meta?: LogMetadata): void {
    // Performance: no-op if level is 'none'
    if (this.config.level === 'none') {
      return;
    }

    // Check if should log
    if (!this.shouldLog(level, meta)) {
      return;
    }

    // Add timestamp to meta if not present
    const enrichedMeta: LogMetadata = {
      ...meta,
      timestamp: meta?.timestamp || Date.now(),
    };

    // Always push to logStore for DevTools
    if (level !== 'none') {
      logStore.add(level as 'debug' | 'info' | 'warn' | 'error', message, {
        module: enrichedMeta.module,
        data: enrichedMeta.data,
      });
    }

    // Custom logger takes precedence
    if (this.customLogger && level !== 'none') {
      this.customLogger[level as keyof Logger](message, enrichedMeta);
      return;
    }
  }

  /**
   * Debug level log
   */
  debug(message: string, meta?: LogMetadata): void {
    this.log('debug', message, meta);
  }

  /**
   * Info level log
   */
  info(message: string, meta?: LogMetadata): void {
    this.log('info', message, meta);
  }

  /**
   * Warning level log
   */
  warn(message: string, meta?: LogMetadata): void {
    this.log('warn', message, meta);
  }

  /**
   * Error level log
   */
  error(message: string, meta?: LogMetadata): void {
    this.log('error', message, meta);
  }

  /**
   * Create a module-specific logger
   */
  createModuleLogger(moduleName: string): Logger {
    return {
      debug: (message: string, meta?: LogMetadata) =>
        this.debug(message, { ...meta, module: moduleName }),
      info: (message: string, meta?: LogMetadata) =>
        this.info(message, { ...meta, module: moduleName }),
      warn: (message: string, meta?: LogMetadata) =>
        this.warn(message, { ...meta, module: moduleName }),
      error: (message: string, meta?: LogMetadata) =>
        this.error(message, { ...meta, module: moduleName }),
    };
  }

  /**
   * Log transaction details
   */
  logTransaction(
    action: string,
    txHash: string,
    meta?: Omit<LogMetadata, 'action'>
  ): void {
    if (!this.config.logTransactions) {
      return;
    }

    this.info(`Transaction submitted`, {
      ...meta,
      action,
      data: { hash: txHash },
    });
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    } as Required<LoggerConfig>;

    if (config.customLogger) {
      this.customLogger = config.customLogger;
    }
  }
}

/**
 * Create a no-op logger (for performance when logging is disabled)
 */
export function createNoOpLogger(): Logger {
  const noop = () => {};
  return {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
  };
}
