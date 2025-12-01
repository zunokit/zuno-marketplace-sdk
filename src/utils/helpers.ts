/**
 * Common helper utilities for Zuno SDK
 */

import { ethers } from 'ethers';
import type { TransactionReceipt } from '../types/entities';
import { ZunoSDKError, ErrorCodes } from './errors';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoff: 'linear' | 'exponential';
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoff: 'exponential',
};

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  shouldRetry?: (error: Error, attempt: number) => boolean
): Promise<T> {
  const { maxRetries, initialDelay, maxDelay, backoff } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error = new Error('Max retries exceeded');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (attempt === maxRetries) {
        break;
      }

      if (shouldRetry && !shouldRetry(lastError, attempt)) {
        break;
      }

      if (!defaultShouldRetry(lastError)) {
        break;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, initialDelay, maxDelay, backoff);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Default retry logic for transactions
 */
function defaultShouldRetry(error: Error): boolean {
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
 * Calculate delay for retry
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoff: 'linear' | 'exponential'
): number {
  let delay: number;

  if (backoff === 'exponential') {
    delay = initialDelay * Math.pow(2, attempt);
  } else {
    delay = initialDelay * (attempt + 1);
  }

  return Math.min(delay, maxDelay);
}

/**
 * Format ethers TransactionReceipt to SDK TransactionReceipt
 */
export function formatTransactionReceipt(
  receipt: ethers.TransactionReceipt
): TransactionReceipt {
  return {
    hash: receipt.hash,
    blockNumber: receipt.blockNumber || 0,
    blockHash: receipt.blockHash || '',
    gasUsed: receipt.gasUsed?.toString() || '0',
    cumulativeGasUsed: receipt.cumulativeGasUsed?.toString() || '0',
    status: receipt.status === 1 ? 'success' : 'failed',
    logs: receipt.logs || [],
    timestamp: Date.now(),
  };
}

/**
 * Parse transaction error and convert to ZunoSDKError
 */
export function parseTransactionError(error: Error): ZunoSDKError {
  const message = error.message.toLowerCase();

  if (message.includes('insufficient funds')) {
    return new ZunoSDKError(
      ErrorCodes.INSUFFICIENT_FUNDS,
      'Insufficient funds for transaction',
      error
    );
  }

  if (message.includes('gas')) {
    return new ZunoSDKError(
      ErrorCodes.GAS_ESTIMATION_FAILED,
      'Gas estimation failed or gas limit too low',
      error
    );
  }

  if (message.includes('nonce too low')) {
    return new ZunoSDKError(
      ErrorCodes.NONCE_TOO_LOW,
      'Transaction nonce too low',
      error
    );
  }

  if (message.includes('nonce too high')) {
    return new ZunoSDKError(
      ErrorCodes.NONCE_TOO_LOW,
      'Transaction nonce too high',
      error
    );
  }

  if (message.includes('reverted')) {
    return new ZunoSDKError(
      ErrorCodes.TRANSACTION_REVERTED,
      'Transaction was reverted by the contract',
      error
    );
  }

  if (message.includes('user rejected')) {
    return new ZunoSDKError(
      ErrorCodes.TRANSACTION_FAILED,
      'User rejected the transaction',
      error
    );
  }

  return new ZunoSDKError(
    ErrorCodes.TRANSACTION_FAILED,
    'Transaction failed',
    error
  );
}

/**
 * Wait for transaction with timeout
 */
export async function waitForTransactionWithTimeout(
  tx: ethers.ContractTransactionResponse,
  confirmations = 1,
  timeoutMs = 10 * 60 * 1000 // 10 minutes
): Promise<TransactionReceipt> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const receipt = await tx.wait(confirmations);
      if (receipt) {
        return formatTransactionReceipt(receipt);
      }
    } catch {
      // Transaction might still be pending, continue waiting
    }

    // Wait 2 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new ZunoSDKError(
    ErrorCodes.TRANSACTION_FAILED,
    'Transaction confirmation timeout'
  );
}

/**
 * Build transaction overrides
 */
export function buildTransactionOverrides(options?: {
  value?: string | bigint;
  gasLimit?: string | bigint;
  gasPrice?: string | bigint;
  maxFeePerGas?: string | bigint;
  maxPriorityFeePerGas?: string | bigint;
  nonce?: number;
}): ethers.Overrides {
  const overrides: ethers.Overrides = {};

  if (options?.value) {
    // Convert string to BigInt for ethers v6 compatibility
    overrides.value = typeof options.value === 'string' ? BigInt(options.value) : options.value;
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

  return overrides;
}

/**
 * Validate and format address
 */
export function validateAndFormatAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    throw new ZunoSDKError(
      ErrorCodes.INVALID_ADDRESS,
      'Address must be a string'
    );
  }

  try {
    return ethers.getAddress(address);
  } catch {
    throw new ZunoSDKError(
      ErrorCodes.INVALID_ADDRESS,
      `Invalid Ethereum address: ${address}`
    );
  }
}

/**
 * Convert value to wei (bigint)
 */
export function toWei(value: string | number): bigint {
  try {
    return ethers.parseEther(value.toString());
  } catch {
    throw new ZunoSDKError(
      ErrorCodes.INVALID_AMOUNT,
      `Invalid amount value: ${value}`
    );
  }
}

/**
 * Convert wei to ether string
 */
export function fromWei(value: string | bigint): string {
  try {
    return ethers.formatEther(value);
  } catch {
    throw new ZunoSDKError(
      ErrorCodes.INVALID_AMOUNT,
      `Invalid wei value: ${value}`
    );
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Safely execute an async function with fallback value
 */
export async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}