/**
 * ERC1155 ExchangeModule Tests
 * Tests for ERC1155-specific listing functionality with amount parameter
 */

import { ZunoSDK } from '../../core/ZunoSDK';
import { ExchangeModule } from '../../modules/ExchangeModule';
import {
  validateListNFTParams,
  validateBatchListNFTParams,
  ZunoSDKError,
} from '../../utils/errors';
import { TransactionManager } from '../../utils/transactions';

// Mock contract registry
jest.mock('../../core/ContractRegistry', () => {
  return {
    ContractRegistry: jest.fn().mockImplementation(() => ({
      verifyTokenStandard: jest.fn().mockResolvedValue('ERC1155'),
      getContract: jest.fn().mockImplementation(() => ({
        listNFT: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue({
            hash: '0xabc123',
            logs: [{ topics: ['0x123', '0xlistingid'] }],
          }),
        }),
        batchListNFT: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue({
            hash: '0xdef456',
            logs: [
              { topics: ['0x123', '0xlisting1'] },
              { topics: ['0x123', '0xlisting2'] },
              { topics: ['0x123', '0xlisting3'] },
            ],
          }),
        }),
        getAddress: jest.fn().mockResolvedValue('0xexchange'),
      })),
    })),
  };
});

// Mock TransactionManager
jest.mock('../../utils/transactions', () => {
  return {
    TransactionManager: jest.fn().mockImplementation(() => {
      const mockInstance = {
        sendTransaction: jest.fn(),
        executeTransaction: jest.fn(),
      };

      // Return single or batch based on method name
      mockInstance.sendTransaction = jest.fn().mockImplementation((_contract, method) => {
        if (method === 'batchListNFT') {
          return Promise.resolve({
            hash: '0xdef456',
            logs: [
              { topics: ['0x123', '0xlisting1'] },
              { topics: ['0x123', '0xlisting2'] },
              { topics: ['0x123', '0xlisting3'] },
            ],
          });
        }
        return Promise.resolve({
          hash: '0xabc123',
          logs: [
            { topics: ['0x123', '0xlistingid'] }
          ],
        });
      });

      mockInstance.executeTransaction = mockInstance.sendTransaction;

      return mockInstance;
    }),
  };
});

