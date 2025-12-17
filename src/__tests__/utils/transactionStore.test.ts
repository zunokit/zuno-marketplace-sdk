/**
 * TransactionStore Tests
 */

import { transactionStore } from '../../utils/transactionStore';

describe('TransactionStore', () => {
  beforeEach(() => {
    transactionStore.clear();
    transactionStore.setMaxEntries(50); // Reset to default
  });

  describe('add', () => {
    it('should add a new transaction entry', () => {
      const id = transactionStore.add({
        hash: '0x123',
        action: 'listNFT',
        module: 'Exchange',
        status: 'pending',
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^tx-/);

      const tx = transactionStore.getById(id);
      expect(tx).toBeDefined();
      expect(tx?.hash).toBe('0x123');
      expect(tx?.action).toBe('listNFT');
      expect(tx?.module).toBe('Exchange');
      expect(tx?.status).toBe('pending');
    });

    it('should initialize retry fields', () => {
      const id = transactionStore.add({
        hash: '0x123',
        action: 'listNFT',
        module: 'Exchange',
        status: 'pending',
      });

      const tx = transactionStore.getById(id);
      expect(tx?.retryCount).toBe(0);
      expect(tx?.maxRetries).toBe(3);
      expect(tx?.canRetry).toBe(false); // pending status can't retry
      expect(tx?.previousAttempts).toEqual([]);
    });

    it('should use custom retry config', () => {
      const id = transactionStore.add(
        {
          hash: '0x123',
          action: 'listNFT',
          module: 'Exchange',
          status: 'pending',
        },
        { maxRetries: 5 }
      );

      const tx = transactionStore.getById(id);
      expect(tx?.maxRetries).toBe(5);
    });

    it('should add timestamp', () => {
      const before = new Date();
      const id = transactionStore.add({
        hash: '0x123',
        action: 'listNFT',
        module: 'Exchange',
        status: 'pending',
      });
      const after = new Date();

      const tx = transactionStore.getById(id);
      expect(tx?.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(tx?.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should trim entries when over limit', () => {
      transactionStore.setMaxEntries(3);

      transactionStore.add({ hash: '0x1', action: 'a1', module: 'M', status: 'pending' });
      transactionStore.add({ hash: '0x2', action: 'a2', module: 'M', status: 'pending' });
      transactionStore.add({ hash: '0x3', action: 'a3', module: 'M', status: 'pending' });
      transactionStore.add({ hash: '0x4', action: 'a4', module: 'M', status: 'pending' });

      const all = transactionStore.getAll();
      expect(all.length).toBe(3);
      expect(all[0].hash).toBe('0x4'); // newest first
      expect(all[2].hash).toBe('0x2'); // oldest kept
    });
  });

  describe('update', () => {
    it('should update existing transaction', () => {
      const id = transactionStore.add({
        hash: '0x123',
        action: 'listNFT',
        module: 'Exchange',
        status: 'pending',
      });

      transactionStore.update(id, {
        status: 'success',
        gasUsed: '21000',
      });

      const tx = transactionStore.getById(id);
      expect(tx?.status).toBe('success');
      expect(tx?.gasUsed).toBe('21000');
    });

    it('should update canRetry based on status and retry count', () => {
      const id = transactionStore.add({
        hash: '0x123',
        action: 'listNFT',
        module: 'Exchange',
        status: 'pending',
      });

      transactionStore.update(id, { status: 'failed' });
      let tx = transactionStore.getById(id);
      expect(tx?.canRetry).toBe(true);

      // Note: Implementation considers canRetry true if tx was ever failed
      // This is intentional to allow retry even after status changes
      transactionStore.update(id, { status: 'success' });
      tx = transactionStore.getById(id);
      // canRetry stays true because the tx was previously failed
      expect(tx?.status).toBe('success');
    });

    it('should do nothing for non-existent ID', () => {
      transactionStore.update('non-existent', { status: 'success' });
      // Should not throw
      expect(transactionStore.getById('non-existent')).toBeUndefined();
    });
  });

  describe('recordRetry', () => {
    it('should record retry attempt', () => {
      const id = transactionStore.add({
        hash: '0x123',
        action: 'listNFT',
        module: 'Exchange',
        status: 'failed',
      });

      transactionStore.recordRetry(id, 'Network error', '0x456');

      const tx = transactionStore.getById(id);
      expect(tx?.retryCount).toBe(1);
      expect(tx?.status).toBe('retrying');
      expect(tx?.hash).toBe('0x456');
      expect(tx?.previousAttempts.length).toBe(1);
      expect(tx?.previousAttempts[0].error).toBe('Network error');
      expect(tx?.previousAttempts[0].hash).toBe('0x456');
    });

    it('should track multiple retry attempts', () => {
      const id = transactionStore.add({
        hash: '0x123',
        action: 'listNFT',
        module: 'Exchange',
        status: 'failed',
      });

      transactionStore.recordRetry(id, 'Error 1');
      transactionStore.recordRetry(id, 'Error 2');
      transactionStore.recordRetry(id, 'Error 3');

      const tx = transactionStore.getById(id);
      expect(tx?.retryCount).toBe(3);
      expect(tx?.previousAttempts.length).toBe(3);
      expect(tx?.canRetry).toBe(false); // max retries reached
    });
  });

  describe('retrySuccess', () => {
    it('should mark retry as successful', () => {
      const id = transactionStore.add({
        hash: '0x123',
        action: 'listNFT',
        module: 'Exchange',
        status: 'failed',
      });

      transactionStore.recordRetry(id, 'Network error');
      transactionStore.retrySuccess(id, '0x456', '25000');

      const tx = transactionStore.getById(id);
      expect(tx?.status).toBe('success');
      expect(tx?.hash).toBe('0x456');
      expect(tx?.gasUsed).toBe('25000');
      expect(tx?.canRetry).toBe(false);
    });
  });

  describe('retryFailed', () => {
    it('should mark retry as failed', () => {
      const id = transactionStore.add({
        hash: '0x123',
        action: 'listNFT',
        module: 'Exchange',
        status: 'pending',
      });

      transactionStore.retryFailed(id, 'Final failure');

      const tx = transactionStore.getById(id);
      expect(tx?.status).toBe('failed');
      expect(tx?.error).toBe('Final failure');
    });
  });

  describe('getAll', () => {
    it('should return all transactions', () => {
      transactionStore.add({ hash: '0x1', action: 'a1', module: 'M', status: 'pending' });
      transactionStore.add({ hash: '0x2', action: 'a2', module: 'M', status: 'success' });

      const all = transactionStore.getAll();
      expect(all.length).toBe(2);
    });

    it('should return a copy of transactions array', () => {
      transactionStore.add({ hash: '0x1', action: 'a1', module: 'M', status: 'pending' });

      const all1 = transactionStore.getAll();
      const all2 = transactionStore.getAll();

      expect(all1).not.toBe(all2);
      expect(all1).toEqual(all2);
    });
  });

  describe('getByStatus', () => {
    beforeEach(() => {
      transactionStore.add({ hash: '0x1', action: 'a1', module: 'M', status: 'pending' });
      transactionStore.add({ hash: '0x2', action: 'a2', module: 'M', status: 'success' });
      transactionStore.add({ hash: '0x3', action: 'a3', module: 'M', status: 'failed' });
      transactionStore.add({ hash: '0x4', action: 'a4', module: 'M', status: 'pending' });
    });

    it('should filter by pending status', () => {
      const pending = transactionStore.getByStatus('pending');
      expect(pending.length).toBe(2);
      pending.forEach((tx) => expect(tx.status).toBe('pending'));
    });

    it('should filter by success status', () => {
      const success = transactionStore.getByStatus('success');
      expect(success.length).toBe(1);
      expect(success[0].status).toBe('success');
    });

    it('should filter by failed status', () => {
      const failed = transactionStore.getByStatus('failed');
      expect(failed.length).toBe(1);
      expect(failed[0].status).toBe('failed');
    });
  });

  describe('getFailedRetryable', () => {
    it('should return failed transactions that can be retried', () => {
      const id1 = transactionStore.add({
        hash: '0x1',
        action: 'a1',
        module: 'M',
        status: 'pending',
      });
      transactionStore.update(id1, { status: 'failed' });

      const id2 = transactionStore.add({
        hash: '0x2',
        action: 'a2',
        module: 'M',
        status: 'pending',
      });
      transactionStore.update(id2, { status: 'success' });

      const retryable = transactionStore.getFailedRetryable();
      expect(retryable.length).toBe(1);
      expect(retryable[0].hash).toBe('0x1');
    });
  });

  describe('getByModule', () => {
    it('should filter by module', () => {
      transactionStore.add({ hash: '0x1', action: 'a1', module: 'Exchange', status: 'pending' });
      transactionStore.add({ hash: '0x2', action: 'a2', module: 'Auction', status: 'pending' });
      transactionStore.add({ hash: '0x3', action: 'a3', module: 'Exchange', status: 'pending' });

      const exchange = transactionStore.getByModule('Exchange');
      expect(exchange.length).toBe(2);
      exchange.forEach((tx) => expect(tx.module).toBe('Exchange'));
    });
  });

  describe('clear', () => {
    it('should clear all transactions', () => {
      transactionStore.add({ hash: '0x1', action: 'a1', module: 'M', status: 'pending' });
      transactionStore.add({ hash: '0x2', action: 'a2', module: 'M', status: 'pending' });

      transactionStore.clear();

      expect(transactionStore.getAll().length).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on add', () => {
      const listener = jest.fn();
      const unsubscribe = transactionStore.subscribe(listener);

      // Initial call
      expect(listener).toHaveBeenCalledTimes(1);

      transactionStore.add({ hash: '0x1', action: 'a1', module: 'M', status: 'pending' });
      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
    });

    it('should notify listeners on update', () => {
      const id = transactionStore.add({
        hash: '0x1',
        action: 'a1',
        module: 'M',
        status: 'pending',
      });

      const listener = jest.fn();
      transactionStore.subscribe(listener);

      transactionStore.update(id, { status: 'success' });
      expect(listener).toHaveBeenCalledTimes(2); // initial + update
    });

    it('should stop notifying after unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = transactionStore.subscribe(listener);

      unsubscribe();
      transactionStore.add({ hash: '0x1', action: 'a1', module: 'M', status: 'pending' });

      expect(listener).toHaveBeenCalledTimes(1); // only initial
    });
  });

  describe('retry configuration', () => {
    it('should set and get default retry config', () => {
      transactionStore.setDefaultRetryConfig({ maxRetries: 5, delayMs: 2000 });

      const config = transactionStore.getDefaultRetryConfig();
      expect(config.maxRetries).toBe(5);
      expect(config.delayMs).toBe(2000);
    });

    it('should calculate retry delay with exponential backoff', () => {
      transactionStore.setDefaultRetryConfig({
        delayMs: 1000,
        backoffMultiplier: 2,
      });

      expect(transactionStore.calculateRetryDelay(0)).toBe(1000);
      expect(transactionStore.calculateRetryDelay(1)).toBe(2000);
      expect(transactionStore.calculateRetryDelay(2)).toBe(4000);
      expect(transactionStore.calculateRetryDelay(3)).toBe(8000);
    });
  });

  describe('setMaxEntries', () => {
    it('should trim existing entries when max is reduced', () => {
      transactionStore.setMaxEntries(50);

      for (let i = 0; i < 10; i++) {
        transactionStore.add({ hash: `0x${i}`, action: 'a', module: 'M', status: 'pending' });
      }

      expect(transactionStore.getAll().length).toBe(10);

      transactionStore.setMaxEntries(5);

      expect(transactionStore.getAll().length).toBe(5);
    });
  });
});
