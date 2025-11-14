/**
 * Auction Module for managing English and Dutch auctions
 *
 * This module provides functionality to create and manage NFT auctions on the Zuno Marketplace.
 * It supports both English auctions (ascending price) and Dutch auctions (descending price).
 *
 * @module AuctionModule
 */

import { ethers } from 'ethers';
import { BaseModule } from './BaseModule';
import type {
  CreateEnglishAuctionParams,
  CreateDutchAuctionParams,
  PlaceBidParams,
  TransactionOptions,
} from '../types/contracts';
import type { Auction, TransactionReceipt } from '../types/entities';
import {
  validateAddress,
  validateTokenId,
  validateAmount,
  validateDuration,
} from '../utils/errors';

/**
 * AuctionModule handles auction creation and bidding operations
 *
 * @example
 * ```typescript
 * const sdk = new ZunoSDK(config);
 *
 * // Create an English auction
 * const { auctionId } = await sdk.auction.createEnglishAuction({
 *   collectionAddress: "0x123...",
 *   tokenId: "1",
 *   startingBid: "1.0",
 *   duration: 86400 * 7, // 7 days
 * });
 *
 * // Place a bid
 * await sdk.auction.placeBid({
 *   auctionId,
 *   amount: "1.5"
 * });
 * ```
 */
