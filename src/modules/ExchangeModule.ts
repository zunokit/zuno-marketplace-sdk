/**
 * Exchange Module for NFT marketplace trading operations
 */

import { ethers } from 'ethers';
import { BaseModule } from './BaseModule';
import type {
  ListNFTParams,
  BatchListNFTParams,
  BuyNFTParams,
  BatchBuyNFTParams,
  BatchCancelListingParams,
  TransactionOptions,
} from '../types/contracts';
import type {
  Listing,
  TransactionReceipt,
} from '../types/entities';
import {
  validateAddress,
  validateTokenId,
  validateListNFTParams,
} from '../utils/errors';
import { ErrorCodes } from '../utils/errors';

/**
 * ExchangeModule handles marketplace trading operations
 */
export class ExchangeModule extends BaseModule {
  /**
   * Ensure NFT collection is approved for Exchange contract
   * Checks approval status and approves if needed
   */
  private async ensureApproval(
    collectionAddress: string,
    ownerAddress: string
  ): Promise<void> {
    const provider = this.ensureProvider();
    const signer = this.ensureSigner();

    // Get Exchange contract address
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider
    );
    const operatorAddress = await exchangeContract.getAddress();

    // Check if already approved
    const erc721Abi = [
      'function isApprovedForAll(address owner, address operator) view returns (bool)',
      'function setApprovalForAll(address operator, bool approved)',
    ];
    const nftContract = new ethers.Contract(collectionAddress, erc721Abi, signer);

    const isApproved = await nftContract.isApprovedForAll(ownerAddress, operatorAddress);

