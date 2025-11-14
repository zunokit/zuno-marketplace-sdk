/**
 * useExchange Hook Tests
 *
 * Note: React tests temporarily disabled for MVP release
 * TODO: Fix ESM module issues with wagmi/viem and re-enable
 */

describe.skip('useExchange', () => {
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

  const _wrapper = ({ children }: { children: ReactNode }) => (
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
