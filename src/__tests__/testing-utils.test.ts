/**
 * Tests for testing utilities
 */

import {
  createMockSDK,
  createMockLogger,
  createMockTxReceipt,
  createMockListing,
  createMockAuction,
  createMockCollection,
  createMockExchangeModule,
  createMockAuctionModule,
  createMockCollectionModule,
  generateMockAddress,
  generateMockTokenId,
  waitFor,
  createDeferred,
  expectZunoError,
} from '../testing';

describe('Testing Utilities', () => {
  describe('createMockSDK', () => {
    it('should create a mock SDK with all modules', () => {
      const sdk = createMockSDK();

      expect(sdk.exchange).toBeDefined();
      expect(sdk.auction).toBeDefined();
      expect(sdk.collection).toBeDefined();
      expect(sdk.logger).toBeDefined();
      expect(sdk.getConfig).toBeDefined();
    });

    it('should allow custom config options', () => {
      const sdk = createMockSDK({
        config: {
          apiKey: 'custom-key',
          network: 'mainnet',
        },
      });

      const config = sdk.getConfig();
      expect(config.apiKey).toBe('custom-key');
      expect(config.network).toBe('mainnet');
    });

    it('should allow overriding module methods', async () => {
      const customListNFT = jest.fn().mockResolvedValue({ listingId: 'custom' });
      const sdk = createMockSDK({
        exchange: {
          listNFT: customListNFT as any,
        },
      });

      const result = await sdk.exchange.listNFT({});
      expect(result.listingId).toBe('custom');
    });
  });

  describe('createMockLogger', () => {
    it('should create a logger that tracks calls', () => {
      const logger = createMockLogger();

      logger.info('test message', { module: 'Test' });
      logger.error('error message');
      logger.debug('debug message');
      logger.warn('warn message');

      expect(logger.calls).toHaveLength(4);
      expect(logger.calls[0]).toEqual({
        level: 'info',
        message: 'test message',
        meta: { module: 'Test' },
      });
    });
  });

  describe('createMockTxReceipt', () => {
    it('should create a valid transaction receipt', () => {
      const receipt = createMockTxReceipt();

      expect(receipt.hash).toMatch(/^0x[a-f]+$/);
      expect(receipt.blockNumber).toBe(12345678);
      expect(receipt.status).toBe(1);
      expect(typeof receipt.gasUsed).toBe('bigint');
    });

    it('should allow overrides', () => {
      const receipt = createMockTxReceipt({
        status: 0,
        blockNumber: 999,
      });

      expect(receipt.status).toBe(0);
      expect(receipt.blockNumber).toBe(999);
    });
  });

  describe('createMockListing', () => {
    it('should create a valid listing', () => {
      const listing = createMockListing();

      expect(listing.listingId).toBe('1');
      expect(listing.collectionAddress).toMatch(/^0x[1]+$/);
      expect(listing.price).toBe('1.0');
      expect(listing.isActive).toBe(true);
    });
  });

  describe('createMockAuction', () => {
    it('should create a valid auction', () => {
      const auction = createMockAuction();

      expect(auction.auctionId).toBe('1');
      expect(auction.auctionType).toBe('english');
      expect(auction.startingBid).toBe('1.0');
    });
  });

  describe('createMockCollection', () => {
    it('should create a valid collection', () => {
      const collection = createMockCollection();

      expect(collection.name).toBe('Test Collection');
      expect(collection.symbol).toBe('TEST');
      expect(collection.tokenType).toBe('ERC721');
    });
  });

  describe('Module mocks', () => {
    it('createMockExchangeModule should have all methods', () => {
      const exchange = createMockExchangeModule();

      expect(exchange.listNFT).toBeDefined();
      expect(exchange.buyNFT).toBeDefined();
      expect(exchange.cancelListing).toBeDefined();
      expect(exchange.getListing).toBeDefined();
      expect(exchange.getListings).toBeDefined();
    });

    it('createMockAuctionModule should have all methods', () => {
      const auction = createMockAuctionModule();

      expect(auction.createEnglishAuction).toBeDefined();
      expect(auction.createDutchAuction).toBeDefined();
      expect(auction.placeBid).toBeDefined();
      expect(auction.settleAuction).toBeDefined();
      expect(auction.cancelAuction).toBeDefined();
    });

    it('createMockCollectionModule should have all methods', () => {
      const collection = createMockCollectionModule();

      expect(collection.createERC721Collection).toBeDefined();
      expect(collection.createERC1155Collection).toBeDefined();
      expect(collection.mintNFT).toBeDefined();
      expect(collection.batchMint).toBeDefined();
    });
  });

  describe('Utility functions', () => {
    it('generateMockAddress should create valid address', () => {
      const address = generateMockAddress();

      expect(address).toMatch(/^0x[0-9a-f]{40}$/);
    });

    it('generateMockTokenId should create valid token ID', () => {
      const tokenId = generateMockTokenId();

      expect(typeof tokenId).toBe('string');
      expect(parseInt(tokenId)).toBeGreaterThanOrEqual(0);
    });

    it('waitFor should resolve when condition is met', async () => {
      let count = 0;
      const condition = () => {
        count++;
        return count >= 3;
      };

      await waitFor(condition, { interval: 10 });
      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('waitFor should timeout if condition never met', async () => {
      await expect(
        waitFor(() => false, { timeout: 100, interval: 10 })
      ).rejects.toThrow('Condition not met within 100ms');
    });

    it('createDeferred should create controllable promise', async () => {
      const deferred = createDeferred<string>();

      setTimeout(() => deferred.resolve('done'), 10);

      const result = await deferred.promise;
      expect(result).toBe('done');
    });

    it('expectZunoError should validate error codes', async () => {
      const fn = async () => {
        const error = new Error('Test error') as any;
        error.code = 'INVALID_ADDRESS';
        throw error;
      };

      await expectZunoError(fn, 'INVALID_ADDRESS');
    });

    it('expectZunoError should fail on wrong code', async () => {
      const fn = async () => {
        const error = new Error('Test error') as any;
        error.code = 'WRONG_CODE';
        throw error;
      };

      await expect(expectZunoError(fn, 'INVALID_ADDRESS')).rejects.toThrow(
        'Expected error code "INVALID_ADDRESS" but got "WRONG_CODE"'
      );
    });
  });
});
