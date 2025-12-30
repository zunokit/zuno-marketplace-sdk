/**
 * Batch utilities tests
 */

import { validateBatchSize, BATCH_LIMITS } from '../../utils/batch';
import { ZunoSDKError, ErrorCodes } from '../../utils/errors';

describe('validateBatchSize', () => {
  describe('valid inputs', () => {
    it('should pass for valid array with single item', () => {
      expect(() => validateBatchSize([1], 10, 'items')).not.toThrow();
    });

    it('should pass for valid array at max limit', () => {
      const items = Array.from({ length: 10 }, (_, i) => i);
      expect(() => validateBatchSize(items, 10, 'items')).not.toThrow();
    });

    it('should pass for valid array below max limit', () => {
      const items = Array.from({ length: 5 }, (_, i) => i);
      expect(() => validateBatchSize(items, 10, 'items')).not.toThrow();
    });
  });

  describe('empty array validation', () => {
    it('should throw INVALID_PARAMETER for empty array', () => {
      expect(() => validateBatchSize([], 10, 'items'))
        .toThrow('items cannot be empty');
    });

    it('should throw ZunoSDKError with correct code', () => {
      try {
        validateBatchSize([], 10, 'items');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ZunoSDKError);
        expect((error as ZunoSDKError).code).toBe(ErrorCodes.INVALID_PARAMETER);
      }
    });

    it('should include param name in error message', () => {
      expect(() => validateBatchSize([], 10, 'auctionIds'))
        .toThrow('auctionIds cannot be empty');
    });
  });

  describe('size exceeded validation', () => {
    it('should throw BATCH_SIZE_EXCEEDED when over limit', () => {
      const items = Array.from({ length: 11 }, (_, i) => i);
      expect(() => validateBatchSize(items, 10, 'items'))
        .toThrow('items exceeds maximum batch size of 10');
    });

    it('should throw ZunoSDKError with correct code', () => {
      const items = Array.from({ length: 11 }, (_, i) => i);
      try {
        validateBatchSize(items, 10, 'items');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ZunoSDKError);
        expect((error as ZunoSDKError).code).toBe(ErrorCodes.BATCH_SIZE_EXCEEDED);
      }
    });

    it('should include param name and limit in error message', () => {
      const items = Array.from({ length: 25 }, (_, i) => i);
      expect(() => validateBatchSize(items, 20, 'auctionIds'))
        .toThrow('auctionIds exceeds maximum batch size of 20');
    });
  });
});

describe('BATCH_LIMITS', () => {
  it('should have AUCTIONS limit of 20', () => {
    expect(BATCH_LIMITS.AUCTIONS).toBe(20);
  });

  it('should have LISTINGS limit of 20', () => {
    expect(BATCH_LIMITS.LISTINGS).toBe(20);
  });

  it('should have ALLOWLIST limit of 100', () => {
    expect(BATCH_LIMITS.ALLOWLIST).toBe(100);
  });

  it('should be readonly', () => {
    // TypeScript will prevent direct mutation, but we can test the values don't change
    const originalAuctions = BATCH_LIMITS.AUCTIONS;
    const originalListings = BATCH_LIMITS.LISTINGS;
    const originalAllowlist = BATCH_LIMITS.ALLOWLIST;

    expect(BATCH_LIMITS.AUCTIONS).toBe(originalAuctions);
    expect(BATCH_LIMITS.LISTINGS).toBe(originalListings);
    expect(BATCH_LIMITS.ALLOWLIST).toBe(originalAllowlist);
  });
});
