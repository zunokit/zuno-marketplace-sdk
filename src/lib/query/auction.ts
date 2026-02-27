/**
 * Query options for auction operations
 */

import { queryOptions } from '@tanstack/react-query';
import type { ZunoSDK } from '../../core/ZunoSDK';

/**
 * Query options for fetching auction details
 */
export function auctionDetailsQueryOptions(sdk: ZunoSDK, auctionId?: string) {
  return queryOptions({
    queryKey: ['auction', auctionId] as const,
    queryFn: () => sdk.auction.getAuctionFromFactory(auctionId!),
    enabled: !!auctionId,
  });
}

/**
 * Query options for fetching Dutch auction price
 */
export function dutchAuctionPriceQueryOptions(sdk: ZunoSDK, auctionId?: string) {
  return queryOptions({
    queryKey: ['dutchAuctionPrice', auctionId] as const,
    queryFn: () => sdk.auction.getCurrentPrice(auctionId!),
    enabled: !!auctionId,
    refetchInterval: 10000,
  });
}

/**
 * Query options for fetching pending refund
 */
export function pendingRefundQueryOptions(sdk: ZunoSDK, auctionId?: string, bidder?: string) {
  return queryOptions({
    queryKey: ['pendingRefund', auctionId, bidder] as const,
    queryFn: () => sdk.auction.getPendingRefund(auctionId!, bidder!),
    enabled: !!auctionId && !!bidder,
  });
}

/**
 * Cache key for listing all auctions (used for cache invalidation)
 */
export function auctionsListQueryKey() {
  return ['auctions'] as const;
}
