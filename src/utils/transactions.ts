/**
 * Transaction management utilities
 */

import { ethers } from 'ethers';
import type { TransactionReceipt } from '../types/entities';
import type { TransactionOptions } from '../types/contracts';
import { ZunoSDKError, ErrorCodes } from './errors';
import {
  withRetry,
  formatTransactionReceipt,
  waitForTransactionWithTimeout,
  buildTransactionOverrides,
} from './helpers';
import { transactionStore } from './transactionStore';
import { logStore } from './logStore';

/**
 * Transaction Manager for handling contract transactions
 */
export class TransactionManager {
  private readonly provider: ethers.Provider;
  private readonly signer?: ethers.Signer;

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  /**
   * Send a contract transaction with proper error handling and options
   */
  async sendTransaction(
    contract: ethers.Contract,
    method: string,
    args: unknown[],
    options?: TransactionOptions & { maxRetries?: number; confirmations?: number; onSent?: (hash: string) => void; onSuccess?: (receipt: TransactionReceipt) => void; module?: string }
  ): Promise<TransactionReceipt> {
    if (!this.signer) {
      throw new ZunoSDKError(
        ErrorCodes.MISSING_PROVIDER,
        'Signer is required to send transactions'
      );
    }

    // Get contract method
    const contractWithSigner = contract.connect(this.signer) as ethers.Contract;
    const contractMethod = contractWithSigner[method];

    if (!contractMethod) {
      throw new ZunoSDKError(
        ErrorCodes.CONTRACT_CALL_FAILED,
        `Method ${method} not found on contract`
      );
    }

    // Build transaction overrides
    const overrides = await this.buildOverrides(contractMethod, args, options);

    let txId: string | null = null;

    // Send transaction with retry logic
    return withRetry(
      async () => {
        const tx: ethers.ContractTransactionResponse = await contractMethod(
          ...args,
          overrides
        );

        // Track transaction in store
        txId = transactionStore.add({
          hash: tx.hash,
          action: method,
          module: options?.module || 'Unknown',
          status: 'pending',
        });

        // Call onSent callback if provided
        if (options?.onSent) {
          options.onSent(tx.hash);
        }

        // Wait for transaction receipt
        const receipt = await waitForTransactionWithTimeout(
          tx,
          options?.confirmations
        );

        // Update transaction status
        if (txId) {
          transactionStore.update(txId, {
            status: 'success',
            gasUsed: receipt.gasUsed?.toString(),
          });
        }

        // Call onSuccess callback if provided
        if (options?.onSuccess) {
          options.onSuccess(receipt);
        }

        return receipt;
      },
      {
        maxRetries: options?.maxRetries ?? 2,
        initialDelay: 1000,
        maxDelay: 10000,
        backoff: 'exponential',
      },
      (error) => {
        // Update transaction status on failure
        if (txId) {
          transactionStore.update(txId, {
            status: 'failed',
            error: error.message,
          });
        }
        return this.shouldRetry(error);
      }
    );
  }

  /**
   * Build transaction overrides with gas estimation
   */
  private async buildOverrides(
    contractMethod: ethers.ContractMethod,
    args: unknown[],
    options?: TransactionOptions & { maxRetries?: number; confirmations?: number; onSent?: (hash: string) => void; onSuccess?: (receipt: TransactionReceipt) => void }
  ): Promise<ethers.Overrides> {
    const overrides = buildTransactionOverrides({
      value: options?.value,
      gasLimit: options?.gasLimit ? BigInt(options.gasLimit) : undefined,
      gasPrice: options?.gasPrice ? BigInt(options.gasPrice) : undefined,
      maxFeePerGas: options?.maxFeePerGas ? BigInt(options.maxFeePerGas) : undefined,
      maxPriorityFeePerGas: options?.maxPriorityFeePerGas ? BigInt(options.maxPriorityFeePerGas) : undefined,
      nonce: options?.nonce,
    });

    // Estimate gas if not provided
    if (!options?.gasLimit) {
      try {
        const estimatedGas = await contractMethod.estimateGas(...args, overrides);
        // Add 20% buffer to estimated gas
        overrides.gasLimit = (estimatedGas * 120n) / 100n;
      } catch (error) {
        // If gas estimation fails, let the transaction proceed without gas limit
        logStore.add('warn', 'Gas estimation failed', {
          module: 'TransactionManager',
          data: { error: error instanceof Error ? error.message : String(error) },
        });
      }
    }

    return overrides;
  }

  /**
   * Check if error should be retried
   */
  private shouldRetry(error: Error): boolean {
    const nonRetryableErrors = [
      'insufficient funds',
      'execution reverted',
      'invalid opcode',
      'out of gas',
      'nonce too high',
      'underpriced',
      'user rejected',
    ];

    const errorMessage = error.message.toLowerCase();
    const isNonRetryable = nonRetryableErrors.some(pattern =>
      errorMessage.includes(pattern)
    );

    return !isNonRetryable;
  }

  /**
   * Execute a read-only contract call
   */
  async callContract<T>(
    contract: ethers.Contract,
    method: string,
    args: unknown[] = []
  ): Promise<T> {
    try {
      const contractMethod = contract[method];

      if (!contractMethod) {
        throw new ZunoSDKError(
          ErrorCodes.CONTRACT_CALL_FAILED,
          `Method ${method} not found on contract`
        );
      }

      const result = await contractMethod(...args);

      return result as T;
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.CONTRACT_CALL_FAILED);
    }
  }

  
  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();

      return feeData.gasPrice || 0n;
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.API_REQUEST_FAILED);
    }
  }

  /**
   * Get current nonce for an address
   */
  async getNonce(address: string): Promise<number> {
    try {
      return await this.provider.getTransactionCount(address, 'pending');
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.API_REQUEST_FAILED);
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations = 1
  ): Promise<TransactionReceipt> {
    try {
      const receipt = await this.provider.waitForTransaction(
        txHash,
        confirmations
      );

      if (!receipt) {
        throw new ZunoSDKError(
          ErrorCodes.TRANSACTION_FAILED,
          'Transaction not found'
        );
      }

      if (receipt.status === 0) {
        throw new ZunoSDKError(
          ErrorCodes.TRANSACTION_REVERTED,
          'Transaction was reverted'
        );
      }

      return formatTransactionReceipt(receipt);
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.TRANSACTION_FAILED);
    }
  }
}
