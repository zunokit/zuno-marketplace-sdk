/**
 * Query keys and options for Zuno SDK modules
 *
 * This module provides type-safe query key factories and query options
 * for use with TanStack Query. Follows TanStack Query v5 best practices.
 *
 * @example
 * ```typescript
 * import { listingsQueryOptions, exchangeQueryKeys } from 'zuno-marketplace-sdk/react';
 *
 * // Use in hook
 * export function useListings(address: string) {
 *   const sdk = useZuno();
 *   return useQuery(listingsQueryOptions(sdk, address));
 * }
 *
 * // Use for invalidation
 * queryClient.invalidateQueries({
 *   queryKey: exchangeQueryKeys.listings(),
 * });
 * ```
 */

export {
  exchangeQueryKeys,
  listingsQueryOptions,
  listingsBySellerQueryOptions,
  listingQueryOptions,
} from './exchange.query-keys';

export {
  auctionQueryKeys,
  auctionDetailsQueryOptions,
  dutchAuctionPriceQueryOptions,
  pendingRefundQueryOptions,
} from './auction.query-keys';

export {
  collectionQueryKeys,
  collectionInfoQueryOptions,
  createdCollectionsQueryOptions,
  userOwnedTokensQueryOptions,
  isInAllowlistQueryOptions,
  isAllowlistOnlyQueryOptions,
  type CreatedCollectionsOptions,
} from './collection.query-keys';
