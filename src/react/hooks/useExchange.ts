/**
 * Exchange hooks for marketplace trading
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListNFTParams, BuyNFTParams, TransactionOptions } from '../../types/contracts';
import { useZuno } from '../provider/ZunoContextProvider';

/**
 * Cancel listing parameters
 */
export interface CancelListingParams {
  listingId: string;
  options?: TransactionOptions;
}

/**
 * Batch cancel listing parameters
 */
export interface BatchCancelListingParams {
  listingIds: string[];
  options?: TransactionOptions;
}

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
    mutationFn: ({ listingId, options }: CancelListingParams) =>
      sdk.exchange.cancelListing(listingId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  const batchCancelListing = useMutation({
    mutationFn: ({ listingIds, options }: BatchCancelListingParams) =>
      sdk.exchange.batchCancelListing({ listingIds, options }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  return {
    listNFT,
    buyNFT,
    cancelListing,
    batchCancelListing,
  };
}

/**
 * Hook to fetch listings by collection
 */
export function useListings(collectionAddress?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['listings', collectionAddress],
    queryFn: () => sdk.exchange.getListings(collectionAddress!),
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


