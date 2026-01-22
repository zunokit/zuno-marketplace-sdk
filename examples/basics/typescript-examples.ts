/**
 * TypeScript Usage Examples
 *
 * This file demonstrates TypeScript patterns and best practices for the Zuno Marketplace SDK
 *
 * @module examples/basics/typescript-examples
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';
import type {
  ZunoSDKConfig,
  ListNFTParams,
  BuyNFTParams,
  CreateERC721CollectionParams,
  CreateEnglishAuctionParams,
  TransactionReceipt,
  Listing,
  Auction,
} from 'zuno-marketplace-sdk';

// ============================================================================
// TYPE-SAFE CONFIGURATION
// ============================================================================

/**
 * Type-safe SDK configuration
 */
export function typedConfiguration(): ZunoSDKConfig {
  const config: ZunoSDKConfig = {
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia', // Type: literal union 'mainnet' | 'sepolia' | 'localhost'
    logger: {
      level: 'debug', // Type: 'none' | 'error' | 'warn' | 'info' | 'debug'
      timestamp: true,
      modulePrefix: true,
      logTransactions: true,
    },
  };

  return config;
}

// ============================================================================
// TYPE-SAFE PARAMETER CONSTRUCTION
// ============================================================================

/**
 * Type-safe list NFT parameters
 */
export function createListParams(): ListNFTParams {
  const params: ListNFTParams = {
    collectionAddress: '0x...',
    tokenId: '1',
    price: '1.5',
    duration: 86400,
  };

  // TypeScript will validate all required fields are present
  return params;
}

/**
 * Type-safe buy NFT parameters
 */
export function createBuyParams(): BuyNFTParams {
  const params: BuyNFTParams = {
    listingId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    value: '1.5',
  };

  return params;
}

/**
 * Type-safe collection creation parameters
 */
export function createCollectionParams(): CreateERC721CollectionParams {
  const params: CreateERC721CollectionParams = {
    name: 'My NFT Collection',
    symbol: 'MNC',
    maxSupply: 10000,
    mintPrice: '0.1',
    royaltyFee: 500, // 5% in basis points
    tokenURI: 'ipfs://...',
    description: 'My awesome NFT collection',
    mintLimitPerWallet: 10,
    mintStartTime: Math.floor(Date.now() / 1000),
  };

  return params;
}

/**
 * Type-safe auction creation parameters
 */
export function createAuctionParams(): CreateEnglishAuctionParams {
  const params: CreateEnglishAuctionParams = {
    collectionAddress: '0x...',
    tokenId: '1',
    startingBid: '1.0',
    reservePrice: '5.0',
    duration: 86400 * 7, // 7 days
  };

  return params;
}

// ============================================================================
// TYPE-SAFE RETURN VALUES
// ============================================================================

/**
 * Type-safe listing operation
 */
export async function listNFTTyped(): Promise<{ listingId: string; tx: TransactionReceipt }> {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: ListNFTParams = {
    collectionAddress: '0x...',
    tokenId: '1',
    price: '1.5',
    duration: 86400,
  };

  const result = await sdk.exchange.listNFT(params);

  // TypeScript knows result has { listingId: string, tx: TransactionReceipt }
  console.log('Listing ID:', result.listingId);
  console.log('Transaction Hash:', result.tx.hash);

  return result;
}

/**
 * Type-safe auction creation
 */
export async function createAuctionTyped(): Promise<{ auctionId: string; tx: TransactionReceipt }> {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: CreateEnglishAuctionParams = {
    collectionAddress: '0x...',
    tokenId: '1',
    startingBid: '1.0',
    duration: 86400 * 7,
  };

  const result = await sdk.auction.createEnglishAuction(params);

  // TypeScript knows result has { auctionId: string, tx: TransactionReceipt }
  console.log('Auction ID:', result.auctionId);
  console.log('Transaction Hash:', result.tx.hash);

  return result;
}

// ============================================================================
// GENERIC TYPE UTILITIES
// ============================================================================

/**
 * Generic async handler with type safety
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    if (onError && error instanceof Error) {
      onError(error);
    }
    return null;
  }
}

// Usage
export async function genericHandlerExample() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const result = await handleAsync(
    () => sdk.exchange.listNFT({
      collectionAddress: '0x...',
      tokenId: '1',
      price: '1.0',
      duration: 86400,
    }),
    (error) => console.error('Error:', error.message)
  );

  if (result) {
    console.log('Listing ID:', result.listingId);
  }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for listing status
 */
export function isListingActive(listing: Listing): boolean {
  return listing.status === 'active';
}

/**
 * Type guard for auction type
 */
