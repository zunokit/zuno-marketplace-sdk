/**
 * CollectionModule Tests
 */

import { ZunoSDK } from '../../core/ZunoSDK';
import { CollectionModule } from '../../modules/CollectionModule';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    Contract: jest.fn().mockImplementation(() => ({
      addToAllowlist: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue({}) }),
      removeFromAllowlist: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue({}) }),
      setAllowlistOnly: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue({}) }),
      isInAllowlist: jest.fn().mockResolvedValue(true),
      isAllowlistOnly: jest.fn().mockResolvedValue(false),
      name: jest.fn().mockResolvedValue('Test Collection'),
      symbol: jest.fn().mockResolvedValue('TEST'),
      getDescription: jest.fn().mockResolvedValue('Test description'),
      getRoyaltyFee: jest.fn().mockResolvedValue(500n),
      owner: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      getMintInfo: jest.fn().mockResolvedValue([
        BigInt(Date.now() / 1000), // currentTime
        BigInt(Date.now() / 1000), // mintStartTime
        BigInt(Date.now() / 1000 + 86400), // allowlistStageEnd
        1, // currentStage
        1000000000000000000n, // currentMintPrice
        1000000000000000000n, // allowlistPrice
        2000000000000000000n, // publicPrice
        100n, // totalMinted
        10000n, // maxSupply
        5n, // mintedPerWallet
        10n, // mintLimitPerWallet
        true, // accountInAllowlist
      ]),
    })),
    parseEther: jest.fn((val) => BigInt(parseFloat(val) * 1e18)),
    formatEther: jest.fn((val) => (Number(val) / 1e18).toString()),
    isAddress: jest.fn().mockReturnValue(true),
    ZeroAddress: '0x0000000000000000000000000000000000000000',
    id: jest.fn().mockReturnValue('0x1234'),
    zeroPadValue: jest.fn().mockReturnValue('0x0000000000000000000000001234567890123456789012345678901234567890'),
    toBigInt: jest.fn().mockReturnValue(1n),
    AbiCoder: {
      defaultAbiCoder: () => ({
        decode: jest.fn().mockReturnValue([1n, 1n]),
      }),
    },
  },
}));

