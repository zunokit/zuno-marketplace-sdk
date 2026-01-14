# Zuno Marketplace SDK - Examples

This folder contains comprehensive examples demonstrating all features of the Zuno Marketplace SDK.

## Directory Structure

```
examples/
├── basics/                 # Core SDK usage patterns
│   ├── initialization.ts
│   ├── wallet-connection.ts
│   ├── error-handling.ts
│   └── typescript-examples.ts
│
├── collection/             # NFT collection operations
│   ├── create-collection.ts
│   ├── minting-flow.ts
│   ├── allowlist-management.ts
│   ├── owner-operations.ts
│   └── collection-info.ts
│
├── exchange/               # NFT marketplace operations
│   ├── listing-workflow.ts
│   ├── buying-flow.ts
│   ├── batch-operations.ts
│   └── market-data.ts
│
├── auction/                # Auction operations
    ├── english-auction.ts
    ├── dutch-auction.ts
    ├── bidding-flow.ts
    └── auction-monitoring.ts
│
└── react/                  # React integration
    ├── setup-and-provider.tsx
    ├── collection-hooks.tsx
    ├── exchange-hooks.tsx
    ├── auction-hooks.tsx
    ├── error-handling.tsx
    ├── loading-states.tsx
    └── optimistic-updates.tsx
```

---

## Basics Module

Core SDK usage patterns and initialization examples.

### initialization.ts
- Basic SDK initialization
- Production vs development configurations
- Signer setup for write operations
- Singleton pattern for apps
- Multi-network setup
- Config validation

### wallet-connection.ts
- Browser wallet connection (MetaMask, WalletConnect)
- Account switching handling
- Network switching handling
- Balance queries
- Connection status checks
- Error handling for wallet operations

### error-handling.ts
- Try-catch error patterns
- Error code handling
- Transaction retry logic
- User-friendly error messages
- Input validation
- Timeout handling
- Error logging

### typescript-examples.ts
- Type-safe configuration
- Type-safe parameter construction
- Generic type utilities
- Type guards
- Discriminated unions
- Enum usage

---

## Collection Module

NFT collection creation, minting, and management.

### create-collection.ts
- Basic ERC721 collection creation
- Fully configured collections
- Allowlist-stage collections
- Free mint collections
- ERC1155 collections
- Verification after creation
- Bulk collection creation
- Custom owner collections

### minting-flow.ts
- Single ERC721 minting
- Batch ERC721 minting
- ERC1155 minting
- Complete minting workflow
- Progress tracking
- Error handling
- Cost estimation
- Multi-recipient minting

### allowlist-management.ts
- Add addresses to allowlist
- Remove from allowlist
- Enable/disable allowlist-only mode
- Check allowlist status
- Setup allowlist (combined operation)
- Batch allowlist management
- Minting stage setup
- Import from CSV/file

### owner-operations.ts
- Owner mint (bypass restrictions)
- Team allocations
- Collection analytics
- User token queries
- Created collections
- Ownership verification
- Supply checks
- Minting dashboard

### collection-info.ts
- Get collection info
- Verify collections
- Minting information
- Supply status
- Allowlist status
- User tokens
- Collection comparison
- Parallel queries

---

## Exchange Module

NFT marketplace listing, buying, and data queries.

### listing-workflow.ts
- Basic NFT listing
- Custom duration listings
- Complete listing workflow
- Sequential multi-NFT listing
- Cancel listings
- Progress tracking
- Listing details
- Collection/seller listings
- Price calculation
- Status checks

### buying-flow.ts
- Basic NFT purchase
- Complete buying workflow
- Progress tracking
- Buyer price calculation
- Error handling
- Cost estimation

### batch-operations.ts
- Batch list NFTs
- Batch buy NFTs
- Batch cancel listings
- Progress tracking
- Price calculation
- Different pricing strategies
- Error handling
- Chunked operations

### market-data.ts
- Single listing queries
- Collection listings
- Seller listings
- Price calculation
- Search and filter
- Market statistics
- Time analysis
- Portfolio analysis
- Collection comparison

---

## Auction Module

English and Dutch auction creation, bidding, and monitoring.

### english-auction.ts
- Basic English auction creation
- Auctions with reserve price
- Custom seller auctions
- Batch auction creation
- Different durations
- Emergency/quick auctions
- Cancel auctions
- Settle auctions
- Auction details

### dutch-auction.ts
- Basic Dutch auction creation
- Gradual decrease auctions
- Flash/rapid decrease auctions
- Batch creation
- Buy now operations
- Current price queries
- Price projection
- Optimal buy time calculator
- Cancel auctions
- Auction details

### bidding-flow.ts
- Basic bid placement
- Complete bidding workflow
- Outbid protection
- Pending refund checks
- Withdraw refunds
- Progress tracking
- Sniping bids
- Bidding history tracking

### auction-monitoring.ts
- Auction details
- Current Dutch price
- Status checks
- English auction monitoring
- Dutch auction progress
- Pending refund checks
- End time alerts
- Batch monitoring
- Auction dashboard

---

## Quick Setup

### SDK Initialization

```typescript
import { ZunoSDK } from 'zuno-marketplace-sdk';

const sdk = new ZunoSDK({
  apiKey: process.env.ZUNO_API_KEY!,
  network: 'sepolia',
});
```

