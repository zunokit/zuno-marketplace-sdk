/**
 * BaseModule Tests
 */

import { ZunoSDK } from '../../core/ZunoSDK';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    Contract: jest.fn().mockImplementation(() => ({})),
    parseEther: jest.fn((val) => BigInt(parseFloat(val) * 1e18)),
    formatEther: jest.fn((val) => (Number(val) / 1e18).toString()),
    isAddress: jest.fn().mockReturnValue(true),
    ZeroAddress: '0x0000000000000000000000000000000000000000',
  },
}));

describe('BaseModule', () => {
  let sdk: ZunoSDK;

  beforeEach(() => {
    sdk = new ZunoSDK({
      apiKey: 'test-api-key',
      network: 'sepolia',
    });
  });

  describe('SDK configuration', () => {
    it('should create SDK with config', () => {
      expect(sdk).toBeDefined();
      expect(sdk.getConfig()).toBeDefined();
    });

    it('should have correct network in config', () => {
      const config = sdk.getConfig();
      expect(config.network).toBe('sepolia');
    });

    it('should have correct apiKey in config', () => {
      const config = sdk.getConfig();
      expect(config.apiKey).toBe('test-api-key');
    });
  });

  describe('Module access', () => {
    it('should access exchange module', () => {
      expect(sdk.exchange).toBeDefined();
    });

    it('should access auction module', () => {
      expect(sdk.auction).toBeDefined();
    });

    it('should access collection module', () => {
      expect(sdk.collection).toBeDefined();
    });
  });

  describe('Module lazy loading', () => {
    it('should create same exchange instance on multiple accesses', () => {
      const exchange1 = sdk.exchange;
      const exchange2 = sdk.exchange;
      expect(exchange1).toBe(exchange2);
    });

    it('should create same auction instance on multiple accesses', () => {
      const auction1 = sdk.auction;
      const auction2 = sdk.auction;
      expect(auction1).toBe(auction2);
    });

    it('should create same collection instance on multiple accesses', () => {
      const collection1 = sdk.collection;
      const collection2 = sdk.collection;
      expect(collection1).toBe(collection2);
    });
  });
});

describe('BaseModule - Network ID', () => {
  it('should handle sepolia network', () => {
    const sdk = new ZunoSDK({
      apiKey: 'test',
      network: 'sepolia',
    });
    expect(sdk.getConfig().network).toBe('sepolia');
  });

  it('should handle mainnet network', () => {
    const sdk = new ZunoSDK({
      apiKey: 'test',
      network: 'mainnet',
    });
    expect(sdk.getConfig().network).toBe('mainnet');
  });

  it('should handle numeric network ID', () => {
    const sdk = new ZunoSDK({
      apiKey: 'test',
      network: 31337,
    });
    expect(sdk.getConfig().network).toBe(31337);
  });
});

describe('BaseModule - Provider/Signer handling', () => {
  let sdk: ZunoSDK;

  beforeEach(() => {
    sdk = new ZunoSDK({
      apiKey: 'test-api-key',
      network: 'sepolia',
    });
  });

  it('should throw error when provider not set for read operations', async () => {
    // Exchange getListing requires provider
    await expect(
      sdk.exchange.getListing('0x123')
    ).rejects.toThrow();
  });

  it('should throw error when signer not set for write operations', async () => {
    // Exchange listNFT requires signer
    await expect(
      sdk.exchange.listNFT({
        collectionAddress: '0x1234567890123456789012345678901234567890',
        tokenId: '1',
        price: '1.0',
        duration: 86400,
      })
    ).rejects.toThrow();
  });
});

describe('BaseModule - Cache configuration', () => {
  it('should accept cache configuration', () => {
    const sdk = new ZunoSDK({
      apiKey: 'test',
      network: 'sepolia',
      cache: {
        ttl: 60000,
        gcTime: 120000,
      },
    });
    expect(sdk.getConfig().cache?.ttl).toBe(60000);
    expect(sdk.getConfig().cache?.gcTime).toBe(120000);
  });
});

describe('BaseModule - Retry policy configuration', () => {
  it('should accept retry policy configuration', () => {
    const sdk = new ZunoSDK({
      apiKey: 'test',
      network: 'sepolia',
      retryPolicy: {
        maxRetries: 5,
        backoff: 'linear',
      },
    });
    expect(sdk.getConfig().retryPolicy?.maxRetries).toBe(5);
    expect(sdk.getConfig().retryPolicy?.backoff).toBe('linear');
  });
});

describe('BaseModule - Logger configuration', () => {
  it('should accept logger configuration', () => {
    const sdk = new ZunoSDK({
      apiKey: 'test',
      network: 'sepolia',
      logger: {
        level: 'debug',
      },
    });
    expect(sdk.getConfig().logger?.level).toBe('debug');
  });
});
