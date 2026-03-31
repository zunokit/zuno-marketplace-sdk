/**
 * ContractRegistry Unit Tests
 */

import { QueryClient } from '@tanstack/react-query';
import { ContractRegistry } from '../../../src/core/ContractRegistry';
import { ZunoAPIClient } from '../../../src/core/ZunoAPIClient';
import { ZunoSDKError } from '../../../src/utils/errors';
import { ethers } from 'ethers';

function createFetchResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: {
      get: jest.fn(() => 'application/json'),
    },
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  } as unknown as Response;
}

describe('ContractRegistry', () => {
  let registry: ContractRegistry;
  let apiClient: ZunoAPIClient;
  let queryClient: QueryClient;
  let mockProvider: ethers.Provider;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockReset();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    apiClient = new ZunoAPIClient('test-api-key');
    registry = new ContractRegistry(apiClient, queryClient);
    mockProvider = new ethers.JsonRpcProvider('http://localhost:8545');
  });

  afterEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
  });

  describe('getContract', () => {
    const mockABI = [
      {
        type: 'function',
        name: 'mint',
        inputs: [{ name: 'to', type: 'address' }],
        outputs: [],
      },
    ];

    const mockAbiEntity = {
      id: 'abi-123',
      contractName: 'ERC721NFTExchange',
      abi: mockABI,
      version: '1.0.0',
      networkId: 'sepolia',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockContractResponse = {
      success: true,
      data: {
        contracts: [
          {
            id: 'contract-123',
            name: 'ERC721NFTExchange',
            abiId: 'abi-123',
            chainId: 11155111,
            address: '0x1234567890123456789012345678901234567890',
          },
        ],
      },
      timestamp: Date.now(),
    };

    it('should create and cache contract instance', async () => {
      mockFetch
        .mockResolvedValueOnce(createFetchResponse(mockContractResponse))
        .mockResolvedValueOnce(createFetchResponse({
          success: true,
          data: mockAbiEntity,
          timestamp: Date.now(),
        }))
        .mockResolvedValueOnce(createFetchResponse(mockContractResponse));

      const contract = await registry.getContract(
        'ERC721NFTExchange',
        'sepolia',
        mockProvider
      );

      expect(contract).toBeDefined();
      expect(contract).toBeInstanceOf(ethers.Contract);
    });

    it('should return cached contract on subsequent calls', async () => {
      mockFetch
        .mockResolvedValueOnce(createFetchResponse(mockContractResponse))
        .mockResolvedValueOnce(createFetchResponse({
          success: true,
          data: mockAbiEntity,
          timestamp: Date.now(),
        }))
        .mockResolvedValueOnce(createFetchResponse(mockContractResponse));

      const contract1 = await registry.getContract(
        'ERC721NFTExchange',
        'sepolia',
        mockProvider
      );
      const contract2 = await registry.getContract(
        'ERC721NFTExchange',
        'sepolia',
        mockProvider
      );

      expect(contract1).toBe(contract2);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should use provided address instead of fetching', async () => {
      const customAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

      mockFetch
        .mockResolvedValueOnce(createFetchResponse(mockContractResponse))
        .mockResolvedValueOnce(createFetchResponse({
          success: true,
          data: mockAbiEntity,
          timestamp: Date.now(),
        }));

      const contract = await registry.getContract(
        'ERC721NFTExchange',
        'sepolia',
        mockProvider,
        customAddress
      );

      expect(contract).toBeDefined();
      expect(contract.target).toBe(customAddress);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid ABI', async () => {
      mockFetch
        .mockResolvedValueOnce(createFetchResponse(mockContractResponse))
        .mockResolvedValueOnce(createFetchResponse({
          success: true,
          data: {
            ...mockAbiEntity,
            abi: null,
          },
          timestamp: Date.now(),
        }));

      await expect(
        registry.getContract('ERC721NFTExchange', 'sepolia', mockProvider)
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should throw error for invalid address', async () => {
      mockFetch
        .mockResolvedValueOnce(createFetchResponse(mockContractResponse))
        .mockResolvedValueOnce(createFetchResponse({
          success: true,
          data: mockAbiEntity,
          timestamp: Date.now(),
        }));

      await expect(
        registry.getContract('ERC721NFTExchange', 'sepolia', mockProvider, 'invalid-address')
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should connect contract to signer when provided', async () => {
      const mockSigner = new ethers.Wallet(
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        mockProvider
      );

      mockFetch
        .mockResolvedValueOnce(createFetchResponse(mockContractResponse))
        .mockResolvedValueOnce(createFetchResponse({
          success: true,
          data: mockAbiEntity,
          timestamp: Date.now(),
        }))
        .mockResolvedValueOnce(createFetchResponse(mockContractResponse));

      const contract = await registry.getContract(
        'ERC721NFTExchange',
        'sepolia',
        mockProvider,
        undefined,
        mockSigner
      );

      expect(contract).toBeDefined();
      expect(contract.runner).toBe(mockSigner);
    });
  });

  describe('prefetchABIs', () => {
    it('should prefetch multiple ABIs', async () => {
      const mockABI = [{ type: 'function', name: 'test' }];
      const mockAbiEntity = {
        id: 'abi-123',
        contractName: 'ERC721NFTExchange',
        abi: mockABI,
        version: '1.0.0',
        networkId: 'sepolia',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      jest.spyOn(apiClient, 'getABI')
        .mockResolvedValueOnce(mockAbiEntity)
        .mockResolvedValueOnce({ ...mockAbiEntity, contractName: 'ERC1155NFTExchange' });

      await registry.prefetchABIs(['ERC721NFTExchange', 'ERC1155NFTExchange'], 'sepolia');

      expect(apiClient.getABI).toHaveBeenCalledTimes(2);
      expect(apiClient.getABI).toHaveBeenCalledWith('ERC721NFTExchange', 'sepolia');
      expect(apiClient.getABI).toHaveBeenCalledWith('ERC1155NFTExchange', 'sepolia');
    }, 10000);
  });

  describe('clearCache', () => {
    it('should clear contract cache', async () => {
      await registry.clearCache();
      expect(registry['contractCache'].size).toBe(0);

      registry.clearContractCache();
      expect(registry['contractCache'].size).toBe(0);
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });
  });
});