### With Wallet Signer

```typescript
import { ethers } from 'ethers';
import { ZunoSDK } from 'zuno-marketplace-sdk';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const sdk = new ZunoSDK({
  apiKey: process.env.ZUNO_API_KEY!,
  network: 'sepolia',
  provider,
  signer,
});
```

### React Setup

```tsx
import { ZunoProvider } from 'zuno-marketplace-sdk/react';

<ZunoProvider config={{ apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!, network: 'sepolia' }}>
  <YourApp />
</ZunoProvider>
```

---

## Running Examples

### Prerequisites

```bash
npm install
npm run build
```

### Run Individual Examples

```bash
# Basics
node examples/basics/initialization.js
node examples/basics/wallet-connection.js

# Collection
node examples/collection/create-collection.js
node examples/collection/minting-flow.js

# Exchange
node examples/exchange/listing-workflow.js
node examples/exchange/buying-flow.js

# Auction
node examples/auction/english-auction.js
node examples/auction/bidding-flow.js
```

---

## React Integration

### Provider Setup

```tsx
import { ZunoProvider } from 'zuno-marketplace-sdk/react';

function App() {
  return (
    <ZunoProvider config={{ apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!, network: 'sepolia' }}>
      <YourApp />
    </ZunoProvider>
  );
}
```

### Collection Hooks

```tsx
import { useCollection, useCollectionInfo } from 'zuno-marketplace-sdk/react';

function MintNFT() {
  const { mintERC721 } = useCollection();
  const { data: collection } = useCollectionInfo('0x...');

  const handleMint = async () => {
    const result = await mintERC721.mutateAsync({
      collectionAddress: '0x...',
      recipient: '0x...',
      value: '0.1',
    });
    console.log('Minted:', result.tokenId);
  };

  return (
    <div>
      <p>Supply: {collection?.totalSupply} / {collection?.maxSupply}</p>
      <button onClick={handleMint} disabled={mintERC721.isPending}>
        {mintERC721.isPending ? 'Minting...' : 'Mint NFT'}
      </button>
    </div>
  );
}
```

### Exchange Hooks

```tsx
import { useExchange, useListings } from 'zuno-marketplace-sdk/react';

function Marketplace({ collectionAddress }: { collectionAddress: string }) {
  const { listNFT } = useExchange();
  const { data: listings } = useListings(collectionAddress);

  return (
    <div>
      {listings?.filter(l => l.status === 'active').map((listing) => (
        <div key={listing.id}>
          <h3>Token #{listing.tokenId}</h3>
          <p>Price: {listing.price} ETH</p>
        </div>
      ))}
    </div>
  );
}
```

### Auction Hooks

```tsx
import { useAuction, useAuctionDetails, useDutchAuctionPrice } from 'zuno-marketplace-sdk/react';

function AuctionInterface({ auctionId }: { auctionId: string }) {
  const { placeBid } = useAuction();
  const { data: auction } = useAuctionDetails(auctionId);
  const { data: currentPrice } = useDutchAuctionPrice(auctionId);

  if (auction?.type === 'english') {
    return (
      <div>
        <h3>English Auction</h3>
        <p>Current Bid: {auction.currentBid} ETH</p>
        <p>Highest Bidder: {auction.highestBidder || 'None'}</p>
        <button onClick={() => placeBid.mutateAsync({ auctionId, amount: '2.0' })}>
          Place Bid
        </button>
      </div>
    );
  }

  // Dutch auction UI...
}
```

### Error Handling

```tsx
import { ZunoErrorBoundary, ErrorDisplay } from 'zuno-marketplace-sdk/react';

function App() {
  return (
    <ZunoErrorBoundary>
      <YourApp />
    </ZunoErrorBoundary>
  );
}

function MyComponent() {
  const { mintERC721 } = useCollection();

  const handleMint = async () => {
    try {
      await mintERC721.mutateAsync({
        collectionAddress: '0x...',
        recipient: '0x...',
        value: '0.1',
      });
    } catch (error) {
      return <ErrorDisplay error={error} />;
    }
  };

  return <button onClick={handleMint}>Mint NFT</button>;
}
```

---

## SDK Features Coverage

### ✅ Collection Module
- Create ERC721/ERC1155 collections
- Mint NFTs (single & batch)
- Allowlist management
- Owner operations
- Collection info queries

### ✅ Exchange Module
- List NFTs (single & batch)
- Buy NFTs (single & batch)
- Cancel listings (single & batch)
- Market data queries
- Price calculations

### ✅ Auction Module
- English auctions (create, bid, cancel, settle)
- Dutch auctions (create, buy now, cancel)
- Batch auction operations
- Auction monitoring & queries
- Refund management

### ✅ React Module
- ZunoProvider setup and configuration
- Collection hooks (mint, create, allowlist, info)
- Exchange hooks (list, buy, cancel, market data)
- Auction hooks (English, Dutch, bid, monitor)
- Error handling and error boundaries
- Loading states and skeleton components
- Optimistic UI patterns

---

## See Also

- [Project Overview](../docs/project-overview-pdr.md)
- [Codebase Summary](../docs/codebase-summary.md)
- [System Architecture](../docs/system-architecture.md)
