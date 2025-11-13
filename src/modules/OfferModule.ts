/**
 * Offer Module for managing NFT and collection offers
 */

import { ethers } from 'ethers';
import { BaseModule } from './BaseModule';
import type {
  MakeOfferParams,
  MakeCollectionOfferParams,
  TransactionOptions,
} from '../types/contracts';
import type { Offer, TransactionReceipt } from '../types/entities';
import {
  validateAddress,
  validateTokenId,
  validateAmount,
  validateDuration,
} from '../utils/errors';

/**
 * OfferModule handles NFT and collection offer operations
 */
export class OfferModule extends BaseModule {
  /**
   * Make an offer on a specific NFT
   */
  async makeOffer(
    params: MakeOfferParams
  ): Promise<{ offerId: string; tx: TransactionReceipt }> {
    const { nftAddress, tokenId, price, duration, options } = params;

    validateAddress(nftAddress, 'nftAddress');
    validateTokenId(tokenId);
    validateAmount(price, 'price');
    validateDuration(duration);

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    const offerContract = await this.contractRegistry.getContract(
      'OfferManager',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const priceWei = ethers.parseEther(price);

    const receipt = await txManager.sendTransaction(
      offerContract,
      'makeTokenOffer',
      [nftAddress, tokenId, priceWei, duration],
      {
        ...options,
        value: priceWei.toString(),
      }
    );

    const offerId = await this.extractOfferId(receipt);

    return { offerId, tx: receipt };
  }

  /**
   * Make an offer on any NFT in a collection
   */
  async makeCollectionOffer(
    params: MakeCollectionOfferParams
  ): Promise<{ offerId: string; tx: TransactionReceipt }> {
    const { collectionAddress, price, duration, options } = params;

    validateAddress(collectionAddress, 'collectionAddress');
    validateAmount(price, 'price');
    validateDuration(duration);

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    const offerContract = await this.contractRegistry.getContract(
      'OfferManager',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    const priceWei = ethers.parseEther(price);

    const receipt = await txManager.sendTransaction(
      offerContract,
      'makeCollectionOffer',
      [collectionAddress, priceWei, duration],
      {
        ...options,
        value: priceWei.toString(),
      }
    );

    const offerId = await this.extractOfferId(receipt);

    return { offerId, tx: receipt };
  }

  /**
   * Accept an offer
   */
  async acceptOffer(
    offerId: string,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    validateTokenId(offerId, 'offerId');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    const offerContract = await this.contractRegistry.getContract(
      'OfferManager',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    return await txManager.sendTransaction(
      offerContract,
      'acceptOffer',
      [offerId],
      options
    );
  }

  /**
   * Cancel an offer
   */
  async cancelOffer(
    offerId: string,
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    validateTokenId(offerId, 'offerId');

    const txManager = this.ensureTxManager();
    const provider = this.ensureProvider();

    const offerContract = await this.contractRegistry.getContract(
      'OfferManager',
      this.getNetworkId(),
      provider,
      undefined,
      this.signer
    );

    return await txManager.sendTransaction(
      offerContract,
      'cancelOffer',
      [offerId],
      options
    );
  }

  /**
   * Get offer details
   */
  async getOffer(offerId: string): Promise<Offer> {
    validateTokenId(offerId, 'offerId');

    const provider = this.ensureProvider();
    const txManager = this.ensureTxManager();

    const offerContract = await this.contractRegistry.getContract(
      'OfferManager',
      this.getNetworkId(),
      provider
    );

    const offer = await txManager.callContract<unknown[]>(
      offerContract,
      'getOffer',
      [offerId]
    );

    return this.formatOffer(offerId, offer);
  }

  /**
   * Extract offer ID from transaction receipt
   */
  private async extractOfferId(receipt: TransactionReceipt): Promise<string> {
    for (const log of receipt.logs) {
      try {
        if (log.topics && log.topics.length > 1) {
          const offerIdHex = log.topics[1];
          const offerId = ethers.toBigInt(offerIdHex);
          return offerId.toString();
        }
      } catch {
        continue;
      }
    }

    throw this.error(
      'CONTRACT_CALL_FAILED',
      'Could not extract offer ID from transaction'
    );
  }

  /**
   * Format raw offer data
   */
  private formatOffer(id: string, data: unknown[]): Offer {
    const [
      offerType,
      offerer,
      collectionAddress,
      tokenId,
      price,
      paymentToken,
      startTime,
      endTime,
      status,
    ] = data as [
      number,
      string,
      string,
      bigint,
      bigint,
      string,
      bigint,
      bigint,
      number,
    ];

    const typeMap: Record<number, Offer['offerType']> = {
      0: 'token',
      1: 'collection',
    };

    const statusMap: Record<number, Offer['status']> = {
      0: 'active',
      1: 'accepted',
      2: 'cancelled',
      3: 'expired',
    };

    return {
      id,
      offerType: typeMap[offerType] || 'token',
      offerer,
      collectionAddress,
      tokenId: tokenId > 0n ? tokenId.toString() : undefined,
      price: ethers.formatEther(price),
      paymentToken,
      startTime: Number(startTime),
      endTime: Number(endTime),
      status: statusMap[status] || 'active',
      createdAt: new Date(Number(startTime) * 1000).toISOString(),
    };
  }
}
