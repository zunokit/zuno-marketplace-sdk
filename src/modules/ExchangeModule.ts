/**
 * Exchange Module for NFT marketplace trading operations
 */

import { ethers } from 'ethers';
import { BaseModule } from './BaseModule';
import type {
  ListNFTParams,
  BuyNFTParams,
  BatchBuyNFTParams,
  BatchCancelListingParams,
  TransactionOptions,
} from '../types/contracts';
import type {
  Listing,
  PaginatedResult,
  TransactionReceipt,
} from '../types/entities';
import {
  validateAddress,
  validateTokenId,
  validateListNFTParams,
} from '../utils/errors';
import { ZunoSDKError, ErrorCodes } from '../utils/errors';

/**
 * ExchangeModule handles marketplace trading operations
 */
export class ExchangeModule extends BaseModule {
  /**
   * List an NFT for sale
   */
  async listNFT(params: ListNFTParams): Promise<{ listingId: string; tx: TransactionReceipt }> {
    // Runtime validation
    validateListNFTParams(params);

    const { collectionAddress, tokenId, price, duration, options } = params;

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    // Prepare parameters - contract expects: (address, uint256, uint256, uint256)
    const priceInWei = ethers.parseEther(price);

    // Call contract method
    const tx = await txManager.sendTransaction(
      exchangeContract,
      'listNFT',
      [collectionAddress, tokenId, priceInWei, duration],
      { ...options, module: 'Exchange' }
    );

    // Extract listing ID from transaction logs
    const listingId = await this.extractListingId(tx);

    return { listingId, tx };
  }

  
  /**
   * Buy an NFT from a listing
   */
  async buyNFT(params: BuyNFTParams): Promise<{ tx: TransactionReceipt }> {
    const { listingId, value, options } = params;

    validateTokenId(listingId, 'listingId');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    // Prepare transaction options with value
    const txOptions: TransactionOptions = {
      ...options,
      value: value || options?.value,
    };

    // Call contract method
    const tx = await txManager.sendTransaction(
      exchangeContract,
      'buyNFT',
      [listingId],
      { ...txOptions, module: 'Exchange' }
    );

    return { tx };
  }

  /**
   * Batch buy multiple NFTs from listings
   */
  async batchBuyNFT(params: BatchBuyNFTParams): Promise<{ tx: TransactionReceipt }> {
    const { listingIds, value, options } = params;

    if (listingIds.length === 0) {
      throw new Error('Listing IDs array cannot be empty');
    }

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    // Prepare transaction options with value
    const txOptions: TransactionOptions = {
      ...options,
      value: value || options?.value,
    };

    // Call contract method - contract expects: (bytes32[])
    const tx = await txManager.sendTransaction(
      exchangeContract,
      'batchBuyNFT',
      [listingIds],
      { ...txOptions, module: 'Exchange' }
    );

    return { tx };
  }

  /**
   * Cancel an NFT listing
   */
  async cancelListing(
    listingId: string,
    options?: TransactionOptions
  ): Promise<{ tx: TransactionReceipt }> {
    validateTokenId(listingId, 'listingId');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    // Call contract method
    const tx = await txManager.sendTransaction(
      exchangeContract,
      'cancelListing',
      [listingId],
      { ...options, module: 'Exchange' }
    );

    return { tx };
  }

  /**
   * Batch cancel multiple NFT listings
   */
  async batchCancelListing(
    params: BatchCancelListingParams
  ): Promise<{ tx: TransactionReceipt }> {
    const { listingIds, options } = params;

    if (listingIds.length === 0) {
      throw new Error('Listing IDs array cannot be empty');
    }

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    // Call contract method - contract expects: (bytes32[])
    const tx = await txManager.sendTransaction(
      exchangeContract,
      'batchCancelListing',
      [listingIds],
      { ...options, module: 'Exchange' }
    );

    return { tx };
  }

  /**
   * Get listing details
   */
  async getListing(listingId: string): Promise<Listing> {
    validateTokenId(listingId, 'listingId');

    const provider = this.ensureProvider();

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider
    );

    const txManager = this.ensureTxManager();

    // Call contract to get listing
    const listing = await txManager.callContract<unknown[]>(
      exchangeContract,
      'getListing',
      [listingId]
    );

