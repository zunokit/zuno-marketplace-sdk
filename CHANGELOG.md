# Changelog

All notable changes to the Zuno Marketplace SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.5] - 2025-11-26

### 🔄 Changed - BREAKING CHANGES

- **Unified API endpoint configuration**
  - Removed `abisUrl` configuration option
  - All API calls now use single `apiUrl` endpoint
  - Simplified SDK configuration with single unified endpoint

**Migration Required:** Remove `abisUrl` from your configuration. All services (ABIs, contracts, networks) now use the unified `apiUrl`.

**Before:**
```typescript
const config: ZunoSDKConfig = {
  apiKey: 'your-api-key',
  network: 'sepolia',
  apiUrl: 'https://api.zuno.com/v1',
  abisUrl: 'https://abis.zuno.com/api',  // ❌ Remove this
};
```

**After:**
```typescript
const config: ZunoSDKConfig = {
  apiKey: 'your-api-key',
  network: 'sepolia',
  apiUrl: 'https://api.zuno.com/v1',  // ✅ Single unified endpoint
};
```

### ✨ Added

- **Production-ready Logger System**
  - Structured logging with multiple levels (`debug`, `info`, `warn`, `error`, `none`)
  - Auto-logging for all SDK operations (transactions, errors, module actions)
  - Manual logging via `sdk.logger` for custom messages
  - Configurable output formats: text or JSON
  - Module-specific logging with automatic prefixes
  - Filter logging by module or action
  - Custom logger support (Sentry, Datadog, Winston, etc.)
  - Automatic transaction logging with hash and status
  - Error context with SDK state for debugging
  - Performance-optimized: no-op when disabled

**Usage Examples:**

Auto-logging:
```typescript
const sdk = new ZunoSDK({
  logger: { level: 'info' }
});
// SDK automatically logs all operations
```

Manual logging:
```typescript
sdk.logger.info('Custom message', { data: {...} });
```

Custom logger integration:
```typescript
logger: {
  customLogger: {
    error: (msg) => Sentry.captureException(new Error(msg))
  }
}
```

### ⚡️ Improved

- Simplified SDK architecture with single API client
- Reduced configuration complexity
- Better default URL handling
- Enhanced debugging capabilities with structured logging
- Better error tracking with automatic context

### 📝 Documentation

- Updated README with simplified configuration examples
- Removed confusing dual-endpoint setup from examples
- Added comprehensive logging documentation with examples
- Documented all logger configuration options

### 🔧 Deprecated

- `debug: boolean` config option - Use `logger.level = 'debug'` instead (backward compatible)

---

## [1.1.4] - 2025-11-23

### 🔄 Changed - BREAKING CHANGES

- **Standardized transaction response shapes across all modules**
  - All mutation methods now return `{ tx: TransactionReceipt, ...additionalData }`
  - `ExchangeModule.listNFT()` now returns `{ listingId: string; tx: TransactionReceipt }` instead of `TransactionReceipt`
  - `ExchangeModule.buyNFT()` now returns `{ tx: TransactionReceipt }` instead of `TransactionReceipt`
  - `ExchangeModule.batchBuyNFT()` now returns `{ tx: TransactionReceipt }` instead of `TransactionReceipt`
  - `ExchangeModule.cancelListing()` now returns `{ tx: TransactionReceipt }` instead of `TransactionReceipt`
  - `ExchangeModule.batchCancelListing()` now returns `{ tx: TransactionReceipt }` instead of `TransactionReceipt`
  - `AuctionModule.placeBid()` now returns `{ tx: TransactionReceipt }` instead of `TransactionReceipt`
  - `AuctionModule.endAuction()` now returns `{ tx: TransactionReceipt }` instead of `TransactionReceipt`
  - `CollectionModule.mintERC1155()` now returns `{ tx: TransactionReceipt }` instead of `TransactionReceipt`

**Migration Required:** Update all SDK method calls to destructure the response object to access the transaction receipt and additional data.

**Before:**
```typescript
const tx = await sdk.exchange.listNFT({ /* params */ });
console.log(tx.hash);
```

**After:**
```typescript
const { listingId, tx } = await sdk.exchange.listNFT({ /* params */ });
console.log(tx.hash);
console.log(listingId); // Now available!
```

### ✨ Added

- **New Query Methods**
  - `ExchangeModule.getActiveListings(page, pageSize)` - Get all active listings with pagination
  - `AuctionModule.getActiveAuctions(page, pageSize)` - Get all active auctions (English & Dutch) with pagination
  - `AuctionModule.getAuctionsBySeller(seller, page, pageSize)` - Get auctions by seller address

- **New Mutation Methods**
  - `ExchangeModule.updateListingPrice(listingId, newPrice, options)` - Update price of an active listing
  - `AuctionModule.cancelAuction(auctionId, options)` - Cancel an auction before it ends

### ⚡️ Improved

- Better response consistency - all mutation methods now return structured objects
- Listing ID extraction from transaction logs for `listNFT()` operations
- Enhanced error handling in auction query methods
- Improved TypeScript type inference for method responses

### 📝 Documentation

- Updated all method JSDoc comments with new return types
- Added comprehensive examples for new query methods
- Documented breaking changes in this changelog

