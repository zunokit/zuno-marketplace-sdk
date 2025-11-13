/**
 * useExchange Hook Tests
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExchange } from '../../react/hooks/useExchange';
import { ZunoProvider } from '../../react/provider/ZunoProvider';
import type { ReactNode } from 'react';

// Mock ZunoSDK
jest.mock('../../core/ZunoSDK');

describe('useExchange', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should provide exchange mutations', () => {
    const { result } = renderHook(() => useExchange(), {
      wrapper: ({ children }) => (
        <ZunoProvider
          config={{ apiKey: 'test', network: 'sepolia' }}
        >
          {children}
        </ZunoProvider>
      ),
    });

    expect(result.current.listNFT).toBeDefined();
    expect(result.current.buyNFT).toBeDefined();
    expect(result.current.cancelListing).toBeDefined();
  });

  it('should have correct mutation states', () => {
    const { result } = renderHook(() => useExchange(), {
      wrapper: ({ children }) => (
        <ZunoProvider
          config={{ apiKey: 'test', network: 'sepolia' }}
        >
          {children}
        </ZunoProvider>
      ),
    });

    expect(result.current.listNFT.isPending).toBe(false);
    expect(result.current.buyNFT.isPending).toBe(false);
    expect(result.current.cancelListing.isPending).toBe(false);
  });
});

// Note: Full integration tests would require mocking ethers and contracts
// This is a basic structure showing how to test React hooks
