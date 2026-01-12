/**
 * Query keys and options for Auction module
 */

import type { UseQueryOptions } from '@tanstack/react-query';
import type { Auction } from '../../types/entities';
import type { ZunoSDK } from '../../core/ZunoSDK';

/**
 * Query key factory for Auction queries
 */
export const auctionQueryKeys = {
  all: ['auction'] as const,
  auctions: () => [...auctionQueryKeys.all, 'auctions'] as const,
  auction: (auctionId: string) => [...auctionQueryKeys.all, auctionId] as const,
  dutchAuctionPrice: (auctionId: string) =>
    [...auctionQueryKeys.all, 'dutchAuctionPrice', auctionId] as const,
  pendingRefund: (auctionId: string, bidder: string) =>
    [...auctionQueryKeys.all, 'pendingRefund', auctionId, bidder] as const,
} as const;

/**
 * Query options for fetching auction details
 */
export function auctionDetailsQueryOptions(
  sdk: ZunoSDK,
  auctionId: string
): UseQueryOptions<Auction> {
  return {
    queryKey: auctionQueryKeys.auction(auctionId),
    queryFn: () => sdk.auction.getAuctionFromFactory(auctionId),
    staleTime: 10000,
  } as const;
}

/**
 * Query options for fetching Dutch auction current price
 * Uses refetchInterval for price updates during active auctions
 */
export function dutchAuctionPriceQueryOptions(
  sdk: ZunoSDK,
  auctionId: string
): UseQueryOptions<string> {
  return {
    queryKey: auctionQueryKeys.dutchAuctionPrice(auctionId),
    queryFn: () => sdk.auction.getCurrentPrice(auctionId),
    staleTime: 5000,
    refetchInterval: 10000,
  } as const;
}

/**
 * Query options for fetching pending refund amount
 */
export function pendingRefundQueryOptions(
  sdk: ZunoSDK,
  auctionId: string,
  bidder: string
): UseQueryOptions<string> {
  return {
    queryKey: auctionQueryKeys.pendingRefund(auctionId, bidder),
    queryFn: () => sdk.auction.getPendingRefund(auctionId, bidder),
    staleTime: 10000,
  } as const;
}
