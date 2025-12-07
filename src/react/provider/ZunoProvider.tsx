/**
 * All-in-One Zuno Provider with Wagmi & React Query built-in
 * Use this for simple apps without existing Wagmi setup
 */

"use client";

import React, { useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiSignerSync } from "./WagmiSignerSync";
import { getChainFromNetwork } from "../utils/chains";
import { createDefaultConnectors } from "../utils/connectors";
import { DEFAULT_CACHE_TIMES, type ZunoSDKConfig } from "../../types/config";
import { ZunoContextProvider } from "./ZunoContextProvider";

export interface ZunoProviderProps {
  config: ZunoSDKConfig;
  children: ReactNode;
}

/**
 * All-in-One Zuno Provider
 * Includes Wagmi + React Query + Zuno SDK
 *
 * Use this when you DON'T have Wagmi setup yet.
 * For apps with existing Wagmi, use ZunoContextProvider instead.
 */
export function ZunoProvider({ config, children }: ZunoProviderProps) {
  // Create QueryClient with caching config
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: config.cache?.ttl ?? DEFAULT_CACHE_TIMES.STALE_TIME,
            gcTime: config.cache?.gcTime ?? DEFAULT_CACHE_TIMES.GC_TIME,
            retry: config.retryPolicy?.maxRetries || 3,
            retryDelay: (attemptIndex) => {
              const delay = config.retryPolicy?.initialDelay || 1000;
              return config.retryPolicy?.backoff === "exponential"
                ? Math.min(delay * 2 ** attemptIndex, 30000)
                : delay * (attemptIndex + 1);
            },
          },
        },
      })
  );

  // Create Wagmi config with SSR support
  const [wagmiConfig] = useState(() => {
    const chain = getChainFromNetwork(config.network, {
      rpcUrl: config.rpcUrl,
    });

    const connectors = createDefaultConnectors({
      walletConnectProjectId: config.walletConnectProjectId,
    });

    return createConfig({
      chains: [chain],
      connectors,
      transports: {
        [chain.id]: http(config.rpcUrl),
      },
      ssr: true, // Enable SSR support
    });
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZunoContextProvider config={config} queryClient={queryClient}>
          <WagmiSignerSync />
          {children}
        </ZunoContextProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Re-export for convenience
export { useZuno } from "./ZunoContextProvider";
export { WagmiSignerSync } from "./WagmiSignerSync";
