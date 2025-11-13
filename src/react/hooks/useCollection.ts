/**
 * Collection hooks for NFT collections and minting
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateERC721CollectionParams,
  CreateERC1155CollectionParams,
  MintERC721Params,
  MintERC1155Params,
} from '../../types/contracts';
import { useZuno } from '../provider/ZunoProvider';

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

  const mintERC1155 = useMutation({
    mutationFn: (params: MintERC1155Params) =>
      sdk.collection.mintERC1155(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
    },
  });

  const verifyCollection = useMutation({
    mutationFn: (address: string) => sdk.collection.verifyCollection(address),
  });

  return {
    createERC721,
    createERC1155,
    mintERC721,
    mintERC1155,
    verifyCollection,
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
