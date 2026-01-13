# Zuno Marketplace SDK - System Architecture

## Overview

The Zuno Marketplace SDK follows a **layered architecture** with clear separation of concerns across four main layers: Core, Modules, React Integration, and Utilities. The architecture emphasizes modularity, testability, and developer experience through dependency injection, lazy loading, and event-driven communication.

**Last Updated:** 2026-01-14
**Architecture Pattern:** Layered Architecture + Singleton + Dependency Injection
**Data Flow:** Unidirectional (Top → Bottom) with Event Emission (Bottom → Top)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application Layer                        │
│                     (Next.js, React, Node.js)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      React Integration Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Hooks      │  │  Providers   │  │     Components       │  │
│  │ (useExchange,│  │ (ZunoProvider,│  │  (ZunoDevTools)     │  │
│  │  useCollection│ │ WagmiProviderSync,│                     │  │
│  │  useAuction, │  │ WagmiSignerSync)│                      │  │
│  │  etc.)       │  └──────────────┘  └──────────────────────┘  │
│  └───────┬──────┘                                                 │
└──────────┼───────────────────────────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────────────────────────┐
│                        Core SDK Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   ZunoSDK    │  │ZunoAPIClient │  │  ContractRegistry    │  │
│  │  (Singleton) │  │ (HTTP Client)│  │  (TanStack Query)    │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────────┘  │
└─────────┼────────────────────────────────────────────────────────┘
          │
┌─────────▼────────────────────────────────────────────────────────┐
│                      Module Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ExchangeModule│  │CollectionMod │  │   AuctionModule      │  │
│  │ (NFT listing)│  │ (Collection) │  │  (Auctions)          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────┘  │
└─────────┼─────────────────┼─────────────────┼──────────────────┘
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼──────────────────┐
│                      Utility Layer                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Logger  │ │  Errors  │ │   Events │ │ TanStack Query   │   │
│  └──────────┘ └──────────┘ └──────────┘ │ (QueryClient)    │   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ └──────────────────┘   │
│  │  Batch   │ │ Transactions │   Log/   │                       │
│  │ Helpers  │ │  Manager   │  TxStore │                       │
│  └──────────┘ └──────────┘ └──────────┘                       │
└────────────────┬─────────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────────┐
│                    External Services                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │Registry  │  │  Ethereum│  │  Wagmi   │  │ TanStack     │    │
│  │   API    │  │  Network │  │  v2      │  │ Query v5     │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Core Architecture

### ZunoSDK (Singleton Pattern)

**Purpose:** Central SDK instance with lazy-loaded modules

**Design Pattern:** Singleton + Lazy Loading

```typescript
// Singleton instance (module-level private variable)
let _singletonInstance: ZunoSDK | null = null;

export class ZunoSDK extends EventEmitter {
  // Lazy-loaded modules
  private _exchange?: ExchangeModule;
  private _collection?: CollectionModule;
  private _auction?: AuctionModule;

  // Singleton accessor
  static getInstance(config: ZunoSDKConfig): ZunoSDK {
    if (!_singletonInstance) {
      _singletonInstance = new ZunoSDK(config);
    }
    return _singletonInstance;
  }

  // Lazy loading getters
  get exchange(): ExchangeModule {
    if (!this._exchange) {
      this._exchange = new ExchangeModule(
        this.apiClient,
        this.contractRegistry,
        this.queryClient,
        this.network,
        this.logger,
        this.events,
        this.provider,
        this.signer
      );
    }
    return this._exchange;
  }
}
```

**Key Features:**
- Single instance per application (prevents multiple SDK instances)
- Lazy module initialization (modules created only when accessed)
- Provider/signer injection support (external wallet integration)
- Event emission for pub/sub communication

**Dependencies:**
1. `ZunoAPIClient` - API communication
2. `ContractRegistry` - Contract caching
3. `QueryClient` - Data caching
4. `ZunoLogger` - Logging
5. `EventEmitter` - Event emission

---

### ZunoAPIClient

**Purpose:** HTTP client for Registry API

**Architecture:** HTTP Client + API Key Authentication

```typescript
export class ZunoAPIClient {
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;

  constructor(apiKey: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.httpClient = axios.create({
      baseURL: apiUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getABI(contractName: string): Promise<any[]> {
    const { data } = await this.httpClient.get(`/contracts/${contractName}/abi`);
    return data.abi;
  }

  async getContractAddress(contractName: string, network: NetworkType): Promise<string> {
    const { data } = await this.httpClient.get(`/contracts/${contractName}/address`, {
      params: { network },
    });
    return data.address;
  }
}
```

