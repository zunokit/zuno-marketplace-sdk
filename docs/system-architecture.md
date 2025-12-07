# System Architecture

**Version:** 2.0.1
**Last Updated:** 2025-12-07

---

## Architecture Overview

Zuno Marketplace SDK employs a **layered, modular architecture** with clear separation of concerns across four main layers:

```
┌────────────────────────────────────────────────┐
│            React Components Layer               │
│  (ZunoProvider, Hooks, DevTools Component)     │
└────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────┐
│         React Integration Layer                 │
│  (Custom Hooks, Context Provider, Adapters)   │
└────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────┐
│         Feature Modules Layer                   │
│  (Exchange, Auction, Collection Modules)       │
└────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────┐
│           Core Infrastructure Layer             │
│  (ZunoSDK, APIClient, ContractRegistry)        │
├────────────────────────────────────────────────┤
│              Utilities Layer                    │
│  (Logger, Errors, Transactions, Events)        │
└────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────┐
│         External Dependencies                   │
│  (ethers.js, Wagmi, React Query, Axios)        │
└────────────────────────────────────────────────┘
```

---

## Core Design Patterns

### 1. Singleton Pattern

**ZunoSDK** implements singleton pattern for app-wide instance management:

```typescript
// Core implementation
let _singletonInstance: ZunoSDK | null = null;

export class ZunoSDK {
  static getInstance(config?: ZunoSDKConfig, options?: SDKOptions): ZunoSDK {
    if (!_singletonInstance && !config) {
      throw new Error('SDK not initialized');
    }
    if (config && !_singletonInstance) {
      _singletonInstance = new ZunoSDK(config, options);
    }
    return _singletonInstance;
  }
}

// Usage patterns
// Initialization (app entry)
ZunoSDK.getInstance({ apiKey: '...', network: 'sepolia' });

// Access from anywhere
const sdk = ZunoSDK.getInstance();
const listings = await sdk.exchange.getActiveListings();
```

**Benefits:**
- Ensures single SDK instance across app
- Centralized configuration
- Easy testing with mock instances
- Memory efficient

### 2. Lazy Module Loading

Feature modules are instantiated on first access, not at SDK construction:

```typescript
export class ZunoSDK {
  private _exchange?: ExchangeModule;
  private _collection?: CollectionModule;
  private _auction?: AuctionModule;

  // Module access (lazy initialization)
  get exchange(): ExchangeModule {
    if (!this._exchange) {
      this._exchange = new ExchangeModule(
        this.apiClient,
        this.contractRegistry,
        this.queryClient,
        this.config.network,
        this.logger,
        this.provider,
        this.signer
      );
    }
    return this._exchange;
  }
}

// Usage: First access triggers initialization
const result = await sdk.exchange.listNFT(params); // Exchange module created here
const auction = sdk.auction.createEnglishAuction(params); // Auction module created here
```

**Benefits:**
- Reduced initial load time
- Memory only allocated for used modules
- Tree-shakeable bundle when importing modules directly
- Extensible for future modules (Offers, Bundles)

### 3. Base Module Abstraction

All feature modules extend **BaseModule** to share common functionality:

```typescript
export abstract class BaseModule {
  protected readonly apiClient: ZunoAPIClient;
  protected readonly contractRegistry: ContractRegistry;
  protected readonly queryClient: QueryClient;
  protected readonly network: NetworkType;
  protected readonly logger: Logger;
  protected provider?: ethers.Provider;
  protected signer?: ethers.Signer;
  protected txManager?: TransactionManager;

  // Shared helper methods
  protected ensureProvider(): ethers.Provider { ... }
  protected ensureSigner(): ethers.Signer { ... }
  protected ensureTxManager(): TransactionManager { ... }
  protected getNetworkId(): number { ... }
}

// Usage in feature modules
export class ExchangeModule extends BaseModule {
  async listNFT(params: ListNFTParams) {
    const provider = this.ensureProvider(); // From BaseModule
    const signer = this.ensureSigner();     // From BaseModule
    const txManager = this.ensureTxManager(); // From BaseModule

    // Implementation using shared resources
  }
}
```

