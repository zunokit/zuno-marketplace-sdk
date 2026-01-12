/**
 * Query keys and options for Exchange module
 */

import type { UseQueryOptions } from '@tanstack/react-query';
import type { Listing } from '../../types/entities';
import type { ZunoSDK } from '../../core/ZunoSDK';

/**
 * Query key factory for Exchange queries
 */
export const exchangeQueryKeys = {
  all: ['exchange'] as const,
  listings: () => [...exchangeQueryKeys.all, 'listings'] as const,
  listing: (listingId: string) => [...exchangeQueryKeys.listings(), listingId] as const,
  listingsByCollection: (collectionAddress: string) =>
    [...exchangeQueryKeys.listings(), 'collection', collectionAddress] as const,
  listingsBySeller: (sellerAddress: string) =>
    [...exchangeQueryKeys.listings(), 'seller', sellerAddress] as const,
} as const;

/**
 * Query options for fetching listings by collection
 */
export function listingsQueryOptions(
  sdk: ZunoSDK,
  collectionAddress: string
): UseQueryOptions<Listing[]> {
  return {
    queryKey: exchangeQueryKeys.listingsByCollection(collectionAddress),
    queryFn: () => sdk.exchange.getListings(collectionAddress),
    staleTime: 10000,
  } as const;
}

/**
 * Query options for fetching listings by seller
 */
export function listingsBySellerQueryOptions(
  sdk: ZunoSDK,
  sellerAddress: string
): UseQueryOptions<Listing[]> {
  return {
    queryKey: exchangeQueryKeys.listingsBySeller(sellerAddress),
    queryFn: () => sdk.exchange.getListingsBySeller(sellerAddress),
    staleTime: 10000,
  } as const;
}

/**
 * Query options for fetching a single listing
 */
export function listingQueryOptions(
  sdk: ZunoSDK,
  listingId: string
): UseQueryOptions<Listing> {
  return {
    queryKey: exchangeQueryKeys.listing(listingId),
    queryFn: () => sdk.exchange.getListing(listingId),
    staleTime: 10000,
  } as const;
}