**Key Features:**
- Axios-based HTTP client
- Bearer token authentication
- TanStack Query integration for caching (via ContractRegistry)
- Error handling with retry logic

---

### ContractRegistry

**Purpose:** Cache contract instances and ABIs

**Architecture:** Factory Pattern + TanStack Query Caching

```typescript
export class ContractRegistry {
  private readonly queryClient: QueryClient;
  private readonly apiClient: ZunoAPIClient;
  private readonly contractCache = new Map<string, ethers.Contract>();

  async getContract(
    address: string,
    abi: any[],
    signer?: ethers.Signer
  ): Promise<ethers.Contract> {
    const cacheKey = `${address}-${signer?.address ?? 'provider'}`;

    if (this.contractCache.has(cacheKey)) {
      return this.contractCache.get(cacheKey)!;
    }

    const contract = new ethers.Contract(address, abi, signer ?? this.provider);
    this.contractCache.set(cacheKey, contract);
    return contract;
  }

  async getContractByName(
    contractName: string,
    network: NetworkType
  ): Promise<ethers.Contract> {
    // Fetch ABI and address via TanStack Query
    const [abi, address] = await Promise.all([
      this.fetchABI(contractName),
      this.fetchAddress(contractName, network),
    ]);

    return this.getContract(address, abi);
  }
}
```

**Caching Strategy:**
- **ABI Cache:** TanStack Query with 5-min TTL
- **Contract Cache:** In-memory Map (process-level)
- **Approval Cache:** Approval status caching (v2.1.0+) to reduce RPC calls
- **Invalidation:** Manual via `invalidateCache()` or automatic on network changes

---

## Module Architecture

### BaseModule (Template Method Pattern)

**Purpose:** Abstract base class for all feature modules

**Architecture:** Template Method + Dependency Injection

```typescript
export abstract class BaseModule {
  // 7 injected dependencies
  protected readonly apiClient: ZunoAPIClient;
  protected readonly contractRegistry: ContractRegistry;
  protected readonly queryClient: QueryClient;
  protected readonly network: NetworkType;
  protected readonly logger: Logger;
  protected readonly events: EventEmitter;
  protected provider?: ethers.Provider;
  protected signer?: ethers.Signer;
  protected txManager?: TransactionManager;

  constructor(
    apiClient: ZunoAPIClient,
    contractRegistry: ContractRegistry,
    queryClient: QueryClient,
    network: NetworkType,
    logger: Logger,
    events: EventEmitter,
    provider?: ethers.Provider,
    signer?: ethers.Signer
  ) {
    this.apiClient = apiClient;
    this.contractRegistry = contractRegistry;
    // ... initialize all deps
  }

  // Template method for getting contracts
  protected async getContract(
    contractName: string,
    signer?: ethers.Signer
  ): Promise<ethers.Contract> {
    return this.contractRegistry.getContractByName(
      contractName,
      this.network,
      signer
    );
  }
}
```

**Key Features:**
- Common module structure (all modules inherit)
- 7 injected dependencies (testability)
- Template methods for common operations
- Transaction manager for gas estimation and retries

---

### ExchangeModule

**Purpose:** NFT marketplace operations (list, buy, cancel)

**Architecture:** Business Logic Module + Contract Interaction

```typescript
export class ExchangeModule extends BaseModule {
  // List NFT for sale
  async listNFT(params: ListNFTParams): Promise<ListNFTResult> {
    this.logger.info('Listing NFT', { data: params });

    try {
      const contract = await this.getContract('ERC721NFTExchange', this.signer);

      // Estimate gas
      const gasEstimate = await contract.list.estimateGas(
        params.collectionAddress,
        params.tokenId,
        params.price,
        params.duration
      );

      // Execute transaction with retry
      const tx = await this.txManager!.execute(
        contract.list,
        [params.collectionAddress, params.tokenId, params.price, params.duration],
        { gasLimit: gasEstimate.mul(120).div(100) } // 20% buffer
      );

      this.logger.info('NFT listed successfully', { listingId: tx.hash });
      this.events.emit('listing:created', { listingId: tx.hash, params });

      return { listingId: tx.hash, tx };
    } catch (error) {
      this.logger.error('Failed to list NFT', { error, params });
      throw new ZunoSDKError(ErrorCodes.CONTRACT_ERROR, 'Failed to list NFT', error);
    }
  }

  // Batch list (max 20)
  async batchListNFTs(params: BatchListNFTParams): Promise<BatchListNFTResult> {
    if (params.listings.length > MAX_BATCH_SIZE) {
      throw new ZunoSDKError(
        ErrorCodes.VALIDATION_ERROR,
        `Max batch size is ${MAX_BATCH_SIZE}`
      );
    }

    const contract = await this.getContract('ERC721NFTExchange', this.signer);
    const tx = await contract.batchList(
      params.listings.map(l => [l.collectionAddress, l.tokenId, l.price, l.duration])
    );

    return { listingIds: tx.hash, tx };
  }
}
```

