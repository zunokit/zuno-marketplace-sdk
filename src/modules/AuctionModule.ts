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
import type { Auction, TransactionReceipt, PaginatedResult } from '../types/entities';
import {
  validateAddress,
  validateTokenId,
  validateAmount,
  validateDuration,
} from '../utils/errors';
import { safeCall } from '../utils/helpers';

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
  private log(message: string, data?: unknown) {
    this.logger.debug(message, { module: 'Auction', data });
  }

  /**
   * Ensure NFT collection is approved for AuctionFactory
   * Checks approval status and approves if needed
   */
  private async ensureApproval(
    collectionAddress: string,
    ownerAddress: string
  ): Promise<void> {
    const provider = this.ensureProvider();
    const signer = this.ensureSigner();

    // Get AuctionFactory address from API
    const auctionFactory = await this.contractRegistry.getContract(
      'AuctionFactory',
      this.getNetworkId(),
      provider
    );
    const operatorAddress = await auctionFactory.getAddress();

    // Check if already approved
    const erc721Abi = [
      'function isApprovedForAll(address owner, address operator) view returns (bool)',
      'function setApprovalForAll(address operator, bool approved)',
    ];
    const nftContract = new ethers.Contract(collectionAddress, erc721Abi, signer);
    
    const isApproved = await nftContract.isApprovedForAll(ownerAddress, operatorAddress);
    
    if (!isApproved) {
      this.log('Approving AuctionFactory for collection', { collectionAddress, operatorAddress });
      const tx = await nftContract.setApprovalForAll(operatorAddress, true);
      await tx.wait();
      this.log('Approval confirmed');
    }
  }

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

    // Get seller address (default to signer address if not provided)
    const sellerAddress =
      seller || (this.signer ? await this.signer.getAddress() : ethers.ZeroAddress);

    // Ensure NFT is approved for AuctionFactory
    await this.ensureApproval(collectionAddress, sellerAddress);

    // Get AuctionFactory contract (handles NFT transfers and creates auctions)
    const auctionFactory = await this.contractRegistry.getContract(
      'AuctionFactory',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const startingBidWei = ethers.parseEther(startingBid);
    const reservePriceWei = reservePrice
      ? ethers.parseEther(reservePrice)
      : 0n;

    // AuctionFactory.createEnglishAuction(nftContract, tokenId, amount, startPrice, reservePrice, duration)
    const receipt = await txManager.sendTransaction(
      auctionFactory,
      'createEnglishAuction',
      [
        collectionAddress,
        tokenId,
        amount,
        startingBidWei,
        reservePriceWei,
        duration,
      ],
      { ...options, module: 'Auction' }
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

    // Get seller address (default to signer address if not provided)
    const sellerAddress =
      seller || (this.signer ? await this.signer.getAddress() : ethers.ZeroAddress);

    // Ensure NFT is approved for AuctionFactory
    await this.ensureApproval(collectionAddress, sellerAddress);

    // Get AuctionFactory contract (handles NFT transfers and creates auctions)
    const auctionFactory = await this.contractRegistry.getContract(
      'AuctionFactory',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const startPriceWei = ethers.parseEther(startPrice);
    const endPriceWei = ethers.parseEther(endPrice);

    // Calculate priceDropPerHour: (startPrice - endPrice) / (duration in hours)
    const durationInHours = BigInt(Math.max(1, Math.ceil(duration / 3600)));
    const priceDiff = startPriceWei - endPriceWei;
    const priceDropPerHour = priceDiff / durationInHours;

    // AuctionFactory.createDutchAuction(nftContract, tokenId, amount, startPrice, reservePrice, duration, priceDropPerHour)
    const receipt = await txManager.sendTransaction(
      auctionFactory,
      'createDutchAuction',
      [
        collectionAddress,
        tokenId,
        amount,
        startPriceWei,
        endPriceWei, // reservePrice (end price)
        duration,
        priceDropPerHour,
      ],
      { ...options, module: 'Auction' }
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
   * const { tx } = await sdk.auction.placeBid({
   *   auctionId: "1",
   *   amount: "2.5"
   * });
   * console.log(`Bid placed in transaction: ${tx.hash}`);
   * ```
   */
  async placeBid(params: PlaceBidParams): Promise<{ tx: TransactionReceipt }> {
    const { auctionId, amount, options } = params;

    validateTokenId(auctionId, 'auctionId');
    validateAmount(amount, 'amount');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get auction contract
    const auctionContract = await this.contractRegistry.getContract(
      'EnglishAuctionImplementation',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const amountWei = ethers.parseEther(amount);

    // Place bid with ETH value
    const tx = await txManager.sendTransaction(
      auctionContract,
      'placeBid',
      [auctionId],
      {
        ...options,
        value: amountWei.toString(),
        module: 'Auction',
      }
    );

    return { tx };
  }

  /**
   * Buy now in a Dutch auction at the current price
   */
  async buyNow(
    auctionId: string,
    options?: TransactionOptions
  ): Promise<{ tx: TransactionReceipt }> {
    this.log('buyNow started', { auctionId });
    validateTokenId(auctionId, 'auctionId');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    const auctionContract = await this.contractRegistry.getContract(
      'DutchAuctionImplementation',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    // Get current price
    const currentPrice = await txManager.callContract<bigint>(
      auctionContract,
      'getCurrentPrice',
      [auctionId]
    );

    const tx = await txManager.sendTransaction(
      auctionContract,
      'buyNow',
      [auctionId],
      { ...options, value: currentPrice.toString(), module: 'Auction' }
    );

    this.log('buyNow completed', { auctionId, txHash: tx.hash });
    return { tx };
  }

  /**
   * Withdraw a refunded bid from an English auction
   */
  async withdrawBid(
    auctionId: string,
    options?: TransactionOptions
  ): Promise<{ tx: TransactionReceipt }> {
    this.log('withdrawBid started', { auctionId });
    validateTokenId(auctionId, 'auctionId');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    const auctionContract = await this.contractRegistry.getContract(
      'EnglishAuctionImplementation',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const tx = await txManager.sendTransaction(
      auctionContract,
      'withdrawBid',
      [auctionId],
      { ...options, module: 'Auction' }
    );

    this.log('withdrawBid completed', { auctionId, txHash: tx.hash });
    return { tx };
  }

  /**
   * Cancel an auction
   *
   * Cancels an active auction before it ends. Can only be called by the auction seller.
   * Returns the NFT to the seller and refunds any bids.
   *
   * @param auctionId - ID of the auction to cancel
   * @param options - Optional transaction options
   *
   * @returns Promise resolving to transaction receipt
   *
   * @throws {ZunoSDKError} INVALID_TOKEN_ID - If the auction ID is invalid
   * @throws {ZunoSDKError} TRANSACTION_FAILED - If the transaction fails
   *
   * @example
   * ```typescript
   * const { tx } = await sdk.auction.cancelAuction("1");
   * console.log(`Auction cancelled in transaction: ${tx.hash}`);
   * ```
   */
  async cancelAuction(
    auctionId: string,
    options?: TransactionOptions
  ): Promise<{ tx: TransactionReceipt }> {
    validateTokenId(auctionId, 'auctionId');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Try English auction first, fall back to Dutch
    const tx = await safeCall(
      async () => {
        const auctionContract = await this.contractRegistry.getContract(
          'EnglishAuctionImplementation',
          this.getNetworkId(),
          provider,
          undefined,
          this.signer
        );
        return txManager.sendTransaction(
          auctionContract,
          'cancelAuction',
          [auctionId],
          { ...options, module: 'Auction' }
        );
      },
      null
    );

    if (tx) return { tx };

    // Fall back to Dutch auction
    const auctionContract = await this.contractRegistry.getContract(
      'DutchAuctionImplementation',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    return {
      tx: await txManager.sendTransaction(
        auctionContract,
        'cancelAuction',
        [auctionId],
        { ...options, module: 'Auction' }
      ),
    };
  }

  /**
   * Settle an auction and finalize the sale
   *
   * Finalizes an active auction. For English auctions, transfers the NFT to the
   * highest bidder and funds to the seller. For Dutch auctions, completes the sale
   * at the current price.
   *
   * @param auctionId - ID of the auction to settle
   * @param options - Optional transaction options
   *
   * @returns Promise resolving to transaction receipt
   *
   * @throws {ZunoSDKError} INVALID_TOKEN_ID - If the auction ID is invalid
   * @throws {ZunoSDKError} TRANSACTION_FAILED - If the transaction fails
   *
   * @example
   * ```typescript
   * const { tx } = await sdk.auction.settleAuction("1");
   * console.log(`Auction settled in transaction: ${tx.hash}`);
   * ```
   */
  async settleAuction(
    auctionId: string,
    options?: TransactionOptions
  ): Promise<{ tx: TransactionReceipt }> {
    validateTokenId(auctionId, 'auctionId');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Try English auction first, fall back to Dutch
    const tx = await safeCall(
      async () => {
        const auctionContract = await this.contractRegistry.getContract(
          'EnglishAuctionImplementation',
          this.getNetworkId(),
          provider,
          undefined,
          this.signer
        );
        return txManager.sendTransaction(
          auctionContract,
          'settleAuction',
          [auctionId],
          { ...options, module: 'Auction' }
        );
      },
      null
    );

    if (tx) return { tx };

    // Fall back to Dutch auction
    const auctionContract = await this.contractRegistry.getContract(
      'DutchAuctionImplementation',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    return {
      tx: await txManager.sendTransaction(
        auctionContract,
        'settleAuction',
        [auctionId],
        { ...options, module: 'Auction' }
      ),
    };
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

    // Try English auction first, fall back to Dutch
    const englishResult = await safeCall(
      async () => {
        const auctionContract = await this.contractRegistry.getContract(
          'EnglishAuctionImplementation',
          this.getNetworkId(),
          provider
        );
        const auction = await txManager.callContract<unknown[]>(
          auctionContract,
          'getAuction',
          [auctionId]
        );
        return this.formatAuction(auctionId, auction, 'english');
      },
      null
    );

    if (englishResult) return englishResult;

    // Fall back to Dutch auction
    const auctionContract = await this.contractRegistry.getContract(
      'DutchAuctionImplementation',
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
      'DutchAuctionImplementation',
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
   * Get all active auctions (both English and Dutch)
   *
   * Fetches paginated list of all active auctions on the marketplace.
   * Returns auctions from both English and Dutch auction contracts.
   *
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of items per page
   *
   * @returns Promise resolving to paginated auction results
   *
   * @example
   * ```typescript
   * const { items: auctions, total } = await sdk.auction.getActiveAuctions(1, 20);
   * console.log(`Found ${total} active auctions`);
   * ```
   */
  async getActiveAuctions(
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<Auction>> {
    // Fetch from both English and Dutch auction contracts
    const [englishAuctions, dutchAuctions] = await Promise.all([
      this.getActiveAuctionsByType('english', page, pageSize),
      this.getActiveAuctionsByType('dutch', page, pageSize),
    ]);

    // Combine results
    const allAuctions = [...englishAuctions.items, ...dutchAuctions.items];
    const total = englishAuctions.total + dutchAuctions.total;

    // Sort by creation time (newest first)
    allAuctions.sort((a, b) => b.startTime - a.startTime);

    // Apply pagination to combined results
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = allAuctions.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      pageSize,
      hasMore: startIndex + pageSize < total,
    };
  }

  /**
   * Get auctions by seller address
   *
   * Fetches all auctions created by a specific seller, including both
   * English and Dutch auctions.
   *
   * @param seller - Seller wallet address
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of items per page
   *
   * @returns Promise resolving to paginated auction results
   *
   * @throws {ZunoSDKError} INVALID_ADDRESS - If the seller address is invalid
   *
   * @example
   * ```typescript
   * const { items } = await sdk.auction.getAuctionsBySeller(
   *   "0x1234567890123456789012345678901234567890",
   *   1,
   *   20
   * );
   * ```
   */
  async getAuctionsBySeller(
    seller: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<Auction>> {
    validateAddress(seller, 'seller');
    this.log('getAuctionsBySeller called', { seller, page, pageSize });

    const emptyResult: PaginatedResult<Auction> = {
      items: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
    };

    const provider = this.ensureProvider();
    const txManager = this.ensureTxManager();

    // Use AuctionFactory.getUserAuctions(seller) to get all auction IDs
    const auctionFactory = await safeCall(
      () => this.contractRegistry.getContract('AuctionFactory', this.getNetworkId(), provider),
      null
    );

    if (!auctionFactory) {
      this.log('getAuctionsBySeller: AuctionFactory not found');
      return emptyResult;
    }

    const auctionIds = await safeCall(
      () => txManager.callContract<string[]>(auctionFactory, 'getUserAuctions', [seller]),
      []
    );

    this.log('getAuctionsBySeller: auctionIds', { auctionIds, count: auctionIds.length });

    if (auctionIds.length === 0) return emptyResult;

    const total = auctionIds.length;
    const skip = (page - 1) * pageSize;
    const paginatedIds = auctionIds.slice(skip, skip + pageSize);

    // Fetch details for each auction using AuctionFactory.getAuction
    const auctionsPromises = paginatedIds.map((id) =>
      safeCall(() => this.getAuctionFromFactory(id), null)
    );
    const auctionResults = await Promise.all(auctionsPromises);
    const items = auctionResults.filter((a): a is Auction => a !== null);

    this.log('getAuctionsBySeller: fetched auctions', { total: items.length, items });

    // Sort by creation time (newest first)
    items.sort((a, b) => b.startTime - a.startTime);

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: skip + pageSize < total,
    };
  }

  /**
   * Get active auctions by type (helper method)
   */
  private async getActiveAuctionsByType(
    type: 'english' | 'dutch',
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<Auction>> {
    const provider = this.ensureProvider();
    const txManager = this.ensureTxManager();
    const emptyResult: PaginatedResult<Auction> = { items: [], total: 0, page, pageSize, hasMore: false };

    const contractType = type === 'english' ? 'EnglishAuctionImplementation' : 'DutchAuctionImplementation';

    const auctionContract = await safeCall(
      () => this.contractRegistry.getContract(contractType, this.getNetworkId(), provider),
      null
    );
    if (!auctionContract) return emptyResult;

    const totalCount = await safeCall(
      () => txManager.callContract<bigint>(auctionContract, 'getActiveAuctionCount', []),
      0n
    );

    const total = Number(totalCount);
    const skip = (page - 1) * pageSize;

    const auctionIds = await safeCall(
      () => txManager.callContract<string[]>(auctionContract, 'getActiveAuctions', [skip, pageSize]),
      []
    );

    const auctionsPromises = auctionIds.map((id) => safeCall(() => this.getAuction(id), null));
    const auctionResults = await Promise.all(auctionsPromises);
    const items = auctionResults.filter((a): a is Auction => a !== null);

    return { items, total, page, pageSize, hasMore: skip + pageSize < total };
  }

  /**
   * Get auction details from AuctionFactory
   */
  private async getAuctionFromFactory(auctionId: string): Promise<Auction> {
    const provider = this.ensureProvider();
    const txManager = this.ensureTxManager();

    const auctionFactory = await this.contractRegistry.getContract(
      'AuctionFactory',
      this.getNetworkId(),
      provider
    );

    const auctionData = await txManager.callContract<{
      auctionId: string;
      nftContract: string;
      tokenId: bigint;
      amount: bigint;
      seller: string;
      startPrice: bigint;
      reservePrice: bigint;
      startTime: bigint;
      endTime: bigint;
      status: number;
      auctionType: number;
      highestBidder: string;
      highestBid: bigint;
      bidCount: bigint;
    }>(auctionFactory, 'getAuction', [auctionId]);

    // Contract enum: CREATED=0, ACTIVE=1, ENDED=2, CANCELLED=3, SETTLED=4
    const statusMap: Record<number, Auction['status']> = {
      0: 'active',     // CREATED - treat as active
      1: 'active',     // ACTIVE
      2: 'ended',      // ENDED
      3: 'cancelled',  // CANCELLED
      4: 'ended',      // SETTLED - treat as ended
    };

    // Convert BigInt to number for status lookup
    const statusNum = Number(auctionData.status);
    const type = Number(auctionData.auctionType) === 0 ? 'english' : 'dutch';

    const auction: Auction = {
      id: auctionId,
      type,
      seller: auctionData.seller,
      collectionAddress: auctionData.nftContract,
      tokenId: auctionData.tokenId.toString(),
      startTime: Number(auctionData.startTime),
      endTime: Number(auctionData.endTime),
      status: statusMap[statusNum] || 'active',
      createdAt: new Date(Number(auctionData.startTime) * 1000).toISOString(),
    };

    if (type === 'english') {
      auction.startingBid = ethers.formatEther(auctionData.startPrice);
      auction.currentBid = ethers.formatEther(auctionData.highestBid);
      auction.highestBidder = auctionData.highestBidder;
    } else {
      auction.startPrice = ethers.formatEther(auctionData.startPrice);
      auction.endPrice = ethers.formatEther(auctionData.reservePrice);
    }

    return auction;
  }

  /**
   * Extract auction ID from transaction receipt
   */
  private async extractAuctionId(receipt: TransactionReceipt): Promise<string> {
    for (const logEntry of receipt.logs) {
      try {
        const log = logEntry as { topics?: string[] };
        if (log.topics && Array.isArray(log.topics) && log.topics.length > 1) {
          const auctionIdHex = log.topics[1];
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

    // Contract enum: CREATED=0, ACTIVE=1, ENDED=2, CANCELLED=3, SETTLED=4
    const statusMap: Record<number, Auction['status']> = {
      0: 'active',     // CREATED - treat as active
      1: 'active',     // ACTIVE
      2: 'ended',      // ENDED
      3: 'cancelled',  // CANCELLED
      4: 'ended',      // SETTLED - treat as ended
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
