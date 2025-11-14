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
    await listNFT.mutateAsync({
      collectionAddress: '0x...',
      tokenId: '1',
      price: '1.5',
      duration: 86400,
    });
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
await sdk.exchange.listNFT({ collectionAddress, tokenId, price, duration });
await sdk.exchange.buyNFT({ listingId, value });
await sdk.exchange.cancelListing(listingId);
```

### Collection

```typescript
await sdk.collection.createERC721Collection({ name, symbol, baseUri, maxSupply });
await sdk.collection.mintERC721({ collectionAddress, recipient, tokenUri });
```

### Auction

```typescript
await sdk.auction.createEnglishAuction({ collectionAddress, tokenId, startingBid, duration });
await sdk.auction.placeBid({ auctionId, amount });
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
