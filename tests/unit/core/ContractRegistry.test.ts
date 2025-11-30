/**
 * ContractRegistry Unit Tests
 */

import { QueryClient } from '@tanstack/react-query';
import { ContractRegistry } from '../../../src/core/ContractRegistry';
import { ZunoAPIClient } from '../../../src/core/ZunoAPIClient';
import { ZunoSDKError } from '../../../src/utils/errors';
import { ethers } from 'ethers';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ContractRegistry', () => {
  let registry: ContractRegistry;
  let apiClient: ZunoAPIClient;
  let queryClient: QueryClient;
  let mockProvider: ethers.Provider;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Setup axios mock
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

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

    it('should create and cache contract instance', async () => {
      // Mock 1st call: get contract by name (for getABI) - includes address
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
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
        },
      });

      // Mock 2nd call: get ABI by ID
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockAbiEntity,
          timestamp: Date.now(),
        },
      });

      // Mock 3rd call: get contract by name again (for getContractByName to get address)
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
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
        },
      });

      const contract = await registry.getContract(
        'ERC721NFTExchange',
        'sepolia',
        mockProvider
      );

      expect(contract).toBeDefined();
      expect(contract).toBeInstanceOf(ethers.Contract);
    });

    it('should return cached contract on subsequent calls', async () => {
      // Mock 1st call: get contract by name (for getABI) - includes address
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
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
        },
      });

      // Mock 2nd call: get ABI by ID
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockAbiEntity,
          timestamp: Date.now(),
        },
      });

      // Mock 3rd call: get contract by name again (for getContractByName to get address)
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
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
        },
      });

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
      // Should only call API for first contract creation (3 calls: contracts-by-name, abi-by-id, contract-info)
      // Second call uses cache, so total is 3
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    });

    it('should use provided address instead of fetching', async () => {
      const customAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

      // Mock 1st call: get contract by name (for getABI) - includes address
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
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
        },
      });

      // Mock 2nd call: get ABI by ID
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockAbiEntity,
          timestamp: Date.now(),
        },
      });

      const contract = await registry.getContract(
        'ERC721NFTExchange',
        'sepolia',
        mockProvider,
        customAddress
      );

      expect(contract).toBeDefined();
      expect(contract.target).toBe(customAddress);
      // Should call twice for ABI (contracts-by-name + abi-by-id), but not for contract info
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid ABI', async () => {
      // Mock 1st call: get contract by name - includes address
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
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
        },
      });

      // Mock 2nd call: get ABI by ID (with invalid ABI)
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            ...mockAbiEntity,
            abi: null,
          },
          timestamp: Date.now(),
        },
      });

      await expect(
        registry.getContract('ERC721NFTExchange', 'sepolia', mockProvider)
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should throw error for invalid address', async () => {
      // Mock 1st call: get contract by name - includes address
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
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
        },
      });

      // Mock 2nd call: get ABI by ID
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockAbiEntity,
          timestamp: Date.now(),
        },
      });

      await expect(
        registry.getContract('ERC721NFTExchange', 'sepolia', mockProvider, 'invalid-address')
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should connect contract to signer when provided', async () => {
      const mockSigner = new ethers.Wallet(
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        mockProvider
      );

      // Mock 1st call: get contract by name (for getABI) - includes address
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
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
        },
      });

      // Mock 2nd call: get ABI by ID
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockAbiEntity,
          timestamp: Date.now(),
        },
      });

      // Mock 3rd call: get contract by name again (for getContractByName to get address)
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
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
        },
      });

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

      // Mock the apiClient.getABI directly
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
      // Simply test that clearCache and clearContractCache methods work
      // without throwing errors
      await registry.clearCache();
      expect(registry['contractCache'].size).toBe(0);
      
      registry.clearContractCache();
      expect(registry['contractCache'].size).toBe(0);
      
      // Verify queryClient cache is cleared
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });
  });
});
