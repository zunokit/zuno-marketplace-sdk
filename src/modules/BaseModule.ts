/**
 * Base Module class for all feature modules
 */

import { ethers } from 'ethers';
import type { QueryClient } from '@tanstack/react-query';
import type { ZunoAPIClient } from '../core/ZunoAPIClient';
import type { ContractRegistry } from '../core/ContractRegistry';
import { TransactionManager } from '../utils/transactions';
import { ZunoSDKError, ErrorCodes } from '../utils/errors';
import type { NetworkType } from '../types/config';

/**
 * Base class for all SDK modules
 */
export abstract class BaseModule {
  protected readonly apiClient: ZunoAPIClient;
  protected readonly contractRegistry: ContractRegistry;
  protected readonly queryClient: QueryClient;
  protected readonly network: NetworkType;
  protected provider?: ethers.Provider;
  protected signer?: ethers.Signer;
  protected txManager?: TransactionManager;

  constructor(
    apiClient: ZunoAPIClient,
    contractRegistry: ContractRegistry,
    queryClient: QueryClient,
    network: NetworkType,
    provider?: ethers.Provider,
    signer?: ethers.Signer
  ) {
    this.apiClient = apiClient;
    this.contractRegistry = contractRegistry;
    this.queryClient = queryClient;
    this.network = network;
    this.provider = provider;
    this.signer = signer;

    if (provider) {
      this.txManager = new TransactionManager(provider, signer);
    }
  }

  /**
   * Update provider and signer
   */
  updateProvider(provider: ethers.Provider, signer?: ethers.Signer): void {
    this.provider = provider;
    this.signer = signer;
    this.txManager = new TransactionManager(provider, signer);
  }

  /**
   * Ensure provider is available
   */
  protected ensureProvider(): ethers.Provider {
    if (!this.provider) {
      throw new ZunoSDKError(
        ErrorCodes.MISSING_PROVIDER,
        'Provider is required for this operation'
      );
    }

    return this.provider;
  }

  /**
   * Ensure signer is available
   */
  protected ensureSigner(): ethers.Signer {
    if (!this.signer) {
      throw new ZunoSDKError(
        ErrorCodes.MISSING_PROVIDER,
        'Signer is required for this operation. Please connect a wallet.'
      );
    }

    return this.signer;
  }

  /**
   * Ensure transaction manager is available
   */
  protected ensureTxManager(): TransactionManager {
    if (!this.txManager) {
      throw new ZunoSDKError(
        ErrorCodes.MISSING_PROVIDER,
        'Transaction manager is not initialized'
      );
    }

    return this.txManager;
  }

  /**
   * Get network identifier as string
   */
  protected getNetworkId(): string {
    return typeof this.network === 'number'
      ? this.network.toString()
      : this.network;
  }

  /**
   * Format error message with module context
   */
  protected error(
    code: string,
    message: string,
    details?: unknown
  ): ZunoSDKError {
    const moduleName = this.constructor.name;
    return new ZunoSDKError(
      code as never,
      `[${moduleName}] ${message}`,
      details
    );
  }

  /**
   * Execute multiple operations in parallel (basic batch operation)
   */
  protected async batchExecute<T>(
    operations: Array<() => Promise<T>>,
    options?: {
      continueOnError?: boolean;
      maxConcurrency?: number;
    }
  ): Promise<Array<{ success: boolean; data?: T; error?: ZunoSDKError }>> {
    const { continueOnError = false, maxConcurrency = 5 } = options || {};
    const results: Array<{ success: boolean; data?: T; error?: ZunoSDKError }> = [];

    // Process in batches to avoid overwhelming the network
    for (let i = 0; i < operations.length; i += maxConcurrency) {
      const batch = operations.slice(i, i + maxConcurrency);

      const batchPromises = batch.map(async (operation) => {
        try {
          const data = await operation();
          return { success: true, data };
        } catch (error) {
          const zunoError = ZunoSDKError.from(error);
          if (!continueOnError) {
            throw zunoError;
          }
          return { success: false, error: zunoError };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          if (!continueOnError) {
            throw result.reason;
          }
          results.push({
            success: false,
            error: ZunoSDKError.from(result.reason)
          });
        }
      }
    }

    return results;
  }
}
