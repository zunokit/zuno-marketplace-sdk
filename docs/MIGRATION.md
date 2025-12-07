# Migration Guide

> **Migrating from v1.x to v2.0.0**

This guide helps you upgrade from Zuno Marketplace SDK v1.x to v2.0.0. Follow the steps below to ensure a smooth transition.

---

## Table of Contents

1. [Breaking Changes Overview](#breaking-changes-overview)
2. [Contract Name Changes](#contract-name-changes)
3. [Listing ID Format Change](#listing-id-format-change)
4. [Default Behavior Changes](#default-behavior-changes)
5. [New Features](#new-features)
6. [Step-by-Step Migration](#step-by-step-migration)
7. [FAQ](#faq)

---

## Breaking Changes Overview

| Change | v1.x | v2.0.0 | Impact |
|--------|------|--------|--------|
| Contract Names | `'EnglishAuction'`, `'DutchAuction'` | `'EnglishAuctionImplementation'`, `'DutchAuctionImplementation'` | Internal only |
| Listing ID Format | Numeric (`'1'`, `'2'`) | bytes32 hex (`'0x...'`) | API responses |
| `mintLimitPerWallet` | Default: `0` (blocks minting) | Default: `maxSupply` | Collection creation |

---

## Contract Name Changes

### What Changed

Internal contract type references have been renamed for clarity:

```typescript
// v1.x (OLD)
'EnglishAuction'
'DutchAuction'

// v2.0.0 (NEW)
'EnglishAuctionImplementation'
'DutchAuctionImplementation'
```

### Impact

**Low** - This is an internal change. If you're using the SDK's public API (e.g., `sdk.auction.createEnglishAuction()`), no changes are required.

### Action Required

Only if you directly access `ContractRegistry` with contract type strings:

```typescript
// v1.x (OLD) - Will fail in v2.0.0
const contract = await contractRegistry.getContract('EnglishAuction', networkId, provider);

// v2.0.0 (NEW)
const contract = await contractRegistry.getContract('EnglishAuctionImplementation', networkId, provider);
```

---

## Listing ID Format Change

### What Changed

Listing IDs returned from `listNFT()` and `batchListNFT()` are now in **bytes32 hex format** instead of numeric strings.

```typescript
// v1.x (OLD)
const { listingId } = await sdk.exchange.listNFT({ ... });
console.log(listingId); // "1", "2", "123"

// v2.0.0 (NEW)
const { listingId } = await sdk.exchange.listNFT({ ... });
console.log(listingId); 
// "0x0000000000000000000000000000000000000000000000000000000000000001"
```

### Impact

**High** - Any code that stores, compares, or displays listing IDs needs to be updated.

### Migration Steps

#### 1. Update Database Schema (if storing IDs)

```sql
-- If using SQL database, update column type
ALTER TABLE listings ALTER COLUMN listing_id TYPE VARCHAR(66);
-- bytes32 = 64 hex chars + '0x' prefix = 66 characters
```

#### 2. Update ID Comparisons

```typescript
// v1.x (OLD) - Numeric comparison
if (listingId === '1') { ... }

// v2.0.0 (NEW) - Hex string comparison (case-insensitive)
if (listingId.toLowerCase() === '0x0000000000000000000000000000000000000000000000000000000000000001') { ... }
```

#### 3. Update Display Logic

```typescript
// If displaying to users, you may want to truncate
function formatListingId(id: string): string {
  if (id.startsWith('0x') && id.length === 66) {
    return `${id.slice(0, 10)}...${id.slice(-8)}`;
  }
  return id;
}

// Result: "0x00000000...00000001"
```

#### 4. Update API Calls

All methods that accept `listingId` now expect bytes32 format:

```typescript
// v2.0.0 - Use the exact format returned by listNFT()
await sdk.exchange.buyNFT({
  listingId: '0x0000000000000000000000000000000000000000000000000000000000000001',
  value: '1.5',
});

await sdk.exchange.cancelListing(
  '0x0000000000000000000000000000000000000000000000000000000000000001'
);
```

---

## Default Behavior Changes

### `mintLimitPerWallet` Default Value

#### What Changed

When creating a collection, `mintLimitPerWallet` now defaults to `maxSupply` instead of `0`.

```typescript
// v1.x (OLD) - Default was 0, which blocked ALL minting!
await sdk.collection.createERC721Collection({
  name: 'My NFTs',
  symbol: 'MNFT',
  maxSupply: 10000,
  mintPrice: '0.1',
  // mintLimitPerWallet: 0 (implicit - blocked minting)
});

// v2.0.0 (NEW) - Default is maxSupply, allowing full minting
await sdk.collection.createERC721Collection({
  name: 'My NFTs',
  symbol: 'MNFT',
  maxSupply: 10000,
  mintPrice: '0.1',
  // mintLimitPerWallet: 10000 (implicit - matches maxSupply)
});
```

#### Impact

**Medium** - Better default behavior. Collections created in v2.0.0 will allow minting by default.

#### Action Required

If you explicitly want to limit minting per wallet, specify the value:

```typescript
await sdk.collection.createERC721Collection({
  name: 'My NFTs',
  symbol: 'MNFT',
  maxSupply: 10000,
  mintPrice: '0.1',
  mintLimitPerWallet: 5, // Explicit limit: 5 NFTs per wallet
});
```

---

## New Features

### Batch Auction Operations

Create or cancel multiple auctions in a single transaction:

```typescript
// Batch create English auctions (max 20 per tx)
const { auctionIds, tx } = await sdk.auction.batchCreateEnglishAuction({
  collectionAddress: '0x...',
  tokenIds: ['1', '2', '3'],
  startingBid: '1.0',
  duration: 86400 * 7,
});

// Batch create Dutch auctions
const { auctionIds, tx } = await sdk.auction.batchCreateDutchAuction({
  collectionAddress: '0x...',
  tokenIds: ['4', '5', '6'],
  startPrice: '10.0',
  endPrice: '1.0',
  duration: 86400,
});

// Batch cancel auctions
const { cancelledCount, tx } = await sdk.auction.batchCancelAuction(['1', '2', '3']);
```

### Allowlist Management

Control who can mint from your collections:

```typescript
// Add addresses to allowlist (max 100 per batch)
await sdk.collection.addToAllowlist(collectionAddress, [
  '0xAddress1...',
  '0xAddress2...',
]);

// Remove addresses from allowlist
await sdk.collection.removeFromAllowlist(collectionAddress, [
  '0xAddress1...',
]);

// Enable allowlist-only mode (only allowlisted addresses can mint)
await sdk.collection.setAllowlistOnly(collectionAddress, true);

// Check if address is in allowlist
const isAllowed = await sdk.collection.isInAllowlist(collectionAddress, userAddress);

// Check if collection is in allowlist-only mode
const isAllowlistOnly = await sdk.collection.isAllowlistOnly(collectionAddress);
```

### New Utility Hooks

```typescript
import { useZunoSDK, useZunoLogger } from 'zuno-marketplace-sdk/react';

function MyComponent() {
  const sdk = useZunoSDK();      // Direct SDK access
  const logger = useZunoLogger(); // Logger access
  
  logger.info('Component rendered');
}
```

---

## Step-by-Step Migration

### Step 1: Update Package

```bash
npm install zuno-marketplace-sdk@^2.0.0
```

### Step 2: Search for Listing ID Usage

Find all places where you use listing IDs:

```bash
# Search your codebase
grep -r "listingId" src/
grep -r "listing_id" src/
```

### Step 3: Update Listing ID Handling

For each occurrence, ensure you handle bytes32 format:

```typescript
// Before
const listingId = response.listingId; // "1"
localStorage.setItem('lastListing', listingId);

// After
const listingId = response.listingId; // "0x000...001"
localStorage.setItem('lastListing', listingId); // Works - just longer string
```

### Step 4: Update Database (if applicable)

```typescript
// Prisma example
model Listing {
  id        String @id @default(uuid())
  listingId String @db.VarChar(66) // Updated from Int
  // ...
}
```

### Step 5: Review Collection Creation

Check if you relied on `mintLimitPerWallet: 0` default:

```typescript
// If you need to block minting initially
await sdk.collection.createERC721Collection({
  // ...
  mintLimitPerWallet: 0, // Explicitly block minting
});
```

### Step 6: Test Thoroughly

```bash
npm run test
npm run type-check
npm run build
```

---

## FAQ

### Q: Will my existing v1.x listings still work?

**A:** Yes, the smart contracts are unchanged. Only the SDK's representation of listing IDs changed. Existing listings on-chain remain accessible.

### Q: Do I need to re-deploy contracts?

**A:** No. This is a SDK-only update. Your deployed contracts are unaffected.

### Q: Can I convert between old and new listing ID formats?

**A:** The bytes32 format IS the actual on-chain format. The v1.x numeric format was a simplified representation. To convert:

```typescript
import { ethers } from 'ethers';

// Numeric to bytes32 (if you have old IDs stored)
function numericToBytes32(numericId: string): string {
  return ethers.zeroPadValue(ethers.toBeHex(BigInt(numericId)), 32);
}

// bytes32 to numeric (for display purposes)
function bytes32ToNumeric(bytes32Id: string): string {
  return BigInt(bytes32Id).toString();
}

// Examples
numericToBytes32('1');
// "0x0000000000000000000000000000000000000000000000000000000000000001"

bytes32ToNumeric('0x0000000000000000000000000000000000000000000000000000000000000001');
// "1"
```

### Q: Why was the listing ID format changed?

**A:** The bytes32 format matches the actual smart contract storage format, providing:
- Direct compatibility with contract calls
- No conversion overhead
- Consistent behavior across all SDK methods

### Q: What if I encounter issues during migration?

**A:** 
1. Check the [GitHub Issues](https://github.com/ZunoKit/zuno-marketplace-sdk/issues) for known problems
2. Ensure all dependencies are updated (`ethers@6`, `wagmi@2`, etc.)
3. Clear any cached data that may contain old ID formats
4. Open a new issue with reproduction steps if needed

---

## Need Help?

- **GitHub Issues:** [Report a bug](https://github.com/ZunoKit/zuno-marketplace-sdk/issues/new)
- **API Reference:** [docs/API.md](./API.md)
- **Examples:** [examples/](../examples/)

---

**Migration Guide Version:** 2.0.0  
**Last Updated:** December 2025
