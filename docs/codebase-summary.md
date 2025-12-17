# Codebase Summary

**Version:** 2.0.1-beta-claude.1
**Last Updated:** 2025-12-07
**Repository:** https://github.com/ZunoKit/zuno-marketplace-sdk

---

## Overview

Zuno Marketplace SDK is a comprehensive TypeScript SDK for building NFT marketplace applications. The codebase consists of:

- **52 TypeScript files** (12,331 lines of code)
- **Modular architecture** with clear separation of concerns
- **Full TypeScript strict mode** compliance
- **70% test coverage** requirement
- **Multiple export points** for tree-shakeable imports

---

## Codebase Statistics

| Metric | Value | Notes |
|--------|-------|-------|
| Total TypeScript Files | 52 | .ts and .tsx files |
| Total Lines of Code | 12,331 | Source code only (excluding tests) |
| Core Infrastructure | 1,188 LOC | ZunoSDK, APIClient, ContractRegistry |
| Feature Modules | 2,408 LOC | Exchange, Collection, Auction modules |
| React Integration | 1,200+ LOC | Hooks, Providers, Components |
| Type Definitions | 851 LOC | Config, Entities, API types, Contracts |
| Utilities | 1,533 LOC | Logger, Errors, Transactions, Events |
| Tests | Parallel | Jest test files parallel to src |
| Bundle Size | < 100KB | Gzipped (main entry point) |

---

## Directory Structure & File Organization

### `/src` Root Files

**`index.ts`** (54 lines)
- Main entry point exports
- Core SDK classes (ZunoSDK, APIClient, ContractRegistry)
- Module classes and types
- Utility exports (Logger, Errors, EventEmitter)
- Query factory functions

### `/src/core` - Core Infrastructure (1,188 LOC)

**`ZunoSDK.ts`** (524 lines)
- Main SDK orchestrator class
- Singleton pattern implementation
- Module lazy loading (exchange, collection, auction)
- Provider/signer management
- Logger initialization
- Query client setup
- Event emitter for cross-module communication
- Provider update for wallet switching

**`ZunoAPIClient.ts`** (430 lines)
- HTTP client using axios
- ABI fetching and caching
- Contract metadata API
- Network information endpoint
- Retry logic (linear/exponential backoff)
- Error handling with timeout
- Request/response typing

**`ContractRegistry.ts`** (234 lines)
- Contract instance caching and management
- ABI lazy loading from API
- Contract address lookup per chain
- React Query integration for caching
- Contract instance creation via ethers
- Error handling for missing contracts/ABIs

### `/src/modules` - Feature Modules (2,408 LOC)

**`BaseModule.ts`** (90 lines)
- Abstract base class for all feature modules
- Shared dependencies injection
- Provider/signer management
- TransactionManager initialization
- Helper methods: ensureProvider, ensureSigner, ensureTxManager
- Network ID getter

**`ExchangeModule.ts`** (459 lines)
- Fixed-price NFT listing operations
- Listing, buying, cancellation flows
- Approval management (ERC721.setApprovalForAll)
- Batch operations (up to 20 items)
- Paginated listing queries
- Seller filtering
- Transaction management and logging

Key Methods:
- `listNFT()` - Create fixed-price listing
- `buyNFT()` - Purchase listed NFT
- `cancelListing()` - Cancel own listing
- `getActiveListings()` - Paginated query
- `getListingsBySeller()` - Filter by seller
- `batchListNFT()` - Create multiple listings
- `batchBuyNFT()` - Purchase multiple NFTs
- `batchCancelListing()` - Cancel multiple listings

**`CollectionModule.ts`** (827 lines)
- ERC721 collection creation and management
- Minting with ETH payment
- Allowlist management (add/remove/check)
- Allowlist enforcement toggle
- Collection metadata retrieval
- Mint limit per wallet enforcement
- Default values: mintLimitPerWallet defaults to maxSupply