    if (!isApproved) {
      const tx = await nftContract.setApprovalForAll(operatorAddress, true);
      await tx.wait();
    }
  }

  /**
   * List an NFT for sale
   */
  async listNFT(params: ListNFTParams): Promise<{ listingId: string; tx: TransactionReceipt }> {
    // Runtime validation
    validateListNFTParams(params);

    const { collectionAddress, tokenId, price, duration, options } = params;

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get seller address
    const sellerAddress = this.signer ? await this.signer.getAddress() : ethers.ZeroAddress;

    // Ensure NFT is approved for Exchange
    await this.ensureApproval(collectionAddress, sellerAddress);

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
   * @param params.value - Price in ETH (e.g., "1.5")
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

    // Convert ETH value to wei for transaction
    const valueInWei = value ? ethers.parseEther(value).toString() : options?.value;

    // Prepare transaction options with value in wei
    const txOptions: TransactionOptions = {
      ...options,
      value: valueInWei,
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
   * Batch buy multiple NFTs from active listings in a single transaction
   *
   * @param params - Batch purchase parameters
   * @param params.listingIds - Array of listing IDs to purchase (bytes32 format)
   * @param params.value - Total price in ETH covering all listings (e.g., "3.0")
   * @param params.options - Transaction options (gas limit, gas price, etc.)
   *
   * @returns Promise resolving to transaction receipt
   *
   * @throws {Error} If listingIds array is empty
   * @throws {ZunoSDKError} INVALID_LISTING_ID - If any listingId is not bytes32 format
   * @throws {ZunoSDKError} TRANSACTION_FAILED - If transaction fails
   * @throws {ZunoSDKError} INSUFFICIENT_FUNDS - If value doesn't cover total price
   *
   * @example
   * ```typescript
   * // Buy 3 NFTs at once
   * const { tx } = await sdk.exchange.batchBuyNFT({
   *   listingIds: [
   *     '0x1234...', // Listing 1: 1.0 ETH
   *     '0x5678...', // Listing 2: 1.5 ETH
   *     '0x9abc...', // Listing 3: 0.5 ETH
   *   ],
   *   value: '3.0', // Total: 3.0 ETH
   * });
   * ```
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

    // Convert ETH value to wei for transaction
    const valueInWei = value ? ethers.parseEther(value).toString() : options?.value;

    // Prepare transaction options with value in wei
    const txOptions: TransactionOptions = {
      ...options,
      value: valueInWei,
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
   * Cancel an active NFT listing and return the NFT to the seller
   *
   * @param listingId - The listing ID to cancel (bytes32 format)
   * @param options - Transaction options (gas limit, gas price, etc.)
   *
   * @returns Promise resolving to transaction receipt
   *
   * @throws {ZunoSDKError} INVALID_LISTING_ID - If listingId is not valid bytes32 format
   * @throws {ZunoSDKError} TRANSACTION_FAILED - If transaction fails
   * @throws {ZunoSDKError} NOT_OWNER - If caller is not the listing owner
   *
   * @example
   * ```typescript
   * // Cancel a listing
   * const { tx } = await sdk.exchange.cancelListing(
   *   '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
   * );
   * console.log('Listing cancelled:', tx.transactionHash);
   * ```
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
   * Batch cancel multiple NFT listings in a single transaction
   *
   * @param params - Batch cancel parameters
   * @param params.listingIds - Array of listing IDs to cancel (bytes32 format)
   * @param params.options - Transaction options (gas limit, gas price, etc.)
   *
   * @returns Promise resolving to transaction receipt
   *
   * @throws {Error} If listingIds array is empty
   * @throws {ZunoSDKError} INVALID_LISTING_ID - If any listingId is not bytes32 format
   * @throws {ZunoSDKError} TRANSACTION_FAILED - If transaction fails
   * @throws {ZunoSDKError} NOT_OWNER - If caller doesn't own any of the listings
   *
   * @example
   * ```typescript
   * // Cancel multiple listings at once
   * const { tx } = await sdk.exchange.batchCancelListing({
   *   listingIds: [
   *     '0x1234...', // Listing 1
   *     '0x5678...', // Listing 2
   *     '0x9abc...', // Listing 3
   *   ],
   * });
   * console.log('Cancelled all listings:', tx.transactionHash);
   * ```
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
   * Get the total price buyer needs to pay for a listing (including royalty and taker fee)
   *
   * This method calculates the final price including:
   * - Base listing price
   * - Creator royalty (if applicable)
   * - Marketplace taker fee
   *
   * @param listingId - The listing ID to query (bytes32 format)
   *
   * @returns Total price in ETH as string (e.g., "1.05" for 1 ETH + 5% fees)
   *
   * @throws {ZunoSDKError} INVALID_LISTING_ID - If listingId is not valid bytes32 format
   * @throws {ZunoSDKError} LISTING_NOT_FOUND - If listing doesn't exist
   *
   * @example
   * ```typescript
   * // Get total price for a listing
   * const totalPrice = await sdk.exchange.getBuyerPrice(
   *   '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
   * );
   * console.log('Total price:', totalPrice, 'ETH');
   * // Output: "Total price: 1.05 ETH" (1.0 base + 5% fees)
   *
   * // Use for buying
   * await sdk.exchange.buyNFT({
   *   listingId: '0x1234...',
   *   value: totalPrice,
   * });
   * ```
   */
  async getBuyerPrice(listingId: string): Promise<string> {
    validateTokenId(listingId, 'listingId');

    const provider = this.ensureProvider();
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider
    );

    const txManager = this.ensureTxManager();
    const totalPriceWei = await txManager.callContract<bigint>(
      exchangeContract,
      'getBuyerSeesPrice',
      [listingId]
    );

    return ethers.formatEther(totalPriceWei);
  }

  /**
   * Get listing details
   */
  async getListing(listingId: string): Promise<Listing> {
    validateTokenId(listingId, 'listingId');

    const provider = this.ensureProvider();
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider
    );

    const txManager = this.ensureTxManager();
    const listing = await txManager.callContract<ethers.Result>(
      exchangeContract,
      's_listings',
      [listingId]
    );

    return this.formatListing(listingId, listing);
  }

  /**
   * Get listings by collection
   */
  async getListings(collectionAddress: string): Promise<Listing[]> {
    validateAddress(collectionAddress);

    const provider = this.ensureProvider();
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider
    );

    const txManager = this.ensureTxManager();
    const listingIds = await txManager.callContract<string[]>(
      exchangeContract,
      'getListingsByCollection',
      [collectionAddress]
    );

    return Promise.all(listingIds.map((id) => this.getListing(id)));
  }

  /**
   * Get listings by seller
   */
  async getListingsBySeller(seller: string): Promise<Listing[]> {
    validateAddress(seller, 'seller');

    const provider = this.ensureProvider();
    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider
    );

    const txManager = this.ensureTxManager();
    const listingIds = await txManager.callContract<string[]>(
      exchangeContract,
      'getListingsBySeller',
      [seller]
    );

    return Promise.all(listingIds.map((id) => this.getListing(id)));
  }

  /**
   * Format raw listing data from contract
   * Contract struct: contractAddress, tokenId, price, seller, listingDuration, listingStart, status, amount
   */
  private formatListing(id: string, data: ethers.Result): Listing {
    const contractAddress = String(data.contractAddress);
    const tokenId = BigInt(data.tokenId);
    const price = BigInt(data.price);
    const seller = String(data.seller);
    const listingDuration = BigInt(data.listingDuration);
    const listingStart = BigInt(data.listingStart);
    const status = Number(data.status);

    // Contract enum: 0=Pending, 1=Active, 2=Sold, 3=Failed, 4=Cancelled
    const statusMap: Record<number, Listing['status']> = {
      0: 'pending',
      1: 'active',
      2: 'sold',
      3: 'expired',
      4: 'cancelled',
    };

    const startTime = Number(listingStart);
    const endTime = startTime + Number(listingDuration);

    return {
      id,
      seller,
      collectionAddress: contractAddress,
      tokenId: tokenId.toString(),
      price: ethers.formatEther(price),
      paymentToken: ethers.ZeroAddress,
      startTime,
      endTime,
      status: statusMap[status] || 'active',
      createdAt: new Date(startTime * 1000).toISOString(),
    };
  }

  /**
   * Batch list multiple NFTs from the SAME collection in 1 transaction
   */
  async batchListNFT(params: BatchListNFTParams): Promise<{ listingIds: string[]; tx: TransactionReceipt }> {
    const { collectionAddress, tokenIds, prices, duration, options } = params;

    if (tokenIds.length === 0) {
      throw this.error(ErrorCodes.INVALID_PARAMETER, 'Token IDs array cannot be empty');
    }
    if (tokenIds.length !== prices.length) {
      throw this.error(ErrorCodes.INVALID_PARAMETER, 'Token IDs and prices arrays must have same length');
    }

    validateAddress(collectionAddress);

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();
    const sellerAddress = this.signer ? await this.signer.getAddress() : ethers.ZeroAddress;

    await this.ensureApproval(collectionAddress, sellerAddress);

    const exchangeContract = await this.contractRegistry.getContract(
      'ERC721NFTExchange',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const pricesInWei = prices.map(p => ethers.parseEther(p));

    const tx = await txManager.sendTransaction(
      exchangeContract,
      'batchListNFT',
      [collectionAddress, tokenIds, pricesInWei, duration],
      { ...options, module: 'Exchange' }
    );

    const listingIds = this.extractListingIdsFromLogs(tx);
    return { listingIds, tx };
  }

  /**
   * Extract listing IDs from transaction logs
   */
  private extractListingIdsFromLogs(receipt: TransactionReceipt): string[] {
    const listingIds: string[] = [];
    for (const log of receipt.logs) {
      const topics = (log as { topics?: string[] }).topics;
      if (topics && topics.length > 1) {
        listingIds.push(topics[1]);
      }
    }
    return listingIds;
  }

  /**
   * Extract single listing ID from transaction receipt
   */
  private async extractListingId(receipt: TransactionReceipt): Promise<string> {
    const listingIds = this.extractListingIdsFromLogs(receipt);
    if (listingIds.length === 0) {
      throw this.error(ErrorCodes.CONTRACT_CALL_FAILED, 'Could not extract listing ID from transaction');
    }
    return listingIds[0];
  }
}
