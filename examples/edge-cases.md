# SDK Edge Cases and Examples

This guide covers common edge cases and how to handle them with the Zuno SDK.

## 🔧 Error Handling Examples

### 1. Handling Insufficient Funds

```typescript
import { ZunoSDK, ErrorCodes } from 'zuno-marketplace-sdk';

const sdk = new ZunoSDK({ apiKey, network: 'sepolia' });

try {
  await sdk.exchange.listNFT({
    collectionAddress: '0x...',
    tokenId: '1',
    price: '1.5',
    duration: 86400,
  });
} catch (error) {
  if (error.code === ErrorCodes.INSUFFICIENT_FUNDS) {
    console.log('Not enough ETH for gas + listing fee');
    // Show user-friendly message
    alert('Please add more ETH to your wallet to complete this transaction');
  }
}
```

### 2. Retry Failed Transactions

```typescript
import { withRetry } from 'zuno-marketplace-sdk/utils';

async function listWithRetry(params) {
  return withRetry(
    () => sdk.exchange.listNFT(params),
    {
      maxRetries: 3,
      initialDelay: 2000,
      backoff: 'exponential'
    }
  );
}
```

## 📦 Batch Operations

### 1. Batch List Multiple NFTs

```typescript
const nftsToSell = [
  { collectionAddress: '0x...', tokenId: '1', price: '1.5', duration: 86400 },
  { collectionAddress: '0x...', tokenId: '2', price: '2.0', duration: 86400 },
  { collectionAddress: '0x...', tokenId: '3', price: '0.8', duration: 86400 },
];

const results = await sdk.exchange.batchListNFT(nftsToSell, {
  continueOnError: true, // Continue if one fails
  maxConcurrency: 2 // Process 2 at a time
});

// Check results
results.forEach((result, index) => {
  if (result.success) {
    console.log(`NFT ${index + 1} listed successfully`);
  } else {
    console.error(`Failed to list NFT ${index + 1}:`, result.error.message);
  }
});
```

### 2. Batch Buy Multiple NFTs

```typescript
async function buyMultipleNFTs(listingIds: string[]) {
  const buyOperations = listingIds.map(listingId =>
    () => sdk.exchange.buyNFT({
      listingId,
      value: await getListingPrice(listingId)
    })
  );

  const results = await sdk.exchange.batchExecute(buyOperations, {
    continueOnError: true,
    maxConcurrency: 1 // Buy one at a time to avoid nonce issues
  });

  return results;
}
```

## 🔄 Preloading Strategies

### 1. Preload for Specific Use Case

```typescript
// For marketplace app
await sdk.prefetchForUseCase('marketplace');

// For collection creation app
await sdk.prefetchForUseCase('collection');

// For auction app
await sdk.prefetchForUseCase('auction');
```

### 2. Preload All ABIs

```typescript
// Preload during app initialization
async function initializeApp() {
  await sdk.prefetchEssentialABIs(); // Load MVP essentials first

  // Then load all ABIs in background
  sdk.prefetchABIs().catch(console.error);
}
```

## ⚠️ Network Issues

### 1. Handle Network Switching

```typescript
import { ZunoSDK, ErrorCodes } from 'zuno-marketplace-sdk';

let sdk = new ZunoSDK({ apiKey, network: 'mainnet' });

// When user switches networks
async function switchNetwork(newNetwork) {
  try {
    // Clear cache to prevent invalid data
    await sdk.clearCache();

    // Create new SDK instance for new network
    sdk = new ZunoSDK({ apiKey, network: newNetwork });

    // Preload ABIs for new network
    await sdk.prefetchEssentialABIs();
  } catch (error) {
    console.error('Network switch failed:', error);
  }
}
```

### 2. RPC Fallback

```typescript
// Configure backup RPC URLs
const sdk = new ZunoSDK({
  apiKey: process.env.API_KEY,
  network: 'mainnet',
  rpcUrl: 'https://primary-rpc-url.com', // Primary RPC
  // Note: Add fallback RPC logic in your provider setup
});
```

## 🎯 Gas Optimization

### 1. Custom Gas Settings

```typescript
await sdk.exchange.listNFT({
  collectionAddress: '0x...',
  tokenId: '1',
  price: '1.5',
  duration: 86400,
  options: {
    gasLimit: '300000', // Override estimated gas
    gasPrice: ethers.parseUnits('20', 'gwei'), // Custom gas price
    maxRetries: 1, // Reduce retries for fast execution
  }
});
```

