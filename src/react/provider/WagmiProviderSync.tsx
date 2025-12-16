/**
 * WagmiProviderSync - Syncs wagmi wallet connection with SDK provider/signer
 * 
 * Features:
 * - Automatically syncs wallet provider/signer with SDK when connected
 * - Handles reconnection on page reload with delay
 * - Clears provider/signer on disconnect
 * 
 * @example
 * ```tsx
 * import { ZunoContextProvider, WagmiProviderSync } from "zuno-marketplace-sdk/react";
 * 
 * <ZunoContextProvider config={config}>
 *   <WagmiProviderSync />
 *   {children}
 * </ZunoContextProvider>
 * ```
 */

'use client';

import { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { BrowserProvider } from 'ethers';
import { useZuno } from './ZunoContextProvider';

export interface WagmiProviderSyncProps {
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
  
  /**
   * Callback when provider/signer is synced
   */
  onSync?: () => void;
  
  /**
   * Callback when provider/signer sync fails
   */
  onError?: (error: Error) => void;
}

/**
 * Component that syncs wagmi wallet connection with SDK provider/signer.
 * Required when using ZunoContextProvider with custom wagmi setup.
 */
export function WagmiProviderSync({
  reconnectDelay = 500,
  clearOnDisconnect = true,
  onSync,
  onError,
}: WagmiProviderSyncProps = {}) {
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
        // Clear provider and signer on disconnect
        sdk.updateProvider(undefined, undefined);
      }
    };

    updateSigner();
  }, [isConnected, walletClient, sdk, isInitialized, clearOnDisconnect, onSync, onError]);

  return null;
}

export default WagmiProviderSync;
