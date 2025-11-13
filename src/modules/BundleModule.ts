/**
 * Bundle Module for managing multi-NFT bundle trading
 */

import { ethers } from 'ethers';
import { BaseModule } from './BaseModule';
import type {
  CreateBundleParams,
  TransactionOptions,
} from '../types/contracts';
import type { Bundle, TransactionReceipt } from '../types/entities';
import {
  validateAddress,
  validateTokenId,
  validateAmount,
  validateDuration,
} from '../utils/errors';

/**
 * BundleModule handles multi-NFT bundle operations
 */
export class BundleModule extends BaseModule {
  /**
   * Create a bundle of multiple NFTs
   */
  async createBundle(
    params: CreateBundleParams
  ): Promise<{ bundleId: string; tx: TransactionReceipt }> {
    const { nfts, price, duration, options } = params;

    // Validate parameters
    if (!nfts || nfts.length === 0) {
      throw this.error('INVALID_PARAMETER', 'At least one NFT is required');
    }

    for (const nft of nfts) {
      validateAddress(nft.address, 'nft.address');
      validateTokenId(nft.tokenId, 'nft.tokenId');
    }

    validateAmount(price, 'price');
    validateDuration(duration);

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    const bundleContract = await this.contractRegistry.getContract(
      'BundleMarketplace',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const priceWei = ethers.parseEther(price);

    // Format NFTs for contract call
    const nftAddresses = nfts.map((nft) => nft.address);
    const tokenIds = nfts.map((nft) => nft.tokenId);

    const receipt = await txManager.sendTransaction(
      bundleContract,
      'createBundle',
      [nftAddresses, tokenIds, priceWei, duration],
      options
    );

    const bundleId = await this.extractBundleId(receipt);

    return { bundleId, tx: receipt };
  }

  /**
   * Buy a bundle
   */
  async buyBundle(
    bundleId: string,
    value?: string,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    validateTokenId(bundleId, 'bundleId');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    const bundleContract = await this.contractRegistry.getContract(
      'BundleMarketplace',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    return await txManager.sendTransaction(
      bundleContract,
      'buyBundle',
      [bundleId],
      {
        ...options,
        value: value || options?.value,
      }
    );
  }

  /**
   * Cancel a bundle listing
   */
  async cancelBundle(
    bundleId: string,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    validateTokenId(bundleId, 'bundleId');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    const bundleContract = await this.contractRegistry.getContract(
      'BundleMarketplace',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    return await txManager.sendTransaction(
      bundleContract,
      'cancelBundle',
      [bundleId],
      options
    );
  }

  /**
   * Get bundle details
   */
  async getBundle(bundleId: string): Promise<Bundle> {
    validateTokenId(bundleId, 'bundleId');

    const provider = this.ensureProvider();
    const txManager = this.ensureTxManager();

    const bundleContract = await this.contractRegistry.getContract(
      'BundleMarketplace',
      this.getNetworkId(),
      provider
    );

    const bundle = await txManager.callContract<unknown[]>(
      bundleContract,
      'getBundle',
      [bundleId]
    );

    return this.formatBundle(bundleId, bundle);
  }

  /**
   * Extract bundle ID from transaction receipt
   */
  private async extractBundleId(receipt: TransactionReceipt): Promise<string> {
    for (const log of receipt.logs) {
      try {
        const logData = log as any; // Type assertion for event log
        if (logData.topics && logData.topics.length > 1) {
          const bundleIdHex = logData.topics[1];
          const bundleId = ethers.toBigInt(bundleIdHex);
          return bundleId.toString();
        }
      } catch {
        continue;
      }
    }

    throw this.error(
      'CONTRACT_CALL_FAILED',
      'Could not extract bundle ID from transaction'
    );
  }

  /**
   * Format raw bundle data
   */
  private formatBundle(id: string, data: unknown[]): Bundle {
    const [
      seller,
      nftAddresses,
      tokenIds,
      price,
      paymentToken,
      startTime,
      endTime,
      status,
    ] = data as [
      string,
      string[],
      bigint[],
      bigint,
      string,
      bigint,
      bigint,
      number,
    ];

    const statusMap: Record<number, Bundle['status']> = {
      0: 'active',
      1: 'sold',
      2: 'cancelled',
      3: 'expired',
    };

    const nfts = nftAddresses.map((address, index) => ({
      address,
      tokenId: tokenIds[index].toString(),
    }));

    return {
      id,
      seller,
      nfts,
      price: ethers.formatEther(price),
      paymentToken,
      startTime: Number(startTime),
      endTime: Number(endTime),
      status: statusMap[status] || 'active',
      createdAt: new Date(Number(startTime) * 1000).toISOString(),
    };
  }
}
