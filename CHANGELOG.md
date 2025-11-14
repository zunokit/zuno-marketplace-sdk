# Changelog

All notable changes to the Zuno Marketplace SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
