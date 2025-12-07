# Zuno Marketplace SDK - Project Overview & PDR

**Version:** 2.0.1-beta-claude.1
**Last Updated:** 2025-12-07
**Repository:** https://github.com/ZunoKit/zuno-marketplace-sdk

---

## Executive Summary

Zuno Marketplace SDK is a comprehensive, type-safe TypeScript library for building NFT marketplace applications on Ethereum and EVM-compatible chains. Built with modern web3 technologies (Wagmi, ethers.js, React Query), it provides first-class React support with a modular architecture supporting exchange, auctions, collections, offers, and bundles.

---

## Project Vision & Goals

### Vision
Empower developers to build feature-rich NFT marketplaces with minimal boilerplate through a well-architected, fully-typed SDK that abstracts blockchain complexity while maintaining flexibility.

### Primary Goals
1. **Developer Experience:** Intuitive API with comprehensive documentation and examples
2. **Type Safety:** Full TypeScript support eliminating runtime type errors
3. **Modularity:** Tree-shakeable imports enabling minimal bundle sizes
4. **Production Readiness:** Robust error handling, retry policies, and transaction management
5. **Extensibility:** Clear interfaces enabling custom implementations
6. **Performance:** Smart caching via React Query and efficient blockchain interactions

---

## Target Audience

- **Frontend Developers:** Building React/Next.js NFT marketplace applications
- **Web3 Teams:** Creating branded NFT trading platforms
- **SDK Consumers:** Integrating NFT marketplace functionality into existing apps
- **Blockchain Developers:** Working with Ethereum and EVM chains

---

## Core Features & Capabilities

### Exchange Module
- List NFTs for fixed-price sale
- Purchase NFTs from active listings
- Cancel listings
- Retrieve active listings with pagination
- Filter listings by seller address
- Batch operations support (v2.0.0+)

### Collection Module
- Create ERC721 collections with configurable supply
- Mint NFTs with payment handling
- Allowlist management (add/remove addresses)
- Allowlist-only mode (permanant minting restrictions)
- Royalty fee configuration (basis points)
- Mint limit per wallet with dynamic defaults

### Auction Module
- English auctions (ascending price with time extension)
- Dutch auctions (descending price, automatic settlement)
- Reserve price support
- Bid placement and auction cancellation
- Batch auction creation (max 20 per tx)
- Batch auction cancellation
- Automatic NFT transfer on settlement

### React Integration
- 21+ custom hooks for all operations
- Wagmi integration for wallet connection
- React Query for query management and caching
- Server-side compatibility (API routes, utilities)
- Built-in DevTools for debugging and monitoring

### Logging & Monitoring
- In-memory log store with subscription support
- Zuno DevTools floating panel (visual debugging)
- Transaction tracking and monitoring
- Configurable log levels (debug, info, warn, error)
- Custom logger integration (Sentry, Datadog, etc.)

### Error Handling
- 50+ error codes with context information
- Retry policies (linear/exponential backoff)
- Transaction failure recovery
- Detailed error suggestions for users

---

## Product Development Requirements (PDR)

### Functional Requirements

#### FR-1: Exchange Operations
- Users must be able to list NFTs at fixed prices
- Users must be able to purchase listed NFTs
- Users must be able to cancel own listings
- System must retrieve paginated listing sets
- System must filter listings by seller address

#### FR-2: Auction Operations
- Users must create English auctions with customizable duration
- Users must create Dutch auctions with price decay
- Users must place bids on English auctions
- Users must buy from Dutch auctions at any point
- Users must cancel own auctions
- System must support batch operations (20 items max per transaction)

#### FR-3: Collection Management
- Admins must create ERC721 collections with configurable parameters
- Users must mint NFTs with ETH payment
- Admins must manage allowlists (add/remove addresses)
- System must enforce allowlist-only minting when enabled
- System must track mint count per wallet

#### FR-4: React Integration
- All SDK operations must be accessible via custom hooks
- Hooks must integrate with React Query for caching
- System must provide direct SDK access via useZunoSDK hook
- DevTools must display logs and transactions in real-time

#### FR-5: Error Handling
- All errors must include descriptive codes and context
- System must retry failed operations per configured policy
- Errors must include user-facing suggestions
- Transaction failures must be recoverable

