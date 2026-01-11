/**
 * Batch Progress Tracker Tests
 */

import {
  BATCH_EVENTS,
  createBatchProgressTracker,
  BatchProgressTracker,
} from '../../utils/batchProgress';
import { EventEmitter } from '../../utils/events';
import type {
  BatchProgressStart,
  BatchProgressItem,
  BatchProgressComplete,
} from '../../types/entities';

describe('BatchProgressTracker', () => {
  let emitter: EventEmitter;
  let startHandler: jest.Mock;
  let itemHandler: jest.Mock;
  let completeHandler: jest.Mock;

  beforeEach(() => {
    emitter = new EventEmitter();
    startHandler = jest.fn();
    itemHandler = jest.fn();
    completeHandler = jest.fn();

    emitter.on(BATCH_EVENTS.START, startHandler);
    emitter.on(BATCH_EVENTS.ITEM, itemHandler);
    emitter.on(BATCH_EVENTS.COMPLETE, completeHandler);
  });

  describe('BATCH_EVENTS', () => {
    it('should have correct event names', () => {
      expect(BATCH_EVENTS.START).toBe('batchProgress.start');
      expect(BATCH_EVENTS.ITEM).toBe('batchProgress.item');
      expect(BATCH_EVENTS.COMPLETE).toBe('batchProgress.complete');
    });
  });

  describe('createBatchProgressTracker', () => {
    it('should create a BatchProgressTracker instance', () => {
      const tracker = createBatchProgressTracker(
        emitter,
        'testOperation',
        'TestModule',
        5
      );
      expect(tracker).toBeInstanceOf(BatchProgressTracker);
    });
  });

  describe('start()', () => {
    it('should emit start event with correct data', () => {
      const tracker = createBatchProgressTracker(
        emitter,
        'batchCreateEnglishAuction',
        'Auction',
        3
      );

      tracker.start();

      expect(startHandler).toHaveBeenCalledTimes(1);
      const event: BatchProgressStart = startHandler.mock.calls[0][0];
      expect(event.operation).toBe('batchCreateEnglishAuction');
      expect(event.module).toBe('Auction');
      expect(event.totalItems).toBe(3);
      expect(event.timestamp).toBeDefined();
    });
  });

  describe('itemProcessed()', () => {
    it('should emit item event for successful item', () => {
      const tracker = createBatchProgressTracker(
        emitter,
        'batchBuyNFT',
        'Exchange',
        5
      );

      tracker.start();
      tracker.itemProcessed(0, true, '0x1234');

      expect(itemHandler).toHaveBeenCalledTimes(1);
      const event: BatchProgressItem = itemHandler.mock.calls[0][0];
      expect(event.operation).toBe('batchBuyNFT');
      expect(event.module).toBe('Exchange');
      expect(event.index).toBe(0);
      expect(event.totalItems).toBe(5);
      expect(event.success).toBe(true);
      expect(event.itemId).toBe('0x1234');
      expect(event.error).toBeUndefined();
    });

    it('should emit item event for failed item', () => {
      const tracker = createBatchProgressTracker(
        emitter,
        'addToAllowlist',
        'Collection',
        10
      );

      tracker.start();
      tracker.itemProcessed(5, false, '0xabcd', 'Transaction reverted');

      expect(itemHandler).toHaveBeenCalledTimes(1);
      const event: BatchProgressItem = itemHandler.mock.calls[0][0];
      expect(event.index).toBe(5);
      expect(event.success).toBe(false);
      expect(event.itemId).toBe('0xabcd');
      expect(event.error).toBe('Transaction reverted');
    });
  });

  describe('complete()', () => {
    it('should emit complete event with correct stats', () => {
      const tracker = createBatchProgressTracker(
        emitter,
        'batchCancelAuction',
        'Auction',
        5
      );

      tracker.start();
      tracker.itemProcessed(0, true);
      tracker.itemProcessed(1, true);
      tracker.itemProcessed(2, false, undefined, 'Failed');
      tracker.itemProcessed(3, true);
      tracker.itemProcessed(4, false, undefined, 'Failed');
      tracker.complete();

      expect(completeHandler).toHaveBeenCalledTimes(1);
      const event: BatchProgressComplete = completeHandler.mock.calls[0][0];
      expect(event.operation).toBe('batchCancelAuction');
      expect(event.module).toBe('Auction');
      expect(event.totalItems).toBe(5);
      expect(event.successCount).toBe(3);
      expect(event.failCount).toBe(2);
      expect(event.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getStats()', () => {
    it('should return current progress stats', () => {
      const tracker = createBatchProgressTracker(
        emitter,
        'test',
        'Test',
        3
      );

      tracker.start();
      tracker.itemProcessed(0, true);
      tracker.itemProcessed(1, false);

      const stats = tracker.getStats();
      expect(stats.successCount).toBe(1);
      expect(stats.failCount).toBe(1);
      expect(stats.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('full batch operation flow', () => {
    it('should track complete batch operation lifecycle', () => {
      const tracker = createBatchProgressTracker(
        emitter,
        'batchMint',
        'Collection',
        3
      );

      tracker.start();
      expect(startHandler).toHaveBeenCalledTimes(1);

      tracker.itemProcessed(0, true, 'token1');
      tracker.itemProcessed(1, true, 'token2');
      tracker.itemProcessed(2, true, 'token3');
      expect(itemHandler).toHaveBeenCalledTimes(3);

      tracker.complete();
      expect(completeHandler).toHaveBeenCalledTimes(1);

      const completeEvent: BatchProgressComplete = completeHandler.mock.calls[0][0];
      expect(completeEvent.successCount).toBe(3);
      expect(completeEvent.failCount).toBe(0);
    });
  });
});
