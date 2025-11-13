/**
 * Bundle hooks for multi-NFT bundle trading
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateBundleParams } from '../../types/contracts';
import { useZuno } from '../provider/ZunoProvider';

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
    mutationFn: ({ bundleId, value, options }: { bundleId: string; value?: string; options?: unknown }) =>
      sdk.bundles.buyBundle(bundleId, value, options as never),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bundle', variables.bundleId] });
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
    },
  });

  const cancelBundle = useMutation({
    mutationFn: ({ bundleId, options }: { bundleId: string; options?: unknown }) =>
      sdk.bundles.cancelBundle(bundleId, options as never),
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
