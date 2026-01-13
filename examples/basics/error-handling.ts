/**
 * Error Handling Examples
 *
 * This file demonstrates error handling patterns for the Zuno Marketplace SDK
 *
 * @module examples/basics/error-handling
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';
import { ZunoSDKError, ErrorCodes } from 'zuno-marketplace-sdk';

// ============================================================================
// BASIC TRY-CATCH ERROR HANDLING
// ============================================================================

/**
 * Basic error handling with try-catch
 */
export async function basicErrorHandling() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  try {
    const result = await sdk.exchange.listNFT({
      collectionAddress: '0x...',
      tokenId: '1',
      price: '1.0',
      duration: 86400,
    });
    console.log('NFT listed:', result.listingId);
  } catch (error) {
    if (error instanceof ZunoSDKError) {
      console.error('SDK Error:', {
        code: error.code,
        message: error.message,
        details: error.details,
      });
    } else {
      console.error('Unknown error:', error);
    }
  }
}

// ============================================================================
// ERROR CODE HANDLING
// ============================================================================

/**
 * Handle specific error codes
 */
export async function handleSpecificErrors() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  try {
    await sdk.collection.mintERC721({
      collectionAddress: '0x...',
      recipient: '0x...',
      value: '0.1',
    });
  } catch (error) {
    if (error instanceof ZunoSDKError) {
      switch (error.code) {
        case ErrorCodes.INVALID_ADDRESS:
          console.error('Invalid address provided');
          break;
        case ErrorCodes.INVALID_AMOUNT:
          console.error('Invalid amount provided');
          break;
        case ErrorCodes.INSUFFICIENT_FUNDS:
          console.error('Insufficient funds for transaction');
          break;
        case ErrorCodes.TRANSACTION_FAILED:
          console.error('Transaction failed:', error.message);
          break;
        case ErrorCodes.NOT_OWNER:
          console.error('You are not the owner of this asset');
          break;
        case ErrorCodes.CONTRACT_CALL_FAILED:
          console.error('Contract call failed:', error.message);
          break;
        default:
          console.error('Unknown SDK error:', error.message);
      }
    }
  }
}

// ============================================================================
// TRANSACTION ERROR HANDLING WITH RETRY
// ============================================================================

/**
 * Handle transaction errors with retry logic
 */