**Data Flow:**
1. User calls `sdk.exchange.listNFT(params)`
2. Module validates input
3. Module fetches contract from ContractRegistry
4. Module estimates gas
5. Module executes transaction via TransactionManager
6. Module logs result and emits event
7. Module returns result to user

---

### CollectionModule

**Purpose:** NFT collection management (create, mint, allowlist)

**Architecture:** Business Logic Module + Factory Contract Interaction

```typescript
export class CollectionModule extends BaseModule {
  // Create ERC721 collection
  async createERC721Collection(params: CreateCollectionParams): Promise<CreateCollectionResult> {
    this.logger.info('Creating ERC721 collection', { data: params });

    const factory = await this.getContract('ERC721CollectionFactory', this.signer);

    const tx = await factory.createCollection(
      params.name,
      params.symbol,
      params.maxSupply,
      params.mintPrice,
      params.royaltyFee,
      params.mintLimitPerWallet ?? params.maxSupply, // Default to maxSupply
      params.allowlistStageDuration,
      params.tokenURI
    );

    // Wait for transaction and extract collection address from event
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try {
        return factory.interface.parseLog(log)?.name === 'CollectionCreated';
      } catch {
        return false;
      }
    });

    const collectionAddress = event?.args?.[0];
    this.logger.info('Collection created', { collectionAddress });

    return { address: collectionAddress, tx };
  }

  // Allowlist management
  async addToAllowlist(params: AllowlistParams): Promise<void> {
    const contract = await this.getContract(params.collectionAddress, this.signer);
    await contract.addToAllowlist(params.addresses);
  }

  async setupAllowlist(params: SetupAllowlistParams): Promise<void> {
    const contract = await this.getContract(params.collectionAddress, this.signer);
    await contract.setupAllowlist(params.enabled, params.duration);
  }

  async ownerMint(params: OwnerMintParams): Promise<OwnerMintResult> {
    const contract = await this.getContract(params.collectionAddress, this.signer);
    const tx = await contract.ownerMint(params.recipient, params.amount);
    return { tokenId: tx.hash, tx };
  }

  async setAllowlistOnly(params: SetAllowlistOnlyParams): Promise<void> {
    const contract = await this.getContract(params.collectionAddress, this.signer);
    await contract.setAllowlistOnly(params.enabled);
  }
}
```

**Key Features:**
- Factory pattern for collection deployment
- Event parsing to extract deployed addresses
- ERC721/ERC1155 auto-detection (v2.2.0)
- Allowlist management (add/remove addresses, setupAllowlist)
- Owner-only minting (ownerMint)
- Allowlist-only mode configuration

---

### AuctionModule

**Purpose:** Auction system (English/Dutch auctions, bidding, settlement)

**Architecture:** Business Logic Module + Complex Contract Interaction

