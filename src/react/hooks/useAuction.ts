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
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const createDutchAuction = useMutation({
    mutationFn: (params: CreateDutchAuctionParams) =>
      sdk.auction.createDutchAuction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const batchCreateEnglishAuction = useMutation({
    mutationFn: (params: BatchCreateEnglishAuctionParams) =>
      sdk.auction.batchCreateEnglishAuction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const batchCreateDutchAuction = useMutation({
    mutationFn: (params: BatchCreateDutchAuctionParams) =>
      sdk.auction.batchCreateDutchAuction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const placeBid = useMutation({
    mutationFn: (params: PlaceBidParams) => sdk.auction.placeBid(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const settleAuction = useMutation({
    mutationFn: ({ auctionId, options }: SettleAuctionParams) =>
      sdk.auction.settleAuction(auctionId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const buyNow = useMutation({
    mutationFn: ({ auctionId, options }: SettleAuctionParams) =>
      sdk.auction.buyNow(auctionId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const withdrawBid = useMutation({
    mutationFn: ({ auctionId, options }: SettleAuctionParams) =>
      sdk.auction.withdrawBid(auctionId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['pendingRefund', variables.auctionId] });
    },
  });

  const cancelAuction = useMutation({
    mutationFn: ({ auctionId, options }: SettleAuctionParams) =>
      sdk.auction.cancelAuction(auctionId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const batchCancelAuction = useMutation({
    mutationFn: (auctionIds: string[]) =>
      sdk.auction.batchCancelAuction(auctionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
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

  return useQuery({
    queryKey: ['auction', auctionId],
    queryFn: () => sdk.auction.getAuctionFromFactory(auctionId!),
    enabled: !!auctionId,
  });
}

/**
 * Hook to get current Dutch auction price
 */
export function useDutchAuctionPrice(auctionId?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['dutchAuctionPrice', auctionId],
    queryFn: () => sdk.auction.getCurrentPrice(auctionId!),
    enabled: !!auctionId,
    refetchInterval: 10000,
  });
}

/**
 * Hook to get pending refund amount for a bidder
 */
export function usePendingRefund(auctionId?: string, bidder?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['pendingRefund', auctionId, bidder],
    queryFn: () => sdk.auction.getPendingRefund(auctionId!, bidder!),
    enabled: !!auctionId && !!bidder,
  });
}
