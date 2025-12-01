/**
 * Core Zuno Context Provider
 * Provides SDK instance without Wagmi/React Query wrappers
 */

'use client';

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ZunoSDK } from '../../core/ZunoSDK';
import type { ZunoSDKConfig } from '../../types/config';
import { QueryClient } from '@tanstack/react-query';

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
 */
export function useZuno(): ZunoSDK {
  const context = useContext(ZunoContext);

  if (!context) {
    throw new Error('useZuno must be used within ZunoContextProvider or ZunoProvider');
  }

  return context.sdk;
}
