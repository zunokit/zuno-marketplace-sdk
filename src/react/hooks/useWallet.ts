/**
 * Wallet hooks using Wagmi
 */

'use client';

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { useEffect } from 'react';
import { useZuno } from '../provider/ZunoProvider';

/**
 * Hook for wallet operations
 */
export function useWallet() {
  const sdk = useZuno();
  const { address, isConnected, chainId, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Update SDK provider when wallet changes
  useEffect(() => {
    if (connector && isConnected) {
      (async () => {
        try {
          const provider = await connector.getProvider();
          const { BrowserProvider } = await import('ethers');
          const ethersProvider = new BrowserProvider(provider as never);
          const signer = await ethersProvider.getSigner();
          sdk.updateProvider(ethersProvider, signer);
        } catch (error) {
          console.error('[useWallet] Failed to update provider:', error);
        }
      })();
    }
  }, [connector, isConnected, sdk]);

  return {
    address,
    chainId,
    isConnected,
    connector,
    isPending,
    connectors,
    connect: (connectorId?: string) => {
      const targetConnector = connectorId
        ? connectors.find((c) => c.id === connectorId)
        : connectors[0];

      if (targetConnector) {
        connect({ connector: targetConnector });
      }
    },
    disconnect,
    switchChain,
  };
}
