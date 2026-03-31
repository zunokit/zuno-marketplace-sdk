/**
 * ZunoAPIClient Unit Tests
 */

import { ZunoAPIClient } from '../../../src/core/ZunoAPIClient';
import { abiQueryOptions, contractInfoQueryOptions } from '../../../src/lib/query/abi';
import { ZunoSDKError } from '../../../src/utils/errors';

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
  let client: ZunoAPIClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockReset();
    client = new ZunoAPIClient('test-api-key', 'https://api.test.com');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with valid config', () => {
      expect(client).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
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

      mockFetch.mockResolvedValueOnce(createFetchResponse({
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
      }));

      mockFetch.mockResolvedValueOnce(createFetchResponse({
        success: true,
        data: mockAbiEntity,
        timestamp: Date.now(),
      }));

      const result = await client.getABI('ERC721', 'sepolia');

      expect(result).toEqual(mockAbiEntity);
      expect(result.abi).toEqual(mockABI);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://api.test.com/contracts/by-name/ERC721?chainId=11155111',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: expect.objectContaining({
            'X-API-Key': 'test-api-key',
          }),
        })
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.test.com/abis/abi-123',
        expect.any(Object)
      );
    });

    it('should throw error on failed fetch', async () => {
      mockFetch.mockResolvedValueOnce(createFetchResponse({
        success: false,
        message: 'Resource not found',
        timestamp: Date.now(),
      }, {
        ok: false,
        status: 404,
      }));

      await expect(client.getABI('InvalidContract', 'sepolia')).rejects.toThrow(
        ZunoSDKError
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

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

      mockFetch.mockResolvedValueOnce(createFetchResponse({
        success: true,
        data: mockContractEntity,
        timestamp: Date.now(),
      }));

      const info = await client.getContractInfo(
        '0x1234567890123456789012345678901234567890',
        'sepolia'
      );

      expect(info).toEqual(mockContractEntity);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/contracts/0x1234567890123456789012345678901234567890?chainId=11155111',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should throw error on invalid contract type', async () => {
      mockFetch.mockResolvedValueOnce(createFetchResponse({
        success: false,
        message: 'Bad Request',
        timestamp: Date.now(),
      }, {
        ok: false,
        status: 400,
      }));

      await expect(
        client.getContractInfo('0xinvalid', 'sepolia')
      ).rejects.toThrow();
    });
  });

  describe('query options methods', () => {
    it('should create ABI query options', () => {
      const options = abiQueryOptions(client, 'ERC721', 'mainnet');

      expect(options).toHaveProperty('queryKey');
      expect(options).toHaveProperty('queryFn');
      expect(options.queryKey).toContain('abis');
      expect(options.queryKey).toContain('ERC721');
      expect(options.queryKey).toContain('mainnet');
    });

    it('should create contract info query options', () => {
      const options = contractInfoQueryOptions(client, '0x123', 'polygon');

      expect(options).toHaveProperty('queryKey');
      expect(options).toHaveProperty('queryFn');
      expect(options.queryKey).toContain('contracts');
      expect(options.queryKey).toContain('0x123');
    });
  });

  describe('error handling', () => {
    it('should include error context in exceptions', async () => {
      mockFetch.mockResolvedValueOnce(createFetchResponse({
        error: { message: 'Database connection failed' },
        timestamp: Date.now(),
      }, {
        ok: false,
        status: 500,
      }));

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
      mockFetch.mockRejectedValueOnce(new SyntaxError('Unexpected token'));

      await expect(client.getABI('ERC721', 'sepolia')).rejects.toThrow();
    });
  });
});
