/**
 * Query options for exchange/listing operations
 */

import { queryOptions } from '@tanstack/react-query';
import type { ZunoSDK } from '../../core/ZunoSDK';

/**
 * Query options for all listings
 */
export function listingsQueryKey() {
  return ['listings'] as const;
}

/**
 * Query options for listings by collection
 */
export function listingsByCollectionQueryOptions(sdk: ZunoSDK, collectionAddress?: string) {
  return queryOptions({
    queryKey: ['listings', collectionAddress] as const,
    queryFn: () => sdk.exchange.getListings(collectionAddress!),
    enabled: !!collectionAddress,
  });
}

/**
 * Query options for listings by seller
 */
export function listingsBySellerQueryOptions(sdk: ZunoSDK, seller?: string) {
  return queryOptions({
    queryKey: ['listings', 'seller', seller] as const,
    queryFn: () => sdk.exchange.getListingsBySeller(seller!),
    enabled: !!seller,
  });
}

/**
 * Query options for a single listing
 */
export function listingQueryOptions(sdk: ZunoSDK, listingId?: string) {
  return queryOptions({
    queryKey: ['listing', listingId] as const,
    queryFn: () => sdk.exchange.getListing(listingId!),
    enabled: !!listingId,
  });
}
