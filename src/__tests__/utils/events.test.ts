/**
 * EventEmitter Tests
 */

import { EventEmitter } from '../../utils/events';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on', () => {
    it('should register event listener', () => {
      const callback = jest.fn();
      emitter.on('test', callback);

      emitter.emit('test');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple listeners for same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      emitter.on('test', callback1);
      emitter.on('test', callback2);

      emitter.emit('test');

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should not add duplicate callbacks', () => {
      const callback = jest.fn();

      emitter.on('test', callback);
      emitter.on('test', callback);

      emitter.emit('test');

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('once', () => {
    it('should only trigger callback once', () => {
      const callback = jest.fn();
      emitter.once('test', callback);

      emitter.emit('test');
      emitter.emit('test');
      emitter.emit('test');

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to callback', () => {
      const callback = jest.fn();
      emitter.once('test', callback);

      emitter.emit('test', 'arg1', 'arg2', 123);

      expect(callback).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });
  });

  describe('off', () => {
    it('should remove event listener', () => {
      const callback = jest.fn();
      emitter.on('test', callback);

      emitter.off('test', callback);
      emitter.emit('test');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should only remove specified callback', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      emitter.on('test', callback1);
      emitter.on('test', callback2);

      emitter.off('test', callback1);
      emitter.emit('test');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should do nothing if event does not exist', () => {
      const callback = jest.fn();

      expect(() => {
        emitter.off('nonexistent', callback);
      }).not.toThrow();
    });

    it('should clean up event when last listener removed', () => {
      const callback = jest.fn();
      emitter.on('test', callback);

      expect(emitter.eventNames()).toContain('test');

      emitter.off('test', callback);

      expect(emitter.eventNames()).not.toContain('test');
    });
  });

  describe('emit', () => {
    it('should pass arguments to callbacks', () => {
      const callback = jest.fn();
      emitter.on('test', callback);

      emitter.emit('test', 'arg1', { key: 'value' }, 123);

      expect(callback).toHaveBeenCalledWith('arg1', { key: 'value' }, 123);
    });

    it('should do nothing if no listeners', () => {
      expect(() => {
        emitter.emit('nonexistent', 'arg1');
      }).not.toThrow();
    });

    it('should catch errors in event handlers', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalCallback = jest.fn();

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      emitter.on('test', errorCallback);
      emitter.on('test', normalCallback);

      expect(() => {
        emitter.emit('test');
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      emitter.on('event1', callback1);
      emitter.on('event1', callback2);
      emitter.on('event2', callback3);

      emitter.removeAllListeners('event1');

      emitter.emit('event1');
      emitter.emit('event2');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('should remove all listeners for all events when no event specified', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      emitter.on('event1', callback1);
      emitter.on('event2', callback2);

      emitter.removeAllListeners();

      emitter.emit('event1');
      emitter.emit('event2');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('should return number of listeners for event', () => {
      expect(emitter.listenerCount('test')).toBe(0);

      emitter.on('test', () => {});
      expect(emitter.listenerCount('test')).toBe(1);

      emitter.on('test', () => {});
      expect(emitter.listenerCount('test')).toBe(2);
    });

    it('should return 0 for non-existent event', () => {
      expect(emitter.listenerCount('nonexistent')).toBe(0);
    });
  });

  describe('eventNames', () => {
    it('should return array of event names', () => {
      emitter.on('event1', () => {});
      emitter.on('event2', () => {});
      emitter.on('event3', () => {});

      const names = emitter.eventNames();

      expect(names).toContain('event1');
      expect(names).toContain('event2');
      expect(names).toContain('event3');
      expect(names.length).toBe(3);
    });

    it('should return empty array when no events', () => {
      expect(emitter.eventNames()).toEqual([]);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle transaction lifecycle events', () => {
      const onPending = jest.fn();
      const onSuccess = jest.fn();
      const onFailed = jest.fn();

      emitter.on('transaction:pending', onPending);
      emitter.on('transaction:success', onSuccess);
      emitter.on('transaction:failed', onFailed);

      // Simulate transaction lifecycle
      emitter.emit('transaction:pending', { hash: '0x123' });
      emitter.emit('transaction:success', { hash: '0x123', gasUsed: '21000' });

      expect(onPending).toHaveBeenCalledWith({ hash: '0x123' });
      expect(onSuccess).toHaveBeenCalledWith({ hash: '0x123', gasUsed: '21000' });
      expect(onFailed).not.toHaveBeenCalled();
    });

    it('should handle batch progress events', () => {
      const onProgress = jest.fn();
      const onComplete = jest.fn();

      emitter.on('batch:progress', onProgress);
      emitter.once('batch:complete', onComplete);

      // Simulate batch progress
      for (let i = 1; i <= 5; i++) {
        emitter.emit('batch:progress', { current: i, total: 5 });
      }
      emitter.emit('batch:complete', { success: 5, failed: 0 });
      emitter.emit('batch:complete', { success: 5, failed: 0 }); // Should not trigger again

      expect(onProgress).toHaveBeenCalledTimes(5);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should support event chaining', () => {
      const results: string[] = [];

      emitter.on('step:1', () => {
        results.push('step1');
        emitter.emit('step:2');
      });

      emitter.on('step:2', () => {
        results.push('step2');
        emitter.emit('step:3');
      });

      emitter.on('step:3', () => {
        results.push('step3');
      });

      emitter.emit('step:1');

      expect(results).toEqual(['step1', 'step2', 'step3']);
    });
  });
});
