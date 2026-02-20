/**
 * Query options for collection operations
 */

import { queryOptions } from '@tanstack/react-query';
import type { ZunoSDK } from '../../core/ZunoSDK';

/**
 * Query options for all collections
 */
export function collectionsQueryOptions() {
  return queryOptions({
    queryKey: ['collections'] as const,
  });
}

/**
 * Query options for all NFTs
 */
export function nftsQueryOptions() {
  return queryOptions({
    queryKey: ['nfts'] as const,
  });
}

/**
 * Query options for collection info
 */
export function collectionInfoQueryOptions(sdk: ZunoSDK, address?: string) {
  return queryOptions({
    queryKey: ['collection', address] as const,
    queryFn: () => sdk.collection.getCollectionInfo(address!),
    enabled: !!address,
  });
}

/**
 * Query options for created collections
 */
export function createdCollectionsQueryOptions(
  sdk: ZunoSDK,
  options?: {
    creator?: string;
    fromBlock?: number;
    toBlock?: number | 'latest';
    enabled?: boolean;
  }
) {
  return queryOptions({
    queryKey: [
      'createdCollections',
      options?.creator,
      options?.fromBlock,
      options?.toBlock,
    ] as const,
    queryFn: () =>
      sdk.collection.getCreatedCollections({
        creator: options?.creator,
        fromBlock: options?.fromBlock,
        toBlock: options?.toBlock,
      }),
    enabled: options?.enabled !== false,
  });
}

/**
 * Query options for user owned tokens
 */
export function userOwnedTokensQueryOptions(
  sdk: ZunoSDK,
  collectionAddress?: string,
  userAddress?: string
) {
  return queryOptions({
    queryKey: ['userOwnedTokens', collectionAddress, userAddress] as const,
    queryFn: () => sdk.collection.getUserOwnedTokens(collectionAddress!, userAddress!),
    enabled: !!collectionAddress && !!userAddress,
  });
}

/**
 * Query options for allowlist check
 */
export function isInAllowlistQueryOptions(
  sdk: ZunoSDK,
  collectionAddress?: string,
  userAddress?: string
) {
  return queryOptions({
    queryKey: ['allowlist', collectionAddress, userAddress] as const,
    queryFn: () => sdk.collection.isInAllowlist(collectionAddress!, userAddress!),
    enabled: !!collectionAddress && !!userAddress,
  });
}

/**
 * Query options for allowlist-only check
 */
export function isAllowlistOnlyQueryOptions(sdk: ZunoSDK, collectionAddress?: string) {
  return queryOptions({
    queryKey: ['allowlistOnly', collectionAddress] as const,
    queryFn: () => sdk.collection.isAllowlistOnly(collectionAddress!),
    enabled: !!collectionAddress,
  });
}
