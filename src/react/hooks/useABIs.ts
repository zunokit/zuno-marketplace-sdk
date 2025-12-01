/**
 * ABI management hooks
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useMemo } from 'react';
import type { ContractType } from '../../types/contracts';
import { createABIQueryOptions } from '../../core/ZunoAPIClient';
import { useZuno } from '../provider/ZunoContextProvider';

/**
 * Hook to fetch ABI for a contract type
 */
export function useABI(contractType: ContractType, network: string) {
  const sdk = useZuno();
  const apiClient = sdk.getAPIClient();

  return useQuery(createABIQueryOptions(apiClient, contractType, network));
}

/**
 * Hook to fetch contract info by address
 */
export function useContractInfo(address?: string, networkId?: string) {
  const sdk = useZuno();
  const apiClient = sdk.getAPIClient();

  return useQuery({
    queryKey: ['contracts', address, networkId],
    queryFn: () => apiClient.getContractInfo(address!, networkId!),
    enabled: !!address && !!networkId,
  });
}

/**
 * Hook to prefetch ABIs
 */
export function usePrefetchABIs() {
  const sdk = useZuno();
  const queryClient = useQueryClient();
  const apiClient = sdk.getAPIClient();

  const prefetch = useCallback(
    async (contractTypes: ContractType[], network: string) => {
      await Promise.all(
        contractTypes.map((type) => {
          const queryOptions = createABIQueryOptions(apiClient, type, network);
          return queryClient.prefetchQuery(queryOptions);
        })
      );
    },
    [apiClient, queryClient]
  );

  return { prefetch };
}

/**
 * Hook to check if ABIs are cached
 */
export function useABIsCached(contractTypes: ContractType[], network: string) {
  const sdk = useZuno();
  const queryClient = useQueryClient();
  const apiClient = sdk.getAPIClient();

  const cached = useMemo(
    () =>
      contractTypes.map((type) => {
        const queryOptions = createABIQueryOptions(apiClient, type, network);
        const data = queryClient.getQueryData(queryOptions.queryKey);
        return { type, cached: data !== undefined };
      }),
    [contractTypes, network, apiClient, queryClient]
  );

  return cached;
}

/**
 * Hook to initialize and prefetch common ABIs on mount
 */
export function useInitializeABIs(network = 'sepolia') {
  const { prefetch } = usePrefetchABIs();

  useEffect(() => {
    const commonContracts: ContractType[] = [
      'ERC721NFTExchange',
      'ERC1155NFTExchange',
      'ERC721CollectionFactory',
      'ERC1155CollectionFactory',
      'EnglishAuctionImplementation',
      'DutchAuctionImplementation',
      'OfferManager',
      'BundleMarketplace',
    ];

    prefetch(commonContracts, network).catch((error) => {
      console.error('[useInitializeABIs] Failed to prefetch ABIs:', error);
    });
  }, [network, prefetch]);
}