**Benefits:**
- Code reuse across modules
- Consistent error handling
- Unified provider/signer management
- Easy to extend with new modules

### 4. Provider/Signer Abstraction

SDK decouples ethers.js provider and signer for flexibility:

```typescript
// Configuration options
export interface SDKOptions {
  provider?: ethers.Provider;  // Custom provider
  signer?: ethers.Signer;      // Custom signer
  queryClient?: QueryClient;   // Custom React Query client
}

// ZunoSDK constructor handles defaults
constructor(config: ZunoSDKConfig, options?: SDKOptions) {
  this.provider = options?.provider ?? this.createDefaultProvider(config);
  this.signer = options?.signer; // Optional
}

// Runtime update support
updateProvider(provider: ethers.Provider, signer?: ethers.Signer): void {
  this.provider = provider;
  this.signer = signer;
  // Propagate to all modules
  this._exchange?.updateProvider(provider, signer);
  this._auction?.updateProvider(provider, signer);
  this._collection?.updateProvider(provider, signer);
}
```

**Benefits:**
- Works with any ethers.js provider
- Wallet integration flexibility (WalletConnect, MetaMask, etc.)
- Runtime provider switching
- Testable with mock providers

---

## Layer Architecture

### Layer 1: React Components & Providers

**Location:** `src/react/provider/`, `src/react/components/`

**Components:**
- `ZunoProvider` - All-in-one Wagmi + React Query setup
- `ZunoContextProvider` - Context-based setup (use existing Wagmi config)
- `ZunoDevTools` - Visual debugging panel (logs, transactions, cache)

**Data Flow:**
```
App Setup
  ↓
ZunoProvider (with Wagmi + QueryClient)
  ↓
Context Creation (ZunoContext)
  ↓
ZunoDevTools Mount (displays logs/transactions)
  ↓
Child Components (access via hooks)
```

### Layer 2: React Integration Hooks

**Location:** `src/react/hooks/`

**21+ Custom Hooks:**

**SDK & Utility Hooks:**
- `useZunoSDK()` - Direct SDK instance access
- `useZunoLogger()` - Logger instance access
- `useWallet()` - Wallet connection (address, connect, disconnect)
- `useApprove()` - Token approval management
- `useBalance()` - Native token balance

**Feature Hooks (TanStack Query Integration):**
- `useExchange()` - Returns `{ listNFT, buyNFT, cancelListing }` mutations
- `useAuction()` - Returns `{ createEnglishAuction, placeBid, cancelAuction }` mutations
- `useCollection()` - Returns `{ createERC721, mintERC721, addToAllowlist }` mutations
- `useABIs()` - Fetch and cache ABIs with React Query

**Mutation Pattern:**
```typescript
export function useExchange() {
  const sdk = useZunoSDK();
  const queryClient = useQueryClient();

  const listNFT = useMutation({
    mutationFn: (params: ListNFTParams) =>
      sdk.exchange.listNFT(params),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
    onError: (error) => {
      console.error('List failed:', error);
    }
  });

  return { listNFT, /* other mutations */ };
}
```

**Benefits:**
- Automatic loading/error states
- Built-in retry with exponential backoff
- Query cache invalidation
- Optimistic updates support

### Layer 3: Feature Modules

**Location:** `src/modules/`

**ExchangeModule** (459 lines)
- `listNFT()` - Create fixed-price listing
- `buyNFT()` - Purchase listed NFT
- `cancelListing()` - Cancel own listing
- `getActiveListings()` - Paginated listings query
- `getListingsBySeller()` - Filter by seller address
- `batchListNFT()` - Create multiple listings in one tx
- `batchBuyNFT()` - Purchase multiple NFTs in one tx
- `batchCancelListing()` - Cancel multiple listings in one tx

