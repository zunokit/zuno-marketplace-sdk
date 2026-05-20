/**
 * Tests for ZunoContextProvider and the useZunoSDK / useZunoLogger hooks.
 *
 * `ZunoContextProvider` deliberately does NOT depend on Wagmi / viem, so we
 * can exercise it without the ESM mocks needed elsewhere in the React tree.
 */

import React, { type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ZunoContextProvider,
  useZuno,
} from '../../react/provider/ZunoContextProvider';
import { useZunoSDK } from '../../react/hooks/useZunoSDK';
import { useZunoLogger } from '../../react/hooks/useZunoLogger';
import { ZunoSDK } from '../../core/ZunoSDK';
import { ZunoSDKError, ErrorCodes } from '../../utils/errors';

function buildWrapper(sdk?: ZunoSDK, queryClient?: QueryClient) {
  const client = queryClient ?? new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <ZunoContextProvider sdk={sdk} config={sdk ? undefined : { apiKey: 'test', network: 'sepolia' }}>
        {children}
      </ZunoContextProvider>
    </QueryClientProvider>
  );
}

describe('ZunoContextProvider', () => {
  it('exposes a pre-initialized SDK through useZunoSDK', () => {
    const externalSdk = new ZunoSDK({ apiKey: 'external', network: 'mainnet' });
    const wrapper = buildWrapper(externalSdk);

    const { result } = renderHook(() => useZunoSDK(), { wrapper });
    expect(result.current).toBe(externalSdk);
    expect(result.current.getConfig().apiKey).toBe('external');
    expect(result.current.getConfig().network).toBe('mainnet');
  });

  it('creates an SDK from config when no external instance is provided', () => {
    const wrapper = buildWrapper();
    const { result } = renderHook(() => useZunoSDK(), { wrapper });
    expect(result.current).toBeInstanceOf(ZunoSDK);
    expect(result.current.getConfig().apiKey).toBe('test');
  });

  it('throws when neither config nor sdk is provided', () => {
    const client = new QueryClient();
    expect(() =>
      renderHook(() => useZunoSDK(), {
        wrapper: ({ children }) => {
          const ProviderAny = ZunoContextProvider as unknown as React.ComponentType<{ children: ReactNode }>;
          return (
            <QueryClientProvider client={client}>
              <ProviderAny>{children}</ProviderAny>
            </QueryClientProvider>
          );
        },
      }),
    ).toThrow(/requires either config or sdk/);
  });

  it('returns the same SDK across multiple useZunoSDK calls inside one provider', () => {
    const externalSdk = new ZunoSDK({ apiKey: 'shared', network: 'sepolia' });
    const wrapper = buildWrapper(externalSdk);

    const { result: r1 } = renderHook(() => useZunoSDK(), { wrapper });
    const { result: r2 } = renderHook(() => useZunoSDK(), { wrapper });
    expect(r1.current).toBe(externalSdk);
    expect(r2.current).toBe(externalSdk);
  });
});

describe('useZunoSDK guard', () => {
  it('throws ZunoSDKError with MISSING_PROVIDER when used without a provider', () => {
    expect.assertions(2);
    try {
      renderHook(() => useZunoSDK());
    } catch (err) {
      expect(err).toBeInstanceOf(ZunoSDKError);
      expect((err as ZunoSDKError).code).toBe(ErrorCodes.MISSING_PROVIDER);
    }
  });
});

describe('useZunoLogger', () => {
  it('returns the SDK logger with the standard log level methods', () => {
    const sdk = new ZunoSDK({ apiKey: 'log', network: 'sepolia' });
    const wrapper = buildWrapper(sdk);

    const { result, rerender } = renderHook(() => useZunoLogger(), { wrapper });
    expect(result.current).toBe(sdk.logger);
    expect(typeof result.current.debug).toBe('function');
    expect(typeof result.current.info).toBe('function');
    expect(typeof result.current.warn).toBe('function');
    expect(typeof result.current.error).toBe('function');

    rerender();
    expect(result.current).toBe(sdk.logger);
  });

  it('propagates the MISSING_PROVIDER error when called outside a provider', () => {
    expect(() => renderHook(() => useZunoLogger())).toThrow(ZunoSDKError);
  });
});

describe('useZuno (SSR-aware helper)', () => {
  it('returns the context SDK when available', () => {
    const sdk = new ZunoSDK({ apiKey: 'ssr', network: 'sepolia' });
    const wrapper = buildWrapper(sdk);
    const { result } = renderHook(() => useZuno(), { wrapper });
    expect(result.current).toBe(sdk);
  });

  it('throws in the browser when used without a provider', () => {
    expect(() => renderHook(() => useZuno())).toThrow(/must be used within ZunoContextProvider/);
  });
});