```typescript
export class AuctionModule extends BaseModule {
  // Create English auction
  async createEnglishAuction(params: CreateEnglishAuctionParams): Promise<CreateAuctionResult> {
    const contract = await this.getContract('EnglishAuction', this.signer);

    const tx = await contract.createAuction(
      params.collectionAddress,
      params.tokenId,
      params.startingBid,
      params.reservePrice ?? 0,
      params.duration
    );

    return { auctionId: tx.hash, tx };
  }

  // Create Dutch auction
  async createDutchAuction(params: CreateDutchAuctionParams): Promise<CreateAuctionResult> {
    const contract = await this.getContract('DutchAuction', this.signer);

    const tx = await contract.createAuction(
      params.collectionAddress,
      params.tokenId,
      params.startPrice,
      params.endPrice,
      params.duration
    );

    return { auctionId: tx.hash, tx };
  }

  // Calculate Dutch auction price at current time
  calculateDutchPrice(
    auction: Auction,
    timestamp?: number
  ): BigNumber {
    const now = timestamp ?? Math.floor(Date.now() / 1000);
    const elapsed = now - auction.startTime;

    if (elapsed >= auction.duration) {
      return auction.endPrice;
    }

    const priceDrop = auction.startPrice.sub(auction.endPrice);
    const progress = elapsed / auction.duration;
    const currentPrice = auction.startPrice.sub(priceDrop.mul(progress).div(1));

    return currentPrice;
  }

  // Batch create auctions
  async batchCreateEnglishAuction(params: BatchCreateEnglishAuctionParams): Promise<BatchCreateAuctionResult> {
    if (params.tokenIds.length > MAX_BATCH_SIZE) {
      throw new ZunoSDKError(ErrorCodes.VALIDATION_ERROR, `Max batch size is ${MAX_BATCH_SIZE}`);
    }

    const contract = await this.getContract('EnglishAuction', this.signer);

    const tx = await contract.batchCreateAuction(
      params.collectionAddress,
      params.tokenIds,
      Array(params.tokenIds.length).fill(params.startingBid),
      Array(params.tokenIds.length).fill(params.reservePrice ?? 0),
      Array(params.tokenIds.length).fill(params.duration)
    );

    return { auctionIds: tx.hash, tx };
  }
}
```

**Key Features:**
- Two auction types: English (ascending) and Dutch (descending)
- Price calculation for Dutch auctions (time-based)
- Batch operations (max 20 per transaction)
- Bid refund tracking for outbid bidders

---

## React Integration Architecture

### Provider Hierarchy

**Purpose:** Provide SDK instance and configuration to React components

```tsx
<ZunoProvider config={config}>
  {/* Initializes Wagmi, QueryClient, and SDK */}
  <WagmiConfig config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <ZunoContextProvider sdk={sdk}>
        {/* Your app */}
      </ZunoContextProvider>
    </QueryClientProvider>
  </WagmiConfig>
</ZunoProvider>
```

**Provider Responsibilities:**

| Provider | Purpose |
|----------|---------|
| `ZunoProvider` | All-in-one provider (Wagmi + QueryClient + SDK) |
| `ZunoContextProvider` | SDK instance context (for manual SDK init) |
| `WagmiProviderSync` | SSR-safe provider sync (v2.1.0+) |
| `WagmiSignerSync` | Syncs Wagmi signer to SDK (auto-updates on wallet change) |

---

### Hook Architecture

**Purpose:** React hooks for marketplace operations

**Design Pattern:** Custom Hooks + TanStack Query

```typescript
export function useExchange() {
  // Get SDK instance from context
  const sdk = useZunoSDK();

  // List NFT mutation
  const listNFT = useMutation({
    mutationFn: useCallback(
      (params: ListNFTParams) => sdk.exchange.listNFT(params),
      [sdk]
    ),
    onSuccess: (data) => {
      console.log('NFT listed:', data.listingId);
    },
    onError: (error) => {
      console.error('Failed to list NFT:', error);
    },
  });

  // Buy NFT mutation
  const buyNFT = useMutation({
    mutationFn: useCallback(
      (params: BuyNFTParams) => sdk.exchange.buyNFT(params),
      [sdk]
    ),
  });

  // Cancel listing mutation
  const cancelListing = useMutation({
    mutationFn: useCallback(
      (listingId: string) => sdk.exchange.cancelListing(listingId),
      [sdk]
    ),
  });

  // Return stable object reference (useMemo)
  return useMemo(
    () => ({ listNFT, buyNFT, cancelListing }),
    [listNFT, buyNFT, cancelListing]
  );
}
```

**Hook Categories:**

1. **Mutation Hooks** (Write Operations)
   - Return `UseMutationResult` from TanStack Query
   - Methods: `mutate`, `mutateAsync`, `reset`
   - State: `isPending`, `isError`, `error`, `data`

2. **Query Hooks** (Read Operations)
   - Return `UseQueryResult` from TanStack Query
   - State: `isLoading`, `isError`, `error`, `data`, `refetch`

3. **Utility Hooks**
   - `useZunoSDK`: Access SDK instance
   - `useZunoLogger`: Access logger
   - `useWallet`: Wallet connection state

