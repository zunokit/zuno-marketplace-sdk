/**
 * All-in-One Zuno Provider with Wagmi & React Query built-in
 */

'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ZunoSDK } from '../../core/ZunoSDK';
import type { ZunoSDKConfig } from '../../types/config';

/**
 * Zuno context value
 */
export interface ZunoContextValue {
  sdk: ZunoSDK;
}

/**
 * Zuno context
 */
const ZunoContext = createContext<ZunoContextValue | null>(null);

/**
 * Provider props
 */
export interface ZunoProviderProps {
  config: ZunoSDKConfig;
  children: ReactNode;
  enableDevTools?: boolean;
}

/**
 * Get chain config from network
 */
function getChainFromNetwork(network: ZunoSDKConfig['network']) {
  switch (network) {
    case 'mainnet':
      return mainnet;
    case 'sepolia':
      return sepolia;
    case 'polygon':
      return polygon;
    case 'arbitrum':
      return arbitrum;
    default:
      return sepolia; // Default to sepolia
  }
}

/**
 * All-in-One Zuno Provider
 * Includes Wagmi + React Query + Zuno SDK
 */
export function ZunoProvider({
  config,
  children,
  enableDevTools = process.env.NODE_ENV === 'development',
}: ZunoProviderProps) {
  // Create QueryClient with caching config
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: config.cache?.ttl || 5 * 60 * 1000,
            gcTime: config.cache?.gcTime || 10 * 60 * 1000,
            retry: config.retryPolicy?.maxRetries || 3,
            retryDelay: (attemptIndex) => {
              const delay = config.retryPolicy?.initialDelay || 1000;
              return config.retryPolicy?.backoff === 'exponential'
                ? Math.min(delay * 2 ** attemptIndex, 30000)
                : delay * (attemptIndex + 1);
            },
          },
        },
      })
  );

  // Create Wagmi config
  const [wagmiConfig] = useState(() => {
    const chain = getChainFromNetwork(config.network);

    const connectors = [
      injected(),
      coinbaseWallet({ appName: 'Zuno Marketplace' }),
    ];

    // Add WalletConnect if project ID is provided
    if (config.walletConnectProjectId) {
      connectors.push(
        // @ts-expect-error - Wagmi connector type compatibility issue
        walletConnect({
          projectId: config.walletConnectProjectId,
          showQrModal: true,
        })
      );
    }

    return createConfig({
      chains: [chain],
      connectors,
      transports: {
        [chain.id]: http(config.rpcUrl),
      } as any, // Type cast for transport compatibility
    });
  });

  // Create SDK instance
  const sdk = useMemo(
    () => new ZunoSDK(config, { queryClient }),
    [config, queryClient]
  );

  // Create context value
  const contextValue = useMemo<ZunoContextValue>(
    () => ({ sdk }),
    [sdk]
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZunoContext.Provider value={contextValue}>
          {children}
          {enableDevTools && <ReactQueryDevtools initialIsOpen={false} />}
        </ZunoContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

/**
 * Hook to access Zuno SDK
 */
export function useZuno(): ZunoSDK {
  const context = useContext(ZunoContext);

  if (!context) {
    throw new Error('useZuno must be used within ZunoProvider');
  }

  return context.sdk;
}
