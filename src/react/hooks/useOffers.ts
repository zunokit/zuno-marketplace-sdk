/**
 * Offer hooks for NFT and collection offers
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  MakeOfferParams,
  MakeCollectionOfferParams,
} from '../../types/contracts';
import { useZuno } from '../provider/ZunoProvider';

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
    mutationFn: ({ offerId, options }: { offerId: string; options?: unknown }) =>
      sdk.offers.acceptOffer(offerId, options as never),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['offer', variables.offerId] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  const cancelOffer = useMutation({
    mutationFn: ({ offerId, options }: { offerId: string; options?: unknown }) =>
      sdk.offers.cancelOffer(offerId, options as never),
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
