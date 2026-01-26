/**
 * WagmiProviderSync - Syncs wagmi wallet connection with SDK provider/signer
 *
 * Features:
 * - Automatically syncs wallet provider/signer with SDK when connected
 * - Handles reconnection on page reload with delay
 * - Clears provider/signer on disconnect
 * - SSR-safe: lazy mounts sync component on client side only
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
import React from 'react';

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

function WagmiProviderSyncInner({
  reconnectDelay = 500,
  clearOnDisconnect = true,
  onSync,
  onError,
}: WagmiProviderSyncProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const sdk = useZuno();
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

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
  }, [isInitialized, isConnected, walletClient, sdk, clearOnDisconnect, onSync, onError]);

  return null;
}

/**
 * Component that syncs wagmi wallet connection with SDK provider/signer.
 * Required when using ZunoContextProvider with custom wagmi setup.
 *
 * SSR-safe: Lazy mounts inner component on client side to prevent wagmi hook errors.
 */
export function WagmiProviderSync(props: WagmiProviderSyncProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Lazy mount: only render wagmi-dependent component on client
  if (!isClient) {
    return null;
  }

  return <WagmiProviderSyncInner {...props} />;
}

export default WagmiProviderSync;