export function isEnglishAuction(auction: Auction): auction is Auction & { type: 'english' } {
  return auction.type === 'english';
}

// Usage
export function typeGuardExample(listing: Listing) {
  if (isListingActive(listing)) {
    console.log('Listing is active until:', new Date(listing.endTime).toLocaleString());
  } else {
    console.log('Listing is not active');
  }
}

// ============================================================================
// TYPE NARROWING
// ============================================================================

/**
 * Type narrowing for auction operations
 */
export async function handleAuctionByType(auction: Auction) {
  if (auction.type === 'english') {
    // TypeScript knows auction has startingBid and currentBid
    console.log('Starting bid:', auction.startingBid);
    console.log('Current bid:', auction.currentBid);
  } else {
    // TypeScript knows auction has startPrice and endPrice
    console.log('Start price:', auction.startPrice);
    console.log('End price:', auction.endPrice);
  }
}

// ============================================================================
// DISCRIMINATED UNIONS
// ============================================================================

/**
 * Example of discriminated union for operation results
 */
type OperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function safeListNFT(
  params: ListNFTParams
): Promise<OperationResult<{ listingId: string; tx: TransactionReceipt }>> {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  try {
    const result = await sdk.exchange.listNFT(params);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Usage
export async function discriminatedUnionExample() {
  const result = await safeListNFT({
    collectionAddress: '0x...',
    tokenId: '1',
    price: '1.0',
    duration: 86400,
  });

  if (result.success) {
    // TypeScript knows result has data property
    console.log('Listing ID:', result.data.listingId);
  } else {
    // TypeScript knows result has error property
    console.error('Error:', result.error);
  }
}

// ============================================================================
// TYPE-SAFE EVENT HANDLERS
// ============================================================================

/**
 * Type-safe event handler for NFT operations
 */
export type NFTOperationHandler = {
  onStart?: () => void;
  onSuccess?: (result: TransactionReceipt) => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
};

export async function listNFTWithHandler(
  params: ListNFTParams,
  handler: NFTOperationHandler
) {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  try {
    handler.onStart?.();
    const result = await sdk.exchange.listNFT(params);
    handler.onSuccess?.(result.tx);
    return result;
  } catch (error) {
    handler.onError?.(error as Error);
    throw error;
  } finally {
    handler.onFinally?.();
  }
}

// ============================================================================
// TYPE-SAFE API RESPONSES
// ============================================================================

/**
 * Type-safe API response wrapper
 */
export interface APIResponse<T> {
  data: T;
  status: number;
  timestamp: number;
}

export async function getListingTyped(listingId: string): Promise<APIResponse<Listing>> {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const listing = await sdk.exchange.getListing(listingId);

  return {
    data: listing,
    status: 200,
    timestamp: Date.now(),
  };
}

// ============================================================================
// TYPE-SAFE ENUMS
// ============================================================================

/**
 * Type-safe network configuration
 */
export type SupportedNetwork = 'mainnet' | 'sepolia' | 'localhost';

export const NETWORK_CONFIGS: Record<SupportedNetwork, { chainId: number; name: string }> = {
  mainnet: { chainId: 1, name: 'Ethereum Mainnet' },
  sepolia: { chainId: 11155111, name: 'Sepolia Testnet' },
  localhost: { chainId: 31337, name: 'Local Development' },
};

export function getNetworkConfig(network: SupportedNetwork) {
  return NETWORK_CONFIGS[network];
}

// ============================================================================
// TYPE-SAFE VALIDATION
// ============================================================================

/**
 * Type-safe input validation
 */
export function validatePrice(price: string): number {
  const numPrice = Number(price);

  if (isNaN(numPrice)) {
    throw new Error('Price must be a valid number');
  }

  if (numPrice <= 0) {
    throw new Error('Price must be greater than 0');
  }

  return numPrice;
}

export function validateDuration(duration: number): number {
  if (duration <= 0) {
    throw new Error('Duration must be greater than 0');
  }

  if (duration > 86400 * 30) {
    throw new Error('Duration cannot exceed 30 days');
  }

  return duration;
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all TypeScript examples
 */
export async function runTypeScriptExamples() {
  console.log('=== Type-Safe Configuration ===');
  const config = typedConfiguration();
  console.log('Network:', config.network);

  console.log('\n=== Type-Safe Parameters ===');
  const listParams = createListParams();
  console.log('List params:', listParams);

  console.log('\n=== Type-Safe Validation ===');
  try {
    console.log('Valid price:', validatePrice('1.5'));
    console.log('Valid duration:', validateDuration(86400));
  } catch (error) {
    console.error('Validation error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runTypeScriptExamples().catch(console.error);
}
