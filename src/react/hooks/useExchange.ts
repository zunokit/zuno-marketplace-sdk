/**
 * Exchange hooks for marketplace trading
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListNFTParams, BuyNFTParams } from '../../types/contracts';
import { useZuno } from '../provider/ZunoProvider';

/**
 * Hook for exchange operations (list, buy, cancel)
 */
export function useExchange() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const listNFT = useMutation({
    mutationFn: (params: ListNFTParams) => sdk.exchange.listNFT(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  const buyNFT = useMutation({
    mutationFn: (params: BuyNFTParams) => sdk.exchange.buyNFT(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  const cancelListing = useMutation({
    mutationFn: ({ listingId, options }: { listingId: string; options?: unknown }) =>
      sdk.exchange.cancelListing(listingId, options as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  return {
    listNFT,
    buyNFT,
    cancelListing,
  };
}

/**
 * Hook to fetch listings by collection
 */
export function useListings(
  collectionAddress?: string,
  page = 1,
  pageSize = 20
) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['listings', collectionAddress, page, pageSize],
    queryFn: () =>
      sdk.exchange.getListingsByCollection(collectionAddress!, page, pageSize),
    enabled: !!collectionAddress,
  });
}

/**
 * Hook to fetch a single listing
 */
export function useListing(listingId?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => sdk.exchange.getListing(listingId!),
    enabled: !!listingId,
  });
}