export class AuctionModule extends BaseModule {
  /**
   * Create an English auction for an NFT
   *
   * An English auction starts at a minimum bid and allows bidders to place
   * progressively higher bids. The highest bidder at the end wins the NFT.
   *
   * @param params - Auction creation parameters
   * @param params.collectionAddress - NFT collection contract address
   * @param params.tokenId - Token ID of the NFT to auction
   * @param params.startingBid - Minimum bid amount in ETH (e.g., "1.0")
   * @param params.duration - Auction duration in seconds
   * @param params.reservePrice - Optional minimum price to accept (in ETH)
   * @param params.amount - Number of tokens to auction (for ERC1155, defaults to 1)
   * @param params.seller - Optional seller address (defaults to signer address)
   * @param params.options - Optional transaction options
   *
   * @returns Promise resolving to auction ID and transaction receipt
   *
   * @throws {ZunoSDKError} INVALID_ADDRESS - If the collection address is invalid
   * @throws {ZunoSDKError} INVALID_TOKEN_ID - If the token ID is invalid
   * @throws {ZunoSDKError} INVALID_AMOUNT - If the starting bid is invalid
   * @throws {ZunoSDKError} INVALID_DURATION - If the duration is invalid
   * @throws {ZunoSDKError} TRANSACTION_FAILED - If the transaction fails
   *
   * @example
   * ```typescript
   * const { auctionId, tx } = await sdk.auction.createEnglishAuction({
   *   collectionAddress: "0x1234567890123456789012345678901234567890",
   *   tokenId: "1",
   *   startingBid: "1.0",
   *   reservePrice: "5.0",
   *   duration: 86400 * 7, // 7 days in seconds
   * });
   * console.log(`Auction created with ID: ${auctionId}`);
   * ```
   */
  async createEnglishAuction(
    params: CreateEnglishAuctionParams
  ): Promise<{ auctionId: string; tx: TransactionReceipt }> {
    const {
      collectionAddress,
      tokenId,
      amount = 1,
      startingBid,
      duration,
      reservePrice,
      seller,
      options,
    } = params;

    validateAddress(collectionAddress, 'collectionAddress');
    validateTokenId(tokenId);
    validateAmount(startingBid, 'startingBid');
    validateDuration(duration);

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get auction contract
    const auctionContract = await this.contractRegistry.getContract(
      'EnglishAuction',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const startingBidWei = ethers.parseEther(startingBid);
    const reservePriceWei = reservePrice
      ? ethers.parseEther(reservePrice)
      : 0n;

    // Get seller address (default to signer address if not provided)
    const sellerAddress =
      seller || (this.signer ? await this.signer.getAddress() : ethers.ZeroAddress);

    // Contract expects: (address, uint256, uint256, uint256, uint256, uint256, AuctionType, address)
    const receipt = await txManager.sendTransaction(
      auctionContract,
      'createAuction',
      [
        collectionAddress,
        tokenId,
        amount,
        startingBidWei,
        reservePriceWei,
        duration,
        0, // AuctionType.ENGLISH = 0
        sellerAddress,
      ],
      options
    );

    // Extract auction ID from logs
    const auctionId = await this.extractAuctionId(receipt);

    return { auctionId, tx: receipt };
  }

  /**
   * Create a Dutch auction for an NFT
   *
   * A Dutch auction starts at a high price and decreases linearly over time
   * until a buyer accepts the current price or the auction ends.
   *
   * @param params - Auction creation parameters
   * @param params.collectionAddress - NFT collection contract address
   * @param params.tokenId - Token ID of the NFT to auction
   * @param params.startPrice - Starting price in ETH (e.g., "10.0")
   * @param params.endPrice - Ending price in ETH (e.g., "1.0")
   * @param params.duration - Auction duration in seconds
   * @param params.amount - Number of tokens to auction (for ERC1155, defaults to 1)
   * @param params.seller - Optional seller address (defaults to signer address)
   * @param params.options - Optional transaction options
   *
   * @returns Promise resolving to auction ID and transaction receipt
   *
   * @throws {ZunoSDKError} INVALID_ADDRESS - If the collection address is invalid
   * @throws {ZunoSDKError} INVALID_TOKEN_ID - If the token ID is invalid
   * @throws {ZunoSDKError} INVALID_AMOUNT - If the start or end price is invalid
   * @throws {ZunoSDKError} INVALID_DURATION - If the duration is invalid
   * @throws {ZunoSDKError} TRANSACTION_FAILED - If the transaction fails
   *
   * @example
   * ```typescript
   * const { auctionId, tx } = await sdk.auction.createDutchAuction({
   *   collectionAddress: "0x1234567890123456789012345678901234567890",
   *   tokenId: "1",
   *   startPrice: "10.0",
   *   endPrice: "1.0",
   *   duration: 86400, // 1 day in seconds
   * });
   * console.log(`Dutch auction created with ID: ${auctionId}`);
   * ```
   */
  async createDutchAuction(
    params: CreateDutchAuctionParams
  ): Promise<{ auctionId: string; tx: TransactionReceipt }> {
    const {
      collectionAddress,
      tokenId,
      amount = 1,
      startPrice,
      endPrice,
      duration,
      seller,
      options,
    } = params;

    validateAddress(collectionAddress, 'collectionAddress');
    validateTokenId(tokenId);
    validateAmount(startPrice, 'startPrice');
    validateAmount(endPrice, 'endPrice');
    validateDuration(duration);

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get auction contract
    const auctionContract = await this.contractRegistry.getContract(
      'DutchAuction',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const startPriceWei = ethers.parseEther(startPrice);
    const endPriceWei = ethers.parseEther(endPrice);

    // Get seller address (default to signer address if not provided)
    const sellerAddress =
      seller || (this.signer ? await this.signer.getAddress() : ethers.ZeroAddress);

    // Contract expects: (address, uint256, uint256, uint256, uint256, uint256, AuctionType, address)
    // Note: endPrice maps to reservePrice parameter in contract
    const receipt = await txManager.sendTransaction(
      auctionContract,
      'createAuction',
      [
        collectionAddress,
        tokenId,
        amount,
        startPriceWei,
        endPriceWei, // maps to reservePrice in contract
        duration,
        1, // AuctionType.DUTCH = 1
        sellerAddress,
      ],
      options
    );

    // Extract auction ID from logs
    const auctionId = await this.extractAuctionId(receipt);

    return { auctionId, tx: receipt };
  }

  /**
   * Place a bid on an English auction
   *
   * Submits a bid for an active English auction. The bid amount must be higher
   * than the current highest bid. The bid amount is sent as ETH with the transaction.
   *
   * @param params - Bid parameters
   * @param params.auctionId - ID of the auction to bid on
   * @param params.amount - Bid amount in ETH (e.g., "2.0")
   * @param params.options - Optional transaction options
   *
   * @returns Promise resolving to transaction receipt
   *
   * @throws {ZunoSDKError} INVALID_TOKEN_ID - If the auction ID is invalid
   * @throws {ZunoSDKError} INVALID_AMOUNT - If the bid amount is invalid
   * @throws {ZunoSDKError} TRANSACTION_FAILED - If the transaction fails
   *
   * @example
   * ```typescript
   * const receipt = await sdk.auction.placeBid({
   *   auctionId: "1",
   *   amount: "2.5"
   * });
   * console.log(`Bid placed in transaction: ${receipt.hash}`);
   * ```
   */
  async placeBid(params: PlaceBidParams): Promise<TransactionReceipt> {
    const { auctionId, amount, options } = params;

    validateTokenId(auctionId, 'auctionId');
    validateAmount(amount, 'amount');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get auction contract
    const auctionContract = await this.contractRegistry.getContract(
      'EnglishAuction',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const amountWei = ethers.parseEther(amount);

    // Place bid with ETH value
    return await txManager.sendTransaction(
      auctionContract,
      'placeBid',
      [auctionId],
      {
        ...options,
        value: amountWei.toString(),
      }
    );
  }

  /**
   * End an auction and finalize the sale
   *
   * Finalizes an active auction. For English auctions, transfers the NFT to the
   * highest bidder and funds to the seller. For Dutch auctions, completes the sale
   * at the current price.
   *
   * @param auctionId - ID of the auction to end
   * @param options - Optional transaction options
   *
   * @returns Promise resolving to transaction receipt
   *
   * @throws {ZunoSDKError} INVALID_TOKEN_ID - If the auction ID is invalid
   * @throws {ZunoSDKError} TRANSACTION_FAILED - If the transaction fails
   *
   * @example
   * ```typescript
   * const receipt = await sdk.auction.endAuction("1");
   * console.log(`Auction ended in transaction: ${receipt.hash}`);
   * ```
   */
  async endAuction(
    auctionId: string,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    validateTokenId(auctionId, 'auctionId');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Try English auction first
    try {
      const auctionContract = await this.contractRegistry.getContract(
        'EnglishAuction',
        this.getNetworkId(),
        provider,
        undefined,
        this.signer
      );

      return await txManager.sendTransaction(
        auctionContract,
        'endAuction',
        [auctionId],
        options
      );
    } catch {
      // Try Dutch auction
      const auctionContract = await this.contractRegistry.getContract(
        'DutchAuction',
        this.getNetworkId(),
        provider,
        undefined,
        this.signer
      );

      return await txManager.sendTransaction(
        auctionContract,
        'endAuction',
        [auctionId],
        options
      );
    }
  }

  /**
   * Get detailed information about an auction
   *
   * Fetches the current state of an auction including seller, NFT details,
   * pricing information, and status. Works for both English and Dutch auctions.
   *
   * @param auctionId - ID of the auction to fetch
   *
   * @returns Promise resolving to auction details
   *
   * @throws {ZunoSDKError} INVALID_TOKEN_ID - If the auction ID is invalid
   * @throws {ZunoSDKError} CONTRACT_CALL_FAILED - If the auction is not found
   *
   * @example
   * ```typescript
   * const auction = await sdk.auction.getAuction("1");
   * console.log(`Auction type: ${auction.type}`);
   * console.log(`Current bid: ${auction.currentBid} ETH`);
   * console.log(`Status: ${auction.status}`);
   * ```
   */
  async getAuction(auctionId: string): Promise<Auction> {
    validateTokenId(auctionId, 'auctionId');

    const provider = this.ensureProvider();
    const txManager = this.ensureTxManager();

    // Try English auction first
    try {
      const auctionContract = await this.contractRegistry.getContract(
        'EnglishAuction',
        this.getNetworkId(),
        provider
      );

      const auction = await txManager.callContract<unknown[]>(
        auctionContract,
        'getAuction',
        [auctionId]
      );

      return this.formatAuction(auctionId, auction, 'english');
    } catch {
      // Try Dutch auction
      const auctionContract = await this.contractRegistry.getContract(
        'DutchAuction',
        this.getNetworkId(),
        provider
      );

      const auction = await txManager.callContract<unknown[]>(
        auctionContract,
        'getAuction',
        [auctionId]
      );

      return this.formatAuction(auctionId, auction, 'dutch');
    }
  }

  /**
   * Get the current price of a Dutch auction
   *
   * Calculates and returns the current price of a Dutch auction based on the
   * time elapsed. The price decreases linearly from startPrice to endPrice
   * over the auction duration.
   *
   * @param auctionId - ID of the Dutch auction
   *
   * @returns Promise resolving to current price in ETH
   *
   * @throws {ZunoSDKError} INVALID_TOKEN_ID - If the auction ID is invalid
   * @throws {ZunoSDKError} CONTRACT_CALL_FAILED - If the auction is not found or not a Dutch auction
   *
   * @example
   * ```typescript
   * const currentPrice = await sdk.auction.getCurrentPrice("1");
   * console.log(`Current price: ${currentPrice} ETH`);
   * ```
   */
  async getCurrentPrice(auctionId: string): Promise<string> {
    validateTokenId(auctionId, 'auctionId');

    const provider = this.ensureProvider();
    const txManager = this.ensureTxManager();

    const auctionContract = await this.contractRegistry.getContract(
      'DutchAuction',
      this.getNetworkId(),
      provider
    );

    const price = await txManager.callContract<bigint>(
      auctionContract,
      'getCurrentPrice',
      [auctionId]
    );

    return ethers.formatEther(price);
  }

  /**
   * Extract auction ID from transaction receipt
   */
  private async extractAuctionId(receipt: TransactionReceipt): Promise<string> {
    for (const log of receipt.logs) {
      try {
        const logData = log as any; // Type assertion for event log
        if (logData.topics && logData.topics.length > 1) {
          const auctionIdHex = logData.topics[1];
          const auctionId = ethers.toBigInt(auctionIdHex);
          return auctionId.toString();
        }
      } catch {
        continue;
      }
    }

    throw this.error(
      'CONTRACT_CALL_FAILED',
      'Could not extract auction ID from transaction'
    );
  }

  /**
   * Format raw auction data
   */
  private formatAuction(
    id: string,
    data: unknown[],
    type: 'english' | 'dutch'
  ): Auction {
    const [
      seller,
      collectionAddress,
      tokenId,
      startPrice,
      endPrice,
      currentBid,
      highestBidder,
      startTime,
      endTime,
      status,
    ] = data as [
      string,
      string,
      bigint,
      bigint,
      bigint,
      bigint,
      string,
      bigint,
      bigint,
      number,
    ];

    const statusMap: Record<number, Auction['status']> = {
      0: 'active',
      1: 'ended',
      2: 'cancelled',
    };

    const auction: Auction = {
      id,
      type,
      seller,
      collectionAddress,
      tokenId: tokenId.toString(),
      startTime: Number(startTime),
      endTime: Number(endTime),
      status: statusMap[status] || 'active',
      createdAt: new Date(Number(startTime) * 1000).toISOString(),
    };

    if (type === 'english') {
      auction.startingBid = ethers.formatEther(startPrice);
      auction.currentBid = ethers.formatEther(currentBid);
      auction.highestBidder = highestBidder;
    } else {
      auction.startPrice = ethers.formatEther(startPrice);
      auction.endPrice = ethers.formatEther(endPrice);
    }

    return auction;
  }
}
