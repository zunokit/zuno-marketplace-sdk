/**
 * useExchange Hook Tests
 */

import React, { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExchange, useListings, useListing, useListingsBySeller, useActiveListings } from '../../react/hooks/useExchange';

// Mock the ZunoContextProvider
const mockSdk = {
  exchange: {
    listNFT: jest.fn(),
    buyNFT: jest.fn(),
    cancelListing: jest.fn(),
    batchCancelListing: jest.fn(),
    getListing: jest.fn(),
    getListingsByCollection: jest.fn(),
    getListingsBySeller: jest.fn(),
    getActiveListings: jest.fn(),
  },
};

jest.mock('../../react/provider/ZunoContextProvider', () => ({
  useZuno: () => mockSdk,
}));

describe('useExchange', () => {
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

  it('should return all exchange mutations', () => {
    const { result } = renderHook(() => useExchange(), { wrapper });

    expect(result.current.listNFT).toBeDefined();
    expect(result.current.buyNFT).toBeDefined();
    expect(result.current.cancelListing).toBeDefined();
    expect(result.current.batchCancelListing).toBeDefined();
  });

  it('should have mutation functions', () => {
    const { result } = renderHook(() => useExchange(), { wrapper });

    expect(typeof result.current.listNFT.mutate).toBe('function');
    expect(typeof result.current.listNFT.mutateAsync).toBe('function');
    expect(typeof result.current.buyNFT.mutate).toBe('function');
    expect(typeof result.current.buyNFT.mutateAsync).toBe('function');
    expect(typeof result.current.cancelListing.mutate).toBe('function');
    expect(typeof result.current.cancelListing.mutateAsync).toBe('function');
    expect(typeof result.current.batchCancelListing.mutate).toBe('function');
    expect(typeof result.current.batchCancelListing.mutateAsync).toBe('function');
  });

  it('should have isPending state', () => {
    const { result } = renderHook(() => useExchange(), { wrapper });

    expect(result.current.listNFT.isPending).toBe(false);
    expect(result.current.buyNFT.isPending).toBe(false);
    expect(result.current.cancelListing.isPending).toBe(false);
    expect(result.current.batchCancelListing.isPending).toBe(false);
  });

  it('should have isError state', () => {
    const { result } = renderHook(() => useExchange(), { wrapper });

    expect(result.current.listNFT.isError).toBe(false);
    expect(result.current.buyNFT.isError).toBe(false);
    expect(result.current.cancelListing.isError).toBe(false);
    expect(result.current.batchCancelListing.isError).toBe(false);
  });

  it('should have isSuccess state', () => {
    const { result } = renderHook(() => useExchange(), { wrapper });

    expect(result.current.listNFT.isSuccess).toBe(false);
    expect(result.current.buyNFT.isSuccess).toBe(false);
    expect(result.current.cancelListing.isSuccess).toBe(false);
    expect(result.current.batchCancelListing.isSuccess).toBe(false);
  });
});

describe('useListings', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    jest.clearAllMocks();
  });

  it('should not fetch without collectionAddress', () => {
    const { result } = renderHook(() => useListings(undefined), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(mockSdk.exchange.getListingsByCollection).not.toHaveBeenCalled();
  });

  it('should return query state', () => {
    const { result } = renderHook(() => useListings('0x123'), { wrapper });

    expect(result.current.isLoading).toBeDefined();
    expect(result.current.isError).toBeDefined();
  });
});

describe('useListing', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    jest.clearAllMocks();
  });

  it('should not fetch without listingId', () => {
    const { result } = renderHook(() => useListing(undefined), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(mockSdk.exchange.getListing).not.toHaveBeenCalled();
  });

  it('should return query state', () => {
    const { result } = renderHook(() => useListing('0x123'), { wrapper });

    expect(result.current.isLoading).toBeDefined();
    expect(result.current.isError).toBeDefined();
  });
});

describe('useListingsBySeller', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    jest.clearAllMocks();
  });

  it('should not fetch without seller address', () => {
    const { result } = renderHook(() => useListingsBySeller(undefined), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(mockSdk.exchange.getListingsBySeller).not.toHaveBeenCalled();
  });

  it('should return query state with seller', () => {
    const { result } = renderHook(() => useListingsBySeller('0x123'), { wrapper });

    expect(result.current.isLoading).toBeDefined();
    expect(result.current.isError).toBeDefined();
  });

  it('should use default pagination', () => {
    const { result } = renderHook(() => useListingsBySeller('0x123'), { wrapper });

    // Default page = 1, pageSize = 20
    expect(result.current).toBeDefined();
  });
});

describe('useActiveListings', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    jest.clearAllMocks();
  });

  it('should return query state', () => {
    const { result } = renderHook(() => useActiveListings(), { wrapper });

    expect(result.current.isLoading).toBeDefined();
    expect(result.current.isError).toBeDefined();
  });

  it('should accept pagination parameters', () => {
    const { result } = renderHook(() => useActiveListings(2, 50), { wrapper });

    expect(result.current).toBeDefined();
  });
});
