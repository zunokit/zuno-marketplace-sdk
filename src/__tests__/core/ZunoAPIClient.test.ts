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

function createFetchResponse(
  data: unknown,
  init: { ok?: boolean; status?: number; contentType?: string } = {}
): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    headers: {
      get: jest.fn(() => init.contentType ?? 'application/json'),
    },
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(typeof data === 'string' ? data : JSON.stringify(data)),
  } as unknown as Response;
}

describe('ZunoAPIClient', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockReset();
  });

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

  describe('query option helpers', () => {
    it('should create ABI query options with correct structure', () => {
      const client = new ZunoAPIClient('test-key');
      const options = abiQueryOptions(client, 'TestContract', 'sepolia');

      expect(options.queryKey).toEqual(['abis', 'detail', 'TestContract', 'sepolia']);
      expect(typeof options.queryFn).toBe('function');
      expect(options.staleTime).toBeDefined();
      expect(options.gcTime).toBeDefined();
      expect(options.retry).toBe(3);
    });

    it('should create query options for ABI by ID', () => {
      const client = new ZunoAPIClient('test-key');
      const options = abiByIdQueryOptions(client, 'abi-123');

      expect(options.queryKey).toEqual(['abis', 'detail', 'byId', 'abi-123']);
      expect(typeof options.queryFn).toBe('function');
    });

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

    it('should create query options for networks', () => {
      const client = new ZunoAPIClient('test-key');
      const options = networksQueryOptions(client);

      expect(options.queryKey).toEqual(['networks']);
      expect(typeof options.queryFn).toBe('function');
    });
  });

  describe('methods', () => {
    let client: ZunoAPIClient;

    beforeEach(() => {
      client = new ZunoAPIClient('test-api-key', 'https://api.test.com');
    });

    it('should fetch ABI for contract', async () => {
      mockFetch
        .mockResolvedValueOnce(createFetchResponse({
          data: {
            contracts: [{ abiId: 'abi-123' }],
          },
        }))
        .mockResolvedValueOnce(createFetchResponse({
          data: { id: 'abi-123', abi: [] },
        }));

      const result = await client.getABI('TestContract', 'sepolia');
      expect(result).toBeDefined();
      expect(result.abi).toEqual([]);
    });

    it('should throw error if contract not found', async () => {
      mockFetch.mockResolvedValueOnce(createFetchResponse({
        data: {
          contracts: [],
        },
      }));

      await expect(client.getABI('NonExistent', 'sepolia')).rejects.toThrow(ZunoSDKError);
    });

    it('should resolve named networks to chain IDs', async () => {
      mockFetch
        .mockResolvedValueOnce(createFetchResponse({
          data: {
            contracts: [{ abiId: 'abi-123' }],
          },
        }))
        .mockResolvedValueOnce(createFetchResponse({
          data: { id: 'abi-123', abi: [] },
        }));

      await client.getABI('TestContract', 'ethereum');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/contracts/by-name/TestContract?chainId=1',
        expect.any(Object)
      );
    });

    it('should accept numeric chain IDs', async () => {
      mockFetch
        .mockResolvedValueOnce(createFetchResponse({
          data: {
            contracts: [{ abiId: 'abi-123' }],
          },
        }))
        .mockResolvedValueOnce(createFetchResponse({
          data: { id: 'abi-123', abi: [] },
        }));

      await client.getABI('TestContract', '137');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/contracts/by-name/TestContract?chainId=137',
        expect.any(Object)
      );
    });

    it('should fetch contract by name', async () => {
      const mockContract = {
        address: '0x1234567890123456789012345678901234567890',
        name: 'TestContract',
      };

      mockFetch.mockResolvedValueOnce(createFetchResponse({
        data: {
          contracts: [mockContract],
        },
      }));

      const result = await client.getContractByName('TestContract', 'sepolia');
      expect(result).toEqual(mockContract);
    });

    it('should fetch ABI by ID', async () => {
      const mockAbi = { id: 'abi-123', abi: [] };
      mockFetch.mockResolvedValueOnce(createFetchResponse({
        data: mockAbi,
      }));

      const result = await client.getABIById('abi-123');
      expect(result).toEqual(mockAbi);
    });

    it('should fetch contract info by address', async () => {
      const mockContract = {
        address: '0x1234567890123456789012345678901234567890',
        name: 'TestContract',
      };

      mockFetch.mockResolvedValueOnce(createFetchResponse({
        data: mockContract,
      }));

      const result = await client.getContractInfo(
        '0x1234567890123456789012345678901234567890',
        'sepolia'
      );
      expect(result).toEqual(mockContract);
    });

    it('should fetch available networks', async () => {
      const mockNetworks = [
        { id: 1, name: 'ethereum' },
        { id: 11155111, name: 'sepolia' },
      ];

      mockFetch.mockResolvedValueOnce(createFetchResponse({
        data: mockNetworks,
      }));

      const result = await client.getNetworks();
      expect(result).toEqual(mockNetworks);
    });
  });
});