export async function transactionWithRetry() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await sdk.exchange.listNFT({
        collectionAddress: '0x...',
        tokenId: '1',
        price: '1.0',
        duration: 86400,
      });
      console.log('NFT listed:', result.listingId);
      return result;
    } catch (error: any) {
      attempt++;

      if (error instanceof ZunoSDKError) {
        // Don't retry on validation errors
        if (
          error.code === ErrorCodes.INVALID_ADDRESS ||
          error.code === ErrorCodes.INVALID_AMOUNT ||
          error.code === ErrorCodes.NOT_OWNER
        ) {
          console.error('Validation error, not retrying:', error.message);
          throw error;
        }

        // Retry on network/transaction errors
        if (attempt < maxRetries) {
          console.log(`Retrying... (${attempt}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

/**
 * Convert SDK errors to user-friendly messages
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof ZunoSDKError) {
    switch (error.code) {
      case ErrorCodes.INVALID_ADDRESS:
        return 'Please enter a valid wallet address';
      case ErrorCodes.INVALID_AMOUNT:
        return 'Please enter a valid amount';
      case ErrorCodes.INSUFFICIENT_FUNDS:
        return 'You don\'t have enough funds for this transaction';
      case ErrorCodes.TRANSACTION_FAILED:
        return 'Transaction failed. Please try again';
      case ErrorCodes.NOT_OWNER:
        return 'You don\'t own this asset';
      case ErrorCodes.INVALID_PARAMETER:
        return 'Invalid parameters provided';
      case ErrorCodes.CONTRACT_CALL_FAILED:
        return 'Contract error. Please contact support';
      case ErrorCodes.NETWORK_ERROR:
        return 'Network error. Please check your connection';
      case ErrorCodes.WALLET_NOT_CONNECTED:
        return 'Please connect your wallet first';
      default:
        return 'An error occurred. Please try again';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

// Use the user-friendly message function
export async function withUserFriendlyErrors() {
  try {
    const sdk = new ZunoSDK({
      apiKey: process.env.ZUNO_API_KEY!,
      network: 'sepolia',
    });

    await sdk.exchange.listNFT({
      collectionAddress: '0x...',
      tokenId: '1',
      price: '1.0',
      duration: 86400,
    });
  } catch (error) {
    const userMessage = getUserFriendlyMessage(error);
    console.error('Error:', userMessage);
    // Display to user in UI: alert(userMessage);
  }
}

// ============================================================================
// VALIDATION BEFORE EXECUTION
// ============================================================================

/**
 * Validate inputs before executing SDK methods
 */
export async function validateBeforeExecution() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const tokenId = '1';
  const price = '1.0';

  // Validate collection address
  if (!collectionAddress || !collectionAddress.startsWith('0x') || collectionAddress.length !== 42) {
    throw new Error('Invalid collection address');
  }

  // Validate token ID
  if (!tokenId || isNaN(Number(tokenId))) {
    throw new Error('Invalid token ID');
  }

  // Validate price
  if (!price || isNaN(Number(price)) || Number(price) <= 0) {
    throw new Error('Invalid price');
  }

  // All validations passed, proceed with operation
  try {
    const result = await sdk.exchange.listNFT({
      collectionAddress,
      tokenId,
      price,
      duration: 86400,
    });
    return result;
  } catch (error) {
    console.error('Operation failed:', error);
    throw error;
  }
}

// ============================================================================
// ASYNC OPERATION ERROR HANDLING
// ============================================================================

/**
 * Handle errors in async operations with loading states
 */
export async function withLoadingState(
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
) {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  try {
    setLoading(true);
    setError(null);

    const result = await sdk.exchange.listNFT({
      collectionAddress: '0x...',
      tokenId: '1',
      price: '1.0',
      duration: 86400,
    });

    console.log('Success:', result.listingId);
    return result;
  } catch (error) {
    const userMessage = getUserFriendlyMessage(error);
    setError(userMessage);
    throw error;
  } finally {
    setLoading(false);
  }
}

// ============================================================================
// TIMEOUT HANDLING
// ============================================================================

/**
 * Handle operations with timeout
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([operation, timeout]);
}

// Usage
export async function operationWithTimeout() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  try {
    const result = await withTimeout(
      sdk.exchange.listNFT({
        collectionAddress: '0x...',
        tokenId: '1',
        price: '1.0',
        duration: 86400,
      }),
      30000, // 30 second timeout
      'Listing NFT timed out. Please try again'
    );
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// ============================================================================
// ERROR LOGGING
// ============================================================================

/**
 * Log errors for debugging
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  const errorLog: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    context: context || {},
  };

  if (error instanceof ZunoSDKError) {
    errorLog.sdkError = {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  } else if (error instanceof Error) {
    errorLog.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  } else {
    errorLog.unknown = error;
  }

  console.error('Error logged:', errorLog);

  // Send to error tracking service
  // sendToErrorTracking(errorLog);
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all error handling examples
 */
export async function runErrorHandlingExamples() {
  console.log('=== Basic Error Handling ===');
  // Uncomment to test: await basicErrorHandling();

  console.log('\n=== User-Friendly Error Messages ===');
  try {
    throw new ZunoSDKError(ErrorCodes.INSUFFICIENT_FUNDS, 'Not enough ETH');
  } catch (error) {
    console.log(getUserFriendlyMessage(error));
  }

  console.log('\n=== Error Logging ===');
  try {
    throw new Error('Test error');
  } catch (error) {
    logError(error, { operation: 'listNFT' });
  }
}

// Run if executed directly
if (require.main === module) {
  runErrorHandlingExamples().catch(console.error);
}
