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
  async listNFT(params: ListNFTParams): Promise<TransactionReceipt> {
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
    return await txManager.sendTransaction(
      exchangeContract,
      'listNFT',
      [collectionAddress, tokenId, priceInWei, duration],
      options
    );
  }

  
  /**
   * Buy an NFT from a listing
   */
  async buyNFT(params: BuyNFTParams): Promise<TransactionReceipt> {
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
    return await txManager.sendTransaction(
      exchangeContract,
      'buyNFT',
      [listingId],
      txOptions
    );
  }

  /**
   * Batch buy multiple NFTs from listings
   */
  async batchBuyNFT(params: BatchBuyNFTParams): Promise<TransactionReceipt> {
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
    return await txManager.sendTransaction(
      exchangeContract,
      'batchBuyNFT',
      [listingIds],
      txOptions
    );
  }

  /**
   * Cancel an NFT listing
   */
  async cancelListing(
    listingId: string,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
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
    return await txManager.sendTransaction(
      exchangeContract,
      'cancelListing',
      [listingId],
      options
    );
  }

  /**
   * Batch cancel multiple NFT listings
   */
  async batchCancelListing(
    params: BatchCancelListingParams
  ): Promise<TransactionReceipt> {
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
    return await txManager.sendTransaction(
      exchangeContract,
      'batchCancelListing',
      [listingIds],
      options
    );
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
  ): Promise<Array<{ success: boolean; data?: TransactionReceipt; error?: ZunoSDKError }>> {
    if (!paramsArray.length) {
      throw this.error(ErrorCodes.INVALID_PARAMETER, 'Parameters array cannot be empty');
    }

    const operations = paramsArray.map(params => () => this.listNFT(params));

    return this.batchExecute(operations, {
      continueOnError: options?.continueOnError ?? true,
      maxConcurrency: options?.maxConcurrency ?? 3
    });
  }
}
