/**
 * useCollection Hook Tests
 */

import React, { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCollection, useCollectionInfo, useCreatedCollections, useIsInAllowlist, useIsAllowlistOnly } from '../../react/hooks/useCollection';

// Mock the ZunoContextProvider
const mockSdk = {
  collection: {
    createERC721Collection: jest.fn(),
    createERC1155Collection: jest.fn(),
    mintERC721: jest.fn(),
    batchMintERC721: jest.fn(),
    mintERC1155: jest.fn(),
    batchMintERC1155: jest.fn(),
    addToAllowlist: jest.fn(),
    removeFromAllowlist: jest.fn(),
    setAllowlistOnly: jest.fn(),
    isInAllowlist: jest.fn(),
    isAllowlistOnly: jest.fn(),
    getCollectionInfo: jest.fn(),
    getMintInfo: jest.fn(),
    verifyCollection: jest.fn(),
    getCreatedCollections: jest.fn(),
  },
};

jest.mock('../../react/provider/ZunoContextProvider', () => ({
  useZuno: () => mockSdk,
}));

describe('useCollection', () => {
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

  it('should return all collection mutations', () => {
    const { result } = renderHook(() => useCollection(), { wrapper });

    expect(result.current.createERC721).toBeDefined();
    expect(result.current.createERC1155).toBeDefined();
    expect(result.current.mintERC721).toBeDefined();
    expect(result.current.batchMintERC721).toBeDefined();
    expect(result.current.mintERC1155).toBeDefined();
    expect(result.current.batchMintERC1155).toBeDefined();
  });

  it('should return allowlist mutations', () => {
    const { result } = renderHook(() => useCollection(), { wrapper });

    expect(result.current.addToAllowlist).toBeDefined();
    expect(result.current.removeFromAllowlist).toBeDefined();
    expect(result.current.setAllowlistOnly).toBeDefined();
  });

  it('should have mutation functions', () => {
    const { result } = renderHook(() => useCollection(), { wrapper });

    expect(typeof result.current.createERC721.mutate).toBe('function');
    expect(typeof result.current.createERC721.mutateAsync).toBe('function');
    expect(typeof result.current.mintERC721.mutate).toBe('function');
    expect(typeof result.current.mintERC721.mutateAsync).toBe('function');
    expect(typeof result.current.addToAllowlist.mutate).toBe('function');
    expect(typeof result.current.addToAllowlist.mutateAsync).toBe('function');
  });

  it('should have isPending state', () => {
    const { result } = renderHook(() => useCollection(), { wrapper });

    expect(result.current.createERC721.isPending).toBe(false);
    expect(result.current.createERC1155.isPending).toBe(false);
    expect(result.current.mintERC721.isPending).toBe(false);
    expect(result.current.batchMintERC721.isPending).toBe(false);
    expect(result.current.mintERC1155.isPending).toBe(false);
    expect(result.current.addToAllowlist.isPending).toBe(false);
  });

  it('should have isError state', () => {
    const { result } = renderHook(() => useCollection(), { wrapper });

    expect(result.current.createERC721.isError).toBe(false);
    expect(result.current.mintERC721.isError).toBe(false);
    expect(result.current.addToAllowlist.isError).toBe(false);
  });

  it('should have isSuccess state', () => {
    const { result } = renderHook(() => useCollection(), { wrapper });

    expect(result.current.createERC721.isSuccess).toBe(false);
    expect(result.current.mintERC721.isSuccess).toBe(false);
    expect(result.current.addToAllowlist.isSuccess).toBe(false);
  });
});

describe('useCollectionInfo', () => {
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
    const { result } = renderHook(() => useCollectionInfo(undefined as unknown as string), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(mockSdk.collection.getCollectionInfo).not.toHaveBeenCalled();
  });

  it('should return query state', () => {
    const { result } = renderHook(() => useCollectionInfo('0x123'), { wrapper });

    expect(result.current.isLoading).toBeDefined();
    expect(result.current.isError).toBeDefined();
  });

  it('should have refetch function', () => {
    const { result } = renderHook(() => useCollectionInfo('0x123'), { wrapper });

    expect(typeof result.current.refetch).toBe('function');
  });
});

describe('useCreatedCollections', () => {
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
    const { result } = renderHook(() => useCreatedCollections(), { wrapper });

    expect(result.current.isLoading).toBeDefined();
    expect(result.current.isError).toBeDefined();
  });

  it('should have refetch function', () => {
    const { result } = renderHook(() => useCreatedCollections(), { wrapper });

    expect(typeof result.current.refetch).toBe('function');
  });
});

describe('useIsInAllowlist', () => {
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

  it('should not fetch without addresses', () => {
    const { result } = renderHook(() => useIsInAllowlist(undefined, undefined), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(mockSdk.collection.isInAllowlist).not.toHaveBeenCalled();
  });

  it('should return query state with addresses', () => {
    const { result } = renderHook(() => useIsInAllowlist('0x123', '0x456'), { wrapper });

    expect(result.current.isLoading).toBeDefined();
    expect(result.current.isError).toBeDefined();
  });
});

describe('useIsAllowlistOnly', () => {
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
    const { result } = renderHook(() => useIsAllowlistOnly(undefined), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(mockSdk.collection.isAllowlistOnly).not.toHaveBeenCalled();
  });

  it('should return query state with address', () => {
    const { result } = renderHook(() => useIsAllowlistOnly('0x123'), { wrapper });

    expect(result.current.isLoading).toBeDefined();
    expect(result.current.isError).toBeDefined();
  });
});

describe('useCollection - ERC1155 operations', () => {
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

  it('should have ERC1155 mint functions', () => {
    const { result } = renderHook(() => useCollection(), { wrapper });

    expect(result.current.mintERC1155).toBeDefined();
    expect(result.current.batchMintERC1155).toBeDefined();
    expect(typeof result.current.mintERC1155.mutateAsync).toBe('function');
    expect(typeof result.current.batchMintERC1155.mutateAsync).toBe('function');
  });

  it('should have ERC1155 isPending state', () => {
    const { result } = renderHook(() => useCollection(), { wrapper });

    expect(result.current.mintERC1155.isPending).toBe(false);
    expect(result.current.batchMintERC1155.isPending).toBe(false);
  });
});

describe('useCollection - Allowlist operations', () => {
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

  it('should have all allowlist operations', () => {
    const { result } = renderHook(() => useCollection(), { wrapper });

    expect(result.current.addToAllowlist).toBeDefined();
    expect(result.current.removeFromAllowlist).toBeDefined();
    expect(result.current.setAllowlistOnly).toBeDefined();
  });

  it('should have allowlist mutation functions', () => {
    const { result } = renderHook(() => useCollection(), { wrapper });

    expect(typeof result.current.addToAllowlist.mutate).toBe('function');
    expect(typeof result.current.removeFromAllowlist.mutate).toBe('function');
    expect(typeof result.current.setAllowlistOnly.mutate).toBe('function');
  });

  it('should have allowlist isPending state', () => {
    const { result } = renderHook(() => useCollection(), { wrapper });

    expect(result.current.addToAllowlist.isPending).toBe(false);
    expect(result.current.removeFromAllowlist.isPending).toBe(false);
    expect(result.current.setAllowlistOnly.isPending).toBe(false);
  });
});
