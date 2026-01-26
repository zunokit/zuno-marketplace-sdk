/**
 * Core Zuno Context Provider
 * Provides SDK instance without Wagmi/React Query wrappers
 */

'use client';

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ZunoSDK } from '../../core/ZunoSDK';
import type { ZunoSDKConfig } from '../../types/config';
import { QueryClient } from '@tanstack/react-query';
import { isBrowser } from '../utils/browser';

export interface ZunoContextValue {
  sdk: ZunoSDK;
}

export const ZunoContext = createContext<ZunoContextValue | null>(null);

export interface ZunoContextProviderProps {
  /** SDK configuration (required if sdk prop not provided) */
  config?: ZunoSDKConfig;
  /** Optional external QueryClient */
  queryClient?: QueryClient;
  /** Optional pre-initialized SDK instance (for hybrid React + non-React usage) */
  sdk?: ZunoSDK;
  children: ReactNode;
}

/**
 * Core Context Provider - No Wagmi/React Query wrappers
 * Use this when you already have Wagmi + React Query setup
 */
export function ZunoContextProvider({
  config,
  queryClient,
  sdk: externalSdk,
  children
}: ZunoContextProviderProps) {
  const sdk = useMemo(() => {
    if (externalSdk) {
      return externalSdk;
    }
    if (!config) {
      throw new Error('ZunoContextProvider requires either config or sdk prop');
    }
    return new ZunoSDK(config, queryClient ? { queryClient } : undefined);
  }, [config, queryClient, externalSdk]);

  const contextValue = useMemo<ZunoContextValue>(
    () => ({ sdk }),
    [sdk]
  );

  return (
    <ZunoContext.Provider value={contextValue}>
      {children}
    </ZunoContext.Provider>
  );
}

/**
 * Hook to access Zuno SDK
 * Returns a no-op SDK during SSR to prevent build errors
 */
export function useZuno(): ZunoSDK {
  const context = useContext(ZunoContext);

  if (!context) {
    // During SSR, return a no-op SDK instead of throwing
    if (!isBrowser()) {
      return createNoOpZunoSDK();
    }
    throw new Error('useZuno must be used within ZunoContextProvider or ZunoProvider');
  }

  return context.sdk;
}

/**
 * Creates a no-op SDK instance for SSR
 * Methods will throw helpful errors when called on the server
 */
function createNoOpZunoSDK(): ZunoSDK {
  return {
    get exchange() {
      throw new Error('[SDK] Exchange module not available during SSR. This method should only be called on the client side.');
    },
    get collection() {
      throw new Error('[SDK] Collection module not available during SSR. This method should only be called on the client side.');
    },
    get auction() {
      throw new Error('[SDK] Auction module not available during SSR. This method should only be called on the client side.');
    },
    get offers() {
      throw new Error('[SDK] Offers module not available during SSR. This method should only be called on the client side.');
    },
    get bundles() {
      throw new Error('[SDK] Bundles module not available during SSR. This method should only be called on the client side.');
    },
    get provider() {
      return undefined;
    },
    get signer() {
      return undefined;
    },
    get logger() {
      return {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      };
    },
    contractRegistry: null as any,
    getProvider: () => undefined,
    setProvider: () => {},
    getSigner: () => undefined,
    setSigner: () => {},
    disconnect: () => {},
  } as unknown as ZunoSDK;
}