describe('ExchangeModule - ERC1155 Listing', () => {
  let sdk: ZunoSDK;
  let mockTxManager: any;
  let mockProvider: any;
  let mockSigner: any;

  beforeEach(() => {
    mockTxManager = new (TransactionManager as unknown as jest.Mock)();

    // Create mock provider
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111 }),
    };

    // Create mock signer
    mockSigner = {
      address: '0xtest',
      getAddress: jest.fn().mockResolvedValue('0xtest'),
    };

    sdk = new ZunoSDK({
      apiKey: 'test-api-key',
      network: 'sepolia',
    });

    // Manually inject mock provider, signer, and txManager
    (sdk.exchange as any).provider = mockProvider;
    (sdk.exchange as any).signer = mockSigner;
    (sdk.exchange as any).txManager = mockTxManager;

    // Mock ensureApproval to skip approval checks
    jest.spyOn(sdk.exchange as any, 'ensureApproval').mockResolvedValue(undefined);
  });

  describe('listNFT - ERC1155', () => {
    it('should list ERC1155 with explicit amount', async () => {
      const result = await sdk.exchange.listNFT({
        collectionAddress: '0x1234567890123456789012345678901234567890',
        tokenId: '1',
        amount: '10',
        price: '2.5',
        duration: 86400,
      });

      expect(result.listingId).toBe('0xlistingid');
      expect(result.tx.hash).toBe('0xabc123');
    });

    it('should list ERC1155 with default amount=1', async () => {
      const result = await sdk.exchange.listNFT({
        collectionAddress: '0x1234567890123456789012345678901234567890',
        tokenId: '1',
        price: '1.0',
        duration: 86400,
      });

      expect(result.listingId).toBe('0xlistingid');
    });

    it('should reject ERC1155 listing with amount=0', async () => {
      await expect(
        sdk.exchange.listNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          amount: '0',
          price: '1.0',
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should reject ERC1155 listing with negative amount', async () => {
      await expect(
        sdk.exchange.listNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          amount: '-1',
          price: '1.0',
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should reject ERC1155 listing with invalid amount format', async () => {
      await expect(
        sdk.exchange.listNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '1',
          amount: 'invalid',
          price: '1.0',
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('listNFT - ERC721 Backward Compatibility', () => {
    it('should list ERC721 without amount (backward compatible)', async () => {
      const result = await sdk.exchange.listNFT({
        collectionAddress: '0x0987654321098765432109876543210987654321',
        tokenId: '42',
        price: '1.5',
        duration: 86400,
      });

      expect(result.listingId).toBe('0xlistingid');
    });

    it('should list ERC721 with amount parameter (ignored for ERC721)', async () => {
      const result = await sdk.exchange.listNFT({
        collectionAddress: '0x0987654321098765432109876543210987654321',
        tokenId: '42',
        amount: '10', // Should be ignored for ERC721
        price: '1.5',
        duration: 86400,
      });

      expect(result.listingId).toBe('0xlistingid');
    });
  });

  describe('batchListNFT - ERC1155', () => {
    it('should batch list ERC1155 with explicit amounts', async () => {
      const result = await sdk.exchange.batchListNFT({
        collectionAddress: '0x1234567890123456789012345678901234567890',
        tokenIds: ['1', '2', '3'],
        amounts: ['5', '10', '15'],
        prices: ['1.0', '2.0', '3.0'],
        duration: 86400,
      });

      expect(result.listingIds).toHaveLength(3);
      expect(result.listingIds).toEqual(['0xlisting1', '0xlisting2', '0xlisting3']);
    });

    it('should batch list ERC1155 with default amounts', async () => {
      const result = await sdk.exchange.batchListNFT({
        collectionAddress: '0x1234567890123456789012345678901234567890',
        tokenIds: ['1', '2', '3'],
        prices: ['1.0', '2.0', '3.0'],
        duration: 86400,
      });

      expect(result.listingIds).toHaveLength(3);
    });

    it('should reject batch listing with mismatched array lengths', async () => {
      await expect(
        sdk.exchange.batchListNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenIds: ['1', '2', '3'],
          amounts: ['5', '10'], // Mismatched length
          prices: ['1.0', '2.0', '3.0'],
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should reject batch listing with amount=0', async () => {
      await expect(
        sdk.exchange.batchListNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenIds: ['1', '2', '3'],
          amounts: ['5', '0', '15'], // Invalid amount at index 1
          prices: ['1.0', '2.0', '3.0'],
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should reject batch listing with negative amount', async () => {
      await expect(
        sdk.exchange.batchListNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenIds: ['1', '2', '3'],
          amounts: ['5', '-1', '15'], // Invalid amount at index 1
          prices: ['1.0', '2.0', '3.0'],
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should reject batch listing with invalid amount format', async () => {
      await expect(
        sdk.exchange.batchListNFT({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenIds: ['1', '2', '3'],
          amounts: ['5', 'invalid', '15'], // Invalid format at index 1
          prices: ['1.0', '2.0', '3.0'],
          duration: 86400,
        })
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('batchListNFT - ERC721 Backward Compatibility', () => {
    it('should batch list ERC721 without amounts (backward compatible)', async () => {
      const result = await sdk.exchange.batchListNFT({
        collectionAddress: '0x0987654321098765432109876543210987654321',
        tokenIds: ['1', '2', '3'],
        prices: ['1.0', '2.0', '3.0'],
        duration: 86400,
      });

      expect(result.listingIds).toHaveLength(3);
    });
  });

  describe('formatListing - ERC1155', () => {
    it('should extract amount from ERC1155 listing data', () => {
      const exchangeModule = new ExchangeModule(
        sdk['apiClient'],
        sdk['contractRegistry'],
        sdk['queryClient'],
        sdk['config']['network'],
        sdk['logger'],
        sdk['provider']
      );

      const mockListingData = {
        contractAddress: '0x1234',
        tokenId: 1n,
        price: 1000000000000000000n,
        seller: '0x5678',
        listingDuration: 86400n,
        listingStart: BigInt(Math.floor(Date.now() / 1000)),
        status: 1,
        amount: 10n,
      };

      // Access private method via bracket notation for testing
      const listing = (exchangeModule as any).formatListing('0xlistingid', mockListingData);

      expect(listing.amount).toBe('10');
      expect(listing.tokenId).toBe('1');
      expect(listing.price).toBe('1.0');
    });

    it('should return undefined amount for ERC721 listing data', () => {
      const exchangeModule = new ExchangeModule(
        sdk['apiClient'],
        sdk['contractRegistry'],
        sdk['queryClient'],
        sdk['config']['network'],
        sdk['logger'],
        sdk['provider']
      );

      const mockListingData = {
        contractAddress: '0x1234',
        tokenId: 1n,
        price: 1000000000000000000n,
        seller: '0x5678',
        listingDuration: 86400n,
        listingStart: BigInt(Math.floor(Date.now() / 1000)),
        status: 1,
        amount: undefined,
      };

      const listing = (exchangeModule as any).formatListing('0xlistingid', mockListingData);

      expect(listing.amount).toBeUndefined();
      expect(listing.tokenId).toBe('1');
      expect(listing.price).toBe('1.0');
    });

    it('should handle missing amount field gracefully', () => {
      const exchangeModule = new ExchangeModule(
        sdk['apiClient'],
        sdk['contractRegistry'],
        sdk['queryClient'],
        sdk['config']['network'],
        sdk['logger'],
        sdk['provider']
      );

      const mockListingData = {
        contractAddress: '0x1234',
        tokenId: 1n,
        price: 1000000000000000000n,
        seller: '0x5678',
        listingDuration: 86400n,
        listingStart: BigInt(Math.floor(Date.now() / 1000)),
        status: 1,
        // No amount field
      };

      const listing = (exchangeModule as any).formatListing('0xlistingid', mockListingData);

      expect(listing.amount).toBeUndefined();
    });
  });
});

describe('validateListNFTParams - Amount Validation', () => {
  it('should reject amount=0', () => {
    expect(() => {
      validateListNFTParams({
        collectionAddress: '0x1234567890123456789012345678901234567890',
        tokenId: '1',
        price: '1.0',
        duration: 86400,
        amount: '0',
      });
    }).toThrow(ZunoSDKError);
  });

  it('should reject negative amount', () => {
    expect(() => {
      validateListNFTParams({
        collectionAddress: '0x1234567890123456789012345678901234567890',
        tokenId: '1',
        price: '1.0',
        duration: 86400,
        amount: '-1',
      });
    }).toThrow(ZunoSDKError);
  });

  it('should reject invalid amount format', () => {
    expect(() => {
      validateListNFTParams({
        collectionAddress: '0x1234567890123456789012345678901234567890',
        tokenId: '1',
        price: '1.0',
        duration: 86400,
        amount: 'invalid',
      });
    }).toThrow(ZunoSDKError);
  });

  it('should accept valid amount', () => {
    expect(() => {
      validateListNFTParams({
        collectionAddress: '0x1234567890123456789012345678901234567890',
        tokenId: '1',
        price: '1.0',
        duration: 86400,
        amount: '10',
      });
    }).not.toThrow();
  });

  it('should accept params without amount', () => {
    expect(() => {
      validateListNFTParams({
        collectionAddress: '0x1234567890123456789012345678901234567890',
        tokenId: '1',
        price: '1.0',
        duration: 86400,
      });
    }).not.toThrow();
  });
});

describe('validateBatchListNFTParams - Amounts Validation', () => {
  const baseParams = {
    collectionAddress: '0x1234567890123456789012345678901234567890',
    tokenIds: ['1', '2', '3'],
    prices: ['1.0', '2.0', '3.0'],
    duration: 86400,
  };

  it('should reject mismatched array lengths', () => {
    expect(() => {
      validateBatchListNFTParams({
        ...baseParams,
        amounts: ['5', '10'], // Length 2 vs tokenIds length 3
      });
    }).toThrow(ZunoSDKError);
  });

  it('should reject amount=0 in array', () => {
    expect(() => {
      validateBatchListNFTParams({
        ...baseParams,
        amounts: ['5', '0', '15'],
      });
    }).toThrow(ZunoSDKError);
  });

  it('should reject negative amount in array', () => {
    expect(() => {
      validateBatchListNFTParams({
        ...baseParams,
        amounts: ['5', '-1', '15'],
      });
    }).toThrow(ZunoSDKError);
  });

  it('should reject invalid amount format in array', () => {
    expect(() => {
      validateBatchListNFTParams({
        ...baseParams,
        amounts: ['5', 'invalid', '15'],
      });
    }).toThrow(ZunoSDKError);
  });

  it('should accept valid amounts array', () => {
    expect(() => {
      validateBatchListNFTParams({
        ...baseParams,
        amounts: ['5', '10', '15'],
      });
    }).not.toThrow();
  });

  it('should accept params without amounts', () => {
    expect(() => {
      validateBatchListNFTParams(baseParams);
    }).not.toThrow();
  });

  it('should reject non-array amounts', () => {
    expect(() => {
      validateBatchListNFTParams({
        ...baseParams,
        amounts: 'not-an-array' as unknown as string[],
      });
    }).toThrow(ZunoSDKError);
  });
});