**Optimization Patterns:**
- `useCallback` for stable function references
- `useMemo` for stable object references
- Dependency arrays: `[sdk]` (recreate if SDK changes)

---

### DevTools Architecture

**Purpose:** In-app debugging panel

**Components:**

```
ZunoDevTools
├── DevToolsPanel (main container)
│   ├── DevToolsHeader (toggle button)
│   ├── DevToolsTabs (tab navigation)
│   └── DevToolsContent
│       ├── LogsTab (log viewer)
│       ├── TransactionsTab (tx history)
│       ├── CacheTab (React Query cache)
│       └── NetworkTab (network status)
```

**Data Sources:**
- **Logs:** `logStore` (in-memory log store)
- **Transactions:** `transactionStore` (in-memory tx store)
- **Cache:** `QueryClient` (TanStack Query cache)
- **Network:** `useNetwork()` (Wagmi hook)

**State Management:**
- React local state (isOpen, activeTab)
- Subscriptions to stores (real-time updates)

---

## Utility Architecture

### Logger

**Purpose:** Structured logging with 5 levels

**Architecture:** Singleton + Custom Logger Support

```typescript
export class ZunoLogger {
  private level: LogLevel;
  private customLogger?: CustomLogger;

  constructor(config: LoggerConfig) {
    this.level = config.level ?? 'info';
    this.customLogger = config.customLogger;
  }

  info(message: string, meta?: LogMeta): void {
    if (this.shouldLog('info')) {
      const logEntry: LogEntry = {
        level: 'info',
        message,
        timestamp: Date.now(),
        ...meta,
      };

      // Output to console
      console.log(`[INFO] ${message}`, meta?.data);

      // Store in memory
      logStore.add(logEntry);

      // Forward to custom logger
      this.customLogger?.info?.(message, meta);
    }
  }
}
```

**Log Levels:** none < error < warn < info < debug

**Integration Points:**
- Console output (browser)
- Log store (in-memory for DevTools)
- Custom logger (Sentry, external services)

---

### Error Handling

**Purpose:** Categorized error codes and handling

**Architecture:** Custom Error Class + Error Categories

```typescript
export class ZunoSDKError extends Error {
  constructor(
    public readonly code: ErrorCodes,
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ZunoSDKError';
  }
}

export enum ErrorCodes {
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

**Error Handling Strategy:**
1. Try-catch around all async operations
2. Categorize errors by type
3. Log errors with context
4. Throw `ZunoSDKError` with error code
5. Propagate to UI for user feedback

---

### Transaction Manager

**Purpose:** Gas estimation, retry logic, and transaction submission

**Architecture:** Transaction Execution Wrapper

```typescript
export class TransactionManager {
  async execute<T>(
    contractMethod: ContractMethod,
    params: any[],
    options?: TxOptions
  ): Promise<T> {
    let lastError: Error;

    // Retry with exponential backoff
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Estimate gas
        const gasEstimate = await contractMethod.estimateGas(...params);

        // Execute transaction
        const tx = await contractMethod(...params, {
          gasLimit: gasEstimate.mul(120).div(100), // 20% buffer
          ...options,
        });

        return tx;
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          await this.delay(this.getBackoffDelay(attempt));
        }
      }
    }

    throw new ZunoSDKError(ErrorCodes.CONTRACT_ERROR, 'Transaction failed', lastError);
  }
}
```

**Key Features:**
- Automatic gas estimation
- Retry with exponential backoff
- Gas limit buffer (20%)
- Transaction timeout handling

---

## Data Flow Diagrams

### Listing NFT Flow

```
User (React Hook)
    │
    │ listNFT.mutateAsync(params)
    ▼
useExchange Hook
    │
    │ sdk.exchange.listNFT(params)
    ▼
