/**
 * useSignerSync - Hook to sync wagmi wallet with SDK signer
 * 
 * Alternative to WagmiSignerSync component for hook-based usage.
 * 
 * @example
 * ```tsx
 * import { useSignerSync } from "zuno-marketplace-sdk/react";
 * 
 * function App() {
 *   const { isSynced, isInitialized, error } = useSignerSync();
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

export interface UseSignerSyncOptions {
  /**
   * Delay in ms before attempting to sync on mount (for reconnection)
   * @default 500
   */
  reconnectDelay?: number;
  
  /**
   * Whether to clear signer on disconnect
   * @default true
   */
  clearOnDisconnect?: boolean;
}

export interface UseSignerSyncReturn {
  /**
   * Whether the signer has been synced successfully
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
 * Hook that syncs wagmi wallet connection with SDK signer.
 * Alternative to WagmiSignerSync component.
 */
export function useSignerSync({
  reconnectDelay = 500,
  clearOnDisconnect = true,
}: UseSignerSyncOptions = {}): UseSignerSyncReturn {
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

  // Sync signer when wallet state changes
  useEffect(() => {
    if (!isInitialized) return;

    if (isConnected && walletClient) {
      sync();
    } else if (!isConnected && clearOnDisconnect) {
      // Clear signer on disconnect
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

export default useSignerSync;
