/**
 * Collection hooks for NFT collections and minting
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateERC721CollectionParams,
  CreateERC1155CollectionParams,
  MintERC721Params,
  BatchMintERC721Params,
  MintERC1155Params,
} from '../../types/contracts';
import { useZuno } from '../provider/ZunoContextProvider';

/**
 * Hook for collection operations
 */
export function useCollection() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  const createERC721 = useMutation({
    mutationFn: (params: CreateERC721CollectionParams) =>
      sdk.collection.createERC721Collection(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const createERC1155 = useMutation({
    mutationFn: (params: CreateERC1155CollectionParams) =>
      sdk.collection.createERC1155Collection(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const mintERC721 = useMutation({
    mutationFn: (params: MintERC721Params) =>
      sdk.collection.mintERC721(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
    },
  });

  const batchMintERC721 = useMutation({
    mutationFn: (params: BatchMintERC721Params) =>
      sdk.collection.batchMintERC721(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
    },
  });

  const mintERC1155 = useMutation({
    mutationFn: (params: MintERC1155Params) =>
      sdk.collection.mintERC1155(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
    },
  });

  const batchMintERC1155 = useMutation({
    mutationFn: (params: MintERC1155Params) =>
      sdk.collection.batchMintERC1155(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
    },
  });

  const verifyCollection = useMutation({
    mutationFn: (address: string) => sdk.collection.verifyCollection(address),
  });

  const addToAllowlist = useMutation({
    mutationFn: ({ collectionAddress, addresses }: { collectionAddress: string; addresses: string[] }) =>
      sdk.collection.addToAllowlist(collectionAddress, addresses),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collection', variables.collectionAddress] });
    },
  });

  const removeFromAllowlist = useMutation({
    mutationFn: ({ collectionAddress, addresses }: { collectionAddress: string; addresses: string[] }) =>
      sdk.collection.removeFromAllowlist(collectionAddress, addresses),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collection', variables.collectionAddress] });
    },
  });

  const setAllowlistOnly = useMutation({
    mutationFn: ({ collectionAddress, enabled }: { collectionAddress: string; enabled: boolean }) =>
      sdk.collection.setAllowlistOnly(collectionAddress, enabled),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collection', variables.collectionAddress] });
    },
  });

  return {
    createERC721,
    createERC1155,
    mintERC721,
    batchMintERC721,
    mintERC1155,
    batchMintERC1155,
    verifyCollection,
    addToAllowlist,
    removeFromAllowlist,
    setAllowlistOnly,
  };
}

/**
 * Hook to fetch collection info
 */
export function useCollectionInfo(address?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['collection', address],
    queryFn: () => sdk.collection.getCollectionInfo(address!),
    enabled: !!address,
  });
}

/**
 * Hook to fetch all created collections from factory events
 */
export function useCreatedCollections(options?: {
  creator?: string;
  fromBlock?: number;
  toBlock?: number | 'latest';
  enabled?: boolean;
}) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['createdCollections', options?.creator, options?.fromBlock, options?.toBlock],
    queryFn: () => sdk.collection.getCreatedCollections({
      creator: options?.creator,
      fromBlock: options?.fromBlock,
      toBlock: options?.toBlock,
    }),
    enabled: options?.enabled !== false,
  });
}

/**
 * Hook to get tokens owned by a user from a specific collection
 * Verifies actual on-chain ownership
 */
export function useUserOwnedTokens(collectionAddress?: string, userAddress?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['userOwnedTokens', collectionAddress, userAddress],
    queryFn: () => sdk.collection.getUserOwnedTokens(collectionAddress!, userAddress!),
    enabled: !!collectionAddress && !!userAddress,
  });
}

/**
 * Hook to check if address is in allowlist
 */
export function useIsInAllowlist(collectionAddress?: string, userAddress?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['allowlist', collectionAddress, userAddress],
    queryFn: () => sdk.collection.isInAllowlist(collectionAddress!, userAddress!),
    enabled: !!collectionAddress && !!userAddress,
  });
}

/**
 * Hook to check if collection is allowlist-only
 */
export function useIsAllowlistOnly(collectionAddress?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['allowlistOnly', collectionAddress],
    queryFn: () => sdk.collection.isAllowlistOnly(collectionAddress!),
    enabled: !!collectionAddress,
  });
}