Key Methods:
- `createERC721Collection()` - Deploy new ERC721
- `mintERC721()` - Mint with payment
- `addToAllowlist()` - Allowlist addresses
- `removeFromAllowlist()` - Remove from allowlist
- `setAllowlistOnly()` - Toggle enforcement
- `isInAllowlist()` - Check allowlist status
- `getCollectionInfo()` - Fetch metadata

**`AuctionModule.ts`** (948 lines)
- English auction (ascending price, time extension)
- Dutch auction (descending price, automatic settlement)
- Bid placement and tracking
- Auction cancellation
- Reserve price support
- Batch auction operations (max 20)
- Batch cancellation
- NFT automatic transfer on settlement

Key Methods:
- `createEnglishAuction()` - Create ascending auction
- `createDutchAuction()` - Create descending auction
- `placeBid()` - Bid on English auction
- `buyNow()` - Purchase from Dutch auction
- `cancelAuction()` - Cancel own auction
- `getAuctionInfo()` - Fetch auction details
- `batchCreateEnglishAuction()` - Create multiple English
- `batchCancelAuction()` - Cancel multiple auctions

### `/src/types` - Type Definitions (851 LOC)

**`config.ts`** (152 lines)
- `ZunoSDKConfig` - Main SDK configuration interface
- `SDKOptions` - Optional initialization parameters
- `CacheConfig` - React Query cache settings
- `RetryPolicy` - Retry strategy configuration
- `NetworkType` - Supported networks (mainnet, sepolia, polygon, arbitrum, custom)
- `DEFAULT_CACHE_TIMES` - Cache TTL constants using `ms` library
- LoggerConfig re-export

**`entities.ts`** (110 lines)
- `Listing` - NFT listing entity
- `Auction` - Auction information entity
- `AuctionBid` - Bid entity
- `TransactionReceipt` - Transaction result entity
- `CollectionInfo` - Collection metadata entity
- `NFT` - NFT entity with metadata

**`api.ts`** (72 lines)
- `ABI` - Contract ABI definition
- `ContractABI` - ABI with metadata
- `ContractInfo` - Contract address and network info
- `NetworkInfo` - Network configuration
- API response type interfaces

**`contracts.ts`** (181 lines)
- `ListNFTParams` - List operation parameters
- `BuyNFTParams` - Buy operation parameters
- `CancelListingParams` - Cancellation parameters
- `BatchListNFTParams` - Batch listing parameters
- `CreateEnglishAuctionParams` - Auction parameters
- `PlaceBidParams` - Bid parameters
- `MintERC721Params` - Minting parameters
- `AddToAllowlistParams` - Allowlist parameters
- `TransactionOptions` - Gas and transaction settings
- All parameters with JSDoc documentation

**`index.ts`** (10 lines)
- Re-exports all types for cleaner imports

### `/src/react` - React Integration (1,200+ LOC)

#### `/src/react/provider` - Context & Providers

**`ZunoProvider.tsx`** (150+ lines)
- All-in-one provider wrapping Wagmi + React Query + Zuno
- Wagmi config creation with chain selection
- Wallet connector setup (injected, WalletConnect, Coinbase)
- QueryClient initialization with cache config
- Auto-initialization of ZunoSDK
- Dev tools support toggle
- For simple apps without existing Wagmi setup

**`ZunoContextProvider.tsx`** (100+ lines)
- Context-based provider for existing Wagmi setups
- Accepts pre-initialized SDK instance
- Provides ZunoContext for hooks
- Minimal dependencies approach
- For advanced setups with custom Wagmi config

#### `/src/react/hooks` - Custom Hooks (1,000+ LOC total)

**`useZunoSDK.ts`** (35 lines)
- Direct access to singleton SDK instance
- Returns `ZunoSDK` for advanced usage
- Throws if SDK not initialized
- Used by all other hooks internally

**`useWallet.ts`** (98 lines)
- Wallet connection management
- Returns: `{ address, isConnected, connect, disconnect, isConnecting }`
- Uses Wagmi internally (useAccount, useConnect, useDisconnect)
- Wallet switching support
- MultiCoin wallet integration

