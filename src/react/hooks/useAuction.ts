/**
 * Auction hooks for English and Dutch auctions
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateEnglishAuctionParams,
  CreateDutchAuctionParams,
  BatchCreateEnglishAuctionParams,
  BatchCreateDutchAuctionParams,
  PlaceBidParams,
  TransactionOptions,
} from '../../types/contracts';
import { useZuno } from '../provider/ZunoContextProvider';
import {
  auctionDetailsQueryOptions,
  dutchAuctionPriceQueryOptions,
  pendingRefundQueryOptions,
  auctionsListQueryKey,
} from '../../lib/query/auction';

/**
 * Settle auction parameters
 */
export interface SettleAuctionParams {
  auctionId: string;
  options?: TransactionOptions;
}

/**
 * Hook for auction operations
 */
export function useAuction() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const createEnglishAuction = useMutation({
    mutationFn: (params: CreateEnglishAuctionParams) =>
      sdk.auction.createEnglishAuction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auctionsListQueryKey() });
    },
  });

  const createDutchAuction = useMutation({
    mutationFn: (params: CreateDutchAuctionParams) =>
      sdk.auction.createDutchAuction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auctionsListQueryKey() });
    },
  });

  const batchCreateEnglishAuction = useMutation({
    mutationFn: (params: BatchCreateEnglishAuctionParams) =>
      sdk.auction.batchCreateEnglishAuction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auctionsListQueryKey() });
    },
  });

  const batchCreateDutchAuction = useMutation({
    mutationFn: (params: BatchCreateDutchAuctionParams) =>
      sdk.auction.batchCreateDutchAuction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auctionsListQueryKey() });
    },
  });

  const placeBid = useMutation({
    mutationFn: (params: PlaceBidParams) => sdk.auction.placeBid(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: auctionDetailsQueryOptions(sdk, variables.auctionId).queryKey 
      });
      queryClient.invalidateQueries({ queryKey: auctionsListQueryKey() });
    },
  });

  const settleAuction = useMutation({
    mutationFn: ({ auctionId, options }: SettleAuctionParams) =>
      sdk.auction.settleAuction(auctionId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: auctionDetailsQueryOptions(sdk, variables.auctionId).queryKey 
      });
      queryClient.invalidateQueries({ queryKey: auctionsListQueryKey() });
    },
  });

  const buyNow = useMutation({
    mutationFn: ({ auctionId, options }: SettleAuctionParams) =>
      sdk.auction.buyNow(auctionId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: auctionDetailsQueryOptions(sdk, variables.auctionId).queryKey 
      });
      queryClient.invalidateQueries({ queryKey: auctionsListQueryKey() });
    },
  });

  const withdrawBid = useMutation({
    mutationFn: ({ auctionId, options }: SettleAuctionParams) =>
      sdk.auction.withdrawBid(auctionId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: auctionDetailsQueryOptions(sdk, variables.auctionId).queryKey 
      });
      // Invalidate pending refund queries for this auction (all bidders)
      queryClient.invalidateQueries({ 
        queryKey: ['pendingRefund', variables.auctionId] 
      });
    },
  });

  const cancelAuction = useMutation({
    mutationFn: ({ auctionId, options }: SettleAuctionParams) =>
      sdk.auction.cancelAuction(auctionId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: auctionDetailsQueryOptions(sdk, variables.auctionId).queryKey 
      });
      queryClient.invalidateQueries({ queryKey: auctionsListQueryKey() });
    },
  });

  const batchCancelAuction = useMutation({
    mutationFn: (auctionIds: string[]) =>
      sdk.auction.batchCancelAuction(auctionIds),
    onSuccess: (_, auctionIds) => {
      auctionIds.forEach((auctionId) => {
        queryClient.invalidateQueries({
          queryKey: auctionDetailsQueryOptions(sdk, auctionId).queryKey,
        });
      });
      queryClient.invalidateQueries({ queryKey: auctionsListQueryKey() });
    },
  });

  return {
    createEnglishAuction,
    createDutchAuction,
    batchCreateEnglishAuction,
    batchCreateDutchAuction,
    placeBid,
    settleAuction,
    buyNow,
    withdrawBid,
    cancelAuction,
    batchCancelAuction,
  };
}

/**
 * Hook to fetch auction details
 */
export function useAuctionDetails(auctionId?: string) {
  const sdk = useZuno();
  return useQuery(auctionDetailsQueryOptions(sdk, auctionId));
}

/**
 * Hook to get current Dutch auction price
 */
export function useDutchAuctionPrice(auctionId?: string) {
  const sdk = useZuno();
  return useQuery(dutchAuctionPriceQueryOptions(sdk, auctionId));
}

/**
 * Hook to get pending refund amount for a bidder
 */
export function usePendingRefund(auctionId?: string, bidder?: string) {
  const sdk = useZuno();
  return useQuery(pendingRefundQueryOptions(sdk, auctionId, bidder));
}
