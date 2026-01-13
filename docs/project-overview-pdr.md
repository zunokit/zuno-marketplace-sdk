# Zuno Marketplace SDK - Project Overview & PDR

## Executive Summary

**Zuno Marketplace SDK** is a comprehensive, type-safe TypeScript SDK for building NFT marketplace applications on Ethereum and EVM-compatible chains. The SDK provides a complete suite of tools for NFT exchange, collection management, auction systems, and React integration with modern Web3 libraries.

**Version:** 2.1.1-beta-claude.3
**Repository:** [github.com/ZunoKit/zuno-marketplace-sdk](https://github.com/ZunoKit/zuno-marketplace-sdk)
**License:** MIT
**Node Version:** >=18.0.0

---

## Product Overview

### What is Zuno Marketplace SDK?

Zuno Marketplace SDK is an all-in-one development kit that abstracts the complexity of building NFT marketplace functionality. It provides:

- **Smart Contract Integration**: Pre-built interfaces for Zuno marketplace contracts (ERC721, ERC1155)
- **React Hooks**: 21+ ready-to-use hooks for common marketplace operations
- **State Management**: Built-in TanStack Query v5 integration for data caching
- **Wallet Support**: Seamless integration with Wagmi v2 for wallet connections
- **Type Safety**: Full TypeScript support with strict typing throughout
- **SSR Support**: WagmiProviderSync for Next.js app directory compatibility
- **Developer Tools**: In-app DevTools for debugging logs, transactions, and cache

### Target Users

**Primary Users:**
- Frontend developers building NFT marketplace UIs
- Web3 developers integrating marketplace functionality
- Next.js/React application developers

**Secondary Users:**
- Backend developers using SDK for server-side operations
- Smart contract developers testing marketplace interactions
- Protocol teams building on top of Zuno infrastructure

### Use Cases

1. **NFT Marketplaces**: Build complete NFT trading platforms
2. **Collection Launches**: Deploy and manage ERC721/ERC1155 collections
3. **Auction Systems**: Implement English and Dutch auction mechanisms
4. **Portfolio Management**: Display user-owned NFTs and marketplace activity
5. **Analytics Dashboards**: Query listings, auctions, and collection data

---

## Key Features

### Core Capabilities

#### Exchange Module
- List NFTs for sale with fixed prices
- Buy NFTs from listings
- Cancel active listings
- Batch operations (max 20 per transaction)
- Query listings by seller, collection, or global market

#### Collection Module
- Create ERC721 and ERC1155 collections with auto-detection
- Configure royalties, minting limits, and pricing
- Mint NFTs with payment verification
- Allowlist management (add/remove addresses, setupAllowlist)
- Owner-only minting (ownerMint)
- Allowlist-only mode configuration
- Query collection info and user-owned tokens

#### Auction Module
- Create English auctions (ascending price bidding)
- Create Dutch auctions (descending price buy-now)
- Place bids on English auctions
- Buy NFTs from Dutch auctions at current price
- Settle completed auctions
- Batch create/cancel auctions (max 20 per transaction)
- Query auction details and calculate Dutch prices

#### React Integration
- **21+ Production Hooks**: useExchange, useCollection, useAuction, useWallet, useBalance, useABI, etc.
- **Provider Components**: ZunoProvider (all-in-one), ZunoContextProvider, WagmiProviderSync (SSR-safe)
- **DevTools Component**: In-app debugging panel with Logs, Transactions, Cache, and Network tabs
- **Wagmi v2 Integration**: Native support for WalletConnect, MetaMask, Coinbase Wallet
- **TanStack Query v5**: Smart caching with configurable TTL and garbage collection
- **SSR Support**: WagmiProviderSync for Next.js app directory compatibility

#### Logging & Debugging
- **5 Log Levels**: none, error, warn, info, debug
- **In-Memory Log Store**: Captures all SDK operations
- **Custom Logger Support**: Integration with Sentry, custom loggers
- **DevTools Integration**: Visual debugging without browser console
- **Transaction Store**: Track all marketplace transactions

### Advanced Features

**Batch Operations**
- Execute multiple operations in a single transaction
- Progress tracking for batch operations
- Max 20 items per batch (contract limitation)

**Smart Caching**
- TanStack Query integration for ABI and contract caching
- Configurable cache TTL (default: 5 minutes)
- Automatic garbage collection (default: 10 minutes)
- Prefetching support for optimal performance

**Error Handling**
- Categorized error codes (NETWORK, CONTRACT, VALIDATION, etc.)
- Automatic retry with exponential backoff
- Gas estimation for all write operations
- Detailed error messages for debugging

**Modular Design**
- Tree-shakeable exports for minimal bundle size
- Use only the modules you need
- Standalone logger module for non-SDK projects

---

## Platform & Network Support

### Contract & ABI Support

| Feature | Status | Description |
|---------|:------:|-------------|
| Zuno ABIs | ✅ Fully Supported | Built-in registry API with automatic caching |
| Zuno Contracts | ✅ Fully Supported | Full integration with all Zuno marketplace contracts |
| Custom ABIs | ❌ Not Supported | Cannot load external ABIs (planned for v3.0) |
| Custom Contracts | ❌ Not Supported | Only Zuno-deployed contracts supported |

### Network Support

| Network | Status | Chain ID | Notes |
|---------|:------:|---------|-------|
| Local Development | ✅ Full Support | 31337 | Anvil/Hardhat local testing |
| Sepolia Testnet | ⚠️ Planned | 11155111 | Planned for Q1 2026 |
| Ethereum Mainnet | ⚠️ Planned | 1 | Planned for Q2 2026 |
| Polygon | ❌ Not Supported | 137 | Under consideration |
| Arbitrum | ❌ Not Supported | 42161 | Under consideration |
| Base | ❌ Not Supported | 8453 | Under consideration |

**Note:** Network can be configured as string (`'mainnet'`, `'sepolia'`) or number (chain ID).

---

## Technical Stack

### Core Dependencies

| Dependency | Version | Purpose |
|-----------|---------|---------|
| **ethers** | ^6.13.0 | Ethereum provider, signer, contract interactions |
| **wagmi** | ^2.12.0 | React hooks for wallet connections |
| **viem** | ^2.21.0 | TypeScript Ethereum library (wagmi dependency) |
| **@tanstack/react-query** | ^5.59.0 | Data fetching and caching |
| **@tanstack/query-core** | ^5.59.0 | Core query functionality (non-React) |
| **axios** | ^1.7.0 | HTTP client for Registry API |

### Peer Dependencies

| Dependency | Version | Required For |
|-----------|---------|-------------|
| **react** | ^18.0.0 \|\| ^19.0.0 | React integration (hooks, providers) |
| **react-dom** | ^18.0.0 \|\| ^19.0.0 | React DOM rendering |

### Development Dependencies

| Dependency | Purpose |
|-----------|---------|
| **TypeScript** ^5.6.0 | Type checking and compilation |
| **tsup** ^8.3.0 | Bundling (CJS + ESM) |
| **Jest** ^29.7.0 | Unit and integration testing |
| **ESLint** ^9.0.0 | Linting and code quality |
| **semantic-release** ^25.0.2 | Automated versioning and changelog |

---

## Product Development Requirements (PDR)

### Functional Requirements

#### FR-1: SDK Initialization
- **Requirement**: SDK must support singleton pattern with lazy-loaded modules
- **Priority**: P0 (Critical)
- **Acceptance Criteria**:
  - Single SDK instance per application
  - Lazy initialization of Exchange, Collection, Auction modules
  - Provider and signer injection support
  - Configurable API key and network

#### FR-2: Exchange Operations
- **Requirement**: Users must be able to list, buy, and cancel NFT listings
- **Priority**: P0 (Critical)
- **Acceptance Criteria**:
  - List NFT with price (ETH) and duration (seconds)
  - Buy NFT from listing with payment verification
  - Cancel listing by seller
  - Query active listings with pagination
  - Batch list max 20 NFTs in single transaction
  - Listing IDs returned as bytes32 hex strings

#### FR-3: Collection Management
- **Requirement**: Users must be able to create and manage NFT collections
- **Priority**: P0 (Critical)
- **Acceptance Criteria**:
  - Create ERC721 collection with name, symbol, maxSupply
  - Set mint price, royalty fee (basis points), mint limit per wallet
  - Configure allowlist stage duration (seconds)
  - Mint NFTs with payment verification
  - Add/remove addresses from allowlist
  - Enable/disable allowlist-only mode
  - Query collection info and user-owned tokens

#### FR-4: Auction Operations
- **Requirement**: Users must be able to create and participate in auctions
- **Priority**: P0 (Critical)
- **Acceptance Criteria**:
  - Create English auction with starting bid, reserve price, duration
  - Create Dutch auction with start price, end price, duration
  - Place bid on English auction (must exceed current bid)
  - Buy NFT from Dutch auction at current calculated price
  - Cancel auction by seller (if no bids)
  - Settle completed auction
  - Batch create/cancel max 20 auctions in single transaction
  - Calculate Dutch auction price at any timestamp

#### FR-5: React Integration
- **Requirement**: SDK must provide React hooks for all marketplace operations
- **Priority**: P0 (Critical)
- **Acceptance Criteria**:
  - useExchange hook for list, buy, cancel operations
  - useCollection hook for create, mint, allowlist operations
  - useAuction hook for create, bid, buy, settle operations
  - useWallet hook for wallet connection
  - useBalance hook for ETH/ERC20 balance queries
  - All hooks return TanStack Query mutation/query objects
  - ZunoProvider for app-level configuration
  - ZunoDevTools component for debugging

#### FR-6: Caching & Performance
- **Requirement**: SDK must cache ABIs and contract data efficiently
- **Priority**: P1 (High)
- **Acceptance Criteria**:
  - TanStack Query integration with default 5-min TTL
  - Configurable cache time and garbage collection
  - ABI prefetching support
  - Contract instance caching per address
  - Cache invalidation on network changes

#### FR-7: Logging & Debugging
- **Requirement**: SDK must provide comprehensive logging for debugging
- **Priority**: P1 (High)
- **Acceptance Criteria**:
  - 5 log levels: none, error, warn, info, debug
  - In-memory log store with subscription API
  - Custom logger integration (Sentry, etc.)
  - ZunoDevTools component for visual debugging
  - Automatic transaction logging
  - Module prefix and timestamp support

### Non-Functional Requirements

#### NFR-1: Type Safety
- **Requirement**: All public APIs must have full TypeScript type definitions
- **Priority**: P0 (Critical)
- **Acceptance Criteria**:
  - No `any` types in public API
  - All function parameters typed
  - All return values typed
  - Exported types for all entities
  - Strict TypeScript configuration (noUncheckedIndexedAccess, etc.)

#### NFR-2: Bundle Size
- **Requirement**: SDK must support tree-shaking for minimal bundle size
- **Priority**: P1 (High)
- **Acceptance Criteria**:
  - Modular exports for each feature
  - Separate entry points for react, exchange, auction, collection, logger
  - ESM format for tree-shaking
  - CJS format for Node.js compatibility

#### NFR-3: Error Handling
- **Requirement**: SDK must provide clear, actionable error messages
- **Priority**: P0 (Critical)
- **Acceptance Criteria**:
  - Categorized error codes (NETWORK, CONTRACT, VALIDATION, etc.)
  - Automatic retry with exponential backoff
  - Gas estimation for all write operations
  - Error context (module, function, parameters)
  - User-friendly error messages

#### NFR-4: Performance
- **Requirement**: SDK must optimize for fast data fetching and minimal re-renders
- **Priority**: P1 (High)
- **Acceptance Criteria**:
  - TanStack Query caching reduces redundant fetches
  - useCallback/useMemo in all React hooks
  - Lazy module initialization
  - Batch operations minimize transaction count
  - ABI caching prevents redundant API calls

#### NFR-5: Browser Support
- **Requirement**: SDK must support modern browsers
- **Priority**: P1 (High)
- **Acceptance Criteria**:
  - Chrome/Edge (last 2 versions)
  - Firefox (last 2 versions)
  - Safari (last 2 versions)
  - Mobile browsers (iOS Safari, Chrome Android)

#### NFR-6: Testing Coverage
- **Requirement**: SDK must have comprehensive test coverage
- **Priority**: P1 (High)
- **Acceptance Criteria**:
  - Unit tests for all modules (target: 80% coverage)
  - Integration tests for batch operations
  - React hook tests with @testing-library/react
  - Mock utilities for testing
  - Edge case coverage (errors, retries, gas estimation)

---

## Development Requirements

### Build System

**Build Tool:** tsup (esbuild wrapper)
**Output Formats:** CommonJS (`.js`) + ESM (`.mjs`)
**Declaration Files:** `.d.ts` with source maps
**Entry Points:** 7 modules (main, react, exchange, auction, collection, logger, testing)

### Code Quality Standards

**TypeScript Configuration:**
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- No unused locals/parameters
- No implicit returns
- No fallthrough cases in switch

**Linting:**
- ESLint with TypeScript parser
- @typescript-eslint recommended rules
- Warn on unused variables (with `_` prefix ignore)

**Testing:**
- Jest with ts-jest transformer
- @testing-library/react for hooks
- jsdom environment for React tests
- Coverage reporting with Jest

### Git Workflow

**Branch Strategy:** GitFlow
- `main`: Production releases
- `develop`: Development branch
- `feature/*`: Feature branches
- `hotfix/*`: Emergency fixes

**Commit Convention:** Conventional Commits
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build/config changes

**Release Strategy:** semantic-release
- Automated versioning based on commits
- Automated changelog generation
- GitHub releases with notes
- npm publish on version bump

---

## Roadmap

### Version 2.1.0 (Released: 2026-01-14)
- ✅ WagmiProviderSync for SSR support
- ✅ Transaction retry logic with history tracking
- ✅ Batch progress events
- ✅ ListingId validation (strict bytes32)
- ✅ Dutch auction warnings
- ✅ Approval caching
- ✅ LogStore optimization

### Version 2.1.1 (Released: 2026-01-14)
- ✅ Query invalidation on mutations
- ✅ Enhanced error messages
- ✅ Performance optimizations
- ✅ Reduced bundle size

### Version 2.2.0 (Planned: Q1 2026)
- ERC1155 support with auto-detection
- setupAllowlist() method
- ownerMint() method
- Sepolia testnet support
- Additional React hooks (useOffers, useBundles)

### Version 2.3.0 (Planned: Q2 2026)
- Ethereum mainnet support
- Advanced analytics hooks
- Real-time subscription support
- Mobile-first DevTools

### Version 3.0.0 (Planned: Q3 2026)
- Custom ABI support
- Custom contract integration
- Multi-chain support (Polygon, Arbitrum, Base)
- SDK plugin system

---

## Support & Resources

**Documentation:** [docs.zuno.com](https://docs.zuno.com)
**GitHub Issues:** [github.com/ZunoKit/zuno-marketplace-sdk/issues](https://github.com/ZunoKit/zuno-marketplace-sdk/issues)
**Examples:** `/examples` directory in repository

**Community:**
- Discord: [Coming Soon]
- Twitter: [@ZunoKit](https://twitter.com/ZunoKit)