**`useExchange.ts`** (126 lines)
- Returns mutation objects for exchange operations
- `{ listNFT, buyNFT, cancelListing }`
- Each returns React Query mutation with loading/error states
- Automatic query invalidation on success
- Error handling with user-friendly messages

**`useAuction.ts`** (156 lines)
- Auction operations mutations
- `{ createEnglishAuction, createDutchAuction, placeBid, buyNow, cancelAuction }`
- Batch mutation support
- Gas estimation feedback
- Auction info caching

**`useCollection.ts`** (174 lines)
- Collection operations mutations
- `{ createERC721, mintERC721, addToAllowlist, removeFromAllowlist, setAllowlistOnly, isInAllowlist, getCollectionInfo }`
- Mint payment handling
- Allowlist management mutations
- Collection metadata caching

**`useApprove.ts`** (92 lines)
- ERC20/ERC721 approval management
- Check approval status
- Request user approval
- Approval revocation
- Gas estimation for approval tx

**`useABIs.ts`** (90 lines)
- Fetch ABIs from Zuno API
- React Query integration with caching
- ABI by ID or name lookup
- Error handling for missing ABIs
- Automatic retry on failure

**`useBalance.ts`** (15 lines)
- Native token balance query
- Returns `{ balance, isLoading }`
- Ethereum balance fetching
- Refreshable on demand

**`useZunoLogger.ts`** (28 lines)
- Access to logger instance
- Manual logging capability
- Log level configuration access
- Context-aware logging

#### `/src/react/components` - React Components

**`ZunoDevTools.tsx`** (200+ lines)
- Visual debugging panel component
- Displays logs in real-time
- Shows transaction tracking
- React Query cache visualization
- Network status indicator
- Floating panel (position configurable)
- Dev-only component
- Max log entries configurable

### `/src/utils` - Utility Modules (1,533 LOC)

**`logger.ts`** (180 lines)
- `ZunoLogger` class with log levels
- `createNoOpLogger()` for disabled logging
- Log level support: none, error, warn, info, debug
- Timestamp and module prefix options
- Custom logger integration (Sentry, Datadog, LogRocket)
- Context setting for error correlation
- LoggerConfig interface and types

**`logStore.ts`** (85 lines)
- In-memory log storage with subscription
- `getAll()` - Get all logged entries
- `subscribe(callback)` - Subscribe to new logs
- `clear()` - Clear log buffer
- Max 200 entries with rotation
- Used by DevTools for log display
- Singleton pattern

**`errors.ts`** (120 lines)
- `ZunoSDKError` custom error class
- 50+ error codes organized by category
  - 1xxx: Configuration errors
  - 2xxx: API errors
  - 3xxx: Contract errors
  - 4xxx: Transaction errors
  - 5xxx: Validation errors
  - 6xxx: Module errors
- Error context object with debugging info
- Validation helpers (validateAddress, validateTokenId, etc.)
- ErrorCode type definition

**`transactions.ts`** (150 lines)
- `TransactionManager` class
- Gas estimation before submission
- Transaction submission and receipt polling
- Retry logic with backoff strategy
- Nonce management
- Transaction status tracking
- Timeout handling
- Network error recovery

**`events.ts`** (60 lines)
- `EventEmitter` class for pub/sub
- `on(event, handler)` - Subscribe to event
- `off(event, handler)` - Unsubscribe
- `emit(event, data)` - Publish event
- Used for cross-module communication
- No external dependencies

**`transactionStore.ts`** (90 lines)
- In-memory transaction tracking store
- `addTransaction()` - Track new transaction
- `updateStatus()` - Update transaction status
- `getAll()` - Retrieve all transactions
- `subscribe()` - Subscribe to changes
- Status: pending, confirmed, failed
- Used by DevTools and analytics

### `/src/__tests__` - Test Files

**Test Coverage Areas (70% threshold):**

