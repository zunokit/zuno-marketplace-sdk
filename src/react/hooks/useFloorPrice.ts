/**
 * Floor price hook.
 *
 * Wraps the existing useListings query and reduces the result through
 * the pure `computeFloorPrice` helper. Returns a stable, memoized
 * result that consumers can render directly without recomputing.
 */

'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useZuno } from '../provider/ZunoContextProvider';
import { listingsByCollectionQueryOptions } from '../../lib/query/exchange';
import {
  computeFloorPrice,
  type FloorPriceOptions,
  type FloorPriceResult,
} from '../../utils/floor-price';
import type { Listing } from '../../types/entities';

export interface UseFloorPriceOptions extends FloorPriceOptions {
  /**
   * When false, the underlying listings query is disabled and the
   * hook returns `floor: null, activeCount: 0`. Use this to gate
   * fetches on user input or feature flags.
   */
  enabled?: boolean;
}

export interface UseFloorPriceResult {
  /** True while the underlying listings query is loading or fetching. */
  isLoading: boolean;
  isFetching: boolean;
  /** Error from the underlying listings query, if any. */
  error: Error | null;
  /** Floor-price reduction over the active listings. */
  data: FloorPriceResult;
  /** Raw listings used to compute the floor. */
  listings: Listing[];
  /** Re-fetch the underlying listings query. */
  refetch: () => void;
}

/**
 * Returns the floor price of a collection.
 *
 * The hook fetches all listings for `collectionAddress` (via the
 * existing `useListings` query) and reduces them with `computeFloorPrice`.
 * The reduction is memoized so reads from the consumer component don't
 * recompute on unrelated re-renders.
 *
 * Example:
 *
 *   const { data, isLoading } = useFloorPrice("0x…", {
 *     paymentToken: ETH_ADDRESS,
 *   });
 *   if (!isLoading && data.floor) {
 *     console.log("Floor:", data.floor.price, data.floor.paymentToken);
 *   }
 */
export function useFloorPrice(
  collectionAddress: string | undefined,
  options: UseFloorPriceOptions = {},
): UseFloorPriceResult {
  const sdk = useZuno();
  const { enabled = true, now, paymentToken } = options;

  const queryOpts = listingsByCollectionQueryOptions(sdk, collectionAddress);
  const query = useQuery({
    ...queryOpts,
    enabled: enabled && !!collectionAddress,
  });

  const listings: Listing[] = useMemo(
    () => query.data ?? [],
    [query.data],
  );

  const data: FloorPriceResult = useMemo(
    () => computeFloorPrice(listings, { now, paymentToken }),
    [listings, now, paymentToken],
  );

  return {
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
    data,
    listings,
    refetch: () => {
      void query.refetch();
    },
  };
}