ExchangeModule
    │
    ├─→ Validate input
    ├─→ Get contract from ContractRegistry
    │       │
    │       ├─→ Check cache (in-memory Map)
    │       └─→ Fetch ABI/address (via TanStack Query)
    │               │
    │               └─→ ZunoAPIClient.getABI()
    │                       │
    │                       └─→ Registry API
    │
    ├─→ Estimate gas
    │       │
    │       └─→ contract.list.estimateGas()
    │
    ├─→ Execute transaction (via TransactionManager)
    │       │
    │       ├─→ Retry logic (v2.1.0+ with exponential backoff)
    │       ├─→ TransactionStore history tracking
    │       └─→ contract.list(...)
    │               │
    │               └─→ Ethereum Network
    │
    ├─→ Log result (via Logger)
    │       │
    │       ├─→ Console output
    │       ├─→ Log store (v2.1.0+ optimized for high-frequency)
    │       └─→ Custom logger (Sentry)
    │
    ├─→ Emit event (via EventEmitter)
    │       │
    │       ├─→ listing:created event
    │       └─→ Batch progress events (v2.1.0+)
    │
    ├─→ Invalidate queries (v2.1.1+ automatic)
    │       │
    │       └─→ TanStack Query cache invalidation
    │
    └─→ Return result { listingId, tx }
            │
            └─→ React Hook (mutateAsync resolves)
                    │
                    └─→ UI updates
```

### React Query Cache Flow

```
React Hook (useABIs)
    │
    │ useQuery({ queryKey: ['abis'], queryFn: fetchABIs })
    ▼
TanStack Query
    │
    ├─→ Check cache (QueryClient)
    │       │
    │       ├─→ Hit? Return cached data
    │       └─→ Miss? Execute queryFn
    │               │
    │               └─→ ZunoAPIClient.getABI()
    │                       │
    │                       └─→ Registry API
    │                               │
    │                               └─→ Return ABI
    │                                       │
    │                                       ├─→ Store in cache (5-min TTL)
    │                                       └─→ Return to hook
    │                                               │
    │                                               └─→ UI renders
    │
    └─→ Background refetch (stale-while-revalidate)
            │
            └─→ Update cache in background
```

---

## Design Patterns Used

### 1. Singleton Pattern
- **Where:** ZunoSDK
- **Purpose:** Single SDK instance per application
- **Benefits:** Prevents multiple instances, shared state

### 2. Lazy Loading Pattern
- **Where:** ExchangeModule, CollectionModule, AuctionModule
- **Purpose:** Initialize modules only when accessed
- **Benefits:** Faster initialization, lower memory footprint

### 3. Template Method Pattern
- **Where:** BaseModule
- **Purpose:** Common module structure with specific implementations
- **Benefits:** Code reuse, consistent module behavior

### 4. Dependency Injection Pattern
- **Where:** All modules (via constructor)
- **Purpose:** Testability and loose coupling
- **Benefits:** Easy mocking, no hard dependencies

### 5. Factory Pattern
- **Where:** ContractRegistry (getContract)
- **Purpose:** Create and cache contract instances
- **Benefits:** Centralized contract creation, caching

### 6. Observer Pattern
- **Where:** EventEmitter, logStore, transactionStore
- **Purpose:** Event-driven communication
- **Benefits:** Decoupled communication, pub/sub

### 7. Strategy Pattern
- **Where:** Logger (custom logger support)
- **Purpose:** Pluggable logging strategies
- **Benefits:** Flexible logging integration (Sentry, etc.)

---

## Integration with External Services

### Ethereum Network

**Library:** ethers.js v6

**Integration Points:**
- **Provider:** Read-only access to blockchain
- **Signer:** Write operations (transactions)
- **Contract:** Smart contract interaction

**Provider Sources:**
- Wagmi v2 (recommended for React)
- Custom provider (Node.js, server-side)
- Default provider (Infura/Alchemy fallback)

### Wagmi v2

**Library:** wagmi v2.12.0

**Integration Points:**
- Wallet connection (MetaMask, WalletConnect, Coinbase Wallet)
- Signer management (auto-updates on wallet change)
- Network switching (chain changes)
- Account management (address, balance)

**Sync Mechanism:**
```typescript
<WagmiSignerSync>
  {/* Automatically syncs wagmi.signer to SDK.signer */}