### Non-Functional Requirements

#### NFR-1: Performance
- Query cache TTL: 5 minutes (configurable)
- Garbage collection: 10 minutes (configurable)
- Extended cache for network data: 30 minutes
- Bundle size < 100KB (gzipped main entry)

#### NFR-2: Type Safety
- 100% TypeScript strict mode compliance
- No `any` types in public APIs
- Comprehensive type definitions for all entities
- Full JSDoc documentation

#### NFR-3: Reliability
- Transaction confirmation with retry support
- Exponential backoff: max 3 retries (configurable)
- Network error recovery
- Graceful degradation for cache misses

#### NFR-4: Compatibility
- Node.js >= 18.0.0
- React >= 18.0.0 (peer dependency)
- Ethereum and EVM-compatible chains
- ESM and CommonJS module formats

#### NFR-5: Code Quality
- 70% test coverage (branches, functions, lines, statements)
- ESLint compliance
- Zero TypeScript errors
- < 200 lines per file guideline

### Architecture Requirements

#### AR-1: Singleton Pattern
- SDK must be instantiable as singleton
- getInstance() should return same instance per app
- Support both React and non-React contexts

#### AR-2: Lazy Module Loading
- Feature modules loaded on first access
- Exchange, Collection, Auction modules auto-loaded
- Offers and Bundles as future extensibility points

#### AR-3: Provider Abstraction
- Decouple ethers.js provider/signer
- Support custom provider instances
- Handle provider switching and updates

#### AR-4: Error Hierarchy
- Custom ZunoSDKError with context information
- 50+ specific error codes organized by category
- Original error preservation for debugging

#### AR-5: Logger Integration
- In-memory log store for monitoring
- Custom logger support (Sentry, Datadog integration)
- DevTools visualization component

### API & Integration Requirements

#### APIR-1: Configuration
- Required: apiKey, network
- Optional: apiUrl, rpcUrl, cache config, retry policy
- Logger configuration with level control
- WalletConnect project ID for wallet connection

#### APIR-2: Export Points
- Main entry: `zuno-marketplace-sdk` (full SDK)
- React hooks: `zuno-marketplace-sdk/react`
- Module imports: `/exchange`, `/auction`, `/collection`, `/logger`
- Testing utilities: `zuno-marketplace-sdk/testing`

#### APIR-3: Contract Registry
- ABI caching via React Query
- Contract address lookup per network
- Lazy loading with fallback support
- Error handling for missing contracts/ABIs

### Data Requirements

#### DR-1: Entity Types
- Listing, Transaction, AucitonInfo entities
- Type-safe parameters for all operations
- Consistent response formats across modules

#### DR-2: Transaction Tracking
- In-memory transaction store
- Status tracking (pending, confirmed, failed)
- Gas estimation and retry logic

---

## Feature Modules & Dependencies

### Module Organization
```
Core Layer
├── ZunoSDK (main orchestrator)
├── ZunoAPIClient (API communication)
└── ContractRegistry (contract/ABI management)

Feature Modules
├── ExchangeModule (listing/buying operations)
├── CollectionModule (ERC721 operations)
└── AuctionModule (English/Dutch auctions)

React Integration
├── ZunoProvider (all-in-one setup)
├── ZunoContextProvider (context-based setup)
└── Hooks (21+ custom hooks)

Utilities
├── Logger (ZunoLogger, logStore)
├── Errors (ZunoSDKError, ErrorCodes)
├── Transactions (TransactionManager)
└── Events (EventEmitter)
```

### Key Dependencies
- **ethers.js 6.13+:** Blockchain interaction and signing
- **Wagmi 2.12+:** Wallet connection and React integration
- **React Query 5.59+:** Query management and caching
- **Viem 2.21+:** Low-level RPC communication
- **Axios 1.7+:** HTTP client for API communication
- **ms 2.1.3:** Millisecond parsing for cache config

---

## Success Metrics

### Development Metrics
- Test coverage: >= 70% across all code paths
- TypeScript strict mode: 0 errors
- Bundle size: < 100KB gzipped (main entry)
- Code duplication: < 5%

### User Adoption Metrics
- npm downloads tracking (secondary)
- GitHub stars and community engagement
- Issue resolution time: < 48 hours
- Documentation completeness: 100% API coverage

