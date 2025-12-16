/**
 * useProviderSync - Hook to sync wagmi wallet with SDK provider/signer
 * 
 * Alternative to WagmiProviderSync component for hook-based usage.
 * 
 * @example
 * ```tsx
 * import { useProviderSync } from "zuno-marketplace-sdk/react";
 * 
 * function App() {
 *   const { isSynced, isInitialized, error } = useProviderSync();
 *   
 *   if (!isInitialized) return <Loading />;
 *   if (error) return <Error message={error.message} />;
 *   
 *   return <>{children}</>;
 * }
 * ```
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import { useZuno } from '../provider/ZunoContextProvider';

export interface UseProviderSyncOptions {
  /**
   * Delay in ms before attempting to sync on mount (for reconnection)
   * @default 500
   */
  reconnectDelay?: number;
  
  /**
   * Whether to clear provider/signer on disconnect
   * @default true
   */
  clearOnDisconnect?: boolean;
}

export interface UseProviderSyncReturn {
  /**
   * Whether the provider/signer has been synced successfully
   */
  isSynced: boolean;
  
  /**
   * Whether the hook has initialized (after reconnect delay)
   */
  isInitialized: boolean;
  
  /**
   * Any error that occurred during sync
   */
  error: Error | null;
  
  /**
   * Manually trigger a sync
   */
  sync: () => Promise<void>;
}

/**
 * Hook that syncs wagmi wallet connection with SDK provider/signer.
 * Alternative to WagmiProviderSync component.
 */
export function useProviderSync({
  reconnectDelay = 500,
  clearOnDisconnect = true,
}: UseProviderSyncOptions = {}): UseProviderSyncReturn {
  const sdk = useZuno();
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Manual sync function
  const sync = useCallback(async () => {
    if (!isConnected || !walletClient) {
      setIsSynced(false);
      return;
    }

    try {
      const provider = new BrowserProvider(walletClient.transport, {
        chainId: walletClient.chain.id,
        name: walletClient.chain.name,
      });
      const signer = await provider.getSigner();
      sdk.updateProvider(provider, signer);
      setIsSynced(true);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setIsSynced(false);
    }
  }, [isConnected, walletClient, sdk]);

  // Handle reconnection on mount with delay
  useEffect(() => {
    const attemptReconnect = async () => {
      await new Promise(resolve => setTimeout(resolve, reconnectDelay));
      setIsInitialized(true);
    };
    attemptReconnect();
  }, [reconnectDelay]);

  // Sync provider/signer when wallet state changes
  useEffect(() => {
    if (!isInitialized) return;

    if (isConnected && walletClient) {
      sync();
    } else if (!isConnected && clearOnDisconnect) {
      // Clear provider/signer on disconnect
      sdk.updateProvider(undefined, undefined);
      setIsSynced(false);
    }
  }, [isConnected, walletClient, isInitialized, clearOnDisconnect, sync, sdk]);

  return {
    isSynced,
    isInitialized,
    error,
    sync,
  };
}

export default useProviderSync;