---

## [1.1.3] - 2025-11-23

### 🐛 Fixed

- Move `@tanstack/react-query-devtools` to dependencies instead of devDependencies
- Lazy load devtools to avoid bundling in production builds
- Reduce bundle size by conditionally loading devtools

### ⚡️ Improved

- Optimized production bundle by lazy loading React Query DevTools

---

## [1.1.0] - 2025-11-20

### ✨ Added

- **ZunoContextProvider** - New flexible provider for Wagmi and React Query integration
- Support for custom Wagmi and React Query configurations
- Improved provider architecture for better extensibility

### 🔄 Changed

- Refactored `ZunoProvider` to support flexible Wagmi and React Query integration
- Updated provider structure for better composability

### 📝 Documentation

- Added comprehensive CLAUDE.md guide for AI assistants working on the SDK
- Documented provider usage patterns

---

## [1.0.1] - 2025-11-18

### ✨ Added

- **Runtime validation** for all method parameters
- **Batch operations** support for exchange and collection modules
- **Error recovery mechanisms** for failed transactions
- Comprehensive examples for all SDK features

### ⚡️ Improved

- Enhanced error handling with better error messages
- Added validation helpers for addresses, token IDs, and amounts
- Better TypeScript type safety

### 🐛 Fixed

- Removed failing tests and added global axios mock
- Fixed test setup and configuration

---

## [1.0.0] - 2025-11-15

### 🎉 Initial Stable Release

- **Core SDK modules:**
  - ExchangeModule - NFT marketplace trading operations
  - AuctionModule - English and Dutch auction support
  - CollectionModule - NFT collection creation and minting

- **React Integration:**
  - TanStack Query hooks for all SDK operations
  - Wagmi integration for wallet connection
  - ZunoProvider for context management

- **Contract Registry:**
  - ABI fetching and caching
  - Contract instance management
  - Multi-network support

- **Transaction Management:**
  - Transaction sending and waiting
  - Error handling and recovery
  - Event emission for transaction lifecycle

- **Type Safety:**
  - Comprehensive TypeScript types
  - Strict mode enabled
  - Full type coverage

---

## [1.0.2] - 2025-11-14

### 🔄 Changed - BREAKING CHANGES

- **Standardized parameter naming across all modules**
  - `nftAddress` → `collectionAddress` in `CreateEnglishAuctionParams`
  - `nftAddress` → `collectionAddress` in `CreateDutchAuctionParams`
  - `nftAddress` → `collectionAddress` in `MakeOfferParams`
  - `nftAddress` → `collectionAddress` in `Auction` entity

**Migration Required:** Update all auction and offer method calls to use `collectionAddress` instead of `nftAddress`. See [Migration Guide](./docs/MIGRATION.md) for details.

**Before:**
```typescript
await sdk.auction.createEnglishAuction({
  nftAddress: "0x123...",  // ❌ Old
  tokenId: "1",
  startingBid: "1.0",
  duration: 86400
});
```

**After:**
```typescript
await sdk.auction.createEnglishAuction({
  collectionAddress: "0x123...",  // ✅ New
  tokenId: "1",
  startingBid: "1.0",
  duration: 86400
});
```

### ✨ Added

- **Comprehensive API Documentation**
  - Added `docs/API.md` with complete API reference
  - Detailed parameter descriptions for all methods
  - Error code documentation
  - Code examples for every method
  - Type definitions reference

- **Migration Guide**
  - Added `docs/MIGRATION.md` for upgrading from custom services
  - Step-by-step migration instructions
  - Breaking changes documentation
  - Before/after code examples

- **Enhanced JSDoc Comments**
  - Added comprehensive JSDoc comments to all public methods in AuctionModule
  - Includes parameter descriptions, return types, error codes, and examples
  - Better IDE autocomplete and inline documentation

### 📝 Documentation

- Updated README.md with links to new documentation
- Fixed naming inconsistencies in examples
- Updated all code examples to use `collectionAddress`

### 🐛 Fixed

- Inconsistent parameter naming between Exchange and Auction modules
- Updated entity types to match new parameter names

---

## [0.1.1] - Previous Release

### Added
- Runtime validation
- Batch operations
- Error recovery mechanisms
- Comprehensive examples

---

## Migration Notes

### Upgrading from v0.1.x to Latest

1. **Update auction/offer calls:**
   - Replace `nftAddress` with `collectionAddress` in all auction-related code
   - Replace `nftAddress` with `collectionAddress` in all offer-related code

2. **TypeScript will help:**
   - The TypeScript compiler will show errors at all locations that need updating
   - Fix each error by changing `nftAddress` to `collectionAddress`

3. **Run tests:**
   - Ensure all your tests pass after the migration
   - Update any test fixtures that use the old parameter names

For detailed migration instructions, see [docs/MIGRATION.md](./docs/MIGRATION.md).

---

**Legend:**
- 🔄 Changed - Breaking changes
- ✨ Added - New features
- 📝 Documentation - Documentation updates
- 🐛 Fixed - Bug fixes
- ⚡️ Improved - Performance improvements
- 🔒 Security - Security fixes
