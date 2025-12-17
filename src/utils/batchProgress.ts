/**
 * Batch progress event utilities for better UX during batch operations
 */

import type {
  BatchProgressStart,
  BatchProgressItem,
  BatchProgressComplete,
} from '../types/entities';
import { EventEmitter } from './events';

/**
 * Event names for batch progress tracking
 */
export const BATCH_EVENTS = {
  START: 'batchProgress.start',
  ITEM: 'batchProgress.item',
  COMPLETE: 'batchProgress.complete',
} as const;

/**
 * Batch progress tracker for emitting progress events during batch operations
 */
export class BatchProgressTracker {
  private startTime: number = 0;
  private successCount: number = 0;
  private failCount: number = 0;

  constructor(
    private emitter: EventEmitter,
    private operation: string,
    private module: string,
    private totalItems: number
  ) {}

  /**
   * Emit batch start event
   */
  start(): void {
    this.startTime = Date.now();
    this.successCount = 0;
    this.failCount = 0;

    const event: BatchProgressStart = {
      operation: this.operation,
      module: this.module,
      totalItems: this.totalItems,
      timestamp: this.startTime,
    };

    this.emitter.emit(BATCH_EVENTS.START, event);
  }

  /**
   * Emit item processed event
   */
  itemProcessed(index: number, success: boolean, itemId?: string, error?: string): void {
    if (success) {
      this.successCount++;
    } else {
      this.failCount++;
    }

    const event: BatchProgressItem = {
      operation: this.operation,
      module: this.module,
      index,
      totalItems: this.totalItems,
      success,
      itemId,
      error,
      timestamp: Date.now(),
    };

    this.emitter.emit(BATCH_EVENTS.ITEM, event);
  }

  /**
   * Emit batch complete event
   */
  complete(): void {
    const event: BatchProgressComplete = {
      operation: this.operation,
      module: this.module,
      totalItems: this.totalItems,
      successCount: this.successCount,
      failCount: this.failCount,
      duration: Date.now() - this.startTime,
      timestamp: Date.now(),
    };

    this.emitter.emit(BATCH_EVENTS.COMPLETE, event);
  }

  /**
   * Get current progress stats
   */
  getStats(): { successCount: number; failCount: number; duration: number } {
    return {
      successCount: this.successCount,
      failCount: this.failCount,
      duration: Date.now() - this.startTime,
    };
  }
}

/**
 * Create a batch progress tracker
 * 
 * @param emitter - Event emitter to use for events
 * @param operation - Name of the batch operation (e.g., 'batchCreateEnglishAuction')
 * @param module - Module name (e.g., 'Auction', 'Exchange', 'Collection')
 * @param totalItems - Total number of items in the batch
 * 
 * @example
 * ```typescript
 * const tracker = createBatchProgressTracker(
 *   this.events,
 *   'batchCreateEnglishAuction',
 *   'Auction',
 *   tokenIds.length
 * );
 * 
 * tracker.start();
 * for (let i = 0; i < tokenIds.length; i++) {
 *   try {
 *     await processItem(tokenIds[i]);
 *     tracker.itemProcessed(i, true, tokenIds[i]);
 *   } catch (error) {
 *     tracker.itemProcessed(i, false, tokenIds[i], error.message);
 *   }
 * }
 * tracker.complete();
 * ```
 */
export function createBatchProgressTracker(
  emitter: EventEmitter,
  operation: string,
  module: string,
  totalItems: number
): BatchProgressTracker {
  return new BatchProgressTracker(emitter, operation, module, totalItems);
}
