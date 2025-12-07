/**
 * Chain utilities for wagmi configuration
 */

import { mainnet, sepolia, polygon, arbitrum, type Chain } from 'wagmi/chains';
import type { ZunoSDKConfig } from '../../types/config';

/**
 * Configuration options for custom chain
 */
export interface CustomChainConfig {
  /**
   * Chain name
   * @default "Anvil" for numeric network IDs
   */
  name?: string;
  
  /**
   * RPC URL for the chain
   */
  rpcUrl?: string;
  
  /**
   * Block explorer configuration
   */
  blockExplorer?: {
    name: string;
    url: string;
  };
  
  /**
   * Whether this is a testnet
   * @default true for numeric network IDs
   */
  testnet?: boolean;
}

/**
 * Get chain configuration from network identifier.
 * Supports named networks (mainnet, sepolia, etc.) and custom chain IDs.
 * 
 * @param network - Network identifier from SDK config
 * @param customConfig - Optional custom chain configuration
 * @returns Chain configuration for wagmi
 * 
 * @example
 * ```ts
 * // Named network
 * const chain = getChainFromNetwork('sepolia');
 * 
 * // Custom chain ID with config
 * const anvil = getChainFromNetwork(31337, {
 *   name: 'My Anvil',
 *   rpcUrl: 'http://localhost:8545',
 *   blockExplorer: { name: 'Explorer', url: 'http://localhost:8545' }
 * });
 * ```
 */
export function getChainFromNetwork(
  network: ZunoSDKConfig['network'],
  customConfig?: CustomChainConfig
): Chain {
  // Handle named networks
  switch (network) {
    case 'mainnet':
      return mainnet;
    case 'sepolia':
      return sepolia;
    case 'polygon':
      return polygon;
    case 'arbitrum':
      return arbitrum;
  }

  // Handle numeric chain IDs (custom/local networks)
  if (typeof network === 'number') {
    const rpcUrl = customConfig?.rpcUrl || 'http://127.0.0.1:8545';
    
    return {
      id: network,
      name: customConfig?.name || 'Anvil',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [rpcUrl],
        },
      },
      blockExplorers: customConfig?.blockExplorer ? {
        default: customConfig.blockExplorer,
      } : undefined,
      testnet: customConfig?.testnet ?? true,
    } as const satisfies Chain;
  }

  // Fallback to sepolia
  return sepolia;
}

/**
 * Create multiple chain configurations from an array of network identifiers
 * 
 * @param networks - Array of network identifiers
 * @param customConfigs - Map of chain ID to custom config
 * @returns Array of chain configurations
 * 
 * @example
 * ```ts
 * const chains = getChainsFromNetworks(
 *   [31337, 'sepolia'],
 *   { 31337: { name: 'Local', rpcUrl: 'http://localhost:8545' } }
 * );
 * ```
 */
export function getChainsFromNetworks(
  networks: ZunoSDKConfig['network'][],
  customConfigs?: Record<number, CustomChainConfig>
): Chain[] {
  return networks.map(network => {
    const customConfig = typeof network === 'number' 
      ? customConfigs?.[network] 
      : undefined;
    return getChainFromNetwork(network, customConfig);
  });
}

export default getChainFromNetwork;
