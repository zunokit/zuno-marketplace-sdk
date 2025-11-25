/**
 * Logger tests
 */

import { ZunoLogger, createNoOpLogger, type Logger, type LoggerConfig } from '../../utils/logger';

describe('ZunoLogger', () => {
  let consoleSpy: {
    debug: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    // Spy on console methods
    consoleSpy = {
      debug: jest.spyOn(console, 'debug').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };
  });

  afterEach(() => {
    // Restore console methods
    consoleSpy.debug.mockRestore();
    consoleSpy.info.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('Log Levels', () => {
    it('should log debug messages when level is debug', () => {
      const logger = new ZunoLogger({ level: 'debug' });
      logger.debug('Test debug message');
      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should log info messages when level is info', () => {
      const logger = new ZunoLogger({ level: 'info' });
      logger.info('Test info message');
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log warn messages when level is warn', () => {
      const logger = new ZunoLogger({ level: 'warn' });
      logger.warn('Test warn message');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error messages when level is error', () => {
      const logger = new ZunoLogger({ level: 'error' });
      logger.error('Test error message');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should not log debug when level is info', () => {
      const logger = new ZunoLogger({ level: 'info' });
      logger.debug('Test debug message');
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it('should not log info when level is warn', () => {
      const logger = new ZunoLogger({ level: 'warn' });
      logger.info('Test info message');
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });

    it('should not log warn when level is error', () => {
      const logger = new ZunoLogger({ level: 'error' });
      logger.warn('Test warn message');
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });

    it('should not log anything when level is none', () => {
      const logger = new ZunoLogger({ level: 'none' });
      logger.debug('Test debug');
      logger.info('Test info');
      logger.warn('Test warn');
      logger.error('Test error');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe('Log Hierarchy', () => {
    it('should log error and warn when level is warn', () => {
      const logger = new ZunoLogger({ level: 'warn' });
      logger.error('Test error');
      logger.warn('Test warn');

      expect(consoleSpy.error).toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error, warn, and info when level is info', () => {
      const logger = new ZunoLogger({ level: 'info' });
      logger.error('Test error');
      logger.warn('Test warn');
      logger.info('Test info');

      expect(consoleSpy.error).toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log all levels when level is debug', () => {
      const logger = new ZunoLogger({ level: 'debug' });
      logger.error('Test error');
      logger.warn('Test warn');
      logger.info('Test info');
      logger.debug('Test debug');

      expect(consoleSpy.error).toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalled();
      expect(consoleSpy.debug).toHaveBeenCalled();
    });
  });

  describe('Message Formatting', () => {
    it('should include module prefix when configured', () => {
      const logger = new ZunoLogger({ level: 'info', modulePrefix: true });
      logger.info('Test message', { module: 'TestModule' });

      const callArg = consoleSpy.info.mock.calls[0][0];
      expect(callArg).toContain('TestModule');
    });

    it('should include timestamp when configured', () => {
      const logger = new ZunoLogger({ level: 'info', timestamp: true });
      logger.info('Test message');

      const callArg = consoleSpy.info.mock.calls[0][0];
      // Should contain ISO timestamp format
      expect(callArg).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include log level in message', () => {
      const logger = new ZunoLogger({ level: 'info' });
      logger.info('Test message');

      const callArg = consoleSpy.info.mock.calls[0][0];
      expect(callArg).toContain('[INFO]');
    });

    it('should include metadata when provided', () => {
      const logger = new ZunoLogger({ level: 'info' });
      logger.info('Test message', { data: { foo: 'bar' } });

      const callArg = consoleSpy.info.mock.calls[0][0];
      expect(callArg).toContain('foo');
      expect(callArg).toContain('bar');
    });
  });

  describe('JSON Format', () => {
    it('should output JSON when format is json', () => {
      const logger = new ZunoLogger({ level: 'info', format: 'json' });
      logger.info('Test message', { data: { foo: 'bar' } });

      const callArg = consoleSpy.info.mock.calls[0][0];
      const parsed = JSON.parse(callArg);

      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('Test message');
      expect(parsed.data).toEqual({ foo: 'bar' });
    });

    it('should include timestamp in JSON when configured', () => {
      const logger = new ZunoLogger({ level: 'info', format: 'json', timestamp: true });
      logger.info('Test message');

      const callArg = consoleSpy.info.mock.calls[0][0];
      const parsed = JSON.parse(callArg);

      expect(parsed.timestamp).toBeDefined();
      expect(typeof parsed.timestamp).toBe('number');
    });
  });

  describe('Module Filtering', () => {
    it('should only log included modules', () => {
      const logger = new ZunoLogger({
        level: 'info',
        includeModules: ['ModuleA', 'ModuleB'],
      });

      logger.info('Message A', { module: 'ModuleA' });
      logger.info('Message B', { module: 'ModuleB' });
      logger.info('Message C', { module: 'ModuleC' });

      expect(consoleSpy.info).toHaveBeenCalledTimes(2);
    });

    it('should exclude specified modules', () => {
      const logger = new ZunoLogger({
        level: 'info',
        excludeModules: ['ModuleC'],
      });

      logger.info('Message A', { module: 'ModuleA' });
      logger.info('Message B', { module: 'ModuleB' });
      logger.info('Message C', { module: 'ModuleC' });

      expect(consoleSpy.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('Action Filtering', () => {
    it('should only log included actions', () => {
      const logger = new ZunoLogger({
        level: 'info',
        includeActions: ['actionA', 'actionB'],
      });

      logger.info('Message A', { action: 'actionA' });
      logger.info('Message B', { action: 'actionB' });
      logger.info('Message C', { action: 'actionC' });

      expect(consoleSpy.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('Custom Logger', () => {
    it('should use custom logger when provided', () => {
      const customLogger: Logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      const logger = new ZunoLogger({
        level: 'info',
        customLogger,
      });

      logger.info('Test message');

      expect(customLogger.info).toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });

    it('should pass metadata to custom logger', () => {
      const customLogger: Logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      const logger = new ZunoLogger({
        level: 'info',
        customLogger,
      });

      const meta = { module: 'Test', data: { foo: 'bar' } };
      logger.info('Test message', meta);

      expect(customLogger.info).toHaveBeenCalledWith(
        'Test message',
        expect.objectContaining({
          module: 'Test',
          data: { foo: 'bar' },
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('Module Logger', () => {
    it('should create module-specific logger', () => {
      const logger = new ZunoLogger({ level: 'info' });
      const moduleLogger = logger.createModuleLogger('TestModule');

      moduleLogger.info('Test message');

      const callArg = consoleSpy.info.mock.calls[0][0];
      expect(callArg).toContain('TestModule');
    });

    it('should preserve metadata when creating module logger', () => {
      const logger = new ZunoLogger({ level: 'info' });
      const moduleLogger = logger.createModuleLogger('TestModule');

      moduleLogger.info('Test message', { data: { foo: 'bar' } });

      const callArg = consoleSpy.info.mock.calls[0][0];
      expect(callArg).toContain('TestModule');
      expect(callArg).toContain('foo');
    });
  });

  describe('Transaction Logging', () => {
    it('should log transactions when enabled', () => {
      const logger = new ZunoLogger({ level: 'info', logTransactions: true });
      logger.logTransaction('listNFT', '0x123abc', { module: 'Exchange' });

      expect(consoleSpy.info).toHaveBeenCalled();
      const callArg = consoleSpy.info.mock.calls[0][0];
      expect(callArg).toContain('Transaction submitted');
      expect(callArg).toContain('0x123abc');
    });

    it('should not log transactions when disabled', () => {
      const logger = new ZunoLogger({ level: 'info', logTransactions: false });
      logger.logTransaction('listNFT', '0x123abc', { module: 'Exchange' });

      expect(consoleSpy.info).not.toHaveBeenCalled();
    });
  });

  describe('Error Context', () => {
    it('should include SDK context in errors when enabled', () => {
      const logger = new ZunoLogger({ level: 'error', includeErrorContext: true });
      logger.setContext({ network: 'sepolia', apiUrl: 'https://api.test.com' });

      logger.error('Test error');

      expect(consoleSpy.error).toHaveBeenCalledTimes(2); // Error message + context
      const contextCall = consoleSpy.error.mock.calls[1];
      expect(contextCall[0]).toBe('SDK Context:');
      expect(contextCall[1]).toEqual({
        network: 'sepolia',
        apiUrl: 'https://api.test.com',
      });
    });

    it('should not include SDK context when disabled', () => {
      const logger = new ZunoLogger({ level: 'error', includeErrorContext: false });
      logger.setContext({ network: 'sepolia' });

      logger.error('Test error');

      expect(consoleSpy.error).toHaveBeenCalledTimes(1); // Only error message
    });
  });

  describe('Config Update', () => {
    it('should update logger config dynamically', () => {
      const logger = new ZunoLogger({ level: 'none' });
      logger.info('Test message 1');
      expect(consoleSpy.info).not.toHaveBeenCalled();

      logger.updateConfig({ level: 'info' });
      logger.info('Test message 2');
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should update custom logger dynamically', () => {
      const logger = new ZunoLogger({ level: 'info' });
      const customLogger: Logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      logger.updateConfig({ customLogger });
      logger.info('Test message');

      expect(customLogger.info).toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });
  });

  describe('createNoOpLogger', () => {
    it('should create a no-op logger that does nothing', () => {
      const logger = createNoOpLogger();

      logger.debug('Test');
      logger.info('Test');
      logger.warn('Test');
      logger.error('Test');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should be fast when logging is disabled', () => {
      const logger = new ZunoLogger({ level: 'none' });

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        logger.info('Test message', { data: { iteration: i } });
      }
      const duration = performance.now() - start;

      // Should complete in less than 50ms for 10k calls
      expect(duration).toBeLessThan(50);
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });

    it('should use no-op logger for better performance', () => {
      const logger = createNoOpLogger();

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        logger.info('Test message', { data: { iteration: i } });
      }
      const duration = performance.now() - start;

      // No-op should be even faster
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle messages without metadata', () => {
      const logger = new ZunoLogger({ level: 'info' });
      logger.info('Simple message');

      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should handle empty metadata', () => {
      const logger = new ZunoLogger({ level: 'info' });
      logger.info('Message', {});

      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should handle complex metadata objects', () => {
      const logger = new ZunoLogger({ level: 'info' });
      const complexMeta = {
        module: 'Test',
        action: 'test',
        data: {
          nested: {
            deeply: {
              value: 'test',
            },
          },
          array: [1, 2, 3],
        },
      };

      logger.info('Message', complexMeta);

      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should handle undefined config gracefully', () => {
      const logger = new ZunoLogger();
      logger.info('Test message');

      // Should not log by default (level: 'none')
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });
  });
});
