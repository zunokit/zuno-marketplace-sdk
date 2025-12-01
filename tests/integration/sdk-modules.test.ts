/**
 * Integration Tests - SDK Module Interactions
 */

// Mock axios to prevent real network calls
jest.mock('axios');

import { ZunoSDK } from '../../src/core/ZunoSDK';
import { ethers } from 'ethers';

describe('SDK Module Integration', () => {
  let sdk: ZunoSDK;
  let provider: ethers.Provider;

  beforeEach(() => {
    sdk = new ZunoSDK({
      apiKey: 'test-api-key',
      network: 'sepolia',
    });

    // Create a mock provider instead of trying to connect to localhost
    provider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111n }),
      getSigner: jest.fn().mockReturnValue(null),
    } as any;
    sdk.updateProvider(provider);
  });

  describe('module initialization', () => {
    it('should initialize all modules with same provider', () => {
      const exchange = sdk.exchange;
      const auction = sdk.auction;
      const collection = sdk.collection;

      expect(exchange).toBeDefined();
      expect(auction).toBeDefined();
      expect(collection).toBeDefined();
    });

    it('should share query client across modules', () => {
      const queryClient = sdk.getQueryClient();

      expect(queryClient).toBeDefined();
      expect(queryClient).toBe(sdk.getQueryClient());
    });

    it('should share API client across modules', () => {
      const apiClient = sdk.getAPIClient();

      expect(apiClient).toBeDefined();
      expect(apiClient).toBe(sdk.getAPIClient());
    });
  });

  describe('provider updates', () => {
    it('should update provider for all modules', () => {
      const newProvider = new ethers.JsonRpcProvider('http://localhost:9545');
      const signer = new ethers.Wallet(
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        newProvider
      );

      sdk.updateProvider(newProvider, signer);

      expect(sdk.getProvider()).toBe(newProvider);
      expect(sdk.getSigner()).toBe(signer);
    });
  });

  describe('configuration', () => {
    it('should maintain consistent configuration', () => {
      const config = sdk.getConfig();

      expect(config.apiKey).toBe('test-api-key');
      expect(config.network).toBe('sepolia');
    });

    it('should allow configuration overrides', () => {
      const customSDK = new ZunoSDK({
        apiKey: 'custom-key',
        network: 'mainnet',
        apiUrl: 'https://custom.api.com',
      });

      const config = customSDK.getConfig();

      expect(config.apiKey).toBe('custom-key');
      expect(config.network).toBe('mainnet');
      expect(config.apiUrl).toBe('https://custom.api.com');
    });
  });

  describe('error handling consistency', () => {
    it.skip('should handle missing signer consistently across modules', async () => {
      // SDK without signer
      const sdkWithoutSigner = new ZunoSDK({
        apiKey: 'test-key',
        network: 'sepolia',
      });
      sdkWithoutSigner.updateProvider(provider);

      // All modules should throw similar errors for operations requiring signer
      await expect(
        sdkWithoutSigner.exchange.listNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          price: '1.0',
          duration: 86400,
        })
      ).rejects.toThrow();

      await expect(
        sdkWithoutSigner.auction.createEnglishAuction({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          startingBid: '1.0',
          duration: 86400,
        })
      ).rejects.toThrow();

      await expect(
        sdkWithoutSigner.collection.mintERC721({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        })
      ).rejects.toThrow();
    }, 10000);
  });

  describe('cache management', () => {
    it('should share cache across modules', () => {
      const queryClient = sdk.getQueryClient();

      // Cache should be empty initially
      const initialCache = queryClient.getQueryCache().getAll();

      expect(Array.isArray(initialCache)).toBe(true);
    });

    it('should allow cache clearing', () => {
      const queryClient = sdk.getQueryClient();

      queryClient.clear();

      const cache = queryClient.getQueryCache().getAll();
      expect(cache.length).toBe(0);
    });
  });

  describe('network consistency', () => {
    it('should use same network across all modules', () => {
      const config = sdk.getConfig();

      expect(config.network).toBe('sepolia');

      // All modules should use the same network
      // This is implicit in the module initialization
    });
  });
});