**CollectionModule** (827 lines)
- `createERC721Collection()` - Deploy ERC721 with config
- `mintERC721()` - Mint with payment
- `addToAllowlist()` - Add addresses to allowlist
- `removeFromAllowlist()` - Remove addresses from allowlist
- `setAllowlistOnly()` - Toggle allowlist enforcement
- `isInAllowlist()` - Check if address allowed
- `getCollectionInfo()` - Fetch collection metadata

**AuctionModule** (948 lines)
- `createEnglishAuction()` - Ascending price auction
- `createDutchAuction()` - Descending price auction
- `placeBid()` - Bid on English auction
- `buyNow()` - Purchase from Dutch auction
- `cancelAuction()` - Cancel own auction
- `getAuctionInfo()` - Fetch auction details
- `batchCreateEnglishAuction()` - Create multiple English auctions
- `batchCancelAuction()` - Cancel multiple auctions

**Module Interactions:**
```
ExchangeModule
  ├── Validates parameters
  ├── Checks NFT approval (via ethers)
  ├── Gets contract from ContractRegistry
  ├── Calls contract method via signer
  ├── Manages transaction (TransactionManager)
  └── Returns listing ID and receipt

CollectionModule
  ├── Validates collection address
  ├── Gets ERC721 contract from registry
  ├── Handles payment (ETH to contract)
  ├── Mints NFT with recipient
  └── Returns token ID and receipt

AuctionModule
  ├── Validates auction parameters
  ├── Gets auction contract from registry
  ├── Locks NFT in contract
  ├── Manages bid placement and settlement
  └── Returns auction ID and receipt
```

### Layer 4: Core Infrastructure

**Location:** `src/core/`

#### ZunoSDK (524 lines)
Central orchestrator managing:
- Singleton instance
- Configuration validation
- Module lazy loading
- Provider/signer management
- Logger initialization
- Query client setup
- Event emitter for cross-module communication

```typescript
export class ZunoSDK extends EventEmitter {
  // Singleton access
  static getInstance(config?: ZunoSDKConfig, options?: SDKOptions): ZunoSDK

  // Configuration
  getConfig(): ZunoSDKConfig

  // Module access (lazy loaded)
  get exchange(): ExchangeModule
  get collection(): CollectionModule
  get auction(): AuctionModule
  get offers(): OffersModule    // Future
  get bundles(): BundlesModule  // Future

  // Provider management
  updateProvider(provider: ethers.Provider, signer?: ethers.Signer): void

  // Public logger instance
  public readonly logger: Logger
}
```

#### ZunoAPIClient (430 lines)
HTTP client for Zuno services:
- ABI fetching and caching
- Contract metadata lookup
- Network information
- Automatic retry with exponential backoff
- Error handling and timeout

```typescript
export class ZunoAPIClient {
  constructor(apiKey: string, baseUrl?: string)

  // ABI operations
  getABI(abiId: string): Promise<ContractABI>
  getABIById(id: string): Promise<ContractABI>

  // Contract metadata
  getContractInfo(chainId: number): Promise<ContractInfo>

  // Network info
  getNetworks(): Promise<NetworkInfo[]>
}
```

#### ContractRegistry (234 lines)
Contract and ABI management:
- Lazy loading from API
- Query-based caching (React Query)
- Contract instance creation
- ABI versioning support

```typescript
export class ContractRegistry {
  constructor(apiClient: ZunoAPIClient, queryClient: QueryClient)

  // Get contract instance
  getContract(
    contractName: string,
    chainId: number,
    provider: ethers.Provider
  ): Promise<ethers.Contract>

  // Get ABI
  getABI(abiId: string): Promise<ContractABI>
}
```

### Layer 5: Utilities

**Location:** `src/utils/`

#### ZunoLogger (150 lines)
Structured logging with in-memory store:
- Log levels: error, warn, info, debug
- Timestamp and module prefix support
- Custom logger integration (Sentry, Datadog)
- DevTools integration

```typescript
export class ZunoLogger implements Logger {
  constructor(config: LoggerConfig)

  info(message: string, meta?: LogMetadata): void
  warn(message: string, meta?: LogMetadata): void
  error(message: string, meta?: LogMetadata): void
  debug(message: string, meta?: LogMetadata): void
}

// Access logs programmatically
import { logStore } from 'zuno-marketplace-sdk';
const logs = logStore.getAll();
logStore.subscribe((newLogs) => { /* ... */ });
```

