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
  BatchCreateEnglishAuctionParams,
  BatchCreateDutchAuctionParams,
  PlaceBidParams,
  TransactionOptions,
} from '../types/contracts';
import type { Auction, TransactionReceipt } from '../types/entities';
import {
  validateAddress,
  validateTokenId,
  validateAmount,
  validateDuration,
  ErrorCodes,
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

    // Calculate priceDropPerHour in basis points (100 = 1%, 5000 = 50%)
    // Total drop % = (startPrice - endPrice) / startPrice * 10000
    // Drop per hour = totalDropBps / durationInHours
    const durationInHours = BigInt(Math.max(1, Math.ceil(duration / 3600)));
    const totalDropBps = ((startPriceWei - endPriceWei) * 10000n) / startPriceWei;
    let priceDropPerHourBps = totalDropBps / durationInHours;
    
    // Clamp to valid range: 100-5000 basis points
    if (priceDropPerHourBps < 100n) priceDropPerHourBps = 100n;
    if (priceDropPerHourBps > 5000n) priceDropPerHourBps = 5000n;

    const receipt = await txManager.sendTransaction(
      auctionFactory,
      'createDutchAuction',
      [
        collectionAddress,
        tokenId,
        amount,
        startPriceWei,
        endPriceWei,
        duration,
        priceDropPerHourBps,
      ],
      { ...options, module: 'Auction' }
    );

    // Extract auction ID from logs
    const auctionId = await this.extractAuctionId(receipt);

    return { auctionId, tx: receipt };
  }

  /**
   * Create multiple English auctions in a single transaction
   *
   * @param params - Batch auction creation parameters
   * @param params.collectionAddress - NFT collection contract address (same for all)
   * @param params.tokenIds - Array of token IDs to auction
   * @param params.amounts - Array of amounts (1 for ERC721, optional)
   * @param params.startingBid - Starting bid for all auctions (in ETH)
   * @param params.reservePrice - Reserve price for all auctions (in ETH)
   * @param params.duration - Duration in seconds for all auctions
   *
   * @returns Promise resolving to array of auction IDs and transaction receipt
   *
   * @example
   * ```typescript
   * const { auctionIds, tx } = await sdk.auction.batchCreateEnglishAuction({
   *   collectionAddress: "0x123...",
   *   tokenIds: ["1", "2", "3"],
   *   startingBid: "1.0",
   *   duration: 86400 * 7,
   * });
   * console.log(`Created ${auctionIds.length} auctions`);
   * ```
   */
  async batchCreateEnglishAuction(
    params: BatchCreateEnglishAuctionParams
  ): Promise<{ auctionIds: string[]; tx: TransactionReceipt }> {
    const {
      collectionAddress,
      tokenIds,
      amounts,
      startingBid,
      reservePrice,
      duration,
      options,
    } = params;

    validateAddress(collectionAddress, 'collectionAddress');
    if (tokenIds.length === 0) {
      throw this.error(ErrorCodes.INVALID_PARAMETER, 'tokenIds cannot be empty');
    }
    if (tokenIds.length > 20) {
      throw this.error(ErrorCodes.BATCH_SIZE_EXCEEDED, 'tokenIds exceeds maximum batch size of 20');
    }
    validateAmount(startingBid, 'startingBid');
    validateDuration(duration);

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();
    const sellerAddress = this.signer ? await this.signer.getAddress() : ethers.ZeroAddress;

    // Ensure NFT is approved for AuctionFactory
    await this.ensureApproval(collectionAddress, sellerAddress);

    const auctionFactory = await this.contractRegistry.getContract(
      'AuctionFactory',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const tokenIdsBigInt = tokenIds.map(id => BigInt(id));
    const amountsArray = amounts || tokenIds.map(() => 1);
    const startingBidWei = ethers.parseEther(startingBid);
    const reservePriceWei = reservePrice ? ethers.parseEther(reservePrice) : 0n;

    const receipt = await txManager.sendTransaction(
      auctionFactory,
      'batchCreateEnglishAuction',
      [
        collectionAddress,
        tokenIdsBigInt,
        amountsArray,
        startingBidWei,
        reservePriceWei,
        duration,
      ],
      { ...options, module: 'Auction' }
    );

    // Extract auction IDs from logs
    const auctionIds = this.extractBatchAuctionIds(receipt, tokenIds.length);

    return { auctionIds, tx: receipt };
  }

  /**
   * Create multiple Dutch auctions in a single transaction
   *
   * @param params - Batch auction creation parameters
   * @param params.collectionAddress - NFT collection contract address (same for all)
   * @param params.tokenIds - Array of token IDs to auction
   * @param params.amounts - Array of amounts (1 for ERC721, optional)
   * @param params.startPrice - Starting price for all auctions (in ETH)
   * @param params.endPrice - End price for all auctions (in ETH)
   * @param params.duration - Duration in seconds for all auctions
   *
   * @returns Promise resolving to array of auction IDs and transaction receipt
   *
   * @example
   * ```typescript
   * const { auctionIds, tx } = await sdk.auction.batchCreateDutchAuction({
   *   collectionAddress: "0x123...",
   *   tokenIds: ["1", "2", "3"],
   *   startPrice: "10.0",
   *   endPrice: "1.0",
   *   duration: 86400,
   * });
   * console.log(`Created ${auctionIds.length} Dutch auctions`);
   * ```
   */
  async batchCreateDutchAuction(
    params: BatchCreateDutchAuctionParams
  ): Promise<{ auctionIds: string[]; tx: TransactionReceipt }> {
    const {
      collectionAddress,
      tokenIds,
      amounts,
      startPrice,
      endPrice,
      duration,
      options,
    } = params;

    validateAddress(collectionAddress, 'collectionAddress');
    if (tokenIds.length === 0) {
      throw this.error(ErrorCodes.INVALID_PARAMETER, 'tokenIds cannot be empty');
    }
    if (tokenIds.length > 20) {
      throw this.error(ErrorCodes.BATCH_SIZE_EXCEEDED, 'tokenIds exceeds maximum batch size of 20');
    }
    validateAmount(startPrice, 'startPrice');
    validateAmount(endPrice, 'endPrice');
    validateDuration(duration);

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();
    const sellerAddress = this.signer ? await this.signer.getAddress() : ethers.ZeroAddress;

    // Ensure NFT is approved for AuctionFactory
    await this.ensureApproval(collectionAddress, sellerAddress);

    const auctionFactory = await this.contractRegistry.getContract(
      'AuctionFactory',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const tokenIdsBigInt = tokenIds.map(id => BigInt(id));
    const amountsArray = amounts || tokenIds.map(() => 1);
    const startPriceWei = ethers.parseEther(startPrice);
    const endPriceWei = ethers.parseEther(endPrice);

    // Calculate priceDropPerHour in basis points
    const durationInHours = BigInt(Math.max(1, Math.ceil(duration / 3600)));
    const totalDropBps = ((startPriceWei - endPriceWei) * 10000n) / startPriceWei;
    let priceDropPerHourBps = totalDropBps / durationInHours;
    if (priceDropPerHourBps < 100n) priceDropPerHourBps = 100n;
    if (priceDropPerHourBps > 5000n) priceDropPerHourBps = 5000n;

    const receipt = await txManager.sendTransaction(
      auctionFactory,
      'batchCreateDutchAuction',
      [
        collectionAddress,
        tokenIdsBigInt,
        amountsArray,
        startPriceWei,
        endPriceWei,
        duration,
        priceDropPerHourBps,
      ],
      { ...options, module: 'Auction' }
    );

    // Extract auction IDs from logs
    const auctionIds = this.extractBatchAuctionIds(receipt, tokenIds.length);

    return { auctionIds, tx: receipt };
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

    // Call AuctionFactory.placeBid (routes to correct auction contract)
    const auctionFactory = await this.contractRegistry.getContract(
      'AuctionFactory',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const amountWei = ethers.parseEther(amount);

    const tx = await txManager.sendTransaction(
      auctionFactory,
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

    const auctionFactory = await this.contractRegistry.getContract(
      'AuctionFactory',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    // Get current price from factory
    const currentPrice = await txManager.callContract<bigint>(
      auctionFactory,
      'getCurrentPrice',
      [auctionId]
    );

    const tx = await txManager.sendTransaction(
      auctionFactory,
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

    const auctionFactory = await this.contractRegistry.getContract(
      'AuctionFactory',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const tx = await txManager.sendTransaction(
      auctionFactory,
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

    const auctionFactory = await this.contractRegistry.getContract(
      'AuctionFactory',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const tx = await txManager.sendTransaction(
      auctionFactory,
      'cancelAuction',
      [auctionId],
      { ...options, module: 'Auction' }
    );

    return { tx };
  }

  /**
   * Cancel multiple auctions in a single transaction
   *
   * @param auctionIds - Array of auction IDs to cancel
   * @param options - Optional transaction options
   *
   * @returns Promise resolving to cancelled count and transaction receipt
   *
   * @example
   * ```typescript
   * const { cancelledCount, tx } = await sdk.auction.batchCancelAuction(["1", "2", "3"]);
   * console.log(`Cancelled ${cancelledCount} auctions`);
   * ```
   */
  async batchCancelAuction(
    auctionIds: string[],
    options?: TransactionOptions
  ): Promise<{ cancelledCount: number; tx: TransactionReceipt }> {
    if (auctionIds.length === 0) {
      throw this.error(ErrorCodes.INVALID_PARAMETER, 'auctionIds cannot be empty');
    }
    if (auctionIds.length > 20) {
      throw this.error(ErrorCodes.BATCH_SIZE_EXCEEDED, 'auctionIds exceeds maximum batch size of 20');
    }

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    const auctionFactory = await this.contractRegistry.getContract(
      'AuctionFactory',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const tx = await txManager.sendTransaction(
      auctionFactory,
      'batchCancelAuction',
      [auctionIds],
      { ...options, module: 'Auction' }
    );

    // Extract cancelledCount from transaction logs or return auctionIds.length as estimate
    // The actual count is returned by the contract but we may not be able to get it from receipt
    // For now, return the length as the caller can verify individually if needed
    return { cancelledCount: auctionIds.length, tx };
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

    const auctionFactory = await this.contractRegistry.getContract(
      'AuctionFactory',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const tx = await txManager.sendTransaction(
      auctionFactory,
      'settleAuction',
      [auctionId],
      { ...options, module: 'Auction' }
    );

    return { tx };
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

    const auctionFactory = await this.contractRegistry.getContract(
      'AuctionFactory',
      this.getNetworkId(),
      provider
    );

    const price = await txManager.callContract<bigint>(
      auctionFactory,
      'getCurrentPrice',
      [auctionId]
    );

    return ethers.formatEther(price);
  }

  /**
   * Get pending refund amount for a bidder
   *
   * @param auctionId - ID of the auction
   * @param bidder - Address of the bidder
   *
   * @returns Promise resolving to pending refund amount in ETH
   */
  async getPendingRefund(auctionId: string, bidder: string): Promise<string> {
    validateTokenId(auctionId, 'auctionId');
    validateAddress(bidder, 'bidder');

    const provider = this.ensureProvider();
    const txManager = this.ensureTxManager();

    const auctionFactory = await this.contractRegistry.getContract(
      'AuctionFactory',
      this.getNetworkId(),
      provider
    );

    const refund = await txManager.callContract<bigint>(
      auctionFactory,
      'getPendingRefund',
      [auctionId, bidder]
    );

    return ethers.formatEther(refund);
  }

  /**
   * Get auction details from AuctionFactory
   */
  async getAuctionFromFactory(auctionId: string): Promise<Auction> {
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
      // If no bids yet, show starting bid as current bid
      auction.currentBid = auctionData.highestBid > 0n 
        ? ethers.formatEther(auctionData.highestBid)
        : ethers.formatEther(auctionData.startPrice);
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
   * Extract multiple auction IDs from batch transaction receipt
   */
  private extractBatchAuctionIds(receipt: TransactionReceipt, _expectedCount: number): string[] {
    const auctionIds: string[] = [];
    
    for (const logEntry of receipt.logs) {
      try {
        const log = logEntry as { topics?: string[] };
        if (log.topics && Array.isArray(log.topics) && log.topics.length > 1) {
          const auctionIdHex = log.topics[1];
          const auctionId = ethers.toBigInt(auctionIdHex).toString();
          if (!auctionIds.includes(auctionId)) {
            auctionIds.push(auctionId);
          }
        }
      } catch {
        continue;
      }
    }

    if (auctionIds.length === 0) {
      throw this.error(
        'CONTRACT_CALL_FAILED',
        'Could not extract auction IDs from transaction'
      );
    }

    return auctionIds;
  }

}
