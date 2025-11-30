/**
 * ZunoAPIClient Unit Tests
 */

import axios from 'axios';
import { ZunoAPIClient, createABIQueryOptions, createContractInfoQueryOptions } from '../../../src/core/ZunoAPIClient';
import { ZunoSDKError } from '../../../src/utils/errors';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ZunoAPIClient', () => {
  let client: ZunoAPIClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    client = new ZunoAPIClient('test-api-key', 'https://api.test.com');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with valid config', () => {
      expect(client).toBeDefined();
      expect(mockedAxios.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error without API key', () => {
      expect(() => {
        new ZunoAPIClient('');
      }).toThrow(ZunoSDKError);
    });

    it('should use default base URL when not provided', () => {
      const defaultClient = new ZunoAPIClient('test-key');
      expect(defaultClient).toBeDefined();
    });
  });

  describe('getABI', () => {
    it('should fetch ABI successfully', async () => {
      const mockABI = [{ type: 'function', name: 'mint' }];
      const mockAbiEntity = {
        id: 'abi-123',
        contractName: 'ERC721',
        abi: mockABI,
        version: '1.0.0',
        networkId: 'sepolia',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock first call: get contract by name
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            contracts: [
              {
                id: 'contract-123',
                name: 'ERC721',
                abiId: 'abi-123',
                chainId: 11155111,
              },
            ],
          },
          timestamp: Date.now(),
        },
      });

      // Mock second call: get ABI by ID
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockAbiEntity,
          timestamp: Date.now(),
        },
      });

      const result = await client.getABI('ERC721', 'sepolia');

      expect(result).toEqual(mockAbiEntity);
      expect(result.abi).toEqual(mockABI);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
      expect(mockAxiosInstance.get).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('/contracts/by-name/ERC721'),
        expect.objectContaining({
          params: { chainId: 11155111 },
        })
      );
      expect(mockAxiosInstance.get).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('/abis/abi-123')
      );
    });

    it('should throw error on failed fetch', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: {
          status: 404,
          statusText: 'Not Found',
        },
        isAxiosError: true,
      });

      await expect(client.getABI('InvalidContract', 'sepolia')).rejects.toThrow(
        ZunoSDKError
      );
    });

    it('should handle network errors', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getABI('ERC721', 'sepolia')).rejects.toThrow();
    });
  });

  describe('getContractInfo', () => {
    it('should fetch contract info successfully', async () => {
      const mockContractEntity = {
        address: '0x1234567890123456789012345678901234567890',
        abi: [],
        networkId: 'sepolia',
        contractType: 'Exchange' as const,
        deploymentBlock: 123456,
        deployer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockContractEntity,
          timestamp: Date.now(),
        },
      });

      const info = await client.getContractInfo('0x1234567890123456789012345678901234567890', 'sepolia');

      expect(info).toEqual(mockContractEntity);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        expect.stringContaining('/contracts/0x1234567890123456789012345678901234567890'),
        expect.objectContaining({
          params: { chainId: 11155111 }, // Sepolia chainId
        })
      );
    });

    it('should throw error on invalid contract type', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: {
          status: 400,
          statusText: 'Bad Request',
        },
        isAxiosError: true,
      });

      await expect(
        client.getContractInfo('0xinvalid', 'sepolia')
      ).rejects.toThrow();
    });
  });

  describe('query factory methods', () => {
    it('should create ABI query options', () => {
      const options = createABIQueryOptions(client, 'ERC721', 'mainnet');

      expect(options).toHaveProperty('queryKey');
      expect(options).toHaveProperty('queryFn');
      expect(options.queryKey).toContain('abis');
      expect(options.queryKey).toContain('ERC721');
      expect(options.queryKey).toContain('mainnet');
    });

    it('should create contract info query options', () => {
      const options = createContractInfoQueryOptions(client, '0x123', 'polygon');

      expect(options).toHaveProperty('queryKey');
      expect(options).toHaveProperty('queryFn');
      expect(options.queryKey).toContain('contracts');
      expect(options.queryKey).toContain('0x123');
    });
  });

  describe('error handling', () => {
    it('should include error context in exceptions', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { error: 'Database connection failed' },
        },
        isAxiosError: true,
      });

      try {
        await client.getABI('ERC721', 'sepolia');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ZunoSDKError);
        if (error instanceof ZunoSDKError) {
          expect(error.code).toBeDefined();
        }
      }
    });

    it('should handle malformed JSON responses', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new SyntaxError('Unexpected token'));

      await expect(client.getABI('ERC721', 'sepolia')).rejects.toThrow();
    });
  });
});
