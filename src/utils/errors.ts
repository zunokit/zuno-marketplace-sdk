/**
 * Error handling utilities for Zuno SDK
 */

/**
 * Error codes for SDK errors
 */
export const ErrorCodes = {
  // Configuration errors (1xxx)
  INVALID_CONFIG: 'INVALID_CONFIG',
  MISSING_API_KEY: 'MISSING_API_KEY',
  INVALID_NETWORK: 'INVALID_NETWORK',
  MISSING_PROVIDER: 'MISSING_PROVIDER',

  // API errors (2xxx)
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
  API_TIMEOUT: 'API_TIMEOUT',
  API_UNAUTHORIZED: 'API_UNAUTHORIZED',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_NOT_FOUND: 'API_NOT_FOUND',

  // Contract errors (3xxx)
  CONTRACT_NOT_FOUND: 'CONTRACT_NOT_FOUND',
  INVALID_CONTRACT_ADDRESS: 'INVALID_CONTRACT_ADDRESS',
  CONTRACT_CALL_FAILED: 'CONTRACT_CALL_FAILED',
  ABI_NOT_FOUND: 'ABI_NOT_FOUND',
  INVALID_ABI: 'INVALID_ABI',

  // Transaction errors (4xxx)
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',
  TRANSACTION_REVERTED: 'TRANSACTION_REVERTED',
  NONCE_TOO_LOW: 'NONCE_TOO_LOW',

  // Validation errors (5xxx)
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_TOKEN_ID: 'INVALID_TOKEN_ID',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_DURATION: 'INVALID_DURATION',

  // Module errors (6xxx)
  MODULE_NOT_INITIALIZED: 'MODULE_NOT_INITIALIZED',
  OPERATION_NOT_SUPPORTED: 'OPERATION_NOT_SUPPORTED',

  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Custom error class for Zuno SDK
 */
export class ZunoSDKError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly originalError?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ZunoSDKError';
    this.code = code;
    this.details = details;
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ZunoSDKError);
    }
  }

  /**
   * Create a ZunoSDKError from an unknown error
   */
  static from(error: unknown, code?: ErrorCode): ZunoSDKError {
    if (error instanceof ZunoSDKError) {
      return error;
    }

    if (error instanceof Error) {
      return new ZunoSDKError(
        code || ErrorCodes.UNKNOWN_ERROR,
        error.message,
        undefined,
        error
      );
    }

    return new ZunoSDKError(
      code || ErrorCodes.UNKNOWN_ERROR,
      String(error),
      error
    );
  }

  /**
   * Check if error is a specific error code
   */
  is(code: ErrorCode): boolean {
    return this.code === code;
  }

  /**
   * Convert to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Assert condition is true, otherwise throw error
 */
export function assert(
  condition: boolean,
  code: ErrorCode,
  message: string
): asserts condition {
  if (!condition) {
    throw new ZunoSDKError(code, message);
  }
}

/**
 * Validate Ethereum address
 */
export function validateAddress(address: string, paramName = 'address'): void {
  const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

  assert(
    typeof address === 'string' && ADDRESS_REGEX.test(address),
    ErrorCodes.INVALID_ADDRESS,
    `Invalid ${paramName}: ${address}`
  );
}

/**
 * Validate token ID
 */
export function validateTokenId(tokenId: string, paramName = 'tokenId'): void {
  assert(
    typeof tokenId === 'string' && tokenId.length > 0,
    ErrorCodes.INVALID_TOKEN_ID,
    `Invalid ${paramName}: ${tokenId}`
  );
}

/**
 * Validate amount
 */
export function validateAmount(amount: string | number, paramName = 'amount'): void {
  const numericAmount = typeof amount === 'string' ? Number(amount) : amount;

  assert(
    !isNaN(numericAmount) && numericAmount > 0,
    ErrorCodes.INVALID_AMOUNT,
    `Invalid ${paramName}: ${amount}`
  );
}

/**
 * Validate duration (in seconds)
 */
export function validateDuration(duration: number, paramName = 'duration'): void {
  assert(
    typeof duration === 'number' && duration > 0,
    ErrorCodes.INVALID_DURATION,
    `Invalid ${paramName}: ${duration}`
  );
}

/**
 * Runtime type guard for CreateERC721CollectionParams
 */
export function validateCreateERC721CollectionParams(params: unknown): asserts params is {
  name: string;
  symbol: string;
  baseUri?: string;
  maxSupply?: string;
  options?: Record<string, any>;
} {
  if (!params || typeof params !== 'object') {
    throw new ZunoSDKError(ErrorCodes.INVALID_PARAMETER, 'Params must be an object');
  }

  const p = params as any;

  assert(
    typeof p.name === 'string' && p.name.length > 0,
    ErrorCodes.INVALID_PARAMETER,
    'name is required and must be a non-empty string'
  );

  assert(
    typeof p.symbol === 'string' && p.symbol.length > 0,
    ErrorCodes.INVALID_PARAMETER,
    'symbol is required and must be a non-empty string'
  );

  if (p.baseUri !== undefined) {
    assert(
      typeof p.baseUri === 'string',
      ErrorCodes.INVALID_PARAMETER,
      'baseUri must be a string'
    );
  }

  if (p.maxSupply !== undefined) {
    const supply = Number(p.maxSupply);
    assert(
      !isNaN(supply) && supply > 0,
      ErrorCodes.INVALID_PARAMETER,
      'maxSupply must be a valid number greater than 0'
    );
  }
}

/**
 * Runtime type guard for ListNFTParams
 */
export function validateListNFTParams(params: unknown): asserts params is {
  collectionAddress: string;
  tokenId: string;
  price: string;
  duration: number;
  options?: Record<string, any>;
} {
  if (!params || typeof params !== 'object') {
    throw new ZunoSDKError(ErrorCodes.INVALID_PARAMETER, 'Params must be an object');
  }

  const p = params as any;

  validateAddress(p.collectionAddress, 'collectionAddress');
  validateTokenId(p.tokenId, 'tokenId');
  validateAmount(p.price, 'price');
  validateDuration(p.duration, 'duration');
}

/**
 * Wrap async function with error handling
 */
export function wrapError<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  errorCode: ErrorCode
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw ZunoSDKError.from(error, errorCode);
    }
  }) as T;
}
