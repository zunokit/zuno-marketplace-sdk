/**
 * Token approval hooks
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from './useWallet';
import { useZuno } from '../provider/ZunoProvider';

/**
 * Hook for ERC721/ERC1155 approval operations
 */
export function useApprove() {
  const sdk = useZuno();
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const approveERC721 = useMutation({
    mutationFn: async ({
      collectionAddress,
      operatorAddress,
    }: {
      collectionAddress: string;
      operatorAddress: string;
    }) => {
      const provider = sdk.getProvider();
      const signer = sdk.getSigner();

      if (!provider || !signer) {
        throw new Error('Provider or signer not available');
      }

      const { ethers } = await import('ethers');
      const erc721Abi = [
        'function setApprovalForAll(address operator, bool approved) external',
      ];

      const contract = new ethers.Contract(
        collectionAddress,
        erc721Abi,
        signer
      );

      const tx = await contract.setApprovalForAll(operatorAddress, true);
      await tx.wait();

      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals', address] });
    },
  });

  const approveERC1155 = useMutation({
    mutationFn: async ({
      collectionAddress,
      operatorAddress,
    }: {
      collectionAddress: string;
      operatorAddress: string;
    }) => {
      const provider = sdk.getProvider();
      const signer = sdk.getSigner();

      if (!provider || !signer) {
        throw new Error('Provider or signer not available');
      }

      const { ethers } = await import('ethers');
      const erc1155Abi = [
        'function setApprovalForAll(address operator, bool approved) external',
      ];

      const contract = new ethers.Contract(
        collectionAddress,
        erc1155Abi,
        signer
      );

      const tx = await contract.setApprovalForAll(operatorAddress, true);
      await tx.wait();

      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals', address] });
    },
  });

  return {
    approveERC721,
    approveERC1155,
  };
}
