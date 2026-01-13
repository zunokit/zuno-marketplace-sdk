# Zuno Marketplace SDK - Codebase Summary

## Overview

The Zuno Marketplace SDK is a modular TypeScript library built with ~8,555 lines of code across 41 source files. The codebase follows a clean architecture pattern with clear separation of concerns between core SDK functionality, business logic modules, React integration, and utilities.

**Last Updated:** 2026-01-14
**Total LOC:** ~8,555 lines (TypeScript)
**Source Files:** 41 files
**Language:** TypeScript 5.6+
**Build System:** tsup (esbuild)

---

## Directory Structure

```
zuno-marketplace-sdk/
├── src/
│   ├── core/              # Core SDK infrastructure (3 files)
│   ├── modules/           # Business logic modules (4 files)
│   ├── react/             # React integration (15+ files)
│   ├── types/             # TypeScript type definitions (6 files)
│   ├── utils/             # Utility functions (9 files)
│   ├── auction/           # Auction module exports
│   ├── collection/        # Collection module exports
│   ├── exchange/          # Exchange module exports
│   ├── logger/            # Logger module exports
│   ├── testing/           # Testing utilities exports
│   ├── index.ts           # Main SDK entry point
│   └── __tests__/         # Unit and integration tests (20+ files)
├── docs/                  # Documentation
├── examples/              # Usage examples
├── tests/                 # Additional test setup
├── dist/                  # Build output (CJS + ESM)
└── configuration files    # tsconfig, eslint, jest, etc.
```

---

## Module Organization

### 1. Core Infrastructure (`src/core/`)

**Purpose:** Foundation for SDK operations

| File | LOC | Purpose |
|------|-----|---------|
| `ZunoSDK.ts` | ~521 | Main SDK class (singleton pattern, module lazy-loading) |
| `ZunoAPIClient.ts` | ~431 | HTTP client for Registry API (ABI/contract fetching) |
| `ContractRegistry.ts` | ~235 | Contract instance caching with TanStack Query |

**Key Responsibilities:**
- Singleton SDK instance management
- Provider/signer initialization
- API key authentication
- Contract deployment address fetching
- ABI caching and retrieval
- Contract instance creation and caching

---

### 2. Business Logic Modules (`src/modules/`)

**Purpose:** Feature-specific marketplace operations

| File | LOC | Purpose |
|------|-----|---------|
| `BaseModule.ts` | ~176 | Abstract base class (template method pattern) |
| `ExchangeModule.ts` | ~624 | NFT listing, buying, canceling (11 public methods) |
| `CollectionModule.ts` | ~1,046 | Collection creation, minting, allowlist (18 public methods) |
| `AuctionModule.ts` | ~1,072 | English/Dutch auctions, bidding, settlement (13 public methods) |

**BaseModule Dependencies (7 injected):**
1. `ZunoAPIClient` - API communication
2. `ContractRegistry` - Contract access
3. `QueryClient` - Caching
4. `NetworkType` - Network configuration
5. `Logger` - Logging
6. `EventEmitter` - Event emission
7. `Provider/Signer` - Web3 interaction

**Module Features:**

**ExchangeModule:**
- List NFTs (single + batch up to 20)
- Buy NFTs from listings
- Cancel listings
- Query active listings
- Query listings by seller

**CollectionModule:**
- Create ERC721/ERC1155 collections (v2.2.0 auto-detection)
- Mint NFTs (with payment)
- Allowlist management (add/remove addresses, setupAllowlist)
- Owner-only minting (ownerMint)
- Set allowlist-only mode
- Query collection info
- Query user-owned tokens
- Check allowlist status

**AuctionModule:**
- Create English auctions (single + batch)
- Create Dutch auctions (single + batch)
- Place bids (English)
- Buy now (Dutch)
- Cancel auctions (single + batch)
- Settle auctions
- Calculate Dutch auction price
- Query auction details
- Query pending refunds

---

### 3. React Integration (`src/react/`)

**Purpose:** React hooks and providers for UI development

#### Hooks (`src/react/hooks/` - 11 files)

