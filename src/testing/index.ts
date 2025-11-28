/**
 * Official testing utilities for Zuno Marketplace SDK
 * Provides mocks, utilities, and test helpers for easier testing
 *
 * @packageDocumentation
 */

import type { QueryClient } from '@tanstack/react-query';
import type { Logger } from '../utils/logger';

// ============================================
// MOCK TYPES
// ============================================

export interface MockTransactionReceipt {
  hash: string;
  blockNumber: number;
  blockHash: string;
  status: 1 | 0;
  gasUsed: bigint;
  logs: any[];
}

export interface MockExchangeModule {
  listNFT: jest.Mock;
  buyNFT: jest.Mock;
  cancelListing: jest.Mock;
  getListing: jest.Mock;
  getListings: jest.Mock;
}

export interface MockAuctionModule {
  createEnglishAuction: jest.Mock;
  createDutchAuction: jest.Mock;
  placeBid: jest.Mock;
  settleAuction: jest.Mock;
  cancelAuction: jest.Mock;
  getAuction: jest.Mock;
  getCurrentPrice: jest.Mock;
}

export interface MockCollectionModule {
  createERC721Collection: jest.Mock;
  createERC1155Collection: jest.Mock;
  mintNFT: jest.Mock;
  batchMint: jest.Mock;
  getCollection: jest.Mock;
}

export interface MockZunoSDK {
  exchange: MockExchangeModule;
  auction: MockAuctionModule;
  collection: MockCollectionModule;
  logger: Logger;
  getConfig: jest.Mock;
  getProvider: jest.Mock;
  getSigner: jest.Mock;
  getQueryClient: jest.Mock;
  updateProvider: jest.Mock;
  prefetchABIs: jest.Mock;
  clearCache: jest.Mock;
}

export interface CreateMockSDKOptions {
  exchange?: Partial<MockExchangeModule>;
  auction?: Partial<MockAuctionModule>;
  collection?: Partial<MockCollectionModule>;
  logger?: Partial<Logger>;
  config?: {
    apiKey?: string;
    network?: string | number;
    debug?: boolean;
  };
}

// ============================================
// MOCK FACTORIES
// ============================================

/**
 * Create a mock transaction receipt
 */
export function createMockTxReceipt(overrides: Partial<MockTransactionReceipt> = {}): MockTransactionReceipt {
  return {
    hash: '0x' + 'a'.repeat(64),
    blockNumber: 12345678,
    blockHash: '0x' + 'b'.repeat(64),
    status: 1,
    gasUsed: BigInt(21000),
    logs: [],
    ...overrides,
  };
}

/**
 * Create a mock listing object
 */
export function createMockListing(overrides: Record<string, any> = {}) {
  return {
    listingId: '1',
    collectionAddress: '0x' + '1'.repeat(40),
    tokenId: '1',
    seller: '0x' + '2'.repeat(40),
    price: '1.0',
    isActive: true,
    createdAt: Date.now(),
    ...overrides,
  };
}

/**
 * Create a mock auction object
 */
export function createMockAuction(overrides: Record<string, any> = {}) {
  return {
    auctionId: '1',
    collectionAddress: '0x' + '1'.repeat(40),
    tokenId: '1',
    seller: '0x' + '2'.repeat(40),
    startingBid: '1.0',
    currentBid: '1.5',
    highestBidder: '0x' + '3'.repeat(40),
    endTime: Date.now() + 86400000,
    isActive: true,
    auctionType: 'english',
    ...overrides,
  };
}

/**
 * Create a mock collection object
 */
export function createMockCollection(overrides: Record<string, any> = {}) {
  return {
    address: '0x' + '1'.repeat(40),
    name: 'Test Collection',
    symbol: 'TEST',
    owner: '0x' + '2'.repeat(40),
    tokenType: 'ERC721',
    totalSupply: 100,
    ...overrides,
  };
}

/**
 * Create a mock logger that tracks calls
 */
export function createMockLogger(): Logger & { calls: { level: string; message: string; meta?: any }[] } {
  const calls: { level: string; message: string; meta?: any }[] = [];

  return {
    calls,
    debug: jest.fn((message: string, meta?: any) => {
      calls.push({ level: 'debug', message, meta });
    }),
    info: jest.fn((message: string, meta?: any) => {
      calls.push({ level: 'info', message, meta });
    }),
    warn: jest.fn((message: string, meta?: any) => {
      calls.push({ level: 'warn', message, meta });
    }),
    error: jest.fn((message: string, meta?: any) => {
      calls.push({ level: 'error', message, meta });
    }),
  };
}

/**
 * Create a mock Exchange module
 */
export function createMockExchangeModule(overrides: Partial<MockExchangeModule> = {}): MockExchangeModule {
  const mockTx = createMockTxReceipt();

  return {
    listNFT: jest.fn().mockResolvedValue({ listingId: '1', tx: mockTx }),
    buyNFT: jest.fn().mockResolvedValue({ tx: mockTx }),
    cancelListing: jest.fn().mockResolvedValue({ tx: mockTx }),
    getListing: jest.fn().mockResolvedValue(createMockListing()),
    getListings: jest.fn().mockResolvedValue([createMockListing()]),
    ...overrides,
  };
}

/**
 * Create a mock Auction module
 */