    // Format the response
    return this.formatListing(listingId, listing);
  }

  /**
   * Get listings by collection
   */
  async getListingsByCollection(
    collectionAddress: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<Listing>> {
    validateAddress(collectionAddress);

    const provider = this.ensureProvider();

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider
    );

    const txManager = this.ensureTxManager();

    // Get total count
    const totalCount = await txManager.callContract<bigint>(
      exchangeContract,
      'getListingCountByCollection',
      [collectionAddress]
    );

    const total = Number(totalCount);
    const skip = (page - 1) * pageSize;

    // Get paginated listings
    const listingIds = await txManager.callContract<string[]>(
      exchangeContract,
      'getListingsByCollection',
      [collectionAddress, skip, pageSize]
    );

    // Fetch details for each listing
    const listingsPromises = listingIds.map((id) => this.getListing(id));
    const items = await Promise.all(listingsPromises);

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: skip + pageSize < total,
    };
  }

  /**
   * Get listings by seller
   */
  async getListingsBySeller(
    seller: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<Listing>> {
    validateAddress(seller, 'seller');

    const provider = this.ensureProvider();

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider
    );

    const txManager = this.ensureTxManager();

    // Get total count
    const totalCount = await txManager.callContract<bigint>(
      exchangeContract,
      'getListingCountBySeller',
      [seller]
    );

    const total = Number(totalCount);
    const skip = (page - 1) * pageSize;

    // Get paginated listings
    const listingIds = await txManager.callContract<string[]>(
      exchangeContract,
      'getListingsBySeller',
      [seller, skip, pageSize]
    );

    // Fetch details for each listing
    const listingsPromises = listingIds.map((id) => this.getListing(id));
    const items = await Promise.all(listingsPromises);

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: skip + pageSize < total,
    };
  }

  /**
   * Get all active listings
   *
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of items per page
   * @returns Paginated active listings
   */
  async getActiveListings(
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<Listing>> {
    const provider = this.ensureProvider();

    // Get contract instance
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider
    );

    const txManager = this.ensureTxManager();

    // Get total count of active listings
    const totalCount = await txManager.callContract<bigint>(
      exchangeContract,
      'getActiveListingCount',
      []
    );

    const total = Number(totalCount);
    const skip = (page - 1) * pageSize;

    // Get paginated active listings
    const listingIds = await txManager.callContract<string[]>(
      exchangeContract,
      'getActiveListings',
      [skip, pageSize]
    );

    // Fetch details for each listing
    const listingsPromises = listingIds.map((id) => this.getListing(id));
    const items = await Promise.all(listingsPromises);

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: skip + pageSize < total,
    };
  }

  /**
   * Format raw listing data from contract
   */
  private formatListing(id: string, data: unknown[]): Listing {
    const [
      seller,
      collectionAddress,
      tokenId,
      price,
      paymentToken,
      startTime,
      endTime,
      status,
    ] = data as [string, string, bigint, bigint, string, bigint, bigint, number];

    const statusMap: Record<number, Listing['status']> = {
      0: 'active',
      1: 'sold',
      2: 'cancelled',
      3: 'expired',
    };

    return {
      id,
      seller,
      collectionAddress,
      tokenId: tokenId.toString(),
      price: ethers.formatEther(price),
      paymentToken,
      startTime: Number(startTime),
      endTime: Number(endTime),
      status: statusMap[status] || 'active',
      createdAt: new Date(Number(startTime) * 1000).toISOString(),
    };
  }

  /**
   * Batch list multiple NFTs using the batchExecute utility
   */
  async batchListNFT(
    paramsArray: ListNFTParams[],
    options?: { continueOnError?: boolean; maxConcurrency?: number }
  ): Promise<Array<{ success: boolean; data?: { listingId: string; tx: TransactionReceipt }; error?: ZunoSDKError }>> {
    if (!paramsArray.length) {
      throw this.error(ErrorCodes.INVALID_PARAMETER, 'Parameters array cannot be empty');
    }

    const operations = paramsArray.map(params => () => this.listNFT(params));

    return this.batchExecute(operations, {
      continueOnError: options?.continueOnError ?? true,
      maxConcurrency: options?.maxConcurrency ?? 3
    });
  }

  /**
   * Extract listing ID from transaction receipt logs
   */
  private async extractListingId(receipt: TransactionReceipt): Promise<string> {
    // Look for ListingCreated event in logs
    for (const logEntry of receipt.logs) {
      try {
        const log = logEntry as { topics?: string[] };
        if (log.topics && Array.isArray(log.topics) && log.topics.length > 1) {
          // Listing ID is typically the first indexed parameter (after event signature)
          const listingIdHex = log.topics[1];
          const listingId = ethers.toBigInt(listingIdHex);
          return listingId.toString();
        }
      } catch {
        continue;
      }
    }

    throw this.error(
      ErrorCodes.CONTRACT_CALL_FAILED,
      'Could not extract listing ID from transaction'
    );
  }
}
