/**
 * Transaction management utilities
 */

import { ethers } from 'ethers';
import type { TransactionReceipt } from '../types/entities';
import type { TransactionOptions } from '../types/contracts';
import { ZunoSDKError, ErrorCodes } from './errors';

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
    options?: TransactionOptions
  ): Promise<TransactionReceipt> {
    if (!this.signer) {
      throw new ZunoSDKError(
        ErrorCodes.MISSING_PROVIDER,
        'Signer is required to send transactions'
      );
    }

    try {
      // Build transaction overrides
      const overrides: ethers.Overrides = {};

      if (options?.value) {
        overrides.value = options.value;
      }

      if (options?.gasLimit) {
        overrides.gasLimit = options.gasLimit;
      }

      if (options?.gasPrice) {
        overrides.gasPrice = options.gasPrice;
      }

      if (options?.maxFeePerGas) {
        overrides.maxFeePerGas = options.maxFeePerGas;
      }

      if (options?.maxPriorityFeePerGas) {
        overrides.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
      }

      if (options?.nonce !== undefined) {
        overrides.nonce = options.nonce;
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

      // Estimate gas if not provided
      if (!options?.gasLimit) {
        try {
          const estimatedGas = await contractMethod.estimateGas(...args, overrides);
          // Add 20% buffer to estimated gas
          overrides.gasLimit = (estimatedGas * 120n) / 100n;
        } catch (error) {
          // If gas estimation fails, let the transaction proceed without gas limit
          // The provider will use default gas limit
          console.warn('Gas estimation failed:', error);
        }
      }

      // Send transaction
      const tx: ethers.ContractTransactionResponse = await contractMethod(
        ...args,
        overrides
      );

      // Call onSent callback if provided
      if (options?.onSent) {
        options.onSent(tx.hash);
      }

      // Wait for confirmation
      const confirmations = options?.waitForConfirmations || 1;
      const receipt = await tx.wait(confirmations);

      if (!receipt) {
        throw new ZunoSDKError(
          ErrorCodes.TRANSACTION_FAILED,
          'Transaction receipt not found'
        );
      }

      // Check if transaction was successful
      if (receipt.status === 0) {
        throw new ZunoSDKError(
          ErrorCodes.TRANSACTION_REVERTED,
          'Transaction was reverted'
        );
      }

      // Call onConfirmed callback if provided
      if (options?.onConfirmed) {
        options.onConfirmed(receipt);
      }

      return this.formatReceipt(receipt);
    } catch (error) {
      // Call onError callback if provided
      if (options?.onError && error instanceof Error) {
        options.onError(error);
      }

      // Handle specific error types
      if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes('insufficient funds')) {
          throw new ZunoSDKError(
            ErrorCodes.INSUFFICIENT_FUNDS,
            'Insufficient funds for transaction',
            undefined,
            error
          );
        }

        if (message.includes('nonce too low')) {
          throw new ZunoSDKError(
            ErrorCodes.NONCE_TOO_LOW,
            'Transaction nonce too low',
            undefined,
            error
          );
        }

        if (message.includes('gas')) {
          throw new ZunoSDKError(
            ErrorCodes.GAS_ESTIMATION_FAILED,
            'Gas estimation failed',
            undefined,
            error
          );
        }
      }

      throw ZunoSDKError.from(error, ErrorCodes.TRANSACTION_FAILED);
    }
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
   * Format ethers TransactionReceipt to our TransactionReceipt type
   */
  private formatReceipt(
    receipt: ethers.TransactionReceipt
  ): TransactionReceipt {
    return {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      status: receipt.status || 0,
      from: receipt.from,
      to: receipt.to || '',
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.gasPrice?.toString() || '0',
      logs: receipt.logs.map((log) => ({
        address: log.address,
        topics: log.topics,
        data: log.data,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        logIndex: log.index,
      })),
    };
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

      return this.formatReceipt(receipt);
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.TRANSACTION_FAILED);
    }
  }
}
