/**
 * API Client for Zuno Registry with TanStack Query integration
 */

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

type RequestParams = Record<string, string | number | boolean | null | undefined>;

interface HTTPError {
  status: number;
  data?: unknown;
}

function isHTTPError(error: unknown): error is HTTPError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

/**
 * Zuno API Client
 */
export class ZunoAPIClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(apiKey: string, apiUrl?: string) {
    if (!apiKey) {
      throw new ZunoSDKError(
        ErrorCodes.MISSING_API_KEY,
        'API key is required'
      );
    }

    this.apiKey = apiKey;
    this.baseUrl = apiUrl || DEFAULT_API_URL;
    this.timeoutMs = 30000;
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
      const contractsResponse = await this.get<{ contracts: ContractEntity[] }>(
        `/contracts/by-name/${contractName}`,
        { chainId }
      );

      // Extract contracts array from response
      const contracts = contractsResponse.data.contracts;
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
      const abiResponse = await this.get<AbiEntity>(`/abis/${abiId}`);

      return abiResponse.data;
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
      const contractsResponse = await this.get<{ contracts: ContractEntity[] }>(
        `/contracts/by-name/${contractName}`,
        { chainId }
      );

      // Extract contracts array from response
      const contracts = contractsResponse.data.contracts;
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
      const response = await this.get<GetABIByIdResponse['data']>(
        `/abis/id/${abiId}`
      );

      return response.data;
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

      const response = await this.get<GetContractInfoResponse['data']>(
        `/contracts/${address}`,
        { chainId }
      );

      return response.data;
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.CONTRACT_NOT_FOUND);
    }
  }

  /**
   * Get available networks
   */
  async getNetworks(): Promise<NetworkEntity[]> {
    try {
      const response = await this.get<GetNetworksResponse['data']>('/networks');

      return response.data;
    } catch (error) {
      throw ZunoSDKError.from(error, ErrorCodes.API_REQUEST_FAILED);
    }
  }

  private async get<T>(path: string, params?: RequestParams): Promise<APIResponse<T>> {
    return this.request<T>(path, { method: 'GET', params });
  }

  private async request<T>(
    path: string,
    options: { method: string; params?: RequestParams }
  ): Promise<APIResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.buildUrl(path, options.params), {
        method: options.method,
        credentials: 'include',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
      });

      const data = await this.parseResponseBody<APIResponse<T>>(response);

      if (!response.ok) {
        throw this.handleError({
          status: response.status,
          data,
        });
      }

      return data;
    } catch (error) {
      if (error instanceof ZunoSDKError) {
        throw error;
      }

      throw this.handleError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildUrl(path: string, params?: RequestParams): string {
    const requestPath = path.startsWith('/') ? path : `/${path}`;

    try {
      const baseUrl = new URL(this.baseUrl);
      const basePath = baseUrl.pathname === '/' ? '' : baseUrl.pathname.replace(/\/$/, '');
      baseUrl.pathname = `${basePath}${requestPath}`;

      this.appendParams(baseUrl.searchParams, params);

      return baseUrl.toString();
    } catch {
      const normalizedBase = this.baseUrl.endsWith('/')
        ? this.baseUrl.slice(0, -1)
        : this.baseUrl;
      const url = `${normalizedBase}${requestPath}`;
      const searchParams = new URLSearchParams();

      this.appendParams(searchParams, params);

      const queryString = searchParams.toString();
      if (!queryString) {
        return url;
      }

      return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
    }
  }

  private appendParams(
    searchParams: URLSearchParams,
    params?: RequestParams
  ): void {
    if (!params) {
      return;
    }

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }

      searchParams.set(key, String(value));
    }
  }

  private async parseResponseBody<T>(response: Response): Promise<T> {
    const contentType = response.headers?.get?.('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    const text = await response.text();

    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return { message: text } as T;
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown): ZunoSDKError {
    if (isHTTPError(error)) {
      const status = error.status;
      const data = error.data as Partial<APIResponse> | undefined;
      const message = this.extractErrorMessage(data);

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
            message || 'API request failed',
            data
          );
      }
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return new ZunoSDKError(
        ErrorCodes.API_TIMEOUT,
        'Request timeout',
        error
      );
    }

    return ZunoSDKError.from(error, ErrorCodes.API_REQUEST_FAILED);
  }

  private extractErrorMessage(data?: Partial<APIResponse>): string | undefined {
    if (!data || typeof data !== 'object') {
      return undefined;
    }

    if (typeof data.message === 'string') {
      return data.message;
    }

    const nestedError = (data as { error?: { message?: unknown } }).error;
    if (nestedError && typeof nestedError.message === 'string') {
      return nestedError.message;
    }

    return undefined;
  }
}
