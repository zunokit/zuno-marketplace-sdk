/**
 * ZunoAPIClient Tests
 */

import {
  ZunoAPIClient,
  SUPPORTED_NETWORKS,
  getSupportedNetworkNames,
  isSupportedNetwork,
} from '../../core/ZunoAPIClient';
import {
  abiQueryOptions,
  abiByIdQueryOptions,
  contractInfoQueryOptions,
  networksQueryOptions,
} from '../../lib/query/abi';
import { ZunoSDKError } from '../../utils/errors';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    interceptors: {
      response: {
        use: jest.fn(),
      },
    },
  })),
}));

describe('ZunoAPIClient', () => {
  describe('constructor', () => {
    it('should throw error without API key', () => {
      expect(() => new ZunoAPIClient('')).toThrow(ZunoSDKError);
      expect(() => new ZunoAPIClient('')).toThrow('API key is required');
    });

    it('should create client with valid API key', () => {
      const client = new ZunoAPIClient('test-api-key');
      expect(client).toBeDefined();
    });

    it('should accept custom API URL', () => {
      const client = new ZunoAPIClient('test-key', 'https://custom-api.example.com');
      expect(client).toBeDefined();
    });
  });

  describe('SUPPORTED_NETWORKS', () => {
    it('should have correct network chain IDs', () => {
      expect(SUPPORTED_NETWORKS.ethereum).toBe(1);
      expect(SUPPORTED_NETWORKS.sepolia).toBe(11155111);
      expect(SUPPORTED_NETWORKS.anvil).toBe(31337);
    });
  });

  describe('getSupportedNetworkNames', () => {
    it('should return array of network names', () => {
      const names = getSupportedNetworkNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names).toContain('ethereum');
      expect(names).toContain('sepolia');
      expect(names).toContain('anvil');
    });
  });

  describe('isSupportedNetwork', () => {
    it('should return true for supported networks', () => {
      expect(isSupportedNetwork('ethereum')).toBe(true);
      expect(isSupportedNetwork('sepolia')).toBe(true);
      expect(isSupportedNetwork('anvil')).toBe(true);
    });

    it('should return false for unsupported networks', () => {
      expect(isSupportedNetwork('invalid')).toBe(false);
      expect(isSupportedNetwork('unknown')).toBe(false);
      expect(isSupportedNetwork('')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isSupportedNetwork('ETHEREUM')).toBe(true);
      expect(isSupportedNetwork('Sepolia')).toBe(true);
    });
  });


  describe('abiQueryOptions', () => {
    it('should create query options with correct structure', () => {
      const client = new ZunoAPIClient('test-key');
      const options = abiQueryOptions(client, 'TestContract', 'sepolia');

      expect(options.queryKey).toEqual(['abis', 'detail', 'TestContract', 'sepolia']);
      expect(typeof options.queryFn).toBe('function');
      expect(options.staleTime).toBeDefined();
      expect(options.gcTime).toBeDefined();
      expect(options.retry).toBe(3);
    });

    it('should use custom cache config when provided', () => {
      const client = new ZunoAPIClient('test-key');
      const options = abiQueryOptions(client, 'TestContract', 'sepolia', {
        ttl: 60000,
        gcTime: 120000,
      });

      expect(options.staleTime).toBe(60000);
      expect(options.gcTime).toBe(120000);
    });

    it('should have exponential backoff for retry delay', () => {
      const client = new ZunoAPIClient('test-key');
      const options = abiQueryOptions(client, 'TestContract', 'sepolia');
      const mockError = new Error('test');

      expect(typeof options.retryDelay).toBe('function');
      if (typeof options.retryDelay === 'function') {
        expect(options.retryDelay(0, mockError)).toBe(1000);
        expect(options.retryDelay(1, mockError)).toBe(2000);
        expect(options.retryDelay(2, mockError)).toBe(4000);
        expect(options.retryDelay(10, mockError)).toBeLessThanOrEqual(30000);
      }
    });
  });

  describe('abiByIdQueryOptions', () => {
    it('should create query options for ABI by ID', () => {
      const client = new ZunoAPIClient('test-key');
      const options = abiByIdQueryOptions(client, 'abi-123');

      expect(options.queryKey).toEqual(['abis', 'detail', 'byId', 'abi-123']);
      expect(typeof options.queryFn).toBe('function');
    });
  });

  describe('contractInfoQueryOptions', () => {
    it('should create query options for contract info', () => {
      const client = new ZunoAPIClient('test-key');
      const options = contractInfoQueryOptions(
        client,
        '0x1234567890123456789012345678901234567890',
        'sepolia'
      );

      expect(options.queryKey).toEqual([
        'contracts',
        '0x1234567890123456789012345678901234567890',
        'sepolia',
      ]);
      expect(typeof options.queryFn).toBe('function');
    });
  });

  describe('networksQueryOptions', () => {
    it('should create query options for networks', () => {
      const client = new ZunoAPIClient('test-key');
      const options = networksQueryOptions(client);

      expect(options.queryKey).toEqual(['networks']);
      expect(typeof options.queryFn).toBe('function');
    });

    it('should use extended cache times for networks', () => {
      const client = new ZunoAPIClient('test-key');
      const abiOptions = abiQueryOptions(client, 'Test', 'sepolia');
      const networkOptions = networksQueryOptions(client);

      expect(typeof networkOptions.staleTime).toBe('number');
      expect(typeof abiOptions.staleTime).toBe('number');
      if (typeof networkOptions.staleTime === 'number' && typeof abiOptions.staleTime === 'number') {
        expect(networkOptions.staleTime).toBeGreaterThan(abiOptions.staleTime);
      }
    });
  });
});

