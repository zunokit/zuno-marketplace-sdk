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

## 🆕 What's New in v2.0.0

### ✨ New Features

- **Batch Auction Operations** - Create/cancel multiple auctions in one transaction
- **Allowlist Management** - Add/remove addresses, set allowlist-only mode
- **Improved Defaults** - `mintLimitPerWallet` defaults to `maxSupply` (was 0)
- **Hex Listing IDs** - Listing IDs returned in bytes32 hex format

### 📖 Batch Operations

```typescript
// Batch create English auctions (max 20 per tx)
const { auctionIds, tx } = await sdk.auction.batchCreateEnglishAuction({
  collectionAddress: '0x...',
  tokenIds: ['1', '2', '3'],
  startingBid: '1.0',
  duration: 86400 * 7,
});

// Batch cancel auctions
const { cancelledCount, tx } = await sdk.auction.batchCancelAuction(['1', '2', '3']);
```

### 📖 Allowlist Management

```typescript
// Add addresses to allowlist
await sdk.collection.addToAllowlist({
  collectionAddress: '0x...',
  addresses: ['0x...', '0x...'],
});

// Enable allowlist-only mode (permanent restriction)
await sdk.collection.setAllowlistOnly({
  collectionAddress: '0x...',
  enabled: true,
});

// Check allowlist status
const isAllowed = await sdk.collection.isInAllowlist({
  collectionAddress: '0x...',
  address: '0x...',
});
```

### Previous Highlights

- Tree-shakeable imports for smaller bundles
- Testing utilities (`zuno-marketplace-sdk/testing`)
- DevTools component for visual debugging
- Standalone logger module

## 📦 Installation

```bash
npm install zuno-marketplace-sdk ethers@6 @tanstack/react-query wagmi viem
```

## 🚀 Quick Start

### React with Next.js

#### Basic Setup

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
            network: 'sepolia', // 'mainnet' | 'sepolia' | 'polygon' | 'arbitrum' | number
          }}
        >
          {children}
        </ZunoProvider>
      </body>
    </html>
  );
}
```

#### Advanced Setup (Full Configuration)

```tsx
// app/layout.tsx
import { ZunoProvider } from 'zuno-marketplace-sdk/react';
import type { ZunoSDKConfig } from 'zuno-marketplace-sdk';

export default function RootLayout({ children }) {
  const config: ZunoSDKConfig = {
    // Required
    apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
    network: 'sepolia',

    // Optional: Custom endpoints
    apiUrl: 'https://api.zuno.com/v1',        // Unified API (ABIs, contracts, networks)
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',  // Blockchain RPC

    // Optional: WalletConnect v2
    walletConnectProjectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,

    // Optional: Caching configuration
    cache: {
      ttl: 300000,      // Cache time-to-live: 5 minutes
      gcTime: 600000,   // Garbage collection: 10 minutes
    },

    // Optional: Retry policy for failed requests
    retryPolicy: {
      maxRetries: 3,
      backoff: 'exponential', // 'linear' | 'exponential'
      initialDelay: 1000,
    },

    // Optional: Debug mode
    debug: process.env.NODE_ENV === 'development',

    // Optional: Logger configuration
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
      timestamp: true,
      modulePrefix: true,
      logTransactions: true,
    },
  };

  return (
    <html>
      <body>
        <ZunoProvider
          config={config}
          enableDevTools={true} // React Query DevTools (dev only)
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
  price: '1.5',        // Price in ETH
  duration: 86400,     // Duration in seconds
});
// listingId is bytes32 hex format: '0x...'

// Buy NFT
const { tx } = await sdk.exchange.buyNFT({
  listingId: '0x...',  // bytes32 hex
});

// Cancel listing
const { tx } = await sdk.exchange.cancelListing('0x...');

// Get active listings
const { items, total } = await sdk.exchange.getActiveListings(1, 20);

// Get listings by seller
const { items } = await sdk.exchange.getListingsBySeller('0x...', 1, 20);
```

### Collection

```typescript
// Create ERC721 collection
const { address, tx } = await sdk.collection.createERC721Collection({
  name: 'My NFTs',
  symbol: 'MNFT',
  maxSupply: 10000,
  mintPrice: '0.1',              // Price in ETH
  royaltyFee: 500,               // 5% (basis points)
  mintLimitPerWallet: 10,        // Optional, defaults to maxSupply
  allowlistStageDuration: 86400, // 1 day allowlist, then public
  tokenURI: 'ipfs://...',
});

// Mint NFT (with payment)
const { tokenId, tx } = await sdk.collection.mintERC721({
  collectionAddress: '0x...',
  recipient: '0x...',
  value: '0.1', // Mint price in ETH (as string)
});

// Allowlist management
await sdk.collection.addToAllowlist({
  collectionAddress: '0x...',
  addresses: ['0x...', '0x...'],
});

await sdk.collection.setAllowlistOnly({
  collectionAddress: '0x...',
  enabled: true, // Only allowlisted addresses can mint
});
```

### Auction

```typescript
// Create English auction
const { auctionId, tx } = await sdk.auction.createEnglishAuction({
  collectionAddress: '0x...',
  tokenId: '1',
  startingBid: '1.0',
  reservePrice: '5.0',    // Optional minimum price
  duration: 86400 * 7,    // 7 days
});

// Create Dutch auction (descending price)
const { auctionId, tx } = await sdk.auction.createDutchAuction({
  collectionAddress: '0x...',
  tokenId: '1',
  startPrice: '10.0',     // Starting high price
  endPrice: '1.0',        // Minimum price
  duration: 86400,        // 1 day
});

