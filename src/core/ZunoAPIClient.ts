/**
 * API Client for Zuno Registry with TanStack Query integration
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  AbiEntity,
  NetworkEntity,
  ContractEntity,
} from '../types/entities';
import type {
  APIResponse,
  GetABIByIdResponse,
  GetContractInfoResponse,
  GetNetworksResponse,
} from '../types/api';
import { ZunoSDKError, ErrorCodes } from '../utils/errors';

/**
 * Default API URL
 */
const DEFAULT_API_URL = 'https://abis.qdang46.xyz/api';

/**
 * Supported network names mapped to chain IDs
 *
 * Use this to see which networks are supported without making API calls.
 *
 * @example
 * ```typescript
 * import { SUPPORTED_NETWORKS } from 'zuno-marketplace-sdk';
 *
 * console.log(SUPPORTED_NETWORKS.mainnet);  // 1
 * console.log(SUPPORTED_NETWORKS.polygon);  // 137
 * console.log(SUPPORTED_NETWORKS.localhost); // 31337
 * ```
 */
export const SUPPORTED_NETWORKS = {
  ethereum: 1,
  sepolia: 11155111,
  anvil: 31337,
} as const;

/**
 * Type for supported network names
 */
export type SupportedNetwork = keyof typeof SUPPORTED_NETWORKS;

/**
 * Get list of all supported network names
 */
export function getSupportedNetworkNames(): SupportedNetwork[] {
  return Object.keys(SUPPORTED_NETWORKS) as SupportedNetwork[];
}

/**
 * Check if a network name is supported
 */
export function isSupportedNetwork(network: string): network is SupportedNetwork {
  return network.toLowerCase() in SUPPORTED_NETWORKS;
}


/**
 * Zuno API Client
 */
export class ZunoAPIClient {
  private readonly axios: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, apiUrl?: string) {
    if (!apiKey) {
      throw new ZunoSDKError(
        ErrorCodes.MISSING_API_KEY,
        'API key is required'
      );
    }

    this.apiKey = apiKey;
    this.baseUrl = apiUrl || DEFAULT_API_URL;

    // Unified API axios instance
    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      withCredentials: true, // Enable CORS credentials
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Get ABI by contract name and network (chain ID)
   *
   * @param contractName - Name of the contract (e.g., 'ERC721NFTExchange')
   * @param network - Chain ID (number or string) or network name (e.g., 'mainnet', 'sepolia', 'localhost')
   * @returns ABI entity with full ABI JSON
   */
  async getABI(contractName: string, network: string): Promise<AbiEntity> {
    try {
      // Convert network to chainId if it's a named network
      const chainId = this.resolveChainId(network);

      // Step 1: Get contract by name filtered by chainId
      const contractsResponse = await this.axios.get(
        `/contracts/by-name/${contractName}`,
        {
          params: { chainId },
        }
      );

      // Extract contracts array from response
      const contracts = contractsResponse.data.data.contracts;
      if (!contracts || contracts.length === 0) {
        throw new ZunoSDKError(
          ErrorCodes.ABI_NOT_FOUND,
          `Contract '${contractName}' not found on chain ID ${chainId}`
        );
      }

      // Get the first matching contract
      const contract = contracts[0];
      const abiId = contract.abiId;

      if (!abiId) {
        throw new ZunoSDKError(
          ErrorCodes.ABI_NOT_FOUND,
          `Contract '${contractName}' has no ABI associated`
        );
      }

      // Step 2: Get ABI by ID
      const abiResponse = await this.axios.get(`/abis/${abiId}`);

      return abiResponse.data.data;
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.ABI_NOT_FOUND);
    }
  }

  /**
   * Get contract info by name and network
   *
   * @param contractName - Name of the contract (e.g., 'ERC721CollectionFactory')
   * @param network - Chain ID (number or string) or network name
   * @returns Contract entity with address and metadata
   */
  async getContractByName(
    contractName: string,
    network: string
  ): Promise<ContractEntity> {
    try {
      // Convert network to chainId if it's a named network
      const chainId = this.resolveChainId(network);

      // Get contract by name filtered by chainId
      const contractsResponse = await this.axios.get(
        `/contracts/by-name/${contractName}`,
        {
          params: { chainId },
        }
      );

      // Extract contracts array from response
      const contracts = contractsResponse.data.data.contracts;
      if (!contracts || contracts.length === 0) {
        throw new ZunoSDKError(
          ErrorCodes.CONTRACT_NOT_FOUND,
          `Contract '${contractName}' not found on chain ID ${chainId}`
        );
      }

      // Return the first matching contract
      return contracts[0];
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.CONTRACT_NOT_FOUND);
    }
  }

  /**
   * Resolve network identifier to chain ID
   *
   * @param network - Network identifier (chain ID as number/string or network name)
   * @returns Chain ID as number
   */
  private resolveChainId(network: string): number {
    // If network is already a number, return it
    if (!isNaN(Number(network))) {
      return Number(network);
    }

    // Use the exported network mappings
    const networkKey = network.toLowerCase() as SupportedNetwork;
    const chainId = SUPPORTED_NETWORKS[networkKey];

    if (!chainId) {
      throw new ZunoSDKError(
        ErrorCodes.INVALID_NETWORK,
        `Unknown network: ${network}. Supported networks: ${Object.keys(SUPPORTED_NETWORKS).join(', ')}`
      );
    }

    return chainId;
  }

  /**
   * Get ABI by ID
   */
  async getABIById(abiId: string): Promise<AbiEntity> {
    try {
      const response = await this.axios.get<GetABIByIdResponse>(
        `/abis/id/${abiId}`
      );

      return response.data.data;
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.ABI_NOT_FOUND);
    }
  }

  /**
   * Get contract information by address
   *
   * @param address - Contract address
   * @param network - Chain ID (number or string) or network name
   * @returns Contract entity
   */
  async getContractInfo(
    address: string,
    network: string
  ): Promise<ContractEntity> {
    try {
      // Convert network to chainId if it's a named network
      const chainId = this.resolveChainId(network);

      const response = await this.axios.get<GetContractInfoResponse>(
        `/contracts/${address}`,
        {
          params: { chainId },
        }
      );

      return response.data.data;
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.CONTRACT_NOT_FOUND);
    }
  }

  /**
   * Get available networks
   */
  async getNetworks(): Promise<NetworkEntity[]> {
    try {
      const response = await this.axios.get<GetNetworksResponse>('/networks');

      return response.data.data;
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.API_REQUEST_FAILED);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): ZunoSDKError {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as APIResponse;

      switch (status) {
        case 401:
          return new ZunoSDKError(
            ErrorCodes.API_UNAUTHORIZED,
            'Unauthorized: Invalid API key',
            data
          );
        case 404:
          return new ZunoSDKError(
            ErrorCodes.API_NOT_FOUND,
            'Resource not found',
            data
          );
        case 429:
          return new ZunoSDKError(
            ErrorCodes.API_RATE_LIMIT,
            'Rate limit exceeded',
            data
          );
        default:
          return new ZunoSDKError(
            ErrorCodes.API_REQUEST_FAILED,
            data.message || 'API request failed',
            data
          );
      }
    }

    if (error.code === 'ECONNABORTED') {
      return new ZunoSDKError(
        ErrorCodes.API_TIMEOUT,
        'Request timeout',
        error
      );
    }

    return ZunoSDKError.from(error, ErrorCodes.API_REQUEST_FAILED);
  }
}