describe('ZunoAPIClient methods', () => {
  let client: ZunoAPIClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const axios = require('axios');
    mockAxiosInstance = {
      get: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn(),
        },
      },
    };
    axios.create.mockReturnValue(mockAxiosInstance);
    client = new ZunoAPIClient('test-api-key');
  });

  describe('getABI', () => {
    it('should fetch ABI for contract', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: {
            data: {
              contracts: [{ abiId: 'abi-123' }],
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            data: { id: 'abi-123', abi: [] },
          },
        });

      const result = await client.getABI('TestContract', 'sepolia');
      expect(result).toBeDefined();
      expect(result.abi).toEqual([]);
    });

    it('should throw error if contract not found', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            contracts: [],
          },
        },
      });

      await expect(client.getABI('NonExistent', 'sepolia')).rejects.toThrow(ZunoSDKError);
    });

    it('should resolve named networks to chain IDs', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: {
            data: {
              contracts: [{ abiId: 'abi-123' }],
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            data: { id: 'abi-123', abi: [] },
          },
        });

      await client.getABI('TestContract', 'ethereum');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/contracts/by-name/TestContract',
        { params: { chainId: 1 } }
      );
    });

    it('should accept numeric chain IDs', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: {
            data: {
              contracts: [{ abiId: 'abi-123' }],
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            data: { id: 'abi-123', abi: [] },
          },
        });

      await client.getABI('TestContract', '137');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/contracts/by-name/TestContract',
        { params: { chainId: 137 } }
      );
    });
  });

  describe('getContractByName', () => {
    it('should fetch contract by name', async () => {
      const mockContract = {
        address: '0x1234567890123456789012345678901234567890',
        name: 'TestContract',
      };

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            contracts: [mockContract],
          },
        },
      });

      const result = await client.getContractByName('TestContract', 'sepolia');
      expect(result).toEqual(mockContract);
    });

    it('should throw error if contract not found', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            contracts: [],
          },
        },
      });

      await expect(client.getContractByName('NonExistent', 'sepolia')).rejects.toThrow(
        ZunoSDKError
      );
    });
  });

  describe('getABIById', () => {
    it('should fetch ABI by ID', async () => {
      const mockAbi = { id: 'abi-123', abi: [] };
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: mockAbi },
      });

      const result = await client.getABIById('abi-123');
      expect(result).toEqual(mockAbi);
    });
  });

  describe('getContractInfo', () => {
    it('should fetch contract info by address', async () => {
      const mockContract = {
        address: '0x1234567890123456789012345678901234567890',
        name: 'TestContract',
      };

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: mockContract },
      });

      const result = await client.getContractInfo(
        '0x1234567890123456789012345678901234567890',
        'sepolia'
      );
      expect(result).toEqual(mockContract);
    });
  });

  describe('getNetworks', () => {
    it('should fetch available networks', async () => {
      const mockNetworks = [
        { id: 1, name: 'ethereum' },
        { id: 11155111, name: 'sepolia' },
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: mockNetworks },
      });

      const result = await client.getNetworks();
      expect(result).toEqual(mockNetworks);
    });
  });
});
