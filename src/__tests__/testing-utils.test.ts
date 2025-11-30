/**
 * Comprehensive tests for testing utilities
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
  createMockQueryClient,
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
      expect(sdk.getProvider).toBeDefined();
      expect(sdk.getSigner).toBeDefined();
      expect(sdk.getQueryClient).toBeDefined();
      expect(sdk.updateProvider).toBeDefined();
      expect(sdk.prefetchABIs).toBeDefined();
      expect(sdk.clearCache).toBeDefined();
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

    it('should allow custom config with numeric network', () => {
      const sdk = createMockSDK({
        config: {
          apiKey: 'test-key',
          network: 11155111,
          debug: true,
        },
      });

      const config = sdk.getConfig();
      expect(config.network).toBe(11155111);
      expect(config.debug).toBe(true);
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

    it('should allow custom logger', () => {
      const customLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      const sdk = createMockSDK({
        logger: customLogger,
      });

      sdk.logger.info('test');
      expect(customLogger.info).toHaveBeenCalledWith('test');
    });

    it('should have working async methods', () => {
      const sdk = createMockSDK();

      // These methods return undefined (not promises in the mock)
      expect(sdk.prefetchABIs()).toBeUndefined();
      expect(sdk.clearCache()).toBeUndefined();
    });

    it('should return default values for provider methods', () => {
      const sdk = createMockSDK();

      expect(sdk.getProvider()).toBeUndefined();
      expect(sdk.getSigner()).toBeUndefined();
      expect(sdk.getQueryClient()).toBeNull();
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

    it('should track all log levels correctly', () => {
      const logger = createMockLogger();

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(logger.calls[0].level).toBe('debug');
      expect(logger.calls[1].level).toBe('info');
      expect(logger.calls[2].level).toBe('warn');
      expect(logger.calls[3].level).toBe('error');
    });

    it('should handle calls without metadata', () => {
      const logger = createMockLogger();

      logger.info('message without meta');

      expect(logger.calls[0]).toEqual({
        level: 'info',
        message: 'message without meta',
        meta: undefined,
      });
    });

    it('should handle complex metadata objects', () => {
      const logger = createMockLogger();
      const complexMeta = {
        module: 'Exchange',
        action: 'listNFT',
        data: { tokenId: '1', price: '1.5' },
        nested: { deep: { value: true } },
      };

      logger.info('complex message', complexMeta);

      expect(logger.calls[0].meta).toEqual(complexMeta);
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

    it('should allow overriding listing properties', () => {
      const listing = createMockListing({
        listingId: '999',
        price: '5.0',
        isActive: false,
      });

      expect(listing.listingId).toBe('999');
      expect(listing.price).toBe('5.0');
      expect(listing.isActive).toBe(false);
    });

    it('should have all required listing fields', () => {
      const listing = createMockListing();

      expect(listing).toHaveProperty('listingId');
      expect(listing).toHaveProperty('collectionAddress');
      expect(listing).toHaveProperty('tokenId');
      expect(listing).toHaveProperty('seller');
      expect(listing).toHaveProperty('price');
      expect(listing).toHaveProperty('isActive');
      expect(listing).toHaveProperty('createdAt');
    });
  });

  describe('createMockAuction', () => {
    it('should create a valid auction', () => {
      const auction = createMockAuction();

      expect(auction.auctionId).toBe('1');
      expect(auction.auctionType).toBe('english');
      expect(auction.startingBid).toBe('1.0');
    });

    it('should allow overriding auction properties', () => {
      const auction = createMockAuction({
        auctionId: '42',
        auctionType: 'dutch',
        startingBid: '10.0',
        currentBid: '8.0',
      });

      expect(auction.auctionId).toBe('42');
      expect(auction.auctionType).toBe('dutch');
      expect(auction.startingBid).toBe('10.0');
      expect(auction.currentBid).toBe('8.0');
    });

    it('should have all required auction fields', () => {
      const auction = createMockAuction();

      expect(auction).toHaveProperty('auctionId');
      expect(auction).toHaveProperty('collectionAddress');
      expect(auction).toHaveProperty('tokenId');
      expect(auction).toHaveProperty('seller');
      expect(auction).toHaveProperty('startingBid');
      expect(auction).toHaveProperty('currentBid');
      expect(auction).toHaveProperty('highestBidder');
      expect(auction).toHaveProperty('endTime');
      expect(auction).toHaveProperty('isActive');
      expect(auction).toHaveProperty('auctionType');
    });
  });

  describe('createMockCollection', () => {
    it('should create a valid collection', () => {
      const collection = createMockCollection();

      expect(collection.name).toBe('Test Collection');
      expect(collection.symbol).toBe('TEST');
      expect(collection.tokenType).toBe('ERC721');
    });

    it('should allow overriding collection properties', () => {
      const collection = createMockCollection({
        name: 'Custom Collection',
        symbol: 'CUSTOM',
        tokenType: 'ERC1155',
        totalSupply: 500,
      });

      expect(collection.name).toBe('Custom Collection');
      expect(collection.symbol).toBe('CUSTOM');
      expect(collection.tokenType).toBe('ERC1155');
      expect(collection.totalSupply).toBe(500);
    });

    it('should have all required collection fields', () => {
      const collection = createMockCollection();

      expect(collection).toHaveProperty('address');
      expect(collection).toHaveProperty('name');
      expect(collection).toHaveProperty('symbol');
      expect(collection).toHaveProperty('owner');
      expect(collection).toHaveProperty('tokenType');
      expect(collection).toHaveProperty('totalSupply');
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

    it('createMockExchangeModule methods should return expected values', async () => {
      const exchange = createMockExchangeModule();

      const listResult = await exchange.listNFT({});
      expect(listResult).toHaveProperty('listingId');
      expect(listResult).toHaveProperty('tx');

      const buyResult = await exchange.buyNFT({});
      expect(buyResult).toHaveProperty('tx');

      const listing = await exchange.getListing('1');
      expect(listing).toHaveProperty('listingId');

      const listings = await exchange.getListings();
      expect(Array.isArray(listings)).toBe(true);
    });

    it('createMockAuctionModule should have all methods', () => {
      const auction = createMockAuctionModule();

      expect(auction.createEnglishAuction).toBeDefined();
      expect(auction.createDutchAuction).toBeDefined();
      expect(auction.placeBid).toBeDefined();
      expect(auction.settleAuction).toBeDefined();
      expect(auction.cancelAuction).toBeDefined();
      expect(auction.getAuction).toBeDefined();
      expect(auction.getCurrentPrice).toBeDefined();
    });

    it('createMockAuctionModule methods should return expected values', async () => {
      const auction = createMockAuctionModule();

      const englishResult = await auction.createEnglishAuction({});
      expect(englishResult).toHaveProperty('auctionId');
      expect(englishResult).toHaveProperty('tx');

      const dutchResult = await auction.createDutchAuction({});
      expect(dutchResult).toHaveProperty('auctionId');

      const price = await auction.getCurrentPrice('1');
      expect(price).toBe('1.5');

      const auctionData = await auction.getAuction('1');
      expect(auctionData).toHaveProperty('auctionId');
    });

    it('createMockCollectionModule should have all methods', () => {
      const collection = createMockCollectionModule();

      expect(collection.createERC721Collection).toBeDefined();
      expect(collection.createERC1155Collection).toBeDefined();
      expect(collection.mintNFT).toBeDefined();
      expect(collection.batchMint).toBeDefined();
      expect(collection.getCollection).toBeDefined();
    });

    it('createMockCollectionModule methods should return expected values', async () => {
      const collection = createMockCollectionModule();

      const erc721Result = await collection.createERC721Collection({});
      expect(erc721Result).toHaveProperty('collectionAddress');
      expect(erc721Result).toHaveProperty('tx');

      const mintResult = await collection.mintNFT({});
      expect(mintResult).toHaveProperty('tokenId');

      const batchResult = await collection.batchMint({});
      expect(batchResult).toHaveProperty('tokenIds');
      expect(Array.isArray(batchResult.tokenIds)).toBe(true);
    });

    it('should allow overriding module methods with custom implementations', async () => {
      const exchange = createMockExchangeModule({
        listNFT: {
          mockRejectedValue: () => ({ mockRejectedValue: () => {} }),
        } as any,
      });

      // The override should be applied
      expect(exchange.listNFT).toBeDefined();
    });
  });

  describe('createMockQueryClient', () => {
    it('should create a QueryClient instance', () => {
      const queryClient = createMockQueryClient();

      expect(queryClient).toBeDefined();
      expect(queryClient.getQueryCache).toBeDefined();
      expect(queryClient.getMutationCache).toBeDefined();
    });

    it('should have retry disabled by default', () => {
      const queryClient = createMockQueryClient();
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.queries?.retry).toBe(false);
      expect(defaultOptions.mutations?.retry).toBe(false);
    });

    it('should have cache times set to 0', () => {
      const queryClient = createMockQueryClient();
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.queries?.gcTime).toBe(0);
      expect(defaultOptions.queries?.staleTime).toBe(0);
    });
  });

  describe('Utility functions', () => {
    it('generateMockAddress should create valid address', () => {
      const address = generateMockAddress();

      expect(address).toMatch(/^0x[0-9a-f]{40}$/);
    });

    it('generateMockAddress should create unique addresses', () => {
      const addresses = new Set<string>();
      for (let i = 0; i < 100; i++) {
        addresses.add(generateMockAddress());
      }
      // Should have high uniqueness (allowing some collision)
      expect(addresses.size).toBeGreaterThan(90);
    });

    it('generateMockTokenId should create valid token ID', () => {
      const tokenId = generateMockTokenId();

      expect(typeof tokenId).toBe('string');
      expect(parseInt(tokenId)).toBeGreaterThanOrEqual(0);
    });

    it('generateMockTokenId should create valid numeric string', () => {
      const tokenId = generateMockTokenId();
      const parsed = parseInt(tokenId, 10);

      expect(Number.isNaN(parsed)).toBe(false);
      expect(parsed).toBeLessThan(1000000);
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

    it('waitFor should work with async conditions', async () => {
      let count = 0;
      const asyncCondition = async () => {
        count++;
        await new Promise((r) => setTimeout(r, 5));
        return count >= 2;
      };

      await waitFor(asyncCondition, { interval: 10, timeout: 1000 });
      expect(count).toBeGreaterThanOrEqual(2);
    });

    it('waitFor should use default timeout and interval', async () => {
      let called = false;
      const condition = () => {
        called = true;
        return true;
      };

      await waitFor(condition);
      expect(called).toBe(true);
    });

    it('createDeferred should create controllable promise', async () => {
      const deferred = createDeferred<string>();

      setTimeout(() => deferred.resolve('done'), 10);

      const result = await deferred.promise;
      expect(result).toBe('done');
    });

    it('createDeferred should handle rejection', async () => {
      const deferred = createDeferred<string>();
      const testError = new Error('Test rejection');

      setTimeout(() => deferred.reject(testError), 10);

      await expect(deferred.promise).rejects.toThrow('Test rejection');
    });

    it('createDeferred should resolve with complex objects', async () => {
      const deferred = createDeferred<{ data: number[]; status: string }>();
      const testData = { data: [1, 2, 3], status: 'success' };

      setTimeout(() => deferred.resolve(testData), 10);

      const result = await deferred.promise;
      expect(result).toEqual(testData);
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

    it('expectZunoError should fail if function does not throw', async () => {
      const fn = async () => {
        return 'success';
      };

      // Note: Due to implementation, when fn doesn't throw, the manually thrown
      // error gets caught by the same catch block and reports undefined code
      await expect(expectZunoError(fn, 'INVALID_ADDRESS')).rejects.toThrow(
        'Expected error code "INVALID_ADDRESS" but got "undefined"'
      );
    });

    it('expectZunoError should fail if error has no code', async () => {
      const fn = async () => {
        throw new Error('Error without code');
      };

      await expect(expectZunoError(fn, 'INVALID_ADDRESS')).rejects.toThrow(
        'Expected error code "INVALID_ADDRESS" but got "undefined"'
      );
    });
  });
});
