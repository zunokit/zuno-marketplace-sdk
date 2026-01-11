# Zuno Marketplace SDK

> **All-in-One NFT Marketplace SDK with Wagmi & React Query built-in**

A comprehensive, type-safe SDK for building NFT marketplace applications on Ethereum and EVM-compatible chains. Built with TypeScript, featuring first-class React support with Wagmi and TanStack Query integration.

[![License](https://img.shields.io/npm/l/zuno-marketplace-sdk)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)

## Features

- **Complete NFT Marketplace** - Exchange, Auctions, Offers, Bundles
- **React Integration** - 21+ hooks with Wagmi & React Query
- **Type-Safe** - Full TypeScript support with strict typing
- **Smart Caching** - Built-in ABI caching with TanStack Query
- **Modular Design** - Use only what you need
- **Production Ready** - Robust error handling and retries
- **DevTools** - In-app debugging panel

## Platform Support

| Feature | Status |
|---------|:------:|
| Zuno ABIs & Contracts | ✅ Fully Supported |
| Custom ABIs/Contracts | ❌ Not Supported |
| Local Development | ✅ Full Support |
| Testnet/Mainnet | ⚠️ Coming Soon |

## Installation

```bash
npm install zuno-marketplace-sdk ethers@6 @tanstack/react-query wagmi viem
```

## Quick Start

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
    console.log('Listed:', listingId);
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

## Core Modules

### Exchange

```typescript
// List NFT
const { listingId, tx } = await sdk.exchange.listNFT({
  collectionAddress: '0x...',
  tokenId: '1',
  price: '1.5',
  duration: 86400,
});

// Buy NFT
const { tx } = await sdk.exchange.buyNFT({ listingId: '0x...' });

// Cancel listing
await sdk.exchange.cancelListing('0x...');
```

### Collection

```typescript
// Create ERC721 collection
const { address, tx } = await sdk.collection.createERC721Collection({
  name: 'My NFTs',
  symbol: 'MNFT',
  maxSupply: 10000,
  mintPrice: '0.1',
  royaltyFee: 500,
  tokenURI: 'ipfs://...',
});

// Mint NFT
const { tokenId, tx } = await sdk.collection.mintERC721({
  collectionAddress: '0x...',
  recipient: '0x...',
  value: '0.1',
});

// Allowlist management
await sdk.collection.addToAllowlist({
  collectionAddress: '0x...',
  addresses: ['0x...', '0x...'],
});
```

### Auction

```typescript
// Create English auction
const { auctionId, tx } = await sdk.auction.createEnglishAuction({
  collectionAddress: '0x...',
  tokenId: '1',
  startingBid: '1.0',
  duration: 86400 * 7,
});

// Create Dutch auction
const { auctionId, tx } = await sdk.auction.createDutchAuction({
  collectionAddress: '0x...',
  tokenId: '1',
  startPrice: '10.0',
  endPrice: '1.0',
  duration: 86400,
});

// Place bid
const { tx } = await sdk.auction.placeBid({
  auctionId: '1',
  amount: '1.5',
});

// Batch operations
const { auctionIds, tx } = await sdk.auction.batchCreateEnglishAuction({
  collectionAddress: '0x...',
  tokenIds: ['1', '2', '3'],
  startingBid: '1.0',
  duration: 86400 * 7,
});
```

## React Hooks

```tsx
import {
  useExchange,
  useCollection,
  useAuction,
  useWallet,
  useZunoSDK,
  useZunoLogger,
} from 'zuno-marketplace-sdk/react';

function App() {
  const { listNFT, buyNFT } = useExchange();
  const { createERC721, mintERC721 } = useCollection();
  const { createEnglishAuction, placeBid } = useAuction();
  const { address, connect } = useWallet();
  const sdk = useZunoSDK();
  const logger = useZunoLogger();

  logger.info('App rendered');
  return <div>Network: {sdk.getConfig().network}</div>;
}
```

## SDK Access Patterns

### React Components

```tsx
import { useZunoSDK, useZunoLogger } from 'zuno-marketplace-sdk/react';

function MyComponent() {
  const sdk = useZunoSDK();
  const logger = useZunoLogger();
  return <div>Network: {sdk.getConfig().network}</div>;
}
```

### Non-React Contexts

```typescript
import { ZunoSDK, getSdk, getLogger } from 'zuno-marketplace-sdk';

// Initialize once
ZunoSDK.getInstance({
  apiKey: process.env.ZUNO_API_KEY!,
  network: 'sepolia',
});

// Use anywhere
const sdk = getSdk();
const logger = getLogger();
```

## Logging & DevTools

### Zuno DevTools

```tsx
import { ZunoDevTools } from 'zuno-marketplace-sdk/react';

function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === 'development' && (
        <ZunoDevTools
          config={{
            showLogger: true,
            showTransactions: true,
            showCache: true,
            showNetwork: true,
            position: 'bottom-right',
          }}
        />
      )}
    </>
  );
}
```

### Logger Configuration

```typescript
const sdk = new ZunoSDK({
  apiKey: 'xxx',
  network: 'sepolia',
  logger: {
    level: 'debug', // 'none' | 'error' | 'warn' | 'info' | 'debug'
    timestamp: true,
    modulePrefix: true,
    logTransactions: true,
    customLogger: {
      info: (msg, meta) => myLogger.info(msg, meta),
      error: (msg, meta) => Sentry.captureException(new Error(msg)),
    },
  },
});
```

## Documentation

- **[Project Overview & PDR](./docs/project-overview-pdr.md)** - Project overview and requirements
- **[Codebase Summary](./docs/codebase-summary.md)** - Architecture and module organization
- **[Code Standards](./docs/code-standards.md)** - TypeScript and coding conventions
- **[System Architecture](./docs/system-architecture.md)** - Detailed architecture documentation

## Development

```bash
npm install          # Install dependencies
npm run build        # Build package
npm run type-check   # Check types
npm run lint         # Lint code
npm run test         # Run tests
```

## License

MIT © [Zuno Team](https://github.com/ZunoKit)

---

**Made with ❤️ by the Zuno Team**