export function createMockAuctionModule(overrides: Partial<MockAuctionModule> = {}): MockAuctionModule {
  const mockTx = createMockTxReceipt();

  return {
    createEnglishAuction: jest.fn().mockResolvedValue({ auctionId: '1', tx: mockTx }),
    createDutchAuction: jest.fn().mockResolvedValue({ auctionId: '1', tx: mockTx }),
    placeBid: jest.fn().mockResolvedValue({ tx: mockTx }),
    settleAuction: jest.fn().mockResolvedValue({ tx: mockTx }),
    cancelAuction: jest.fn().mockResolvedValue({ tx: mockTx }),
    getAuction: jest.fn().mockResolvedValue(createMockAuction()),
    getCurrentPrice: jest.fn().mockResolvedValue('1.5'),
    ...overrides,
  };
}

/**
 * Create a mock Collection module
 */
export function createMockCollectionModule(overrides: Partial<MockCollectionModule> = {}): MockCollectionModule {
  const mockTx = createMockTxReceipt();

  return {
    createERC721Collection: jest.fn().mockResolvedValue({ collectionAddress: '0x' + '1'.repeat(40), tx: mockTx }),
    createERC1155Collection: jest.fn().mockResolvedValue({ collectionAddress: '0x' + '1'.repeat(40), tx: mockTx }),
    mintNFT: jest.fn().mockResolvedValue({ tokenId: '1', tx: mockTx }),
    batchMint: jest.fn().mockResolvedValue({ tokenIds: ['1', '2', '3'], tx: mockTx }),
    getCollection: jest.fn().mockResolvedValue(createMockCollection()),
    ...overrides,
  };
}

/**
 * Create a complete mock SDK instance
 *
 * @param options - Customization options for the mock
 * @returns Mock SDK instance with all modules
 *
 * @example
 * ```typescript
 * import { createMockSDK } from 'zuno-marketplace-sdk/testing';
 *
 * const mockSdk = createMockSDK({
 *   exchange: {
 *     listNFT: jest.fn().mockRejectedValue(new Error('Network error')),
 *   },
 * });
 *
 * // Use in tests
 * expect(mockSdk.exchange.listNFT).toHaveBeenCalled();
 * ```
 */
export function createMockSDK(options: CreateMockSDKOptions = {}): MockZunoSDK {
  const mockLogger = createMockLogger();

  return {
    exchange: createMockExchangeModule(options.exchange),
    auction: createMockAuctionModule(options.auction),
    collection: createMockCollectionModule(options.collection),
    logger: options.logger ? { ...mockLogger, ...options.logger } : mockLogger,
    getConfig: jest.fn().mockReturnValue({
      apiKey: options.config?.apiKey || 'test-api-key',
      network: options.config?.network || 'sepolia',
      debug: options.config?.debug || false,
    }),
    getProvider: jest.fn().mockReturnValue(undefined),
    getSigner: jest.fn().mockReturnValue(undefined),
    getQueryClient: jest.fn().mockReturnValue(null),
    updateProvider: jest.fn(),
    prefetchABIs: jest.fn().mockResolvedValue(undefined),
    clearCache: jest.fn().mockResolvedValue(undefined),
  };
}

// ============================================
// REACT TESTING UTILITIES
// ============================================

/**
 * Create a mock QueryClient for testing
 */
export function createMockQueryClient(): QueryClient {
  // Dynamic import to avoid bundling React Query in non-React environments
  const { QueryClient } = require('@tanstack/react-query');

  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Props for MockZunoProvider component
 */
export interface MockZunoProviderProps {
  children: React.ReactNode;
  sdk?: MockZunoSDK;
  queryClient?: QueryClient;
}

/**
 * Create a mock ZunoProvider for testing React components
 * Returns a component that wraps children with mocked context
 *
 * @example
 * ```typescript
 * import { createMockZunoProvider, createMockSDK } from 'zuno-marketplace-sdk/testing';
 * import { render } from '@testing-library/react';
 *
 * const MockProvider = createMockZunoProvider();
 * const mockSdk = createMockSDK();
 *
 * render(
 *   <MockProvider sdk={mockSdk}>
 *     <YourComponent />
 *   </MockProvider>
 * );
 * ```
 */
export function createMockZunoProvider() {
  // This returns a factory function to avoid React import issues
  return function MockZunoProvider({ children, sdk, queryClient }: MockZunoProviderProps) {
    const React = require('react');
    const { QueryClientProvider } = require('@tanstack/react-query');

    const mockSdk = sdk || createMockSDK();
    const mockQueryClient = queryClient || createMockQueryClient();

    // Create a mock context value
    const contextValue = {
      sdk: mockSdk,
      queryClient: mockQueryClient,
      isInitialized: true,
    };

    // We need to create a context that matches ZunoContext
    const MockContext = React.createContext(contextValue);

    return React.createElement(
      QueryClientProvider,
      { client: mockQueryClient },
      React.createElement(
        MockContext.Provider,
        { value: contextValue },
        children
      )
    );
  };
}

// ============================================
// TEST UTILITIES
// ============================================

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Create a deferred promise for testing async operations
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
} {
  let resolve: (value: T) => void;
  let reject: (error: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve: resolve!, reject: reject! };
}

/**
 * Mock Ethereum address generator
 */
export function generateMockAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

/**
 * Mock token ID generator
 */
export function generateMockTokenId(): string {
  return String(Math.floor(Math.random() * 1000000));
}

/**
 * Assert that a function throws a ZunoSDKError with specific code
 */
export async function expectZunoError(
  fn: () => Promise<any>,
  expectedCode: string
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error: any) {
    if (error.code !== expectedCode) {
      throw new Error(`Expected error code "${expectedCode}" but got "${error.code}"`);
    }
  }
}
