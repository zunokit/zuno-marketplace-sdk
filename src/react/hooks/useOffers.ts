/**
 * Offer hooks for NFT and collection offers
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  MakeOfferParams,
  MakeCollectionOfferParams,
  TransactionOptions,
} from '../../types/contracts';
import { useZuno } from '../provider/ZunoProvider';

/**
 * Accept/Cancel offer parameters
 */
export interface OfferActionParams {
  offerId: string;
  options?: TransactionOptions;
}

/**
 * Hook for offer operations
 */
export function useOffers() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const makeOffer = useMutation({
    mutationFn: (params: MakeOfferParams) => sdk.offers.makeOffer(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  const makeCollectionOffer = useMutation({
    mutationFn: (params: MakeCollectionOfferParams) =>
      sdk.offers.makeCollectionOffer(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  const acceptOffer = useMutation({
    mutationFn: ({ offerId, options }: OfferActionParams) =>
      sdk.offers.acceptOffer(offerId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['offer', variables.offerId] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  const cancelOffer = useMutation({
    mutationFn: ({ offerId, options }: OfferActionParams) =>
      sdk.offers.cancelOffer(offerId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['offer', variables.offerId] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  return {
    makeOffer,
    makeCollectionOffer,
    acceptOffer,
    cancelOffer,
  };
}

/**
 * Hook to fetch offer details
 */
export function useOffer(offerId?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => sdk.offers.getOffer(offerId!),
    enabled: !!offerId,
  });
}
