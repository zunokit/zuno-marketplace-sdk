/**
 * Contract Registry with ABI caching using TanStack Query
 */

import { QueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import type { ZunoAPIClient } from './ZunoAPIClient';
import {
  createABIQueryOptions,
  createContractInfoQueryOptions,
} from './ZunoAPIClient';
import type { ContractType, TokenStandard } from '../types/contracts';
import { ZunoSDKError, ErrorCodes, validateAddress } from '../utils/errors';

/**
 * Contract Registry manages contract instances and ABI caching
 */
export class ContractRegistry {
  private readonly apiClient: ZunoAPIClient;
  private readonly queryClient: QueryClient;
  private readonly contractCache: Map<string, ethers.Contract> = new Map();

  constructor(apiClient: ZunoAPIClient, queryClient: QueryClient) {
    this.apiClient = apiClient;
    this.queryClient = queryClient;
  }

  /**
   * Get contract instance with ABI from registry
   */
  async getContract(
    contractType: ContractType,
    network: string,
    provider: ethers.Provider,
    address?: string,
    signer?: ethers.Signer
  ): Promise<ethers.Contract> {
    const cacheKey = `${contractType}-${network}-${address || 'default'}`;

    // Check cache first
    if (this.contractCache.has(cacheKey)) {
      const cached = this.contractCache.get(cacheKey)!;

      // If signer is provided, return contract connected to signer
      if (signer) {
        return cached.connect(signer) as ethers.Contract;
      }

      return cached;
    }

    // Fetch ABI using TanStack Query
    const abi = await this.getABI(contractType, network);

    if (!abi || !Array.isArray(abi)) {
      throw new ZunoSDKError(
        ErrorCodes.INVALID_ABI,
        `Invalid ABI for contract type: ${contractType}`
      );
    }

    // If no address provided, get it from contract info
    let contractAddress = address;
    if (!contractAddress) {
      const contractInfo = await this.apiClient.getContractInfo(
        contractType,
        network
      );
      contractAddress = contractInfo.address;
    }

    validateAddress(contractAddress);

    // Create contract instance
    const contract = new ethers.Contract(
      contractAddress,
      abi,
      signer || provider
    );

    // Cache the contract
    this.contractCache.set(cacheKey, contract);

    return contract;
  }

  /**
   * Get ABI from cache or fetch from API
   */
  async getABI(
    contractType: ContractType,
    network: string
  ): Promise<unknown[]> {
    const queryOptions = createABIQueryOptions(
      this.apiClient,
      contractType,
      network
    );

    try {
      // Fetch data using QueryClient
      const abiEntity = await this.queryClient.fetchQuery(queryOptions);

      return abiEntity.abi;
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.ABI_NOT_FOUND);
    }
  }

  /**
   * Get ABI for a specific contract address
   */
  async getABIByAddress(
    address: string,
    networkId: string
  ): Promise<unknown[]> {
    validateAddress(address);

    const queryOptions = createContractInfoQueryOptions(
      this.apiClient,
      address,
      networkId
    );

    try {
      const contractInfo = await this.queryClient.fetchQuery(queryOptions);
      const abiEntity = await this.apiClient.getABIById(contractInfo.abiId);

      return abiEntity.abi;
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.ABI_NOT_FOUND);
    }
  }

  /**
   * Prefetch ABIs for multiple contract types
   */
  async prefetchABIs(
    contractTypes: ContractType[],
    network: string
  ): Promise<void> {
    const prefetchPromises = contractTypes.map((contractType) => {
      const queryOptions = createABIQueryOptions(
        this.apiClient,
        contractType,
        network
      );

      return this.queryClient.prefetchQuery(queryOptions);
    });

    await Promise.all(prefetchPromises);
  }

  /**
   * Check if ABI is cached
   */
  isABICached(contractType: ContractType, network: string): boolean {
    const queryOptions = createABIQueryOptions(
      this.apiClient,
      contractType,
      network
    );

    const data = this.queryClient.getQueryData(queryOptions.queryKey);

    return data !== undefined;
  }

  /**
   * Verify if a contract supports a specific interface (ERC721, ERC1155, etc.)
   */
  async verifyTokenStandard(
    address: string,
    provider: ethers.Provider
  ): Promise<TokenStandard> {
    validateAddress(address);

    try {
      // ERC165 interface IDs
      const ERC721_INTERFACE_ID = '0x80ac58cd';
      const ERC1155_INTERFACE_ID = '0xd9b67a26';

      // Create minimal contract to check supportsInterface
      const contract = new ethers.Contract(
        address,
        [
          'function supportsInterface(bytes4 interfaceId) view returns (bool)',
        ],
        provider
      );

      // Check ERC721
      try {
        const isERC721 = await contract.supportsInterface(ERC721_INTERFACE_ID);
        if (isERC721) {
          return 'ERC721';
        }
      } catch {
        // Not ERC721
      }

      // Check ERC1155
      try {
        const isERC1155 = await contract.supportsInterface(ERC1155_INTERFACE_ID);
        if (isERC1155) {
          return 'ERC1155';
        }
      } catch {
        // Not ERC1155
      }

      return 'Unknown';
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.CONTRACT_CALL_FAILED);
    }
  }

  /**
   * Clear all cached ABIs
   */
  async clearCache(): Promise<void> {
    this.contractCache.clear();
    // Remove all ABI queries from the cache
    this.queryClient.removeQueries({ queryKey: ['abis'] });
  }

  /**
   * Clear contract cache only
   */
  clearContractCache(): void {
    this.contractCache.clear();
  }
}
