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
  validateListNFTParams,
  ErrorCodes,
} from '../utils/errors';
import { validateBytes32 } from '../utils/helpers';

/**
 * ExchangeModule handles marketplace trading operations
 */
export class ExchangeModule extends BaseModule {
  private approvalCache = new Map<string, boolean>();

  private log(message: string, data?: unknown) {
    this.logger.debug(message, { module: 'Exchange', data });
  }

  /**
   * Clear the approval status cache
   *
   * Use this when you need to force re-checking approval status,
   * for example after revoking approvals or switching accounts.
   *
   * @example
   * ```typescript
   * sdk.exchange.clearApprovalCache();
   * ```
   */
  clearApprovalCache(): void {
    this.approvalCache.clear();
    this.log('Approval cache cleared');
  }

  /**
   * Get appropriate exchange contract based on token standard
   * Auto-detects ERC721 vs ERC1155 and returns correct exchange contract
   */
  private async getExchangeContract(
    collectionAddress: string,
    provider: ethers.Provider,
    signer?: ethers.Signer
  ): Promise<ethers.Contract> {
    // Detect token standard
    const tokenType = await this.contractRegistry.verifyTokenStandard(
      collectionAddress,
      provider
    );

    // Select appropriate contract
    const contractType = tokenType === 'ERC1155'
      ? 'ERC1155NFTExchange'
      : 'ERC721NFTExchange';

    this.log('Using exchange contract', { collectionAddress, tokenType, contractType });

    return this.contractRegistry.getContract(
      contractType,
      this.getNetworkId(),
      provider,
      undefined,
      signer
    );
  }

  /**
   * Ensure NFT collection is approved for Exchange contract
   * Checks cache first, then RPC if needed, and grants approval if required
   */
  private async ensureApproval(
    collectionAddress: string,
    ownerAddress: string
  ): Promise<void> {
    const cacheKey = `${collectionAddress.toLowerCase()}-${ownerAddress.toLowerCase()}`;

    if (this.approvalCache.get(cacheKey)) {
      this.log('Approval cache hit', { collectionAddress, ownerAddress });
      return;
    }

    const provider = this.ensureProvider();
    const signer = this.ensureSigner();

    // Get correct exchange contract address for operator
    const exchangeContract = await this.getExchangeContract(
      collectionAddress,
      provider
    );
    const operatorAddress = await exchangeContract.getAddress();

    const approvalAbi = [
      'function isApprovedForAll(address owner, address operator) view returns (bool)',
      'function setApprovalForAll(address operator, bool approved)',
    ];
    const nftContract = new ethers.Contract(collectionAddress, approvalAbi, signer);

    const isApproved = await nftContract.isApprovedForAll(ownerAddress, operatorAddress);

    if (isApproved) {
      this.approvalCache.set(cacheKey, true);
      this.log('Approval already granted, cached', { collectionAddress, ownerAddress });
      return;
    }

    this.log('Approving Exchange for collection', { collectionAddress, operatorAddress });
    const tx = await nftContract.setApprovalForAll(operatorAddress, true);
    await tx.wait();
    this.approvalCache.set(cacheKey, true);
    this.log('Approval confirmed and cached');
  }

  /**
   * List an NFT for sale
   */
  async listNFT(params: ListNFTParams): Promise<{ listingId: string; tx: TransactionReceipt }> {
    // Runtime validation
    validateListNFTParams(params);

    const { collectionAddress, tokenId, price, amount = 1, duration, options } = params;

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    // Get seller address
    const sellerAddress = this.signer ? await this.signer.getAddress() : ethers.ZeroAddress;

    // Ensure NFT is approved for Exchange
    await this.ensureApproval(collectionAddress, sellerAddress);

    // Detect token standard
    const tokenType = await this.contractRegistry.verifyTokenStandard(
      collectionAddress,
      provider
    );

    // Get appropriate exchange contract based on token standard
    const exchangeContract = await this.getExchangeContract(
      collectionAddress,
      provider,
      this.signer
    );

    // Prepare parameters - contract expects: (address, uint256, uint256, uint256)
    const priceInWei = ethers.parseEther(price);

    // ERC1155 needs amount parameter
    if (tokenType === 'ERC1155') {
      const tx = await txManager.sendTransaction(
        exchangeContract,
        'listNFT',
        [collectionAddress, tokenId, priceInWei, amount, duration],
        { ...options, module: 'Exchange' }
      );

      // Extract listing ID from transaction logs
      const listingId = await this.extractListingId(tx);

      return { listingId, tx };
    } else {
      // ERC721 - 4 params (original behavior)
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
  }


  
  /**
   * Buy an NFT from a listing
   * @param params.listingId - Listing ID in bytes32 hex format (0x followed by 64 hex characters)
   * @param params.value - Price in ETH (e.g., "1.5")
   */
  async buyNFT(params: BuyNFTParams): Promise<{ tx: TransactionReceipt }> {
    const { listingId, value, options } = params;

    validateBytes32(listingId, 'listingId');

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
      throw this.error(ErrorCodes.INVALID_PARAMETER, 'listingIds cannot be empty');
    }

    listingIds.forEach((id, index) => {
      validateBytes32(id, `listingIds[${index}]`);
    });

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
    validateBytes32(listingId, 'listingId');

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
      throw this.error(ErrorCodes.INVALID_PARAMETER, 'listingIds cannot be empty');
    }

