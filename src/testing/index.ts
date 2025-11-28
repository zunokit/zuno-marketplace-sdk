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

/**
 * Generic mock function type that works with or without Jest
 */
export type MockFn<T extends (...args: any[]) => any = (...args: any[]) => any> = T & {
  mockResolvedValue: (value: ReturnType<T> extends Promise<infer U> ? U : ReturnType<T>) => MockFn<T>;
  mockRejectedValue: (error: Error) => MockFn<T>;
  mockReturnValue: (value: ReturnType<T>) => MockFn<T>;
  mockImplementation: (impl: T) => MockFn<T>;
  mockClear: () => void;
  mockReset: () => void;
  calls: Parameters<T>[];
};

export interface MockTransactionReceipt {
  hash: string;
  blockNumber: number;
  blockHash: string;
  status: 1 | 0;
  gasUsed: bigint;
  logs: unknown[];
}

export interface MockExchangeModule {
  listNFT: MockFn;
  buyNFT: MockFn;
  cancelListing: MockFn;
  getListing: MockFn;
  getListings: MockFn;
}

export interface MockAuctionModule {
  createEnglishAuction: MockFn;
  createDutchAuction: MockFn;
  placeBid: MockFn;
  settleAuction: MockFn;
  cancelAuction: MockFn;
  getAuction: MockFn;
  getCurrentPrice: MockFn;
}

export interface MockCollectionModule {
  createERC721Collection: MockFn;
  createERC1155Collection: MockFn;
  mintNFT: MockFn;
  batchMint: MockFn;
  getCollection: MockFn;
}

export interface MockZunoSDK {
  exchange: MockExchangeModule;
  auction: MockAuctionModule;
  collection: MockCollectionModule;
  logger: Logger;
  getConfig: MockFn;
  getProvider: MockFn;
  getSigner: MockFn;
  getQueryClient: MockFn;
  updateProvider: MockFn;
  prefetchABIs: MockFn;
  clearCache: MockFn;
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

/**
 * Create a mock function (works with or without Jest)
 */
function createMockFn<T = unknown>(defaultReturnValue?: T): MockFn {
  const calls: unknown[][] = [];
  let returnValue: unknown = defaultReturnValue;
  let resolvedValue: unknown = undefined;
  let rejectedValue: Error | undefined = undefined;
  let implementation: ((...args: unknown[]) => unknown) | undefined = undefined;

  const mockFn = ((...args: unknown[]) => {
    calls.push(args);
    if (implementation) {
      return implementation(...args);
    }
    if (rejectedValue !== undefined) {
      return Promise.reject(rejectedValue);
    }
    if (resolvedValue !== undefined) {
      return Promise.resolve(resolvedValue);
    }
    return returnValue;
  }) as MockFn;

  mockFn.calls = calls as Parameters<typeof mockFn>[];
  mockFn.mockResolvedValue = (value: unknown) => {
    resolvedValue = value;
    rejectedValue = undefined;
    return mockFn;
  };
  mockFn.mockRejectedValue = (error: Error) => {
    rejectedValue = error;
    resolvedValue = undefined;
    return mockFn;
  };
  mockFn.mockReturnValue = (value: unknown) => {
    returnValue = value;
    return mockFn;
  };
  mockFn.mockImplementation = (impl: (...args: unknown[]) => unknown) => {
    implementation = impl;
    return mockFn;
  };
  mockFn.mockClear = () => {
    calls.length = 0;
  };
  mockFn.mockReset = () => {
    calls.length = 0;
    returnValue = defaultReturnValue;
    resolvedValue = undefined;
    rejectedValue = undefined;
    implementation = undefined;
  };

  return mockFn;
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
export function createMockLogger(): Logger & { calls: { level: string; message: string; meta?: unknown }[] } {
  const calls: { level: string; message: string; meta?: unknown }[] = [];

  const debugFn = createMockFn();
  debugFn.mockImplementation((message: unknown, meta?: unknown) => {
    calls.push({ level: 'debug', message: message as string, meta });
  });

  const infoFn = createMockFn();
  infoFn.mockImplementation((message: unknown, meta?: unknown) => {
    calls.push({ level: 'info', message: message as string, meta });
  });

  const warnFn = createMockFn();
  warnFn.mockImplementation((message: unknown, meta?: unknown) => {
    calls.push({ level: 'warn', message: message as string, meta });
  });

  const errorFn = createMockFn();
  errorFn.mockImplementation((message: unknown, meta?: unknown) => {
    calls.push({ level: 'error', message: message as string, meta });
  });

  return {
    calls,
    debug: debugFn as unknown as Logger['debug'],
    info: infoFn as unknown as Logger['info'],
    warn: warnFn as unknown as Logger['warn'],
    error: errorFn as unknown as Logger['error'],
  };
}

/**
 * Create a mock Exchange module
 */
export function createMockExchangeModule(overrides: Partial<MockExchangeModule> = {}): MockExchangeModule {
  const mockTx = createMockTxReceipt();

  return {
    listNFT: createMockFn().mockResolvedValue({ listingId: '1', tx: mockTx }),
    buyNFT: createMockFn().mockResolvedValue({ tx: mockTx }),
    cancelListing: createMockFn().mockResolvedValue({ tx: mockTx }),
    getListing: createMockFn().mockResolvedValue(createMockListing()),
    getListings: createMockFn().mockResolvedValue([createMockListing()]),
    ...overrides,
  };
}

/**
 * Create a mock Auction module
 */
export function createMockAuctionModule(overrides: Partial<MockAuctionModule> = {}): MockAuctionModule {
  const mockTx = createMockTxReceipt();

  return {
    createEnglishAuction: createMockFn().mockResolvedValue({ auctionId: '1', tx: mockTx }),
    createDutchAuction: createMockFn().mockResolvedValue({ auctionId: '1', tx: mockTx }),
    placeBid: createMockFn().mockResolvedValue({ tx: mockTx }),
    settleAuction: createMockFn().mockResolvedValue({ tx: mockTx }),
    cancelAuction: createMockFn().mockResolvedValue({ tx: mockTx }),
    getAuction: createMockFn().mockResolvedValue(createMockAuction()),
    getCurrentPrice: createMockFn().mockResolvedValue('1.5'),
    ...overrides,
  };
}

/**
 * Create a mock Collection module
 */
export function createMockCollectionModule(overrides: Partial<MockCollectionModule> = {}): MockCollectionModule {
  const mockTx = createMockTxReceipt();

  return {
    createERC721Collection: createMockFn().mockResolvedValue({ collectionAddress: '0x' + '1'.repeat(40), tx: mockTx }),
    createERC1155Collection: createMockFn().mockResolvedValue({ collectionAddress: '0x' + '1'.repeat(40), tx: mockTx }),
    mintNFT: createMockFn().mockResolvedValue({ tokenId: '1', tx: mockTx }),
    batchMint: createMockFn().mockResolvedValue({ tokenIds: ['1', '2', '3'], tx: mockTx }),
    getCollection: createMockFn().mockResolvedValue(createMockCollection()),
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
    getConfig: createMockFn().mockReturnValue({
      apiKey: options.config?.apiKey || 'test-api-key',
      network: options.config?.network || 'sepolia',
      debug: options.config?.debug || false,
    }),
    getProvider: createMockFn().mockReturnValue(undefined),
    getSigner: createMockFn().mockReturnValue(undefined),
    getQueryClient: createMockFn().mockReturnValue(null),
    updateProvider: createMockFn(),
    prefetchABIs: createMockFn().mockResolvedValue(undefined),
    clearCache: createMockFn().mockResolvedValue(undefined),
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
