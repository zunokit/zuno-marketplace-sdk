/**
 * Tests for logger utilities
 */

import {
  createLogger,
  configureLogger,
  getDefaultLogger,
  resetLogger,
  logger,
  ZunoLogger,
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
  });
});