    listingIds.forEach((id, index) => {
      validateBytes32(id, `listingIds[${index}]`);
    });

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
    validateBytes32(listingId, 'listingId');

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
   * @param listingId - Listing ID in bytes32 hex format (0x followed by 64 hex characters)
   */
  async getListing(listingId: string): Promise<Listing> {
    validateBytes32(listingId, 'listingId');

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
    const normalizedCollection = validateAddress(collectionAddress);

    const provider = this.ensureProvider();
    // Get appropriate exchange contract based on token standard
    const exchangeContract = await this.getExchangeContract(
      normalizedCollection,
      provider
    );

    const txManager = this.ensureTxManager();
    const listingIds = await txManager.callContract<string[]>(
      exchangeContract,
      'getListingsByCollection',
      [normalizedCollection]
    );

    return Promise.all(listingIds.map((id) => this.getListing(id)));
  }

  /**
   * Get listings by seller
   */
  async getListingsBySeller(seller: string): Promise<Listing[]> {
    const normalizedSeller = validateAddress(seller, 'seller');

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
      [normalizedSeller]
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
    const { collectionAddress, tokenIds, prices, amounts, duration, options } = params;

    if (tokenIds.length === 0) {
      throw this.error(ErrorCodes.INVALID_PARAMETER, 'Token IDs array cannot be empty');
    }
    if (tokenIds.length !== prices.length) {
      throw this.error(ErrorCodes.INVALID_PARAMETER, 'Token IDs and prices arrays must have same length');
    }

    const normalizedCollection = validateAddress(collectionAddress);

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();
    const sellerAddress = this.signer ? await this.signer.getAddress() : ethers.ZeroAddress;

    await this.ensureApproval(normalizedCollection, sellerAddress);

    // Default amounts to 1 for each token if not provided (ERC721 compatible)
    const normalizedAmounts = amounts || tokenIds.map(() => 1);

    // Validation
    if (tokenIds.length !== normalizedAmounts.length) {
      throw this.error(ErrorCodes.INVALID_PARAMETER,
        'Token IDs and amounts arrays must have same length');
    }

    // Detect token standard
    const tokenType = await this.contractRegistry.verifyTokenStandard(
      normalizedCollection,
      provider
    );

    // Get appropriate exchange contract based on token standard
    const exchangeContract = await this.getExchangeContract(
      normalizedCollection,
      provider,
      this.signer
    );

    const pricesInWei = prices.map(p => ethers.parseEther(p));

    // ERC1155 needs amounts parameter
    if (tokenType === 'ERC1155') {
      const tx = await txManager.sendTransaction(
        exchangeContract,
        'batchListNFT',
        [normalizedCollection, tokenIds, normalizedAmounts, pricesInWei, duration],
        { ...options, module: 'Exchange' }
      );

      const listingIds = this.extractListingIdsFromLogs(tx);
      return { listingIds, tx };
    } else {
      // ERC721 - 4 params (original behavior)
      const tx = await txManager.sendTransaction(
        exchangeContract,
        'batchListNFT',
        [normalizedCollection, tokenIds, pricesInWei, duration],
        { ...options, module: 'Exchange' }
      );

      const listingIds = this.extractListingIdsFromLogs(tx);
      return { listingIds, tx };
    }
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
