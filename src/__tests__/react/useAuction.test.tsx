/**
 * useAuction Hook Tests
 */

import React, { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuction } from '../../react/hooks/useAuction';

// Mock the ZunoContextProvider
const mockSdk = {
  auction: {
    createEnglishAuction: jest.fn(),
    createDutchAuction: jest.fn(),
    batchCreateEnglishAuction: jest.fn(),
    batchCreateDutchAuction: jest.fn(),
    placeBid: jest.fn(),
    settleAuction: jest.fn(),
    buyNow: jest.fn(),
    withdrawBid: jest.fn(),
    cancelAuction: jest.fn(),
    batchCancelAuction: jest.fn(),
  },
};

jest.mock('../../react/provider/ZunoContextProvider', () => ({
  useZuno: () => mockSdk,
}));

describe('useAuction', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    jest.clearAllMocks();
  });

  it('should return all auction mutations', () => {
    const { result } = renderHook(() => useAuction(), { wrapper });

    expect(result.current.createEnglishAuction).toBeDefined();
    expect(result.current.createDutchAuction).toBeDefined();
    expect(result.current.batchCreateEnglishAuction).toBeDefined();
    expect(result.current.batchCreateDutchAuction).toBeDefined();
    expect(result.current.placeBid).toBeDefined();
    expect(result.current.settleAuction).toBeDefined();
    expect(result.current.buyNow).toBeDefined();
    expect(result.current.withdrawBid).toBeDefined();
    expect(result.current.cancelAuction).toBeDefined();
    expect(result.current.batchCancelAuction).toBeDefined();
  });

  it('should have mutation functions', () => {
    const { result } = renderHook(() => useAuction(), { wrapper });

    expect(typeof result.current.createEnglishAuction.mutate).toBe('function');
    expect(typeof result.current.createEnglishAuction.mutateAsync).toBe('function');
    expect(typeof result.current.batchCancelAuction.mutate).toBe('function');
    expect(typeof result.current.batchCancelAuction.mutateAsync).toBe('function');
  });

  it('should have isPending state', () => {
    const { result } = renderHook(() => useAuction(), { wrapper });

    expect(result.current.createEnglishAuction.isPending).toBe(false);
    expect(result.current.batchCancelAuction.isPending).toBe(false);
  });

  it('should have isError state', () => {
    const { result } = renderHook(() => useAuction(), { wrapper });

    expect(result.current.createEnglishAuction.isError).toBe(false);
    expect(result.current.batchCancelAuction.isError).toBe(false);
  });

  it('should have isSuccess state', () => {
    const { result } = renderHook(() => useAuction(), { wrapper });

    expect(result.current.createEnglishAuction.isSuccess).toBe(false);
    expect(result.current.batchCancelAuction.isSuccess).toBe(false);
  });
});