**Core Tests:**
- `core/ZunoSDK.test.ts` - SDK instantiation, singleton pattern
- `core/ZunoAPIClient.test.ts` - API communication
- `core/ContractRegistry.test.ts` - Contract caching

**Module Tests:**
- `modules/BaseModule.test.ts` - Base functionality
- `modules/ExchangeModule.test.ts` - Listing/buying operations
- `modules/CollectionModule.test.ts` - Collection/minting operations
- `modules/AuctionModule.test.ts` - Auction operations

**React Tests:**
- `react/useZunoSDK.test.tsx` - SDK hook
- `react/useExchange.test.tsx` - Exchange mutations
- `react/useAuction.test.tsx` - Auction mutations
- `react/useCollection.test.tsx` - Collection mutations
- `react/useWallet.test.tsx` - Wallet connection

**Utility Tests:**
- `utils/errors.test.ts` - Error handling
- `utils/logStore.test.ts` - Log storage
- `utils/logger-utils.test.ts` - Logger functionality

**Integration Tests:**
- `edge-cases.test.ts` - Production patterns
- `testing-utils.test.ts` - Test helpers

**Test Setup:**
- `setup/jest.config.js` - Jest configuration
- `setup/mocks/` - Global mocks for axios, ethers
- `setup/factories/` - Mock entity factories

### `/src/testing` - Testing Utilities

**`index.ts`** (100+ lines)
- Mock factory functions for testing
- `createMockProvider()` - ethers provider mock
- `createMockSigner()` - ethers signer mock
- `createMockNFT()` - NFT entity factory
- `createMockListing()` - Listing entity factory
- `createMockApiClient()` - API client mock
- Re-exports Jest matchers and utilities

---

## Key Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `ethers` | ^6.13.0 | Blockchain interaction and signing |
| `wagmi` | ^2.12.0 | Wallet connection and React hooks |
| `@wagmi/core` | ^2.13.0 | Core wagmi utilities |
| `@wagmi/connectors` | ^5.1.0 | Wallet connectors (MetaMask, WalletConnect, etc.) |
| `viem` | ^2.21.0 | Low-level Ethereum client |
| `@tanstack/react-query` | ^5.59.0 | Query management and caching |
| `axios` | ^1.7.0 | HTTP client for API calls |
| `ms` | ^2.1.3 | Millisecond string parsing (cache config) |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.6.0 | TypeScript compiler |
| `jest` | ^29.7.0 | Test framework |
| `ts-jest` | ^29.2.0 | TypeScript support for Jest |
| `@testing-library/react` | ^16.0.0 | React component testing |
| `eslint` | ^9.0.0 | Code linting |
| `@typescript-eslint/parser` | ^8.0.0 | TypeScript ESLint parser |
| `tsup` | ^8.3.0 | Build tool (ES modules + CommonJS) |
| `semantic-release` | ^25.0.2 | Automated versioning and publishing |

### Peer Dependencies

| Package | Required | Purpose |
|---------|----------|---------|
| `react` | ^18.0.0 \| ^19.0.0 | React framework |
| `react-dom` | ^18.0.0 \| ^19.0.0 | React DOM rendering |

---

## Build Configuration

### tsup.config.js
- Builds to multiple formats: ESM (.mjs), CommonJS (.js), Types (.d.ts)
- Tree-shakeable exports
- 7 entry points:
  - `./` (main)
  - `./react`
  - `./exchange`
  - `./auction`
  - `./collection`
  - `./logger`
  - `./testing`

### Package.json Exports
```json
{
  ".": "Main entry (full SDK)",
  "./react": "React hooks and providers",
  "./exchange": "Exchange module only",
  "./auction": "Auction module only",
  "./collection": "Collection module only",
  "./logger": "Logger utilities",
  "./testing": "Test helpers"
}
```

### TypeScript Configuration
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- JSX: React (for .tsx files)
- Declaration files generated
- Source maps for debugging

---

## Module Export Map

### Main Entry (`zuno-marketplace-sdk`)
Exports everything: core, modules, types, utilities, React integration