| Hook | Purpose | Returns |
|------|---------|---------|
| `useZunoSDK` | Access SDK instance | `ZunoSDK` |
| `useZunoLogger` | Access logger | `Logger` |
| `useWallet` | Wallet connection | `{ address, connect, isConnected, connector }` |
| `useBalance` | ETH/ERC20 balance | `{ balance, refetch }` |
| `useExchange` | Exchange operations | `{ listNFT, buyNFT, cancelListing }` (mutations) |
| `useCollection` | Collection operations | `{ createERC721, mintERC721, addToAllowlist, ... }` |
| `useAuction` | Auction operations | `{ createEnglishAuction, placeBid, buyNow, ... }` |
| `useABIs` | ABI caching | `{ prefetch, initialize, getCached }` |
| `useApprove` | ERC721 approval | `{ approve, isApproved }` |
| `useSignerSync` | Wagmi signer sync | Syncs wagmi signer to SDK |
| `useListing` | Single listing query | `{ listing, isLoading, error }` |
| `useListings` | Paginated listings | `{ items, total, isLoading, error }` |
| `useListingsBySeller` | Seller's listings | `{ items, isLoading, error }` |
| `useCollectionInfo` | Collection metadata | `{ collection, isLoading, error }` |
| `useCreatedCollections` | User's collections | `{ collections, isLoading, error }` |
| `useUserOwnedTokens` | User's NFTs | `{ tokens, isLoading, error }` |
| `useIsInAllowlist` | Allowlist status | `{ isAllowed, isLoading, error }` |
| `useIsAllowlistOnly` | Allowlist mode | `{ isAllowlistOnly, isLoading, error }` |
| `useAuctionDetails` | Auction metadata | `{ auction, isLoading, error }` |
| `useDutchAuctionPrice` | Current Dutch price | `{ price, calculatePrice }` |
| `usePendingRefund` | Bid refund status | `{ refund, isLoading, error }` |

**Total Hooks:** 21+

#### Providers (`src/react/provider/`)

| Provider | Purpose |
|----------|---------|
| `ZunoProvider` | All-in-one provider (Wagmi config + SDK + QueryClient) |
| `ZunoContextProvider` | SDK instance context for manual SDK initialization |
| `WagmiProviderSync` | SSR-safe provider sync (v2.1.0+) |
| `WagmiSignerSync` | Syncs Wagmi signer to SDK (auto-updates on wallet change) |

#### Components (`src/react/components/`)

| Component | Purpose |
|-----------|---------|
| `ZunoDevTools` | In-app debugging panel with 4 tabs: Logs, Transactions, Cache, Network |

**DevTools Features:**
- Real-time log viewing (filtered by level)
- Transaction history with status
- React Query cache inspection
- Network status display
- Configurable position (bottom-right, bottom-left, etc.)
- Max log entries limit (default: 200)

#### Utilities (`src/react/utils/`)

| File | Purpose |
|------|---------|
| `chains.ts` | Convert network names to Wagmi Chain objects |
| `connectors.ts` | Create WalletConnect, MetaMask, Coinbase Wallet connectors |
| `index.ts` | Utility exports |

---

### 4. Type Definitions (`src/types/`)

**Purpose:** TypeScript types for SDK entities and configurations

| File | LOC | Purpose |
|------|-----|---------|
| `config.ts` | ~150 | SDK configuration, network types, cache settings |
| `entities.ts` | ~200 | Listing, Collection, Auction, Offer entities |
| `contracts.ts` | ~100 | Contract parameter types |
| `api.ts` | ~100 | API request/response types |
| `index.ts` | ~50 | Type exports barrel file |

**Key Types:**
- `ZunoSDKConfig`: SDK initialization options
- `Listing`: NFT listing entity
- `Collection`: NFT collection entity
- `Auction`: Auction entity (English/Dutch)
- `NetworkType`: Supported networks (string or number)
- `LoggerConfig`: Logging configuration

---

### 5. Utilities (`src/utils/`)

**Purpose:** Shared utility functions and helpers

| File | LOC | Purpose |
|------|-----|---------|
| `logger.ts` | ~250 | ZunoLogger class (5 levels, custom logger support) |
| `errors.ts` | ~150 | ZunoSDKError class, error codes categorization |
| `transactions.ts` | ~200 | TransactionManager (retry, gas estimation, submission) |
| `events.ts` | ~50 | EventEmitter class (pub/sub pattern) |
| `batch.ts` | ~100 | Batch operation helpers (chunk arrays, max 20) |
| `batchProgress.ts` | ~100 | BatchProgressTracker (progress tracking) |
| `logStore.ts` | ~100 | In-memory log store with subscriptions |
| `transactionStore.ts` | ~100 | In-memory transaction store |
| `helpers.ts` | ~50 | Utility functions (formatting, validation) |

