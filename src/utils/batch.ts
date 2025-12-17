/**
 * Batch operation utilities for Zuno SDK
 */

import { ZunoSDKError, ErrorCodes } from './errors';

/**
 * Batch operation size limits
 */
export const BATCH_LIMITS = {
  /** Maximum auctions per batch operation */
  AUCTIONS: 20,
  /** Maximum listings per batch operation */
  LISTINGS: 20,
  /** Maximum addresses per allowlist batch operation */
  ALLOWLIST: 100,
} as const;

/**
 * Validate batch operation array size
 * 
 * @param items - Array to validate
 * @param maxSize - Maximum allowed size
 * @param paramName - Parameter name for error messages
 * @throws {ZunoSDKError} INVALID_PARAMETER if array is empty
 * @throws {ZunoSDKError} BATCH_SIZE_EXCEEDED if exceeds max
 * 
 * @example
 * ```typescript
 * // Validate auction IDs array
 * validateBatchSize(auctionIds, BATCH_LIMITS.AUCTIONS, 'auctionIds');
 * 
 * // Validate allowlist addresses
 * validateBatchSize(addresses, BATCH_LIMITS.ALLOWLIST, 'addresses');
 * ```
 */
export function validateBatchSize<T>(
  items: T[],
  maxSize: number,
  paramName: string
): void {
  if (items.length === 0) {
    throw new ZunoSDKError(
      ErrorCodes.INVALID_PARAMETER,
      `${paramName} cannot be empty`
    );
  }
  
  if (items.length > maxSize) {
    throw new ZunoSDKError(
      ErrorCodes.BATCH_SIZE_EXCEEDED,
      `${paramName} exceeds maximum batch size of ${maxSize}`
    );
  }
}
