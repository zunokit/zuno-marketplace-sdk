/**
 * Balance hooks
 */

'use client';

import { useBalance as useWagmiBalance } from 'wagmi';
import type { Address } from 'viem';

/**
 * Hook to get ETH or token balance
 */
export function useBalance(address?: string, tokenAddress?: string) {
  return useWagmiBalance({
    address: address as Address,
    token: tokenAddress as Address,
  });
}
