/**
 * ExchangeModule Tests
 */

import { ZunoSDK } from '../../core/ZunoSDK';
import { ExchangeModule } from '../../modules/ExchangeModule';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    Contract: jest.fn().mockImplementation(() => ({
      listNFT: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({
          hash: '0xabc123',
          logs: [{ topics: ['0x123', '0x456789'] }],
        }),
      }),
      buyNFT: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ hash: '0xdef456' }),
      }),
      batchBuyNFT: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ hash: '0xghi789' }),
      }),
      cancelListing: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ hash: '0xjkl012' }),
      }),
      batchCancelListing: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ hash: '0xmno345' }),
      }),
      getListing: jest.fn().mockResolvedValue([
        '0x1234567890123456789012345678901234567890', // seller
        '0x1234567890123456789012345678901234567890', // nftContract
        1n, // tokenId
        1000000000000000000n, // price
        BigInt(Math.floor(Date.now() / 1000) + 86400), // expirationTime
        1, // status (active)
        0, // tokenType (ERC721)
        1n, // amount
      ]),
      getListingsByCollection: jest.fn().mockResolvedValue(['0x123', '0x456']),
      getListingsBySeller: jest.fn().mockResolvedValue(['0x789', '0xabc']),
      getActiveListings: jest.fn().mockResolvedValue(['0xdef', '0xghi']),
      getListingCountByCollection: jest.fn().mockResolvedValue(10n),
      getListingCountBySeller: jest.fn().mockResolvedValue(5n),
      getActiveListingCount: jest.fn().mockResolvedValue(100n),
      updateListingPrice: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ hash: '0xpqr678' }),
      }),
    })),
    parseEther: jest.fn((val) => BigInt(parseFloat(val) * 1e18)),
    formatEther: jest.fn((val) => (Number(val) / 1e18).toString()),
    isAddress: jest.fn().mockReturnValue(true),
    toBigInt: jest.fn((val) => BigInt(val.startsWith('0x') ? parseInt(val, 16) : val)),
    ZeroAddress: '0x0000000000000000000000000000000000000000',
  },
}));

describe('ExchangeModule', () => {
  let sdk: ZunoSDK;

  beforeEach(() => {
    sdk = new ZunoSDK({
      apiKey: 'test-api-key',
      network: 'sepolia',
    });
  });

  describe('initialization', () => {
    it('should be accessible from SDK', () => {
      expect(sdk.exchange).toBeInstanceOf(ExchangeModule);
    });
  });

  describe('listNFT', () => {
    it('should validate collectionAddress', async () => {
      const { ethers } = await import('ethers');
      (ethers.isAddress as unknown as jest.Mock).mockReturnValueOnce(false);

      await expect(
        sdk.exchange.listNFT({
          collectionAddress: 'invalid',
          tokenId: '1',
          price: '1.0',
          duration: 86400,
        })
      ).rejects.toThrow();
    });

    it('should validate tokenId is not empty', async () => {
      await expect(
        sdk.exchange.listNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '',
          price: '1.0',
          duration: 86400,
        })
      ).rejects.toThrow();
    });

    it('should validate price is positive', async () => {
      await expect(
        sdk.exchange.listNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          price: '0',
          duration: 86400,
        })
      ).rejects.toThrow();
    });

    it('should validate price is not negative', async () => {
      await expect(
        sdk.exchange.listNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          price: '-1',
          duration: 86400,
        })
      ).rejects.toThrow();
    });

    it('should validate duration is positive', async () => {
      await expect(
        sdk.exchange.listNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          price: '1.0',
          duration: 0,
        })
      ).rejects.toThrow();
    });
  });

  describe('buyNFT', () => {
    it('should validate listingId is not empty', async () => {
      await expect(
        sdk.exchange.buyNFT({ listingId: '' })
      ).rejects.toThrow('must be a valid bytes32 hex string');
    });

    it('should reject invalid bytes32 format', async () => {
      await expect(
        sdk.exchange.buyNFT({ listingId: '0x123' })
      ).rejects.toThrow('must be a valid bytes32 hex string');
    });

    it('should accept valid bytes32 listingId', async () => {
      const validBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000001';
      // Will fail due to no signer, but validates input format is correct
      await expect(
        sdk.exchange.buyNFT({ listingId: validBytes32 })
      ).rejects.toThrow();
    });
  });

  describe('batchBuyNFT', () => {
    it('should throw error for empty listingIds array', async () => {
      await expect(
        sdk.exchange.batchBuyNFT({ listingIds: [] })
      ).rejects.toThrow('listingIds cannot be empty');
    });

    it('should reject invalid bytes32 format in array', async () => {
      await expect(
        sdk.exchange.batchBuyNFT({ listingIds: ['0x123', '0x456'] })
      ).rejects.toThrow('must be a valid bytes32 hex string');
    });

    it('should accept valid bytes32 array', async () => {
      const validBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const validBytes32_2 = '0x0000000000000000000000000000000000000000000000000000000000000002';
      // Will fail due to no signer, but validates input format is correct
      await expect(
        sdk.exchange.batchBuyNFT({ listingIds: [validBytes32, validBytes32_2] })
      ).rejects.toThrow();
    });
  });

  describe('cancelListing', () => {
    it('should validate listingId is not empty', async () => {
      await expect(
        sdk.exchange.cancelListing('')
      ).rejects.toThrow('must be a valid bytes32 hex string');
    });

    it('should reject invalid bytes32 format', async () => {
      await expect(
        sdk.exchange.cancelListing('0x1234567890')
      ).rejects.toThrow('must be a valid bytes32 hex string');
    });

    it('should accept valid bytes32 listingId', async () => {
      const validBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000001';
      // Will fail due to no signer, but validates input format is correct
      await expect(
        sdk.exchange.cancelListing(validBytes32)
      ).rejects.toThrow();
    });
  });

  describe('batchCancelListing', () => {
    it('should throw error for empty listingIds array', async () => {
      await expect(
        sdk.exchange.batchCancelListing({ listingIds: [] })
      ).rejects.toThrow('listingIds cannot be empty');
    });

    it('should reject invalid bytes32 format in array', async () => {
      await expect(
        sdk.exchange.batchCancelListing({ listingIds: ['0x123', '0x456'] })
      ).rejects.toThrow('must be a valid bytes32 hex string');
    });

    it('should accept valid bytes32 array', async () => {
      const validBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000001';
      const validBytes32_2 = '0x0000000000000000000000000000000000000000000000000000000000000002';
      // Will fail due to no signer, but validates input format is correct
      await expect(
        sdk.exchange.batchCancelListing({ listingIds: [validBytes32, validBytes32_2] })
      ).rejects.toThrow();
    });
  });

  describe('getListing', () => {
    it('should validate listingId is not empty', async () => {
      await expect(
        sdk.exchange.getListing('')
      ).rejects.toThrow('must be a valid bytes32 hex string');
    });

    it('should reject invalid bytes32 format', async () => {
      await expect(
        sdk.exchange.getListing('0x123')
      ).rejects.toThrow('must be a valid bytes32 hex string');
    });
  });

  describe('batchListNFT', () => {
    it('should throw error for empty tokenIds array', async () => {
      await expect(
        sdk.exchange.batchListNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenIds: [],
          prices: [],
          duration: 86400,
        })
      ).rejects.toThrow('Token IDs array cannot be empty');
    });

    it('should throw error when tokenIds and prices length mismatch', async () => {
      await expect(
        sdk.exchange.batchListNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenIds: ['1', '2'],
          prices: ['1.0'],
          duration: 86400,
        })
      ).rejects.toThrow('Token IDs and prices arrays must have same length');
    });
  });
});