#### ZunoSDKError (80 lines)
Custom error class with context:
```typescript
export class ZunoSDKError extends Error {
  public readonly code: ErrorCode;
  public readonly context?: ErrorContext;
  public readonly originalError?: Error;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: ErrorCode,
    options?: { originalError?, context?, details? }
  )
}
```

#### TransactionManager (100 lines)
Transaction execution and monitoring:
- Gas estimation
- Transaction submission
- Receipt polling
- Retry logic with backoff

```typescript
export class TransactionManager {
  constructor(provider: ethers.Provider, signer?: ethers.Signer)

  async executeTransaction(
    txFn: () => Promise<ethers.ContractTransactionResponse>,
    options?: TransactionOptions
  ): Promise<TransactionReceipt>
}
```

#### EventEmitter (60 lines)
Simple pub/sub for cross-module events:
```typescript
export class EventEmitter {
  on(event: string, handler: Function): void
  off(event: string, handler: Function): void
  emit(event: string, data?: any): void
}
```

#### logStore & transactionStore (140 lines)
In-memory stores with subscriptions:
```typescript
export const logStore = {
  getAll(): LogEntry[],
  subscribe(callback: (logs: LogEntry[]) => void): () => void,
  clear(): void
}
```

---

## Data Flow Patterns

### NFT Listing Flow (Exchange Module)

```
User (React Component)
  ↓
useExchange().listNFT.mutateAsync(params)
  ↓
React Query Mutation
  ↓
sdk.exchange.listNFT(params)
  ↓
ExchangeModule
  ├─ Validate parameters
  ├─ Check NFT approval
  │  └─ Call ERC721.isApprovedForAll()
  ├─ Get Exchange contract from ContractRegistry
  │  └─ (Fetches ABI from ZunoAPIClient if needed)
  ├─ Call exchange.listNFT(params) via signer
  ├─ TransactionManager executes transaction
  │  ├─ Estimates gas
  │  ├─ Submits transaction
  │  └─ Polls for receipt
  ├─ Log operation to logStore
  ├─ Emit event: 'listing:created'
  └─ Return { listingId, tx }
  ↓
React Query invalidates related queries
  ↓
UI updates with success message
  ↓
logStore and DevTools reflect new logs
```

### Collection Minting Flow (Collection Module)

```
User Input
  ↓
useCollection().mintERC721.mutateAsync(params)
  ↓
CollectionModule
  ├─ Validate collection address & amount
  ├─ Get ERC721Collection contract
  ├─ Check wallet has sufficient ETH
  ├─ Call mint(recipient, uri) with value
  ├─ TransactionManager
  │  ├─ Gas estimation: 80k-120k
  │  ├─ Submit transaction
  │  ├─ Wait for confirmation (1-3 blocks)
  │  └─ Extract tokenId from receipt logs
  ├─ Log to logStore
  ├─ Emit event: 'nft:minted'
  └─ Return { tokenId, tx }
  ↓
React Query updates cache
  ↓
UI reflects new token
```

### Batch Auction Creation (Auction Module)

```
User Input (array of 1-20 auctions)
  ↓
useAuction().batchCreateEnglishAuction.mutateAsync(params)
  ↓
AuctionModule
  ├─ Validate array length <= 20
  ├─ Validate each auction parameters
  ├─ Check approval for all NFTs
  ├─ Get Auction contract
  ├─ Call batchCreateEnglishAuction(auctions[])
  ├─ TransactionManager
  │  ├─ Estimate gas: 150k + 50k per auction
  │  ├─ Submit batch transaction
  │  └─ Wait for confirmation
  ├─ Extract auction IDs from receipt logs
  ├─ Log batch operation
  └─ Return { auctionIds: [], tx }
  ↓
React Query invalidates auctions query
  ↓
UI updates with new auctions list
```