describe('CollectionModule', () => {
  let sdk: ZunoSDK;

  beforeEach(() => {
    sdk = new ZunoSDK({
      apiKey: 'test-api-key',
      network: 'sepolia',
    });
  });

  describe('initialization', () => {
    it('should be accessible from SDK', () => {
      expect(sdk.collection).toBeInstanceOf(CollectionModule);
    });
  });

  describe('addToAllowlist', () => {
    it('should throw error for empty addresses array', async () => {
      await expect(
        sdk.collection.addToAllowlist('0x1234567890123456789012345678901234567890', [])
      ).rejects.toThrow('addresses array cannot be empty');
    });

    it('should throw error for array exceeding max limit', async () => {
      const tooManyAddresses = Array(101).fill('0x1234567890123456789012345678901234567890');
      await expect(
        sdk.collection.addToAllowlist('0x1234567890123456789012345678901234567890', tooManyAddresses)
      ).rejects.toThrow('Maximum 100 addresses per batch');
    });

    it('should validate collection address', async () => {
      const { ethers } = await import('ethers');
      (ethers.isAddress as unknown as jest.Mock).mockReturnValueOnce(false);

      await expect(
        sdk.collection.addToAllowlist('invalid', ['0x1234567890123456789012345678901234567890'])
      ).rejects.toThrow();
    });
  });

  describe('removeFromAllowlist', () => {
    it('should throw error for empty addresses array', async () => {
      await expect(
        sdk.collection.removeFromAllowlist('0x1234567890123456789012345678901234567890', [])
      ).rejects.toThrow('addresses array cannot be empty');
    });

    it('should validate collection address', async () => {
      const { ethers } = await import('ethers');
      (ethers.isAddress as unknown as jest.Mock).mockReturnValueOnce(false);

      await expect(
        sdk.collection.removeFromAllowlist('invalid', ['0x1234567890123456789012345678901234567890'])
      ).rejects.toThrow();
    });
  });

  describe('setAllowlistOnly', () => {
    it('should validate collection address', async () => {
      const { ethers } = await import('ethers');
      (ethers.isAddress as unknown as jest.Mock).mockReturnValueOnce(false);

      await expect(
        sdk.collection.setAllowlistOnly('invalid', true)
      ).rejects.toThrow();
    });

    it('should accept boolean enabled parameter', async () => {
      // This will fail due to no signer, but validates input
      await expect(
        sdk.collection.setAllowlistOnly('0x1234567890123456789012345678901234567890', true)
      ).rejects.toThrow();
    });
  });

  describe('isInAllowlist', () => {
    it('should validate collection address', async () => {
      const { ethers } = await import('ethers');
      (ethers.isAddress as unknown as jest.Mock).mockReturnValueOnce(false);

      await expect(
        sdk.collection.isInAllowlist('invalid', '0x1234567890123456789012345678901234567890')
      ).rejects.toThrow();
    });

    it('should validate user address', async () => {
      const { ethers } = await import('ethers');
      (ethers.isAddress as unknown as jest.Mock)
        .mockReturnValueOnce(true) // collection address valid
        .mockReturnValueOnce(false); // user address invalid

      await expect(
        sdk.collection.isInAllowlist('0x1234567890123456789012345678901234567890', 'invalid')
      ).rejects.toThrow();
    });
  });

  describe('isAllowlistOnly', () => {
    it('should validate collection address', async () => {
      const { ethers } = await import('ethers');
      (ethers.isAddress as unknown as jest.Mock).mockReturnValueOnce(false);

      await expect(
        sdk.collection.isAllowlistOnly('invalid')
      ).rejects.toThrow();
    });
  });

  describe('createERC721Collection', () => {
    it('should validate required parameters', async () => {
      await expect(
        sdk.collection.createERC721Collection({
          name: '',
          symbol: 'TEST',
          maxSupply: 10000,
        })
      ).rejects.toThrow();
    });

    it('should validate symbol', async () => {
      await expect(
        sdk.collection.createERC721Collection({
          name: 'Test',
          symbol: '',
          maxSupply: 10000,
        })
      ).rejects.toThrow();
    });

    it('should validate maxSupply', async () => {
      await expect(
        sdk.collection.createERC721Collection({
          name: 'Test',
          symbol: 'TEST',
          maxSupply: 0,
        })
      ).rejects.toThrow();
    });
  });

  describe('mintERC721', () => {
    it('should validate collection address', async () => {
      const { ethers } = await import('ethers');
      (ethers.isAddress as unknown as jest.Mock).mockReturnValueOnce(false);

      await expect(
        sdk.collection.mintERC721({
          collectionAddress: 'invalid',
          recipient: '0x1234567890123456789012345678901234567890',
        })
      ).rejects.toThrow();
    });

    it('should validate recipient address', async () => {
      const { ethers } = await import('ethers');
      (ethers.isAddress as unknown as jest.Mock)
        .mockReturnValueOnce(true) // collection address valid
        .mockReturnValueOnce(false); // recipient address invalid

      await expect(
        sdk.collection.mintERC721({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          recipient: 'invalid',
        })
      ).rejects.toThrow();
    });
  });

  describe('batchMintERC721', () => {
    it('should validate amount is positive', async () => {
      await expect(
        sdk.collection.batchMintERC721({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          recipient: '0x1234567890123456789012345678901234567890',
          amount: 0,
        })
      ).rejects.toThrow();
    });

    it('should validate amount is not negative', async () => {
      await expect(
        sdk.collection.batchMintERC721({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          recipient: '0x1234567890123456789012345678901234567890',
          amount: -1,
        })
      ).rejects.toThrow();
    });
  });

  describe('getCollectionInfo', () => {
    it('should validate address', async () => {
      const { ethers } = await import('ethers');
      (ethers.isAddress as unknown as jest.Mock).mockReturnValueOnce(false);

      await expect(
        sdk.collection.getCollectionInfo('invalid')
      ).rejects.toThrow();
    });
  });

  describe('verifyCollection', () => {
    it('should validate address', async () => {
      const { ethers } = await import('ethers');
      (ethers.isAddress as unknown as jest.Mock).mockReturnValueOnce(false);

      await expect(
        sdk.collection.verifyCollection('invalid')
      ).rejects.toThrow();
    });
  });
});
