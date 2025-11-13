/**
 * Auction hooks for English and Dutch auctions
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateEnglishAuctionParams,
  CreateDutchAuctionParams,
  PlaceBidParams,
  TransactionOptions,
} from '../../types/contracts';
import { useZuno } from '../provider/ZunoProvider';

/**
 * End auction parameters
 */
export interface EndAuctionParams {
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

  const placeBid = useMutation({
    mutationFn: (params: PlaceBidParams) => sdk.auction.placeBid(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  const endAuction = useMutation({
    mutationFn: ({ auctionId, options }: EndAuctionParams) =>
      sdk.auction.endAuction(auctionId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    },
  });

  return {
    createEnglishAuction,
    createDutchAuction,
    placeBid,
    endAuction,
  };
}

/**
 * Hook to fetch auction details
 */
export function useAuctionDetails(auctionId?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['auction', auctionId],
    queryFn: () => sdk.auction.getAuction(auctionId!),
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
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}
