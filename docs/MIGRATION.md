# Migration Guide

This guide helps you migrate to the Zuno Marketplace SDK from custom services or older SDK versions.

## Table of Contents

- [Migrating from Custom Services](#migrating-from-custom-services)
- [Breaking Changes](#breaking-changes)
- [Naming Convention Updates](#naming-convention-updates)
- [Step-by-Step Migration](#step-by-step-migration)

---

## Migrating from Custom Services

If you're currently using custom `exchangeService`, `auctionService`, or `collectionService`, this guide will help you migrate to the SDK.

### Installation

**Before:**
```typescript
// Custom service implementations in your project
import { exchangeService } from "@/lib/services/contracts";
import { auctionService } from "@/lib/services/contracts";
```

**After:**
```bash
npm install zuno-marketplace-sdk
```

```typescript
import { ZunoSDK } from 'zuno-marketplace-sdk';
// or for React
import { ZunoProvider, useExchange, useAuction } from 'zuno-marketplace-sdk/react';
```

---

### SDK Initialization

**Node.js/TypeScript:**
```typescript
import { ZunoSDK } from 'zuno-marketplace-sdk';

const sdk = new ZunoSDK({
  apiKey: 'your-api-key',
  network: 'sepolia',
  abisUrl: 'https://abis.zuno.com/api',
});
```

**React:**
```typescript
import { ZunoProvider } from 'zuno-marketplace-sdk/react';

function App() {
  return (
    <ZunoProvider
      config={{
        apiKey: 'your-api-key',
        network: 'sepolia',
      }}
    >
      <YourApp />
    </ZunoProvider>
  );
}
```

---

## Breaking Changes

### v1.0.1 - Naming Convention Changes

**BREAKING CHANGE:** Parameters for auction and offer operations now use `collectionAddress` instead of `nftAddress` for consistency across the SDK.

#### What Changed

**Before (v1.0.0):**
```typescript
// ❌ Old - Mixed naming conventions
await sdk.exchange.listNFT({
  collectionAddress: "0x123...",  // Uses collectionAddress
  tokenId: "1",
  price: "1.0",
  duration: 86400
});

await sdk.auction.createEnglishAuction({
  nftAddress: "0x123...",  // Uses nftAddress (inconsistent!)
  tokenId: "1",
  startingBid: "1.0",
  duration: 86400
});
```

**After (v1.0.1+):**
```typescript
// ✅ New - Consistent naming
await sdk.exchange.listNFT({
  collectionAddress: "0x123...",
  tokenId: "1",
  price: "1.0",
  duration: 86400
});

await sdk.auction.createEnglishAuction({
  collectionAddress: "0x123...",  // Now consistent!
  tokenId: "1",
  startingBid: "1.0",
  duration: 86400
});
```

#### Affected Interfaces

The following interfaces now use `collectionAddress`:

1. **CreateEnglishAuctionParams**
   - `nftAddress` → `collectionAddress`

2. **CreateDutchAuctionParams**
   - `nftAddress` → `collectionAddress`

3. **MakeOfferParams**
   - `nftAddress` → `collectionAddress`

4. **Auction Entity**
   - `nftAddress` → `collectionAddress`

#### Migration Steps

**Option 1: Find and Replace (Recommended)**

Search your codebase for auction-related calls and replace `nftAddress` with `collectionAddress`:

```bash
# Find all occurrences
grep -r "nftAddress" src/

# Replace in your files
# Before: nftAddress: "0x123..."
# After:  collectionAddress: "0x123..."
```

**Option 2: TypeScript will help you**

If you're using TypeScript, the compiler will show errors at all locations that need updating:

```typescript
// TypeScript Error: Property 'nftAddress' does not exist on type 'CreateEnglishAuctionParams'
await sdk.auction.createEnglishAuction({
  nftAddress: "0x123...",  // ❌ Error!
  tokenId: "1",
  startingBid: "1.0",
  duration: 86400
});

// Fix: Use collectionAddress
await sdk.auction.createEnglishAuction({
  collectionAddress: "0x123...",  // ✅ Correct
  tokenId: "1",
  startingBid: "1.0",
  duration: 86400
});
```

---

## Naming Convention Updates

### Parameter Naming Reference

| Module | Old Parameter | New Parameter | Scope |
|--------|---------------|---------------|-------|
| Exchange | `collectionAddress` | `collectionAddress` | ✅ No change |
| Auction | `nftAddress` | `collectionAddress` | 🔄 Changed |
| Offer | `nftAddress` | `collectionAddress` | 🔄 Changed |
| Collection | `collectionAddress` | `collectionAddress` | ✅ No change |

### Method Naming Reference

| Custom Service | SDK Method | Module |
|----------------|------------|--------|
| `exchangeService.createListing()` | `sdk.exchange.listNFT()` | Exchange |
| `exchangeService.buyListing()` | `sdk.exchange.buyNFT()` | Exchange |
| `exchangeService.cancelListing()` | `sdk.exchange.cancelListing()` | Exchange |
| `auctionService.createAuction()` | `sdk.auction.createEnglishAuction()` | Auction |
| `auctionService.createDutchAuction()` | `sdk.auction.createDutchAuction()` | Auction |
| `auctionService.placeBid()` | `sdk.auction.placeBid()` | Auction |
| `collectionService.createCollection()` | `sdk.collection.createERC721()` | Collection |
| `collectionService.mint()` | `sdk.collection.mintERC721()` | Collection |

---

## Step-by-Step Migration

### Step 1: Install SDK

```bash
npm install zuno-marketplace-sdk
```

### Step 2: Replace Service Imports

**Before:**
```typescript
import { exchangeService } from "@/lib/services/contracts";
import { auctionService } from "@/lib/services/contracts";
import { collectionService } from "@/lib/services/contracts";
```

**After (Node.js):**
```typescript
import { ZunoSDK } from 'zuno-marketplace-sdk';

const sdk = new ZunoSDK({
  apiKey: 'your-api-key',
  network: 'sepolia',
});
```

**After (React):**
```typescript
import { useExchange, useAuction, useCollection } from 'zuno-marketplace-sdk/react';

function MyComponent() {
  const exchange = useExchange();
  const auction = useAuction();
  const collection = useCollection();

  // Use the hooks...
}
```

### Step 3: Update Method Calls

#### Exchange Methods

**Before:**
```typescript
// Custom service
await exchangeService.createListing({
  contractAddress: "0x123...",
  tokenId: "1",
  price: ethers.parseEther("1.0"),
  duration: 86400
});
```

**After:**
```typescript
// SDK
await sdk.exchange.listNFT({
  collectionAddress: "0x123...",
  tokenId: "1",
  price: "1.0",  // No need to parse, SDK handles it
  duration: 86400
});

// React
await exchange.listNFT.mutateAsync({
  collectionAddress: "0x123...",
  tokenId: "1",
  price: "1.0",
  duration: 86400
});
```

#### Auction Methods

**Before:**
```typescript
// Custom service
await auctionService.createAuction({
  nftAddress: "0x123...",  // Old parameter name
  tokenId: "1",
  startingBid: ethers.parseEther("1.0"),
  duration: 86400
});
```

**After:**
```typescript
// SDK
await sdk.auction.createEnglishAuction({
  collectionAddress: "0x123...",  // New parameter name
  tokenId: "1",
  startingBid: "1.0",  // No need to parse
  duration: 86400
});

// React
await auction.createEnglishAuction.mutateAsync({
  collectionAddress: "0x123...",
  tokenId: "1",
  startingBid: "1.0",
  duration: 86400
});
```

#### Collection Methods

**Before:**
```typescript
// Custom service
await collectionService.createCollection({
  name: "My Collection",
  symbol: "MYC",
  baseUri: "ipfs://...",
  maxSupply: 10000
});
```

**After:**
```typescript
// SDK
const { address, tx } = await sdk.collection.createERC721({
  name: "My Collection",
  symbol: "MYC",
  baseUri: "ipfs://...",
  maxSupply: 10000
});

// React
const result = await collection.createERC721.mutateAsync({
  name: "My Collection",
  symbol: "MYC",
  baseUri: "ipfs://...",
  maxSupply: 10000
});
```

### Step 4: Update Price Handling

The SDK automatically handles ETH conversion, so you don't need to use `ethers.parseEther()` or `ethers.formatEther()`.

**Before:**
```typescript
import { ethers } from 'ethers';

// Manual conversion
const price = ethers.parseEther("1.5");
await exchangeService.createListing({ price });

// Reading price
const listing = await exchangeService.getListing(id);
const priceInEth = ethers.formatEther(listing.price);
```

**After:**
```typescript
// SDK handles conversion
await sdk.exchange.listNFT({
  price: "1.5"  // Pass as string
});

// SDK returns formatted values
const listing = await sdk.exchange.getListing(id);
console.log(listing.price); // Already in ETH: "1.5"
```

### Step 5: Update Error Handling

**Before:**
```typescript
try {
  await exchangeService.createListing({ ... });
} catch (error) {
  console.error("Error:", error.message);
}
```

**After:**
```typescript
import { ZunoSDKError } from 'zuno-marketplace-sdk';

try {
  await sdk.exchange.listNFT({ ... });
} catch (error) {
  if (error instanceof ZunoSDKError) {
    switch (error.code) {
      case 'INVALID_ADDRESS':
        console.error('Invalid collection address');
        break;
      case 'NOT_APPROVED':
        console.error('NFT not approved for marketplace');
        break;
      case 'USER_REJECTED':
        console.error('Transaction was rejected');
        break;
      default:
        console.error(`Error: ${error.message}`);
    }
  }
}
```

### Step 6: Update React Components

**Before:**
```typescript
function MyComponent() {
  const [loading, setLoading] = useState(false);

  const handleList = async () => {
    setLoading(true);
    try {
      await exchangeService.createListing({ ... });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleList} disabled={loading}>
      {loading ? 'Listing...' : 'List NFT'}
    </button>
  );
}
```

**After:**
```typescript
import { useExchange } from 'zuno-marketplace-sdk/react';

function MyComponent() {
  const { listNFT } = useExchange();

  const handleList = async () => {
    await listNFT.mutateAsync({
      collectionAddress: "0x123...",
      tokenId: "1",
      price: "1.5",
      duration: 86400
    });
  };

  return (
    <button
      onClick={handleList}
      disabled={listNFT.isPending}
    >
      {listNFT.isPending ? 'Listing...' : 'List NFT'}
    </button>
  );
}
```

---

## Migration Checklist

- [ ] Install `zuno-marketplace-sdk` package
- [ ] Remove custom service files
- [ ] Initialize SDK or wrap app in `ZunoProvider`
- [ ] Replace `nftAddress` with `collectionAddress` in auction/offer calls
- [ ] Update method names (e.g., `createListing` → `listNFT`)
- [ ] Remove manual `ethers.parseEther()` calls (SDK handles it)
- [ ] Update error handling to use `ZunoSDKError`
- [ ] Update React components to use SDK hooks
- [ ] Test all functionality
- [ ] Remove old custom services

---

## Full Example: Before & After

### Before (Custom Services)

```typescript
import { exchangeService, auctionService } from "@/lib/services/contracts";
import { ethers } from 'ethers';

function MyComponent() {
  const [loading, setLoading] = useState(false);

  const handleListAndAuction = async () => {
    setLoading(true);
    try {
      // List NFT
      await exchangeService.createListing({
        contractAddress: "0x123...",
        tokenId: "1",
        price: ethers.parseEther("1.5"),
        duration: 86400
      });

      // Create auction (inconsistent parameter name)
      await auctionService.createAuction({
        nftAddress: "0x456...",  // Different parameter name!
        tokenId: "2",
        startingBid: ethers.parseEther("2.0"),
        duration: 604800
      });

      alert('Success!');
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleListAndAuction} disabled={loading}>
      {loading ? 'Processing...' : 'List & Auction'}
    </button>
  );
}
```

### After (SDK)

```typescript
import { useExchange, useAuction } from 'zuno-marketplace-sdk/react';
import { ZunoSDKError } from 'zuno-marketplace-sdk';

function MyComponent() {
  const { listNFT } = useExchange();
  const { createEnglishAuction } = useAuction();

  const handleListAndAuction = async () => {
    try {
      // List NFT (consistent naming)
      await listNFT.mutateAsync({
        collectionAddress: "0x123...",
        tokenId: "1",
        price: "1.5",  // SDK handles parsing
        duration: 86400
      });

      // Create auction (consistent naming)
      await createEnglishAuction.mutateAsync({
        collectionAddress: "0x456...",  // Same parameter name!
        tokenId: "2",
        startingBid: "2.0",  // SDK handles parsing
        duration: 604800
      });

      alert('Success!');
    } catch (error) {
      if (error instanceof ZunoSDKError) {
        console.error(`Error [${error.code}]:`, error.message);
      }
    }
  };

  const isLoading = listNFT.isPending || createEnglishAuction.isPending;

  return (
    <button onClick={handleListAndAuction} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'List & Auction'}
    </button>
  );
}
```

---

## Need Help?

- **API Reference:** See [API.md](./API.md) for detailed method documentation
- **Examples:** Check the [examples](../examples/) directory for complete working examples
- **Issues:** Report issues on [GitHub](https://github.com/zuno/zuno-marketplace-sdk/issues)

---

**Last Updated:** 2025-11-14
**SDK Version:** v1.0.1+