### Quality Metrics
- Zero critical security vulnerabilities
- Transaction success rate: > 99% (network dependent)
- API response time: < 500ms (p95)
- Cache hit rate: > 80%

---

## Technical Constraints & Dependencies

### Environment
- **Node.js:** >= 18.0.0 (LTS)
- **TypeScript:** >= 5.6.0 (strict mode)
- **React:** >= 18.0.0 (peer dependency)

### Network Support
- **Mainnet:** Ethereum mainnet
- **Testnet:** Sepolia (Ethereum testnet)
- **L2/Sidechains:** Polygon, Arbitrum
- **Custom:** Local development (Hardhat, Anvil)

### External Services
- Zuno API: For ABI and contract registry
- RPC Providers: Infura, Alchemy, Ankr, custom endpoints
- Wallet Services: WalletConnect, MetaMask, Coinbase Wallet

### Browser Support
- Modern browsers with Web3 support (Chrome, Firefox, Safari, Edge)
- Requires crypto APIs and BigInt support

---

## Implementation Status

| Component | Status | Version | Notes |
|-----------|:------:|:-------:|-------|
| Core SDK | ✅ Production | 2.0.1 | Singleton, lazy loading |
| Exchange Module | ✅ Production | 2.0.1 | Full support, batch ops |
| Auction Module | ✅ Production | 2.0.1 | English/Dutch auctions |
| Collection Module | ✅ Production | 2.0.1 | ERC721, allowlist, minting |
| React Hooks | ✅ Production | 2.0.1 | 21+ hooks, React Query |
| DevTools | ✅ Production | 2.0.1 | Visual debugging |
| Logger | ✅ Production | 2.0.1 | In-memory, custom integration |
| Offers Module | 🔲 Planned | Future | Basic offer system |
| Bundles Module | 🔲 Planned | Future | Multi-NFT bundles |
| ERC1155 Support | 🔲 Planned | Future | Semi-fungible tokens |
| Testnet (Sepolia) | 🔲 Planned | Future | Official testnet support |

---

## Release Strategy

### Versioning
- **Semantic Versioning:** MAJOR.MINOR.PATCH
- **v2.x.x:** Current major version (React Query 5, Wagmi 2, ethers 6)
- **Beta Tags:** `-beta-{number}` for pre-release versions

### Release Channels
- **Production:** Stable releases (npm latest)
- **Beta:** Pre-release versions (npm dist-tags)
- **Development:** Feature branches for CI/CD testing

### CI/CD Pipelines
1. **Production Release:** GitHub Actions on push to main
2. **Beta Release:** GitHub Actions on push to feature branches
3. **Testing:** Jest with 70% coverage requirement
4. **Code Quality:** ESLint with dual configs (legacy + new)

---

## Documentation & Support

### Delivered Documentation
- **README.md:** Quick start and feature overview
- **docs/codebase-summary.md:** Directory structure and dependencies
- **docs/code-standards.md:** Coding conventions and patterns
- **docs/system-architecture.md:** Architecture details and data flow
- **examples/:** Working code samples (Node.js, React)
- **tests/:** Test suites demonstrating usage patterns

### Code Examples
- `examples/basic-usage.ts` - Node.js SDK usage
- `examples/react-example.tsx` - React component patterns
- `examples/edge-cases.md` - Production patterns and gotchas

### External Resources
- Official Docs: [docs.zuno.com](https://docs.zuno.com)
- GitHub Issues: Bug reports and feature requests
- Discussions: Community Q&A and feature proposals

---

## Known Limitations & Future Work

### Current Limitations
- **Contract Support:** Zuno contracts only (custom ABIs not supported)
- **Network Support:** Mainnet only (testnet/polygon coming)
- **Offers/Bundles:** Not yet implemented
- **ERC1155:** Semi-fungible tokens not supported
- **Royalty Enforcement:** Off-chain (contract-level only)

### Future Enhancements
- Custom ABI support for non-Zuno contracts
- Expanded network support (Sepolia, Polygon, Arbitrum)
- Bundle and Offer modules
- ERC1155 token support
- Advanced filtering and analytics APIs
- Subgraph integration for indexing

---

## Review & Approval

**Document Status:** Final
**Last Review:** 2025-12-07
**Next Review:** Quarterly or as needed