// Place bid (English auction)
const { tx } = await sdk.auction.placeBid({
  auctionId: '1',
  amount: '1.5',
});

// Buy now (Dutch auction)
const { tx } = await sdk.auction.buyNow('auctionId');

// Cancel auction
const { tx } = await sdk.auction.cancelAuction('auctionId');

// Batch create auctions (max 20 per tx)
const { auctionIds, tx } = await sdk.auction.batchCreateEnglishAuction({
  collectionAddress: '0x...',
  tokenIds: ['1', '2', '3'],
  startingBid: '1.0',
  duration: 86400 * 7,
});

// Batch cancel auctions
const { cancelledCount, tx } = await sdk.auction.batchCancelAuction(['1', '2', '3']);
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
  useZunoSDK,    // NEW: Direct SDK access
  useZunoLogger, // NEW: Logger access
} from 'zuno-marketplace-sdk/react';

function App() {
  const { listNFT, buyNFT } = useExchange();
  const { createERC721, mintERC721 } = useCollection();
  const { createEnglishAuction, placeBid } = useAuction();
  const { address, connect } = useWallet();
  
  // NEW: Direct SDK instance access
  const sdk = useZunoSDK();
  const logger = useZunoLogger();
  
  // Use SDK utilities
  logger.info('App rendered');
  const config = sdk.getConfig();
}
```

## 🔧 SDK Access Patterns

### React Components

```tsx
import { useZunoSDK, useZunoLogger } from 'zuno-marketplace-sdk/react';

function MyComponent() {
  const sdk = useZunoSDK();      // Full SDK instance
  const logger = useZunoLogger(); // Logger only
  
  useEffect(() => {
    logger.info('Component mounted');
  }, []);
  
  return <div>Network: {sdk.getConfig().network}</div>;
}
```

### Non-React Contexts (API Routes, Utilities, Server Components)

```typescript
import { ZunoSDK, getSdk, getLogger } from 'zuno-marketplace-sdk';

// Initialize once in app entry point
ZunoSDK.getInstance({
  apiKey: process.env.ZUNO_API_KEY!,
  network: 'sepolia',
});

// utils/nft-formatter.ts
export function formatNFT(nft: NFT) {
  const logger = getLogger();
  logger.info('Formatting NFT', { tokenId: nft.tokenId });
  return formatted;
}

// app/api/nfts/route.ts (Next.js API Route)
export async function GET() {
  const sdk = getSdk();
  const listings = await sdk.exchange.getActiveListings();
  return Response.json(listings);
}
```

### Hybrid React + Non-React

```tsx
// app/layout.tsx
import { ZunoSDK } from 'zuno-marketplace-sdk';
import { ZunoContextProvider } from 'zuno-marketplace-sdk/react';

// Initialize singleton
const sdk = ZunoSDK.getInstance({
  apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
  network: 'sepolia',
});

export default function RootLayout({ children }) {
  return (
    <ZunoContextProvider sdk={sdk}>
      {children}
    </ZunoContextProvider>
  );
}
```

## 📝 Logging & DevTools

The SDK provides a powerful logging system with built-in DevTools integration. All logs are captured in-memory and displayed in the Zuno DevTools panel - no need to open browser console (F12).

### Zuno DevTools (Recommended)

Add DevTools to your app to view all SDK logs in a floating panel:

```tsx
import { ZunoDevTools } from 'zuno-marketplace-sdk/devtools';

function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === 'development' && (
        <ZunoDevTools 
          config={{
            showLogger: true,      // Show logs panel
            showTransactions: true, // Show transactions
            showCache: true,       // Show React Query cache
            showNetwork: true,     // Show network status
            position: 'bottom-right',
            maxLogEntries: 200,
          }} 
        />
      )}
    </>
  );
}
```

### Log Store API

Access logs programmatically:

```typescript
import { logStore } from 'zuno-marketplace-sdk';

// Get all logs
const logs = logStore.getAll();

// Subscribe to new logs
const unsubscribe = logStore.subscribe((logs) => {
  console.log('New logs:', logs);
});

// Clear all logs
logStore.clear();
```

### Logger Configuration

```typescript
const sdk = new ZunoSDK({
  apiKey: 'xxx',
  network: 'sepolia',
  logger: {
    level: 'debug',  // 'none' | 'error' | 'warn' | 'info' | 'debug'
    timestamp: true,
    modulePrefix: true,
    logTransactions: true,
  }
});

// All SDK operations are automatically logged to DevTools:
await sdk.exchange.listNFT({ ... });
// → Appears in DevTools Logs panel
```

### Manual Logging

```typescript
// Via SDK instance
sdk.logger.info('Custom message', { module: 'MyModule', data: { foo: 'bar' } });
sdk.logger.warn('Warning message');
sdk.logger.error('Error occurred');

// Standalone logger
import { ZunoLogger } from 'zuno-marketplace-sdk';

const logger = new ZunoLogger({ level: 'debug' });
logger.info('My log'); // → Also appears in DevTools
```

### Custom Logger Integration

```typescript
logger: {
  level: 'debug',
  customLogger: {
    debug: (msg, meta) => Sentry.addBreadcrumb({ message: msg }),
    info: (msg, meta) => myLogger.info(msg, meta),
    warn: (msg, meta) => Sentry.captureMessage(msg, 'warning'),
    error: (msg, meta) => Sentry.captureException(new Error(msg)),
  }
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
