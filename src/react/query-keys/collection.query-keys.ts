/**
 * Query keys and options for Collection module
 */

import type { UseQueryOptions } from '@tanstack/react-query';
import type { ZunoSDK } from '../../core/ZunoSDK';

/**
 * Query options for fetching created collections
 */
export interface CreatedCollectionsOptions {
  creator?: string;
  fromBlock?: number;
  toBlock?: number | 'latest';
}

/**
 * Return type for getCollectionInfo
 */
export type CollectionInfo = {
  name: string;
  symbol: string;
  totalSupply: string;
  tokenType: 'ERC721' | 'ERC1155' | 'Unknown';
  description: string;
  maxSupply: string;
  mintPrice: string;
  royaltyFee: number;
  mintLimitPerWallet: number;
  owner: string;
};

/**
 * Return type for getCreatedCollections
 */
export type CreatedCollectionEvent = {
  address: string;
  creator: string;
  blockNumber: number;
  transactionHash: string;
  type: 'ERC721' | 'ERC1155';
};

/**
 * Return type for getUserOwnedTokens
 */
export type UserTokenOwnership = Array<{ tokenId: string; amount: number }>;

/**
 * Query key factory for Collection queries
 */
export const collectionQueryKeys = {
  all: ['collection'] as const,
  collections: () => [...collectionQueryKeys.all, 'collections'] as const,
  collection: (address: string) => [...collectionQueryKeys.all, address] as const,
  nfts: () => [...collectionQueryKeys.all, 'nfts'] as const,
  createdCollections: (options?: CreatedCollectionsOptions) =>
    [...collectionQueryKeys.collections(), 'created', options?.creator, options?.fromBlock, options?.toBlock] as const,
  userOwnedTokens: (collectionAddress: string, userAddress: string) =>
    [...collectionQueryKeys.all, 'userOwnedTokens', collectionAddress, userAddress] as const,
  allowlist: (collectionAddress: string, userAddress: string) =>
    [...collectionQueryKeys.all, 'allowlist', collectionAddress, userAddress] as const,
  allowlistOnly: (collectionAddress: string) =>
    [...collectionQueryKeys.all, 'allowlistOnly', collectionAddress] as const,
} as const;

/**
 * Query options for fetching collection info
 */
export function collectionInfoQueryOptions(
  sdk: ZunoSDK,
  address: string
): UseQueryOptions<CollectionInfo> {
  return {
    queryKey: collectionQueryKeys.collection(address),
    queryFn: () => sdk.collection.getCollectionInfo(address),
    staleTime: 30000,
  } as const;
}

/**
 * Query options for fetching created collections from factory events
 */
export function createdCollectionsQueryOptions(
  sdk: ZunoSDK,
  options?: CreatedCollectionsOptions
): UseQueryOptions<CreatedCollectionEvent[]> {
  return {
    queryKey: collectionQueryKeys.createdCollections(options),
    queryFn: () => sdk.collection.getCreatedCollections(options),
    staleTime: 10000,
  } as const;
}

/**
 * Query options for fetching user owned tokens from a collection
 */
export function userOwnedTokensQueryOptions(
  sdk: ZunoSDK,
  collectionAddress: string,
  userAddress: string
): UseQueryOptions<UserTokenOwnership> {
  return {
    queryKey: collectionQueryKeys.userOwnedTokens(collectionAddress, userAddress),
    queryFn: () => sdk.collection.getUserOwnedTokens(collectionAddress, userAddress),
    staleTime: 15000,
  } as const;
}

/**
 * Query options for checking if address is in allowlist
 */
export function isInAllowlistQueryOptions(
  sdk: ZunoSDK,
  collectionAddress: string,
  userAddress: string
): UseQueryOptions<boolean> {
  return {
    queryKey: collectionQueryKeys.allowlist(collectionAddress, userAddress),
    queryFn: () => sdk.collection.isInAllowlist(collectionAddress, userAddress),
    staleTime: 20000,
  } as const;
}

/**
 * Query options for checking if collection is allowlist-only
 */
export function isAllowlistOnlyQueryOptions(
  sdk: ZunoSDK,
  collectionAddress: string
): UseQueryOptions<boolean> {
  return {
    queryKey: collectionQueryKeys.allowlistOnly(collectionAddress),
    queryFn: () => sdk.collection.isAllowlistOnly(collectionAddress),
    staleTime: 30000,
  } as const;
}