---

## Cache Strategy

### React Query Configuration
```
Stale Time (TTL):
├─ Regular data: 5 minutes (300s)
├─ Network data: 30 minutes (extended)
└─ Configurable per cache config

Garbage Collection (GC):
├─ Regular data: 10 minutes (600s)
├─ Network data: 1 hour (extended)
└─ Removes unused queries after GC time
```

### Caching Layers
1. **Query Cache:** React Query caches API responses
2. **Contract Registry:** Lazy-loads and caches contracts/ABIs
3. **logStore:** In-memory log buffer (200 entries max)
4. **Provider Cache:** ethers.js internal provider caching

### Cache Invalidation
```typescript
// Manual invalidation on mutation success
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: ['listings']
  });
}

// Partial invalidation for filters
queryClient.invalidateQueries({
  queryKey: ['listings'],
  exact: false // Invalidates all variants
});
```

---

## Error Handling Architecture

### Error Flow
```
Operation Error
  ↓
Catch in try-catch
  ↓
Wrap in ZunoSDKError (if needed)
  ├─ Add error code (50+ defined)
  ├─ Add context (method, contract, network)
  ├─ Add suggestion (user-facing)
  └─ Preserve original error
  ↓
Log to logStore
  ├─ Error level logging
  ├─ Include code and context
  └─ Display in DevTools
  ↓
Throw to caller
  └─ React component handles via onError
```

### Error Categories
```
1xxx - Configuration Errors
  INVALID_CONFIG, MISSING_API_KEY, INVALID_NETWORK

2xxx - API Errors
  API_REQUEST_FAILED, API_TIMEOUT, API_UNAUTHORIZED, API_RATE_LIMIT

3xxx - Contract Errors
  CONTRACT_NOT_FOUND, INVALID_ABI, CONTRACT_CALL_FAILED

4xxx - Transaction Errors
  TRANSACTION_FAILED, INSUFFICIENT_FUNDS, GAS_ESTIMATION_FAILED

5xxx - Validation Errors
  INVALID_ADDRESS, INVALID_TOKEN_ID, INVALID_AMOUNT

6xxx - Module Errors
  MODULE_NOT_INITIALIZED, OPERATION_NOT_SUPPORTED
```

---

## External Integrations

### Wagmi Integration (Wallet Connection)
```typescript
// ZunoProvider wraps WagmiProvider
<WagmiProvider config={config}>
  <ZunoContextProvider>
    <QueryClientProvider>
      <App />
    </QueryClientProvider>
  </ZunoContextProvider>
</WagmiProvider>

// Hooks access wallet state
const { address, connect } = useWallet();
// Internally uses useAccount from Wagmi
```

### React Query Integration
```typescript
// Queries cached with configurable TTL
const { data: listings } = useQuery({
  queryKey: ['listings'],
  queryFn: () => sdk.exchange.getActiveListings(),
  staleTime: DEFAULT_CACHE_TIMES.STALE_TIME,
  gcTime: DEFAULT_CACHE_TIMES.GC_TIME
});

// Mutations with retry
const listMutation = useMutation({
  mutationFn: (params) => sdk.exchange.listNFT(params),
  retry: 3, // Automatic retry
  retryDelay: (attempt) => Math.exp(2 ** attempt) * 1000
});
```

### ethers.js Integration
```typescript
// Provider for read operations
const provider = new ethers.JsonRpcProvider(rpcUrl);

// Signer for write operations
const signer = provider.getSigner();

// Contract instances
const contract = new ethers.Contract(address, abi, signer);
```

---

## Extensibility Points

### Adding New Modules
```typescript
// 1. Create module extending BaseModule
export class OffersModule extends BaseModule {
  // Implementation...
}

// 2. Add to ZunoSDK
private _offers?: OffersModule;

get offers(): OffersModule {
  if (!this._offers) {
    this._offers = new OffersModule(
      this.apiClient,
      this.contractRegistry,
      this.queryClient,
      this.config.network,
      this.logger,
      this.provider,
      this.signer
    );
  }
  return this._offers;
}

// 3. Create React hooks
export function useOffers() {
  const sdk = useZunoSDK();
  // Implementation...
}

// 4. Export from index
export { OffersModule } from './modules/OffersModule';
```

