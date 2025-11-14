/**
 * ZunoSDK Core Tests
 */

import { ZunoSDK } from '../../core/ZunoSDK';
import { ZunoSDKError } from '../../utils/errors';

describe('ZunoSDK', () => {
  describe('initialization', () => {
    it('should initialize with valid config', () => {
      const sdk = new ZunoSDK({
        apiKey: 'test-api-key',
        network: 'sepolia',
      });

      expect(sdk).toBeDefined();
      expect(sdk.getConfig()).toMatchObject({
        apiKey: 'test-api-key',
        network: 'sepolia',
      });
    });

    it('should throw error without API key', () => {
      expect(() => {
        new ZunoSDK({
          apiKey: '',
          network: 'sepolia',
        });
      }).toThrow(ZunoSDKError);

      expect(() => {
        new ZunoSDK({
          apiKey: '',
          network: 'sepolia',
        });
      }).toThrow('API key is required');
    });

    it('should throw error without network', () => {
      expect(() => {
        new ZunoSDK({
          apiKey: 'test-key',
          network: '' as never,
        });
      }).toThrow(ZunoSDKError);
    });
  });

  describe('modules', () => {
    let sdk: ZunoSDK;

    beforeEach(() => {
      sdk = new ZunoSDK({
        apiKey: 'test-key',
        network: 'sepolia',
      });
    });

    it('should lazy load exchange module', () => {
      const exchange = sdk.exchange;
      expect(exchange).toBeDefined();
      expect(exchange).toBe(sdk.exchange); // Same instance
    });

    it('should lazy load collection module', () => {
      const collection = sdk.collection;
      expect(collection).toBeDefined();
      expect(collection).toBe(sdk.collection);
    });

    it('should lazy load auction module', () => {
      const auction = sdk.auction;
      expect(auction).toBeDefined();
      expect(auction).toBe(sdk.auction);
    });

    it('should lazy load offers module', () => {
      const offers = sdk.offers;
      expect(offers).toBeDefined();
      expect(offers).toBe(sdk.offers);
    });

    it('should lazy load bundles module', () => {
      const bundles = sdk.bundles;
      expect(bundles).toBeDefined();
      expect(bundles).toBe(sdk.bundles);
    });
  });

  describe('provider management', () => {
    let sdk: ZunoSDK;

    beforeEach(() => {
      sdk = new ZunoSDK({
        apiKey: 'test-key',
        network: 'sepolia',
      });
    });

    it('should return undefined provider initially', () => {
      expect(sdk.getProvider()).toBeUndefined();
      expect(sdk.getSigner()).toBeUndefined();
    });

    it('should update provider', () => {
      const mockProvider = {} as any;
      const mockSigner = {} as any;

      sdk.updateProvider(mockProvider, mockSigner);

      expect(sdk.getProvider()).toBe(mockProvider);
      expect(sdk.getSigner()).toBe(mockSigner);
    });
  });

  describe('API client', () => {
    it('should expose API client', () => {
      const sdk = new ZunoSDK({
        apiKey: 'test-key',
        network: 'sepolia',
      });

      const apiClient = sdk.getAPIClient();
      expect(apiClient).toBeDefined();
    });
  });

  describe('QueryClient', () => {
    it('should expose QueryClient', () => {
      const sdk = new ZunoSDK({
        apiKey: 'test-key',
        network: 'sepolia',
      });

      const queryClient = sdk.getQueryClient();
      expect(queryClient).toBeDefined();
    });

    it('should use custom QueryClient if provided', () => {
      const mockQueryClient = { clear: jest.fn() } as any;

      const sdk = new ZunoSDK(
        {
          apiKey: 'test-key',
          network: 'sepolia',
        },
        { queryClient: mockQueryClient }
      );

      expect(sdk.getQueryClient()).toBe(mockQueryClient);
    });
  });
});
