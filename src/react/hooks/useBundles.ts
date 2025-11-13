/**
 * Bundle hooks for multi-NFT bundle trading
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateBundleParams, TransactionOptions } from '../../types/contracts';
import { useZuno } from '../provider/ZunoProvider';

/**
 * Buy bundle parameters
 */
export interface BuyBundleParams {
  bundleId: string;
  value?: string;
  options?: TransactionOptions;
}

/**
 * Cancel bundle parameters
 */
export interface CancelBundleParams {
  bundleId: string;
  options?: TransactionOptions;
}

/**
 * Hook for bundle operations
 */
export function useBundles() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const createBundle = useMutation({
    mutationFn: (params: CreateBundleParams) => sdk.bundles.createBundle(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
    },
  });

  const buyBundle = useMutation({
    mutationFn: ({ bundleId, value, options }: BuyBundleParams) =>
      sdk.bundles.buyBundle(bundleId, value, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bundle', variables.bundleId] });
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
    },
  });

  const cancelBundle = useMutation({
    mutationFn: ({ bundleId, options }: CancelBundleParams) =>
      sdk.bundles.cancelBundle(bundleId, options),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bundle', variables.bundleId] });
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
    },
  });

  return {
    createBundle,
    buyBundle,
    cancelBundle,
  };
}

/**
 * Hook to fetch bundle details
 */
export function useBundle(bundleId?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['bundle', bundleId],
    queryFn: () => sdk.bundles.getBundle(bundleId!),
    enabled: !!bundleId,
  });
}