### 2. Gas Price Monitoring

```typescript
// Check current gas price before transaction
const gasPrice = await sdk.exchange.txManager?.getGasPrice();
const gasPriceGwei = Number(ethers.formatUnits(gasPrice, 'gwei'));

if (gasPriceGwei > 50) {
  // Warn user about high gas prices
  if (!confirm(`Gas is high (${gasPriceGwei} Gwei). Continue?`)) {
    return;
  }
}
```

## 🔍 Validation Examples

### 1. Input Validation

```typescript
import { validateAddress, validateAmount, ErrorCodes } from 'zuno-marketplace-sdk';

function validateAndList(params) {
  try {
    // Manual validation
    validateAddress(params.collectionAddress);
    validateAmount(params.price, 'price');

    // Runtime type guard
    validateListNFTParams(params);

    return sdk.exchange.listNFT(params);
  } catch (error) {
    if (error.code === ErrorCodes.INVALID_PARAMETER) {
      // Show validation error to user
      alert(`Validation error: ${error.message}`);
    }
    throw error;
  }
}
```

### 2. Contract Verification

```typescript
// Verify collection before listing
async function safeListNFT(params) {
  const { isValid, tokenType } = await sdk.collection.verifyCollection(
    params.collectionAddress
  );

  if (!isValid) {
    throw new Error('Invalid collection contract');
  }

  if (tokenType !== 'ERC721') {
    throw new Error('Only ERC721 collections are supported');
  }

  return sdk.exchange.listNFT(params);
}
```

## 📱 Mobile/Wallet Specific

### 1. Mobile Wallet Handling

```typescript
// Detect mobile environment
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (isMobile) {
  // Use different timeout for mobile
  const sdk = new ZunoSDK({
    apiKey,
    network: 'mainnet',
    // Note: Configure longer timeouts for mobile wallets
  });
}
```

### 2. WalletConnect Issues

```typescript
// Handle WalletConnect-specific errors
try {
  await sdk.exchange.listNFT(params);
} catch (error) {
  if (error.message.includes('WalletConnect')) {
    // Reconnect WalletConnect
    await reconnectWalletConnect();
    // Retry transaction
    return sdk.exchange.listNFT(params);
  }
  throw error;
}
```

## 🔄 State Management

### 1. Transaction Status Tracking

```typescript
const [transactions, setTransactions] = useState([]);

async function listNFTWithTracking(params) {
  const txHash = await new Promise((resolve, reject) => {
    sdk.exchange.listNFT({
      ...params,
      options: {
        onSent: (hash) => {
          setTransactions(prev => [...prev, {
            hash,
            status: 'pending',
            timestamp: Date.now()
          }]);
          resolve(hash);
        },
        onSuccess: (receipt) => {
          setTransactions(prev =>
            prev.map(tx => tx.hash === receipt.hash
              ? { ...tx, status: 'success', receipt }
              : tx
            )
          );
        },
        onError: (error) => {
          setTransactions(prev =>
            prev.map(tx => tx.hash === resolve.hash
              ? { ...tx, status: 'failed', error }
              : tx
            )
          );
          reject(error);
        }
      }
    });
  });

  return txHash;
}
```

## 🧪 Testing Edge Cases

### 1. Mock Network Failures

```typescript
// Test transaction failure handling
async function testFailureHandling() {
  // Simulate network failure
  const originalFetch = global.fetch;
  global.fetch = () => Promise.reject(new Error('Network error'));

  try {
    await sdk.exchange.listNFT(params);
  } catch (error) {
    console.log('Properly caught network error:', error.code);
  }

  // Restore original fetch
  global.fetch = originalFetch;
}
```

### 2. Performance Testing

```typescript
// Test batch operation performance
console.time('batch-list-100');
const nfts = Array.from({ length: 100 }, (_, i) => ({
  collectionAddress: '0x...',
  tokenId: i.toString(),
  price: '1.0',
  duration: 86400
}));

await sdk.exchange.batchListNFT(nfts, {
  maxConcurrency: 5,
  continueOnError: true
});
console.timeEnd('batch-list-100');
```

## 📋 Best Practices

1. **Always validate inputs** before sending transactions
2. **Handle network errors gracefully** with retry logic
3. **Preload ABIs** during app initialization
4. **Use batch operations** for multiple transactions
5. **Monitor gas prices** before expensive operations
6. **Implement proper error boundaries** in React apps
7. **Clear cache** when switching networks
8. **Track transaction status** for better UX