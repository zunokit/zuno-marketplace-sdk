/**
 * WagmiSignerSync - Syncs wagmi wallet connection with SDK signer
 * 
 * Features:
 * - Automatically syncs wallet signer with SDK when connected
 * - Handles reconnection on page reload with delay
 * - Clears signer on disconnect
 * 
 * @example
 * ```tsx
 * import { ZunoContextProvider, WagmiSignerSync } from "zuno-marketplace-sdk/react";
 * 
 * <ZunoContextProvider config={config}>
 *   <WagmiSignerSync />
 *   {children}
 * </ZunoContextProvider>
 * ```
 */

'use client';

import { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import { useZuno } from './ZunoContextProvider';

export interface WagmiSignerSyncProps {
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
  
  /**
   * Callback when signer is synced
   */
  onSync?: () => void;
  
  /**
   * Callback when signer sync fails
   */
  onError?: (error: Error) => void;
}

/**
 * Component that syncs wagmi wallet connection with SDK signer.
 * Required when using ZunoContextProvider with custom wagmi setup.
 */
export function WagmiSignerSync({
  reconnectDelay = 500,
  clearOnDisconnect = true,
  onSync,
  onError,
}: WagmiSignerSyncProps = {}) {
  const sdk = useZuno();
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isInitialized, setIsInitialized] = useState(false);

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

    const updateSigner = async () => {
      if (isConnected && walletClient) {
        try {
          const provider = new BrowserProvider(walletClient.transport, {
            chainId: walletClient.chain.id,
            name: walletClient.chain.name,
          });
          const signer = await provider.getSigner();
          sdk.updateProvider(provider, signer);
          onSync?.();
        } catch (error) {
          onError?.(error as Error);
        }
      } else if (!isConnected && clearOnDisconnect) {
        // Clear signer on disconnect
        sdk.updateProvider(undefined as any, undefined);
      }
    };

    updateSigner();
  }, [isConnected, walletClient, sdk, isInitialized, clearOnDisconnect, onSync, onError]);

  return null;
}

export default WagmiSignerSync;
