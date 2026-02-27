/**
 * Query options for ABI and contract information
 */

import { queryOptions } from '@tanstack/react-query';
import type { ZunoAPIClient } from '../../core/ZunoAPIClient';
import { DEFAULT_CACHE_TIMES, type CacheConfig } from '../../types/config';

/**
 * Query options for fetching ABI
 *
 * @param client - ZunoAPIClient instance
 * @param contractName - Contract name
 * @param network - Network identifier
 * @param cacheConfig - Optional cache configuration to override defaults
 */
export function abiQueryOptions(
  client: ZunoAPIClient,
  contractName: string,
  network: string,
  cacheConfig?: CacheConfig
) {
  return queryOptions({
    queryKey: ['abis', 'detail', contractName, network] as const,
    queryFn: () => client.getABI(contractName, network),
    staleTime: cacheConfig?.ttl ?? DEFAULT_CACHE_TIMES.STALE_TIME,
    gcTime: cacheConfig?.gcTime ?? DEFAULT_CACHE_TIMES.GC_TIME,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Query options for fetching ABI by ID
 *
 * @param client - ZunoAPIClient instance
 * @param abiId - ABI identifier
 * @param cacheConfig - Optional cache configuration to override defaults
 */
export function abiByIdQueryOptions(
  client: ZunoAPIClient,
  abiId: string,
  cacheConfig?: CacheConfig
) {
  return queryOptions({
    queryKey: ['abis', 'detail', 'byId', abiId] as const,
    queryFn: () => client.getABIById(abiId),
    staleTime: cacheConfig?.ttl ?? DEFAULT_CACHE_TIMES.STALE_TIME,
    gcTime: cacheConfig?.gcTime ?? DEFAULT_CACHE_TIMES.GC_TIME,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Query options for fetching contract info
 *
 * @param client - ZunoAPIClient instance
 * @param address - Contract address
 * @param network - Network identifier
 * @param cacheConfig - Optional cache configuration to override defaults
 */
export function contractInfoQueryOptions(
  client: ZunoAPIClient,
  address: string,
  network: string,
  cacheConfig?: CacheConfig
) {
  return queryOptions({
    queryKey: ['contracts', address, network] as const,
    queryFn: () => client.getContractInfo(address, network),
    enabled: !!address && !!network,
    staleTime: cacheConfig?.ttl ?? DEFAULT_CACHE_TIMES.STALE_TIME,
    gcTime: cacheConfig?.gcTime ?? DEFAULT_CACHE_TIMES.GC_TIME,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Query options for fetching networks
 * Uses extended cache times since network data rarely changes
 *
 * @param client - ZunoAPIClient instance
 * @param cacheConfig - Optional cache configuration to override defaults
 */
export function networksQueryOptions(
  client: ZunoAPIClient,
  cacheConfig?: CacheConfig
) {
  return queryOptions({
    queryKey: ['networks'] as const,
    queryFn: () => client.getNetworks(),
    staleTime: cacheConfig?.ttl ?? DEFAULT_CACHE_TIMES.STALE_TIME_EXTENDED,
    gcTime: cacheConfig?.gcTime ?? DEFAULT_CACHE_TIMES.GC_TIME_EXTENDED,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
