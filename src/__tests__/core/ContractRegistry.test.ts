/**
 * ContractRegistry Tests
 */

import { ContractRegistry } from '../../core/ContractRegistry';
import { ZunoSDKError } from '../../utils/errors';
import type { ContractType } from '../../types/contracts';
import { QueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';

// Mock ZunoAPIClient
const mockApiClient = {
  getABI: jest.fn(),
  getABIById: jest.fn(),
  getContractByName: jest.fn(),
  getContractInfo: jest.fn(),
};

// Mock provider and signer
const mockProvider = {
  getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111n }),
} as unknown as ethers.Provider;

const mockSigner = {
  getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
} as unknown as ethers.Signer;

describe('ContractRegistry', () => {
  let registry: ContractRegistry;
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    registry = new ContractRegistry(mockApiClient as any, queryClient);
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('getABI', () => {
    const contractType: ContractType = 'ERC721NFTExchange';

    it('should fetch and return ABI', async () => {
      const mockAbi = [{ name: 'transfer', type: 'function' }];
      queryClient.setQueryData(['abis', 'detail', contractType, 'sepolia'], {
        abi: mockAbi,
      });

      const result = await registry.getABI(contractType, 'sepolia');
      expect(result).toEqual(mockAbi);
    });

    it('should throw error if ABI not found', async () => {
      queryClient.setQueryDefaults(['abis'], {
        queryFn: () => Promise.reject(new Error('Not found')),
      });

      await expect(registry.getABI('ERC1155NFTExchange', 'sepolia')).rejects.toThrow();
    });
  });

  describe('getContract', () => {
    const validAddress = '0x1234567890123456789012345678901234567890';
    const contractType: ContractType = 'ERC721NFTExchange';
    const mockAbi = [
      {
        name: 'transfer',
        type: 'function',
        inputs: [],
        outputs: [],
      },
    ];

    beforeEach(() => {
      mockApiClient.getContractByName.mockResolvedValue({
        address: validAddress,
        name: contractType,
      });
    });

    it('should create contract instance with provider', async () => {
      queryClient.setQueryData(['abis', 'detail', contractType, 'sepolia'], {
        abi: mockAbi,
      });

      const contract = await registry.getContract(
        contractType,
        'sepolia',
        mockProvider,
        validAddress
      );

      expect(contract).toBeDefined();
      expect(contract.target).toBe(validAddress);
    });

    it('should cache contract instances', async () => {
      queryClient.setQueryData(['abis', 'detail', contractType, 'sepolia'], {
        abi: mockAbi,
      });

      const contract1 = await registry.getContract(
        contractType,
        'sepolia',
        mockProvider,
        validAddress
      );
      const contract2 = await registry.getContract(
        contractType,
        'sepolia',
        mockProvider,
        validAddress
      );

      expect(contract1).toBe(contract2);
    });

    it('should connect signer when provided', async () => {
      queryClient.setQueryData(['abis', 'detail', contractType, 'sepolia'], {
        abi: mockAbi,
      });

      const contract = await registry.getContract(
        contractType,
        'sepolia',
        mockProvider,
        validAddress,
        mockSigner
      );

      expect(contract).toBeDefined();
    });

    it('should throw error for invalid ABI', async () => {
      queryClient.setQueryData(['abis', 'detail', contractType, 'sepolia'], {
        abi: 'invalid',
      });

      await expect(
        registry.getContract(contractType, 'sepolia', mockProvider, validAddress)
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should throw error for invalid address', async () => {
      queryClient.setQueryData(['abis', 'detail', contractType, 'sepolia'], {
        abi: mockAbi,
      });

      await expect(
        registry.getContract(contractType, 'sepolia', mockProvider, 'invalid')
      ).rejects.toThrow(ZunoSDKError);
    });

    it('should fetch contract address if not provided', async () => {
      queryClient.setQueryData(['abis', 'detail', contractType, 'sepolia'], {
        abi: mockAbi,
      });

      // Clear cache first to ensure fresh fetch
      registry.clearContractCache();

      const contract = await registry.getContract(
        contractType,
        'sepolia',
        mockProvider
      );

      expect(mockApiClient.getContractByName).toHaveBeenCalledWith(contractType, 'sepolia');
      expect(contract).toBeDefined();
    });
  });

  describe('getABIByAddress', () => {
    const validAddress = '0x1234567890123456789012345678901234567890';

    it('should fetch ABI by contract address', async () => {
      const mockAbi = [{ name: 'transfer', type: 'function' }];
      
      queryClient.setQueryData(['contracts', validAddress, 'sepolia'], {
        abiId: 'abi-123',
      });
      
      mockApiClient.getABIById.mockResolvedValue({ abi: mockAbi });

      const result = await registry.getABIByAddress(validAddress, 'sepolia');
      expect(result).toEqual(mockAbi);
    });

    it('should throw error for invalid address', async () => {
      await expect(registry.getABIByAddress('invalid', 'sepolia')).rejects.toThrow(
        ZunoSDKError
      );
    });
  });

  describe('prefetchABIs', () => {
    it('should prefetch multiple ABIs', async () => {
      const contractTypes = ['Contract1', 'Contract2', 'Contract3'];
      
      // Set up mock data for each contract
      contractTypes.forEach((type) => {
        queryClient.setQueryData(['abis', 'detail', type, 'sepolia'], {
          abi: [],
        });
      });

      await registry.prefetchABIs(contractTypes as any, 'sepolia');
      
      // Check that data is in cache
      contractTypes.forEach((type) => {
        expect(queryClient.getQueryData(['abis', 'detail', type, 'sepolia'])).toBeDefined();
      });
    });
  });

  describe('isABICached', () => {
    it('should return true if ABI is cached', () => {
      queryClient.setQueryData(['abis', 'detail', 'TestContract', 'sepolia'], {
        abi: [],
      });

      expect(registry.isABICached('TestContract' as any, 'sepolia')).toBe(true);
    });

    it('should return false if ABI is not cached', () => {
      expect(registry.isABICached('NonCached' as any, 'sepolia')).toBe(false);
    });
  });

  describe('verifyTokenStandard', () => {
    const validAddress = '0x1234567890123456789012345678901234567890';

    it('should detect ERC721 contracts', async () => {
      const mockContract = {
        supportsInterface: jest.fn()
          .mockResolvedValueOnce(true) // ERC721
          .mockResolvedValueOnce(false), // ERC1155
      };

      jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContract as any);

      const result = await registry.verifyTokenStandard(validAddress, mockProvider);
      expect(result).toBe('ERC721');
    });

    it('should detect ERC1155 contracts', async () => {
      const mockContract = {
        supportsInterface: jest.fn()
          .mockResolvedValueOnce(false) // ERC721
          .mockResolvedValueOnce(true), // ERC1155
      };

      jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContract as any);

      const result = await registry.verifyTokenStandard(validAddress, mockProvider);
      expect(result).toBe('ERC1155');
    });

    it('should return Unknown for non-standard contracts', async () => {
      const mockContract = {
        supportsInterface: jest.fn().mockResolvedValue(false),
      };

      jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContract as any);

      const result = await registry.verifyTokenStandard(validAddress, mockProvider);
      expect(result).toBe('Unknown');
    });

    it('should throw error for invalid address', async () => {
      await expect(
        registry.verifyTokenStandard('invalid', mockProvider)
      ).rejects.toThrow(ZunoSDKError);
    });
  });

  describe('cache management', () => {
    it('should clear all caches', async () => {
      queryClient.setQueryData(['abis', 'detail', 'Test', 'sepolia'], { abi: [] });

      await registry.clearCache();

      expect(queryClient.getQueryData(['abis', 'detail', 'Test', 'sepolia'])).toBeUndefined();
    });

    it('should clear only contract cache', () => {
      queryClient.setQueryData(['abis', 'detail', 'Test', 'sepolia'], { abi: [] });

      registry.clearContractCache();

      // ABI cache should still exist
      expect(queryClient.getQueryData(['abis', 'detail', 'Test', 'sepolia'])).toBeDefined();
    });
  });
});