**Error Categories:**
- `NETWORK`: RPC/network failures
- `CONTRACT`: Contract call failures
- `VALIDATION`: Input validation failures
- `AUTHENTICATION`: API key failures
- `NOT_FOUND`: Resource not found
- `UNKNOWN`: Unexpected errors

---

### 6. Module Exports

**Purpose:** Public API entry points for tree-shaking

#### Main SDK (`src/index.ts`)
```typescript
export { ZunoSDK, getSdk, getLogger } from './core/ZunoSDK';
export { ZunoLogger } from './utils/logger';
export type * from './types';
export { logStore, transactionStore } from './utils';
```

#### React (`src/react/index.ts`)
Exports all hooks, providers, components, and utilities

#### Exchange (`src/exchange/index.ts`)
Exports `ExchangeModule` for standalone use

#### Auction (`src/auction/index.ts`)
Exports `AuctionModule` for standalone use

#### Collection (`src/collection/index.ts`)
Exports `CollectionModule` for standalone use

#### Logger (`src/logger/index.ts`)
Exports `ZunoLogger` for standalone logging

#### Testing (`src/testing/index.ts`)
Exports mock factories and testing utilities

---

## Entry Points & Exports

### Package Exports (7 entry points)

| Export Path | Types | Import | Require | Purpose |
|-------------|-------|--------|---------|---------|
| `.` | `./dist/index.d.ts` | `./dist/index.mjs` | `./dist/index.js` | Main SDK |
| `./react` | `./dist/react/index.d.ts` | `./dist/react/index.mjs` | `./dist/react/index.js` | React integration |
| `./exchange` | `./dist/exchange/index.d.ts` | `./dist/exchange/index.mjs` | `./dist/exchange/index.js` | Exchange module |
| `./auction` | `./dist/auction/index.d.ts` | `./dist/auction/index.mjs` | `./dist/auction/index.js` | Auction module |
| `./collection` | `./dist/collection/index.d.ts` | `./dist/collection/index.mjs` | `./dist/collection/index.js` | Collection module |
| `./logger` | `./dist/logger/index.d.ts` | `./dist/logger/index.mjs` | `./dist/logger/index.js` | Logger utility |
| `./testing` | `./dist/testing/index.d.ts` | `./dist/testing/index.mjs` | `./dist/testing/index.js` | Testing utilities |

### Build Output Format

