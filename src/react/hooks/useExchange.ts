/**
 * Exchange hooks for marketplace trading
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { 
  ListNFTParams, 
  BatchListNFTParams,
  BuyNFTParams,
  BatchBuyNFTParams,
  TransactionOptions 
} from '../../types/contracts';
import { useZuno } from '../provider/ZunoContextProvider';

export interface CancelListingParams {
  listingId: string;
  options?: TransactionOptions;
}

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

  const batchListNFT = useMutation({
    mutationFn: (params: BatchListNFTParams) => sdk.exchange.batchListNFT(params),
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

  const batchBuyNFT = useMutation({
    mutationFn: (params: BatchBuyNFTParams) => sdk.exchange.batchBuyNFT(params),
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
    batchListNFT,
    buyNFT,
    batchBuyNFT,
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
 * Hook to fetch listings by seller
 */
export function useListingsBySeller(seller?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['listings', 'seller', seller],
    queryFn: () => sdk.exchange.getListingsBySeller(seller!),
    enabled: !!seller,
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


