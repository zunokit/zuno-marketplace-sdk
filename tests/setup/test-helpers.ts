/**
 * Test helpers and common mocks
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create a fresh QueryClient for testing
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

/**
 * Setup fetch mock with proper structure
 */
export function setupFetchMock() {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    headers: {
      get: () => 'application/json',
    },
    json: async () => ({}),
    text: async () => '',
  } as Response);

  return { mockFetch };
}

/**
 * Create mock ABI entity
 */
export function createMockAbiEntity(overrides?: any) {
  const mockABI = [
    {
      type: 'function',
      name: 'mint',
      inputs: [{ name: 'to', type: 'address' }],
      outputs: [],
    },
  ];

  return {
    id: 'abi-123',
    contractName: 'ERC721',
    abi: mockABI,
    version: '1.0.0',
    networkId: 'sepolia',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock contract entity
 */
export function createMockContractEntity(overrides?: any) {
  return {
    address: '0x1234567890123456789012345678901234567890',
    abi: [],
    networkId: 'sepolia',
    contractType: 'Exchange' as const,
    deploymentBlock: 123456,
    deployer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock API response
 */
export function createMockAPIResponse<T>(data: T) {
  return {
    data: {
      success: true,
      data,
      timestamp: Date.now(),
    },
  };
}

/**
 * Mock ethers provider
 */
export function createMockProvider() {
  return {
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1, name: 'homestead' }),
    getBlockNumber: jest.fn().mockResolvedValue(12345678),
    call: jest.fn(),
    estimateGas: jest.fn(),
    getTransactionReceipt: jest.fn(),
    waitForTransaction: jest.fn(),
  };
}

/**
 * Mock ethers signer
 */
export function createMockSigner() {
  return {
    getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
    signMessage: jest.fn(),
    signTransaction: jest.fn(),
    sendTransaction: jest.fn().mockResolvedValue({
      hash: '0xabcdef',
      wait: jest.fn().mockResolvedValue({ status: 1 }),
    }),
  };
}