### React Entry (`zuno-marketplace-sdk/react`)
Exports:
- `ZunoProvider`
- `ZunoContextProvider`
- `useZunoSDK`, `useWallet`, `useExchange`, `useAuction`, `useCollection`
- `useApprove`, `useBalance`, `useABIs`, `useZunoLogger`
- `ZunoDevTools`

### Feature Entries
- `/exchange` - ExchangeModule + types
- `/auction` - AuctionModule + types
- `/collection` - CollectionModule + types
- `/logger` - ZunoLogger, logStore
- `/testing` - Mock factories, test utilities

---

## Code Metrics & Standards

### File Size Distribution
- Most files: < 200 lines (guideline)
- Core files (ZunoSDK, modules): 400-950 lines (justified complexity)
- Utility files: 30-180 lines (focused)
- React hooks: 15-175 lines (single purpose)

### TypeScript Compliance
- Strict mode: 100% enabled
- No `any` types in public APIs
- Full type coverage for contracts
- Generic type constraints documented
- JSDoc on all public exports

### Error Handling
- 50+ specific error codes
- Try-catch in all async operations
- ZunoSDKError with context
- Original error preservation
- User-facing suggestions

### Testing
- 70% coverage threshold
- Jest with ts-jest
- React Testing Library for components
- Mock factories for entities
- Global axios mock setup
- Integration tests for edge cases

---

## Important Files to Know

| File | Purpose | Impact |
|------|---------|--------|
| `src/core/ZunoSDK.ts` | Main SDK orchestrator | Central to all operations |
| `src/types/config.ts` | Configuration types | Defines SDK config contract |
| `src/modules/BaseModule.ts` | Module base class | All modules extend this |
| `src/react/hooks/useZunoSDK.ts` | SDK access | Used by all other hooks |
| `src/utils/errors.ts` | Error definitions | Referenced throughout |
| `src/utils/logger.ts` | Logging system | Debugging and monitoring |
| `package.json` | Entry points and build | Controls module access |

---

## Performance Characteristics

### Initial Load
- ZunoSDK initialization: ~10ms
- Module lazy loading: ~5ms on first access
- Provider creation: varies (RPC dependent)

### Runtime
- API call caching via React Query
- Contract registry lazy loading
- Batch operations for efficiency
- Exponential backoff retry strategy
- Gas estimation on-demand

### Memory
- Singleton SDK instance
- QueryClient with configurable GC
- Log buffer: 200 entries max
- Transaction store: unbounded but in-memory

---

## Notable Implementation Details

### Singleton Pattern
- Module-level `_singletonInstance` variable
- `getInstance()` factory method
- Supports both React and non-React contexts
- Provider/signer can be updated at runtime

### Lazy Module Loading
- Modules created on first property access
- Getter pattern with cached instance
- New modules easily added (offers, bundles)

### React Query Integration
- Default cache: 5 min (stale), 10 min (GC)
- Extended cache: 30 min (stale), 1 hour (GC)
- Query key factories for consistency
- Mutation invalidation on write success

### Custom Logger Integration
- No hard dependency on logging library
- Pluggable custom logger interface
- Sentry, DataDog, LogRocket compatible
- In-memory store for DevTools

---

## Future Extension Points

1. **New Modules:** Offers, Bundles (structure ready)
2. **Network Support:** Testnet, Polygon, Arbitrum integration
3. **ABI Management:** Custom ABI support
4. **Event Indexing:** Subgraph integration
5. **Analytics:** Market metrics and user analytics
6. **WebSocket:** Real-time event subscriptions
7. **Offline Mode:** Transaction queue with sync

---

## Version & Release Info

- **Current Version:** 2.0.1-beta-claude.1
- **Major Version:** 2 (React Query 5, Wagmi 2, ethers 6)
- **Release Strategy:** Semantic versioning with beta tags
- **CI/CD:** GitHub Actions with semantic-release
- **Package Manager:** npm (npmjs.org)
- **Node Requirement:** >= 18.0.0 (LTS)