</WagmiSignerSync>
```

### TanStack Query v5

**Library:** @tanstack/react-query v5.59.0

**Integration Points:**
- React hooks (useQuery, useMutation)
- Caching (ABIs, contract addresses)
- Background refetching
- Optimistic updates

**QueryClient Configuration:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300000, // 5 minutes
      gcTime: 600000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

### Registry API

**Purpose:** Centralized API for ABIs and contract addresses

**Endpoints:**
- `GET /contracts/{name}/abi` - Fetch contract ABI
- `GET /contracts/{name}/address` - Fetch deployment address
- `GET /networks` - List supported networks

**Authentication:** Bearer token (API key)

---

## Performance Optimization

### Caching Strategy

**Layer 1: Contract Registry (In-Memory)**
- Contract instances cached in Map
- Key: `{address}-{signerAddress}`
- Lifetime: Process lifetime

**Layer 2: TanStack Query (ABIs/Addresses)**
- ABIs cached for 5 minutes
- Contract addresses cached for 5 minutes
- Garbage collection after 10 minutes
- Automatic invalidation on mutations (v2.1.1+)

**Layer 3: Approval Cache (v2.1.0+)**
- Approval status cached to reduce RPC calls
- Token approval state tracked per collection
- Lifetime: 5 minutes with manual invalidation

**Layer 4: Browser/Node (HTTP)**
- HTTP caching (Cache-Control headers)
- CDN caching (if applicable)

### Bundle Optimization

**Tree Shaking:**
- Separate entry points for each module
- Named exports (no default exports)
- ESM format enables tree-shaking

**Code Splitting:**
- Main SDK: ~50 KB (minified)
- React integration: ~30 KB (minified)
- Individual modules: ~10-15 KB each

---

## Security Architecture

### API Key Management
- Never hardcoded in source code
- Loaded from environment variables
- Passed via SDK config
- Stored in React app (`.env` files)

### Private Key Handling
- SDK never handles private keys directly
- Signers injected from external sources (Wagmi, ethers)
- No key storage in SDK
- Wallet providers manage keys securely

### Input Validation
- All user inputs validated
- Address validation (ethers.isAddress)
- Numeric range checks
- Array length limits (max 20 for batches)

---

## Monitoring & Observability

### Logging
- Structured logging with 5 levels
- In-memory log store for DevTools
- Custom logger integration (Sentry)
- Automatic transaction logging

### Error Tracking
- Categorized error codes
- Error context (module, function, params)
- Stack traces preserved
- Custom error integration (Sentry)

### Performance Monitoring
- Transaction timing tracking
- Gas estimation accuracy
- Cache hit/miss metrics (via TanStack Query DevTools)

---

## Testing Architecture

### Unit Tests
- Core SDK (ZunoSDK, APIClient, ContractRegistry)
- Modules (Exchange, Collection, Auction)
- Utils (Logger, Errors, Transactions)
- React Hooks (@testing-library/react)

### Integration Tests
- Batch operations (multiple transactions)
- End-to-end workflows (list → buy → cancel)
- Error handling and retries

### Test Utilities
- Mock factories (contracts, SDK instances)
- React testing utilities (wrapper components)
- Jest configuration with jsdom environment

---

## Future Architecture Considerations

### V3.0 Roadmap
- Custom ABI support (plugin system)
- Custom contract integration
- Multi-chain support (Polygon, Arbitrum, Base)
- SDK plugins/modules (extensible architecture)

### V2.2.0 Features (Current)
- ERC1155 support with auto-detection
- setupAllowlist() method for programmatic allowlist configuration
- ownerMint() method for owner-only minting
- Enhanced batch operations with progress tracking
- Sepolia testnet support (planned)

### V2.1.0+ Features (Released)
- WagmiProviderSync for SSR-safe provider initialization
- Transaction retry logic with exponential backoff
- TransactionStore history tracking
- Batch progress events for real-time updates
- ListingId validation (strict bytes32 format)
- Dutch auction warnings for price clamp adjustments
- Approval caching to reduce RPC calls
- LogStore optimization for high-frequency logging
- Query invalidation on mutations (v2.1.1+)

### Scalability
- Event-based architecture (for real-time updates)
- Subgraph integration (for indexed data)
- WebSocket support (for live updates)
- Edge deployment support (Vercel Edge, Cloudflare Workers)

---

## Summary

The Zuno Marketplace SDK architecture follows clean, modular design principles:

- **Layered Architecture:** Clear separation (Core → Modules → React → Utils)
- **Design Patterns:** Singleton, Lazy Loading, Template Method, DI, Factory, Observer
- **Dependency Injection:** All modules injectable for testability
- **Event-Driven:** EventEmitter for pub/sub communication
- **React Integration:** Hooks + Providers + DevTools
- **Caching:** Multi-layer (In-Memory + TanStack Query + HTTP)
- **Error Handling:** Categorized errors with retry logic
- **Logging:** Structured logging with 5 levels
- **Testing:** Comprehensive unit and integration tests

This architecture ensures the SDK is maintainable, testable, and extensible for future enhancements.
