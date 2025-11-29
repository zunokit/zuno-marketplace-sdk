/**
 * Comprehensive tests for logger utilities
 */

import {
  createLogger,
  configureLogger,
  getDefaultLogger,
  resetLogger,
  logger,
  ZunoLogger,
  createNoOpLogger,
} from '../logger';

describe('Logger Utilities', () => {
  beforeEach(() => {
    resetLogger();
  });

  describe('createLogger', () => {
    it('should create a new logger instance', () => {
      const log = createLogger({ level: 'debug' });

      expect(log).toBeDefined();
      expect(log.debug).toBeDefined();
      expect(log.info).toBeDefined();
      expect(log.warn).toBeDefined();
      expect(log.error).toBeDefined();
    });

    it('should respect log level configuration', () => {
      const log = createLogger({ level: 'error' });

      // Should not throw
      log.debug('debug message');
      log.info('info message');
      log.warn('warn message');
      log.error('error message');
    });

    it('should create logger with default config when no options provided', () => {
      const log = createLogger();

      expect(log).toBeDefined();
      expect(log.debug).toBeDefined();
    });

    it('should create independent logger instances', () => {
      const log1 = createLogger({ level: 'debug' });
      const log2 = createLogger({ level: 'error' });

      expect(log1).not.toBe(log2);
    });
  });

  describe('configureLogger', () => {
    it('should configure the default logger', () => {
      const configured = configureLogger({ level: 'info' });

      expect(configured).toBeDefined();
      expect(getDefaultLogger()).toBe(configured);
    });

    it('should return the configured logger', () => {
      const log1 = configureLogger({ level: 'debug' });
      const log2 = getDefaultLogger();

      expect(log1).toBe(log2);
    });
  });

  describe('getDefaultLogger', () => {
    it('should return no-op logger when not configured', () => {
      const log = getDefaultLogger();

      expect(log).toBeDefined();
      // Should not throw
      log.debug('test');
      log.info('test');
      log.warn('test');
      log.error('test');
    });

    it('should return configured logger after configuration', () => {
      configureLogger({ level: 'debug' });
      const log = getDefaultLogger();

      expect(log).toBeInstanceOf(ZunoLogger);
    });
  });

  describe('resetLogger', () => {
    it('should reset the default logger', () => {
      configureLogger({ level: 'debug' });
      const before = getDefaultLogger();

      resetLogger();
      const after = getDefaultLogger();

      expect(before).not.toBe(after);
    });
  });

  describe('logger proxy', () => {
    it('should proxy calls to default logger', () => {
      // Configure to capture logs
      configureLogger({ level: 'debug' });

      // Should not throw
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
    });

    it('should work even when not configured', () => {
      // Should not throw even without configuration
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
    });
  });

  describe('ZunoLogger', () => {
    it('should create module-specific loggers', () => {
      const mainLogger = new ZunoLogger({ level: 'debug' });
      const moduleLogger = mainLogger.createModuleLogger('TestModule');

      expect(moduleLogger).toBeDefined();
      expect(moduleLogger.debug).toBeDefined();
      expect(moduleLogger.info).toBeDefined();
    });

    it('should support JSON format', () => {
      const log = new ZunoLogger({ level: 'debug', format: 'json' });

      // Should not throw
      log.info('test message', { data: { key: 'value' } });
    });

    it('should update configuration', () => {
      const log = new ZunoLogger({ level: 'error' });

      log.updateConfig({ level: 'debug' });

      // Should not throw after update
      log.debug('debug message');
    });

    it('should support timestamp option', () => {
      const logWithTimestamp = new ZunoLogger({ level: 'debug', timestamp: true });
      const logWithoutTimestamp = new ZunoLogger({ level: 'debug', timestamp: false });

      // Both should work without throwing
      logWithTimestamp.info('with timestamp');
      logWithoutTimestamp.info('without timestamp');
    });

    it('should support colors option', () => {
      const logWithColors = new ZunoLogger({ level: 'debug', colors: true });
      const logWithoutColors = new ZunoLogger({ level: 'debug', colors: false });

      // Both should work without throwing
      logWithColors.info('with colors');
      logWithoutColors.info('without colors');
    });

    it('should support modulePrefix option', () => {
      const log = new ZunoLogger({ level: 'debug', modulePrefix: true });
      const moduleLogger = log.createModuleLogger('TestModule');

      // Should not throw
      moduleLogger.info('test message');
    });

    it('should log transactions when enabled', () => {
      const log = new ZunoLogger({ level: 'debug', logTransactions: true });

      // Should not throw
      log.logTransaction('listNFT', '0x123...abc', { module: 'Exchange' });
    });

    it('should not log transactions when disabled', () => {
      const log = new ZunoLogger({ level: 'debug', logTransactions: false });

      // Should not throw
      log.logTransaction('listNFT', '0x123...abc', { module: 'Exchange' });
    });

    it('should set context for error logging', () => {
      const log = new ZunoLogger({ level: 'debug', includeErrorContext: true });

      log.setContext({ network: 'sepolia', version: '1.0.0' });

      // Should not throw
      log.error('test error');
    });

    it('should support custom logger', () => {
      const customLogs: string[] = [];
      const customLogger = {
        debug: (msg: string) => customLogs.push(`DEBUG: ${msg}`),
        info: (msg: string) => customLogs.push(`INFO: ${msg}`),
        warn: (msg: string) => customLogs.push(`WARN: ${msg}`),
        error: (msg: string) => customLogs.push(`ERROR: ${msg}`),
      };

      const log = new ZunoLogger({ level: 'debug', customLogger });

      log.info('test message');

      expect(customLogs).toContain('INFO: test message');
    });
  });

  describe('createNoOpLogger', () => {
    it('should create a logger that does nothing', () => {
      const noOpLogger = createNoOpLogger();

      expect(noOpLogger).toBeDefined();
      expect(noOpLogger.debug).toBeDefined();
      expect(noOpLogger.info).toBeDefined();
      expect(noOpLogger.warn).toBeDefined();
      expect(noOpLogger.error).toBeDefined();

      // Should not throw
      noOpLogger.debug('test');
      noOpLogger.info('test');
      noOpLogger.warn('test');
      noOpLogger.error('test');
    });
  });

  describe('Log levels', () => {
    it('should respect none level', () => {
      const log = new ZunoLogger({ level: 'none' });

      // All levels should be no-ops
      log.debug('debug');
      log.info('info');
      log.warn('warn');
      log.error('error');
    });

    it('should respect error level', () => {
      const log = new ZunoLogger({ level: 'error' });

      // Only error should log, others should be no-ops
      log.debug('debug');
      log.info('info');
      log.warn('warn');
      log.error('error');
    });

    it('should respect warn level', () => {
      const log = new ZunoLogger({ level: 'warn' });

      // warn and error should log
      log.debug('debug');
      log.info('info');
      log.warn('warn');
      log.error('error');
    });

    it('should respect info level', () => {
      const log = new ZunoLogger({ level: 'info' });

      // info, warn, and error should log
      log.debug('debug');
      log.info('info');
      log.warn('warn');
      log.error('error');
    });

    it('should respect debug level', () => {
      const log = new ZunoLogger({ level: 'debug' });

      // All levels should log
      log.debug('debug');
      log.info('info');
      log.warn('warn');
      log.error('error');
    });
  });

  describe('Module filtering', () => {
    it('should include only specified modules', () => {
      const log = new ZunoLogger({
        level: 'debug',
        includeModules: ['Exchange'],
      });

      // Should not throw
      log.info('test', { module: 'Exchange' });
      log.info('test', { module: 'Auction' });
    });

    it('should exclude specified modules', () => {
      const log = new ZunoLogger({
        level: 'debug',
        excludeModules: ['Debug'],
      });

      // Should not throw
      log.info('test', { module: 'Exchange' });
      log.info('test', { module: 'Debug' });
    });

    it('should filter by action', () => {
      const log = new ZunoLogger({
        level: 'debug',
        includeActions: ['listNFT', 'buyNFT'],
      });

      // Should not throw
      log.info('test', { action: 'listNFT' });
      log.info('test', { action: 'transfer' });
    });
  });
});
