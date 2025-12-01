/**
 * LogStore tests
 */

import { logStore } from '../../utils/logStore';
import { ZunoLogger } from '../../utils/logger';

describe('LogStore', () => {
  beforeEach(() => {
    logStore.clear();
  });

  afterEach(() => {
    logStore.clear();
  });

  describe('Basic Operations', () => {
    it('should add log entries', () => {
      logStore.add('info', 'Test message');
      const logs = logStore.getAll();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('Test message');
      expect(logs[0].level).toBe('info');
    });

    it('should clear all logs', () => {
      logStore.add('info', 'Test 1');
      logStore.add('info', 'Test 2');
      expect(logStore.getAll().length).toBe(2);
      
      logStore.clear();
      expect(logStore.getAll().length).toBe(0);
    });

    it('should store logs in reverse order (newest first)', () => {
      logStore.add('info', 'First');
      logStore.add('info', 'Second');
      const logs = logStore.getAll();
      expect(logs[0].message).toBe('Second');
      expect(logs[1].message).toBe('First');
    });

    it('should include module in log entry', () => {
      logStore.add('debug', 'Test', { module: 'TestModule' });
      const logs = logStore.getAll();
      expect(logs[0].module).toBe('TestModule');
    });

    it('should include data in log entry', () => {
      logStore.add('info', 'Test', { data: { foo: 'bar' } });
      const logs = logStore.getAll();
      expect(logs[0].data).toEqual({ foo: 'bar' });
    });
  });

  describe('Subscription', () => {
    it('should notify subscribers when logs are added', () => {
      const callback = jest.fn();
      const unsubscribe = logStore.subscribe(callback);

      logStore.add('info', 'Test');
      expect(callback).toHaveBeenCalledTimes(2); // Initial + add

      unsubscribe();
    });

    it('should stop notifying after unsubscribe', () => {
      const callback = jest.fn();
      const unsubscribe = logStore.subscribe(callback);
      
      unsubscribe();
      callback.mockClear();
      
      logStore.add('info', 'Test');
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Max Entries', () => {
    it('should respect max entries limit', () => {
      logStore.setMaxEntries(3);
      
      logStore.add('info', 'Log 1');
      logStore.add('info', 'Log 2');
      logStore.add('info', 'Log 3');
      logStore.add('info', 'Log 4');
      
      const logs = logStore.getAll();
      expect(logs.length).toBe(3);
      expect(logs[0].message).toBe('Log 4');
    });
  });

  describe('Integration with ZunoLogger', () => {
    it('should receive logs from ZunoLogger', () => {
      const logger = new ZunoLogger({ level: 'debug' });
      
      logger.info('Test message', { module: 'Test' });
      
      const logs = logStore.getAll();
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe('Test message');
      expect(logs[0].module).toBe('Test');
    });

    it('should receive logs from different methods', () => {
      const logger = new ZunoLogger({ level: 'info' });
      
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      
      const logs = logStore.getAll();
      expect(logs.length).toBeGreaterThanOrEqual(3);
    });
  });
});
