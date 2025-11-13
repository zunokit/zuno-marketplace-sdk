/**
 * ABI management hooks
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { ContractType } from '../../types/contracts';
import { createABIQueryOptions } from '../../core/ZunoAPIClient';
import { useZuno } from '../provider/ZunoProvider';

/**
 * Hook to fetch ABI for a contract type
 */
export function useABI(contractType: ContractType, network: string) {
  const sdk = useZuno();
  const apiClient = (sdk as never)['apiClient'];

  return useQuery(createABIQueryOptions(apiClient, contractType, network));
}

/**
 * Hook to fetch contract info by address
 */
export function useContractInfo(address?: string, networkId?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['contracts', address, networkId],
    queryFn: async () => {
      const apiClient = (sdk as never)['apiClient'];
      return apiClient.getContractInfo(address!, networkId!);
    },
    enabled: !!address && !!networkId,
  });
}

/**
 * Hook to prefetch ABIs
 */
export function usePrefetchABIs() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const prefetch = async (contractTypes: ContractType[], network: string) => {
    const apiClient = (sdk as never)['apiClient'];

    await Promise.all(
      contractTypes.map((type) => {
        const queryOptions = createABIQueryOptions(apiClient, type, network);
        return queryClient.prefetchQuery(queryOptions);
      })
    );
  };

  return { prefetch };
}

/**
 * Hook to check if ABIs are cached
 */
export function useABIsCached(contractTypes: ContractType[], network: string) {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const apiClient = (sdk as never)['apiClient'];

  const cached = contractTypes.map((type) => {
    const queryOptions = createABIQueryOptions(apiClient, type, network);
    const data = queryClient.getQueryData(queryOptions.queryKey);
    return { type, cached: data !== undefined };
  });

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
      'EnglishAuction',
      'DutchAuction',
      'OfferManager',
      'BundleMarketplace',
    ];

    prefetch(commonContracts, network).catch((error) => {
      console.error('[useInitializeABIs] Failed to prefetch ABIs:', error);
    });
  }, [network, prefetch]);
}
