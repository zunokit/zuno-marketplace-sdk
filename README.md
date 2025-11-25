# Zuno Marketplace SDK

> **All-in-One NFT Marketplace SDK with Wagmi & React Query built-in**

A comprehensive, type-safe SDK for building NFT marketplace applications on Ethereum and EVM-compatible chains. Built with TypeScript, featuring first-class React support with Wagmi and TanStack Query integration.

[![License](https://img.shields.io/npm/l/zuno-marketplace-sdk)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)

## ✨ Features

- 🎨 **Complete NFT Marketplace** - Exchange, Auctions, Offers, Bundles
- ⚛️ **React Integration** - 21+ hooks with Wagmi & React Query
- 🔐 **Type-Safe** - Full TypeScript support with strict typing
- 📦 **Smart Caching** - Built-in ABI caching with TanStack Query
- 🎯 **Modular Design** - Use only what you need
- 🚀 **Production Ready** - Robust error handling and retries
- 🪝 **Modern React** - useCallback, useMemo optimization
- 📱 **Wallet Support** - WalletConnect, MetaMask, Coinbase Wallet

## 🌐 Platform Support

### Contract & ABI Support

| Feature | Status | Description |
|---------|:------:|-------------|
| Zuno ABIs | ✅ | Fully supported with built-in registry |
| Zuno Contracts | ✅ | Full integration with Zuno marketplace contracts |
| Other ABIs | ❌ | Not supported yet |
| Other Contracts | ❌ | Custom contract support not available |

### Network Support

| Network | Status | Description |
|---------|:------:|-------------|
| Local Development | ✅ | Full support for local testing |
| Testnet (Sepolia) | ❌ | Coming soon |
| Mainnet | ❌ | Coming soon |

## 🆕 What's New in v1.1.4

- **Standardized Response Format** - All mutation methods now return `{ tx, ...data }` for consistency
- **New Query Methods** - `getActiveListings()`, `getActiveAuctions()`, `getAuctionsBySeller()`
- **New Mutation Methods** - `updateListingPrice()`, `cancelAuction()`
- **Better TypeScript Inference** - Improved type inference for all method responses
- **Listing ID Extraction** - `listNFT()` now returns `{ listingId, tx }` automatically

> **Migration Note**: If upgrading from v1.1.3, update your code to destructure responses. See [CHANGELOG.md](./CHANGELOG.md) for details.

## 📦 Installation

```bash
npm install zuno-marketplace-sdk ethers@6 @tanstack/react-query wagmi viem
```

## 🚀 Quick Start

### React with Next.js

```tsx
// app/layout.tsx
import { ZunoProvider } from 'zuno-marketplace-sdk/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ZunoProvider
          config={{
            apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
            network: 'sepolia',
          }}
        >
          {children}
        </ZunoProvider>
      </body>
    </html>
  );
}
```

```tsx
// app/page.tsx
'use client';

import { useExchange, useWallet } from 'zuno-marketplace-sdk/react';

export default function HomePage() {
  const { address, connect, isConnected } = useWallet();
  const { listNFT } = useExchange();

  const handleList = async () => {
    const { listingId, tx } = await listNFT.mutateAsync({
      collectionAddress: '0x...',
      tokenId: '1',
      price: '1.5',
      duration: 86400,
    });
    console.log('Listed with ID:', listingId, 'TX:', tx.hash);
  };

  return (
    <div>
      {!isConnected ? (
        <button onClick={() => connect()}>Connect</button>
      ) : (
        <button onClick={handleList}>List NFT</button>
      )}
    </div>
  );
}
```

## 📖 Core Modules

### Exchange

```typescript
// List NFT for sale
const { listingId, tx } = await sdk.exchange.listNFT({
  collectionAddress: '0x...',
  tokenId: '1',
  price: '1.5',
  duration: 86400,
});

// Buy NFT
const { tx } = await sdk.exchange.buyNFT({
  listingId: '0x...',
  value: '1.5',
});

// Update listing price (NEW in v1.1.4)
const { tx } = await sdk.exchange.updateListingPrice('listingId', '2.0');

// Cancel listing
const { tx } = await sdk.exchange.cancelListing('listingId');

// Get active listings (NEW in v1.1.4)
const { items, total } = await sdk.exchange.getActiveListings(1, 20);
```

### Collection

```typescript
// Create ERC721 collection
const { address, tx } = await sdk.collection.createERC721Collection({
  name: 'My NFTs',
  symbol: 'MNFT',
  baseUri: 'ipfs://...',
  maxSupply: 10000,
});

// Mint NFT
const { tokenId, tx } = await sdk.collection.mintERC721({
  collectionAddress: '0x...',
  recipient: '0x...',
  value: '0.1',
});
```

### Auction

```typescript
// Create English auction
const { auctionId, tx } = await sdk.auction.createEnglishAuction({
  collectionAddress: '0x...',
  tokenId: '1',
  startingBid: '1.0',
  duration: 86400 * 7, // 7 days
});

// Place bid
const { tx } = await sdk.auction.placeBid({
  auctionId: '1',
  amount: '1.5',
});

// Cancel auction (NEW in v1.1.4)
const { tx } = await sdk.auction.cancelAuction('auctionId');

// Get active auctions (NEW in v1.1.4)
const { items, total } = await sdk.auction.getActiveAuctions(1, 20);

// Get auctions by seller (NEW in v1.1.4)
const { items } = await sdk.auction.getAuctionsBySeller('0x...', 1, 20);
```

### Offers & Bundles

```typescript
await sdk.offers.makeOffer({ collectionAddress, tokenId, price, duration });
await sdk.bundles.createBundle({ nfts, price, duration });
```

## ⚛️ React Hooks

```tsx
import {
  useExchange,
  useCollection,
  useAuction,
  useWallet,
} from 'zuno-marketplace-sdk/react';

function App() {
  const { listNFT, buyNFT } = useExchange();
  const { createERC721, mintERC721 } = useCollection();
  const { createEnglishAuction, placeBid } = useAuction();
  const { address, connect } = useWallet();
  // ... use them
}
```

## 📚 Documentation

- **[API Reference](./docs/API.md)** - Complete API documentation with examples
- **[Migration Guide](./docs/MIGRATION.md)** - Migrate from custom services or older versions
- **[Examples](./examples/)** - Working code examples for Node.js and React

For additional resources, visit [docs.zuno.com](https://docs.zuno.com)

## 🛠️ Development

```bash
npm install       # Install dependencies
npm run build     # Build package
npm run type-check # Check types
npm run lint      # Lint code
npm run test      # Run tests
```

## 📄 License

MIT © [Zuno Team](https://github.com/ZunoKit)

---

**Made with ❤️ by the Zuno Team**