### Custom Logger Integration
```typescript
const config = {
  logger: {
    level: 'debug',
    customLogger: {
      error: (msg, meta) => Sentry.captureException(new Error(msg)),
      warn: (msg, meta) => Sentry.captureMessage(msg, 'warning'),
      info: (msg, meta) => myLogger.info(msg, meta),
      debug: (msg, meta) => myLogger.debug(msg, meta),
    }
  }
};
```

---

## Performance Considerations

### Bundle Size Optimization
- Tree-shakeable exports
- Lazy module loading
- Direct module imports: `import from 'zuno-marketplace-sdk/exchange'`
- External dependencies optimized (ethers 6 + viem)

### Transaction Performance
- Gas estimation caching
- Batch operations (up to 20 items)
- Retry with exponential backoff
- Provider-level caching

### Query Performance
- React Query deduplication
- TTL-based cache invalidation
- Pagination support in listing queries
- Indexed contract lookups

---

## Security Architecture

### Input Validation
- Address validation (checksumming)
- Token ID validation (numeric or bigint)
- Amount validation (no negative, max supply checks)
- Duration validation (reasonable time bounds)

### Transaction Safety
- Gas estimation before submission
- Signer required for write operations
- Transaction receipt verification
- Nonce handling in TransactionManager

### Error Information
- User-facing suggestions (no internals leaked)
- Original error preserved for debugging
- Context includes contract/method/network
- Sensitive data excluded from logs

---

## Monitoring & Observability

### Built-in Monitoring
- logStore with subscription support
- DevTools component for visual debugging
- Transaction tracking in transactionStore
- Event emitter for cross-module events

### Integration Points
- Custom logger integration (Sentry, DataDog, LogRocket)
- Analytics hooks for tracking events
- Error reporting with full context
- Performance metrics logging

---

## Module Dependencies & Initialization Order

```
App Start
  ↓
Create ZunoSDK instance
  ├─ Initialize ZunoAPIClient
  ├─ Initialize ContractRegistry
  ├─ Create QueryClient (or use provided)
  ├─ Initialize ZunoLogger
  └─ Set provider/signer
  ↓
First module access (e.g., sdk.exchange)
  ├─ Create ExchangeModule instance
  ├─ Initialize TransactionManager
  └─ Ready for operations
  ↓
React: ZunoProvider initialization
  ├─ Create Wagmi config
  ├─ Initialize QueryClient
  ├─ Create ZunoContext
  └─ Mount child components
  ↓
Component: Hook usage
  ├─ useZunoSDK() returns SDK instance
  ├─ useMutation() wraps SDK methods
  └─ React Query manages state
```

---

## Key Architectural Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Singleton Pattern | Single SDK instance, centralized config | Less flexibility for multi-app scenarios |
| Lazy Module Loading | Reduce initial load time | Slight complexity in getter methods |
| React Query Integration | Built-in caching, deduplication, retry | Dependency on React Query |
| ethers.js v6 | Modern API, smaller bundle | Breaking change from v5 |
| Custom Error Class | Rich context for debugging | Additional error wrapping overhead |
| In-memory Log Store | Fast logging, DevTools integration | Limited to session duration |
| Wagmi Integration | Standard in React web3 apps | Wagmi dependency required |

---

## Architecture Roadmap

**Current State (v2.0.1):** Exchange, Auction, Collection modules + React hooks

**Future Enhancements:**
1. **Offers Module:** Make/accept/decline offers
2. **Bundles Module:** Bundle multiple NFTs with single price
3. **ERC1155 Support:** Semi-fungible token operations
4. **Subgraph Integration:** Event indexing and querying
5. **Advanced Analytics:** Transaction history, market metrics
6. **WebSocket Support:** Real-time event subscriptions
7. **Offline Mode:** Local transaction queue with sync
