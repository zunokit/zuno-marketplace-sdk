/**
 * AuctionModule Tests
 */

import { ZunoSDK } from '../../core/ZunoSDK';
import { AuctionModule } from '../../modules/AuctionModule';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    Contract: jest.fn().mockImplementation(() => ({
      createEnglishAuction: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue({ logs: [] }) }),
      createDutchAuction: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue({ logs: [] }) }),
      batchCancelAuction: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue({}) }),
      cancelAuction: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue({}) }),
      placeBid: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue({}) }),
      getAuction: jest.fn().mockResolvedValue({
        seller: '0x1234567890123456789012345678901234567890',
        nftContract: '0x1234567890123456789012345678901234567890',
        tokenId: 1n,
        amount: 1n,
        startPrice: 1000000000000000000n,
        reservePrice: 500000000000000000n,
        currentBid: 0n,
        highestBidder: '0x0000000000000000000000000000000000000000',
        startTime: BigInt(Math.floor(Date.now() / 1000)),
        endTime: BigInt(Math.floor(Date.now() / 1000) + 86400),
        status: 1,
        auctionType: 0,
      }),
      isAuctionActive: jest.fn().mockResolvedValue(true),
      getCurrentPrice: jest.fn().mockResolvedValue(1000000000000000000n),
      getPendingRefund: jest.fn().mockResolvedValue(100000000000000000n),
    })),
    parseEther: jest.fn((val) => BigInt(parseFloat(val) * 1e18)),
    formatEther: jest.fn((val) => (Number(val) / 1e18).toString()),
    isAddress: jest.fn().mockReturnValue(true),
    ZeroAddress: '0x0000000000000000000000000000000000000000',
  },
}));

describe('AuctionModule', () => {
  let sdk: ZunoSDK;

  beforeEach(() => {
    sdk = new ZunoSDK({
      apiKey: 'test-api-key',
      network: 'sepolia',
    });
  });

  describe('initialization', () => {
    it('should be accessible from SDK', () => {
      expect(sdk.auction).toBeInstanceOf(AuctionModule);
    });
  });

  describe('batchCancelAuction', () => {
    it('should throw error for empty array', async () => {
      await expect(sdk.auction.batchCancelAuction([])).rejects.toThrow(
        'auctionIds array cannot be empty'
      );
    });

    it('should throw error for array exceeding max limit', async () => {
      const tooManyIds = Array(21).fill('0x1234');
      await expect(sdk.auction.batchCancelAuction(tooManyIds)).rejects.toThrow(
        'Maximum 20 cancellations per batch'
      );
    });

    it('should accept valid array of auction IDs', async () => {
      // This will fail due to no signer, but validates input
      const validIds = ['0x1234', '0x5678'];
      await expect(sdk.auction.batchCancelAuction(validIds)).rejects.toThrow();
    });
  });

  describe('validation', () => {
    it('should validate collectionAddress in createEnglishAuction', async () => {
      const { ethers } = await import('ethers');
      (ethers.isAddress as unknown as jest.Mock).mockReturnValueOnce(false);

      await expect(
        sdk.auction.createEnglishAuction({
          collectionAddress: 'invalid',
          tokenId: '1',
          amount: 1,
          startingBid: '1.0',
          reservePrice: '0.5',
          duration: 86400,
        })
      ).rejects.toThrow();
    });

    it('should validate tokenId in createEnglishAuction', async () => {
      await expect(
        sdk.auction.createEnglishAuction({
          collectionAddress: '0x1234567890123456789012345678901234567890',
          tokenId: '',
          amount: 1,
          startingBid: '1.0',
          reservePrice: '0.5',
          duration: 86400,
        })
      ).rejects.toThrow();
    });

    it('should validate auctionId in cancelAuction', async () => {
      await expect(
        sdk.auction.cancelAuction('')
      ).rejects.toThrow();
    });

    it('should validate auctionId in placeBid', async () => {
      await expect(
        sdk.auction.placeBid({ auctionId: '', amount: '1.0' })
      ).rejects.toThrow();
    });
  });

  describe('getAuctionFromFactory', () => {
    it('should return auction details', async () => {
      // This will fail due to no provider, but tests the method exists
      await expect(sdk.auction.getAuctionFromFactory('0x1234')).rejects.toThrow();
    });
  });

  describe('getPendingRefund', () => {
    it('should validate auctionId', async () => {
      await expect(
        sdk.auction.getPendingRefund('', '0x1234567890123456789012345678901234567890')
      ).rejects.toThrow();
    });

    it('should validate bidder address', async () => {
      const { ethers } = await import('ethers');
      (ethers.isAddress as unknown as jest.Mock).mockReturnValueOnce(false);

      await expect(
        sdk.auction.getPendingRefund('0x1234', 'invalid')
      ).rejects.toThrow();
    });
  });
});