**tsup Configuration:**
- **Formats:** CommonJS (`.js`) + ESM (`.mjs`)
- **Declarations:** `.d.ts` with inline source maps
- **Source Maps:** `.js.map` and `.mjs.map`
- **Banner:** `"use client";` for all outputs (Next.js app directory support)
- **External Dependencies:** react, ethers, wagmi, viem, axios, @tanstack/*
- **Tree Shaking:** Enabled (treeshake: true)
- **Code Splitting:** Disabled (splitting: false) - single file per entry point

---

## Key Components & Their Purposes

### 1. ZunoSDK (Core)

**Purpose:** Singleton SDK instance with lazy-loaded modules

**Key Methods:**
- `getInstance(config)`: Get/create singleton instance
- `get exchange()`: Lazy-load ExchangeModule
- `get collection()`: Lazy-load CollectionModule
- `get auction()`: Lazy-load AuctionModule
- `setProvider(provider)`: Update Ethereum provider
- `setSigner(signer)`: Update signer
- `getConfig()`: Get current configuration
- `getNetwork()`: Get current network

**v2.1.0+ Features:**
- WagmiProviderSync integration for SSR support
- Transaction retry logic via TransactionStore
- Enhanced error handling and recovery

**Design Pattern:** Singleton + Lazy Loading

---

### 2. ZunoAPIClient

**Purpose:** HTTP client for Registry API

**Key Methods:**
- `getABI(contractName)`: Fetch contract ABI
- `getContractAddress(contractName, network)`: Fetch deployment address
- `getNetworks()`: List supported networks

**Features:**
- Axios-based HTTP client
- API key authentication (Bearer token)
- TanStack Query integration for caching
- Error handling with retry logic
- Approval caching (v2.1.0+)

---

### 3. ContractRegistry

**Purpose:** Cache and manage contract instances

**Key Methods:**
- `getContract(address, abi)`: Get cached contract instance
- `getContractByName(name, network)`: Get contract by name
- `invalidateCache()`: Clear all cached contracts

**Features:**
- TanStack Query for caching (5-min TTL)
- ERC165 interface verification
- Automatic ABI fetching
- Contract instance pooling

---

### 4. ExchangeModule

**Purpose:** NFT marketplace operations

**Key Methods:**
- `listNFT(params)`: Create listing
- `buyNFT(listingId)`: Buy from listing
- `cancelListing(listingId)`: Cancel listing
- `getActiveListings(page, limit)`: Query active listings
- `getListingsBySeller(address, page, limit)`: Query seller's listings
- `batchListNFTs(params)`: Batch list (max 20)

**Contract:** ERC721NFTExchange (Zuno-deployed)

---

### 5. CollectionModule

**Purpose:** NFT collection management

**Key Methods:**
- `createERC721Collection(params)`: Deploy ERC721 collection
- `createERC1155Collection(params)`: Deploy ERC1155 collection (v2.2.0)
- `mintERC721(params)`: Mint ERC721 with payment
- `mintERC1155(params)`: Mint ERC1155 with payment (v2.2.0)
- `setupAllowlist(params)`: Configure allowlist settings (v2.2.0)
- `ownerMint(params)`: Owner-only minting (v2.2.0)
- `addToAllowlist(params)`: Add addresses to allowlist
- `removeFromAllowlist(params)`: Remove addresses
- `setAllowlistOnly(params)`: Enable/disable allowlist-only mode
- `isInAllowlist(params)`: Check allowlist status
- `getCollectionInfo(address)`: Query collection metadata
- `getUserOwnedTokens(address)`: Query user's NFTs
- `batchMintERC721(params)`: Batch mint (max 20)

**Contracts:** ERC721CollectionFactory, ERC1155CollectionFactory (Zuno-deployed)

---

### 6. AuctionModule

**Purpose:** Auction system operations

**Key Methods:**
- `createEnglishAuction(params)`: Create English auction
- `createDutchAuction(params)`: Create Dutch auction
- `placeBid(params)`: Bid on English auction
- `buyNow(auctionId)`: Buy from Dutch auction
- `cancelAuction(auctionId)`: Cancel auction
- `settleAuction(auctionId)`: Settle completed auction
- `getAuctionDetails(auctionId)`: Query auction metadata
- `calculateDutchPrice(auctionId)`: Calculate current Dutch price
- `batchCreateEnglishAuction(params)`: Batch create (max 20)
- `batchCancelAuction(auctionIds)`: Batch cancel (max 20)
- `getPendingRefund(auctionId, bidder)`: Query pending refund

**Contracts:** EnglishAuction, DutchAuction (Zuno-deployed)

---

### 7. React Hooks

**Purpose:** React integration for marketplace operations

**Design Patterns:**
- **Mutation Hooks:** Return `UseMutationResult` from TanStack Query
- **Query Hooks:** Return `UseQueryResult` from TanStack Query
- **Optimization:** useCallback for stable function references
- **Error Handling:** Automatic error propagation to UI

**Example:**
```typescript
const { listNFT } = useExchange();
// listNFT.mutateAsync(...) returns { listingId, tx }
```

---

## Testing Structure

### Test Files (`src/__tests__/` - 20+ files)

**Unit Tests:**
- `core/`: ZunoSDK, ZunoAPIClient, ContractRegistry
- `modules/`: ExchangeModule, CollectionModule, AuctionModule, BaseModule
- `utils/`: All utility functions (errors, logger, transactions, etc.)
- `react/`: All React hooks (useExchange, useCollection, useAuction, etc.)

**Integration Tests:**
- `integration/batch-operations.test.ts`: Batch operation workflows

**Edge Cases:**
- `edge-cases.test.ts`: Error handling, retries, gas estimation

**Test Setup:**
- Jest configuration in `tests/setup/jest.config.js`
- ts-jest transformer
- @testing-library/react for hooks
- jsdom environment for React tests

**Coverage Target:** 80%

---

## File Count & LOC Statistics

### By Directory

| Directory | Files | LOC | Purpose |
|-----------|-------|-----|---------|
| `src/core/` | 3 | ~1,192 | Core SDK infrastructure |
| `src/modules/` | 4 | ~2,818 | Business logic |
| `src/react/` | 17+ | ~1,800 | React integration |
| `src/types/` | 5 | ~865 | Type definitions |
| `src/utils/` | 7 | ~1,880 | Utilities |
| `src/__tests__/` | 20+ | ~2,500+ | Tests |
| **Total** | **41+** | **~8,555** | (excluding tests) |

### By Module

| Module | LOC | Percentage |
|--------|-----|------------|
| Core + Modules | ~4,010 | 47% |
| React Integration | ~1,800 | 21% |
| Types + Utils | ~2,745 | 32% |

---

## Dependencies Analysis

### Runtime Dependencies (6 packages)

| Package | Version | Purpose | Import Usage |
|---------|---------|---------|--------------|
| ethers | ^6.13.0 | Web3 library | Core + Modules |
| @tanstack/react-query | ^5.59.0 | React data fetching | React hooks |
| @tanstack/query-core | ^5.59.0 | Core query logic | Core SDK |
| wagmi | ^2.12.0 | React Web3 hooks | React integration |
| viem | ^2.21.0 | TypeScript Ethereum | Wagmi dependency |
| axios | ^1.7.0 | HTTP client | API client |

### Peer Dependencies (2 packages)

| Package | Version | Required For |
|---------|---------|--------------|
| react | ^18.0.0 \|\| ^19.0.0 | React integration |
| react-dom | ^18.0.0 \|\| ^19.0.0 | React DOM |

### Dev Dependencies (15+ packages)

Key dev dependencies:
- **TypeScript** ^5.6.0: Type checking
- **tsup** ^8.3.0: Bundling
- **Jest** ^29.7.0: Testing
- **ESLint** ^9.0.0: Linting
- **@testing-library/react** ^16.0.0: React testing

---

## Key Design Patterns

### 1. Singleton Pattern
- **Used By:** ZunoSDK
- **Purpose:** Single SDK instance per application
- **Implementation:** Module-level private variable with `getInstance()` method

### 2. Lazy Loading
- **Used By:** ExchangeModule, CollectionModule, AuctionModule
- **Purpose:** Initialize modules only when accessed
- **Implementation:** Getters that check `if (!this._module) this._module = new Module()`

### 3. Template Method Pattern
- **Used By:** BaseModule
- **Purpose:** Common module structure with specific implementations
- **Implementation:** Abstract base class with 7 injected dependencies

### 4. Dependency Injection
- **Used By:** All modules
- **Purpose:** Testability and loose coupling
- **Implementation:** Constructor injection of dependencies

### 5. Observer Pattern
- **Used By:** EventEmitter, logStore, transactionStore
- **Purpose:** Event-driven communication
- **Implementation:** Pub/sub with subscription/unsubscription

### 6. Factory Pattern
- **Used By:** ContractRegistry
- **Purpose:** Create and cache contract instances
- **Implementation:** `getContract(address, abi)` factory method

---

## Import/Export Patterns

### Barrel Exports
All modules use barrel exports (`index.ts`) for clean public APIs:

```typescript
// src/exchange/index.ts
export { ExchangeModule } from './ExchangeModule';
export type * from './types';
```

### Tree-Shaking Support
- Separate entry points for each module
- ESM format enables tree-shaking
- Use named exports, not default exports

### Re-export Patterns
```typescript
// Main SDK re-exports modules
export { ExchangeModule } from './exchange';
export { CollectionModule } from './collection';
export { AuctionModule } from './auction';
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript compiler configuration |
| `tsconfig.build.json` | Build-specific TypeScript config |
| `tsconfig.test.json` | Test-specific TypeScript config |
| `tsup.config.ts` | Bundle configuration (7 entry points) |
| `eslint.config.js` | ESLint rules |
| `jest.config.js` | Jest test configuration |
| `.env.example` | Environment variable template |
| `.releaserc.cjs` | semantic-release configuration |

---

## Summary

The Zuno Marketplace SDK is a well-structured, modular TypeScript library with clear separation of concerns. The codebase follows best practices including:

- **Clean Architecture:** Core → Modules → React → Utils
- **Design Patterns:** Singleton, Lazy Loading, Template Method, Dependency Injection
- **Type Safety:** Full TypeScript coverage with strict mode
- **Testing:** Comprehensive unit and integration tests
- **Build System:** Modern bundling with tree-shaking support
- **Developer Experience:** React hooks, DevTools, logging

The ~9,185 lines of code are distributed across core functionality (26%), React integration (27%), tests (27%), and utilities/types (20%), resulting in a balanced, maintainable codebase.