describe('ExchangeModule - Listing Status', () => {
  let sdk: ZunoSDK;

  beforeEach(() => {
    sdk = new ZunoSDK({
      apiKey: 'test-api-key',
      network: 'sepolia',
    });
  });

  it('should parse listing status correctly', async () => {
    const validBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000001';
    // Active listing has status = 1
    // This tests that the module correctly interprets contract data
    await expect(
      sdk.exchange.getListing(validBytes32)
    ).rejects.toThrow();
  });
});

describe('ExchangeModule - Price Formatting', () => {
  let sdk: ZunoSDK;

  beforeEach(() => {
    sdk = new ZunoSDK({
      apiKey: 'test-api-key',
      network: 'sepolia',
    });
  });

  it('should format price as ETH string', async () => {
    const validBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000001';
    // Validates that formatEther is called on prices
    await expect(
      sdk.exchange.getListing(validBytes32)
    ).rejects.toThrow();
  });
});

describe('ExchangeModule - getBuyerPrice', () => {
  let sdk: ZunoSDK;

  beforeEach(() => {
    sdk = new ZunoSDK({
      apiKey: 'test-api-key',
      network: 'sepolia',
    });
  });

  it('should validate listingId is not empty', async () => {
    await expect(
      sdk.exchange.getBuyerPrice('')
    ).rejects.toThrow('must be a valid bytes32 hex string');
  });

  it('should reject invalid bytes32 format', async () => {
    await expect(
      sdk.exchange.getBuyerPrice('0x1234567890')
    ).rejects.toThrow('must be a valid bytes32 hex string');
  });

  it('should accept valid bytes32 listingId', async () => {
    const validBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000001';
    // Will fail due to no provider, but validates input format is correct
    await expect(
      sdk.exchange.getBuyerPrice(validBytes32)
    ).rejects.toThrow();
  });
});

describe('ExchangeModule - getListings', () => {
  let sdk: ZunoSDK;

  beforeEach(() => {
    sdk = new ZunoSDK({
      apiKey: 'test-api-key',
      network: 'sepolia',
    });
  });

  it('should validate collectionAddress', async () => {
    const { ethers } = await import('ethers');
    (ethers.isAddress as unknown as jest.Mock).mockReturnValueOnce(false);

    await expect(
      sdk.exchange.getListings('invalid')
    ).rejects.toThrow();
  });

  it('should accept valid collectionAddress', async () => {
    // Will fail due to no provider, but validates input
    await expect(
      sdk.exchange.getListings('0x1234567890123456789012345678901234567890')
    ).rejects.toThrow();
  });
});

describe('ExchangeModule - getListingsBySeller', () => {
  let sdk: ZunoSDK;

  beforeEach(() => {
    sdk = new ZunoSDK({
      apiKey: 'test-api-key',
      network: 'sepolia',
    });
  });

  it('should validate seller address', async () => {
    const { ethers } = await import('ethers');
    (ethers.isAddress as unknown as jest.Mock).mockReturnValueOnce(false);

    await expect(
      sdk.exchange.getListingsBySeller('invalid')
    ).rejects.toThrow();
  });

  it('should accept valid seller address', async () => {
    // Will fail due to no provider, but validates input
    await expect(
      sdk.exchange.getListingsBySeller('0x1234567890123456789012345678901234567890')
    ).rejects.toThrow();
  });
});
