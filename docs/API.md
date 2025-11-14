# Zuno Marketplace SDK - API Reference

Complete API reference for the Zuno Marketplace SDK.

## Table of Contents

- [AuctionModule](#auctionmodule)
  - [createEnglishAuction](#createenglishauction)
  - [createDutchAuction](#createdutchauction)
  - [placeBid](#placebid)
  - [endAuction](#endauction)
  - [getAuction](#getauction)
  - [getCurrentPrice](#getcurrentprice)
- [ExchangeModule](#exchangemodule)
  - [listNFT](#listnft)
  - [buyNFT](#buynft)
  - [cancelListing](#cancellisting)
  - [batchListNFT](#batchlistnft)
  - [batchBuyNFT](#batchbuynft)
- [CollectionModule](#collectionmodule)
  - [createERC721](#createerc721)
  - [createERC1155](#createerc1155)
  - [mintERC721](#minterc721)
  - [mintERC1155](#minterc1155)
- [React Hooks](#react-hooks)
  - [useAuction](#useauction)
  - [useExchange](#useexchange-1)
  - [useCollection](#usecollection-1)
- [Error Codes](#error-codes)

---

## AuctionModule

The AuctionModule handles creation and management of NFT auctions, supporting both English (ascending) and Dutch (descending) auction formats.

### createEnglishAuction

Create an English auction for an NFT.

**Signature:**
```typescript
async createEnglishAuction(
  params: CreateEnglishAuctionParams
): Promise<{ auctionId: string; tx: TransactionReceipt }>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `collectionAddress` | `string` | ✅ | NFT collection contract address |
| `tokenId` | `string` | ✅ | Token ID of the NFT to auction |
| `startingBid` | `string` | ✅ | Minimum bid amount in ETH (e.g., "1.0") |
| `duration` | `number` | ✅ | Auction duration in seconds |
| `reservePrice` | `string` | ❌ | Minimum price to accept (in ETH) |
| `amount` | `number` | ❌ | Number of tokens (for ERC1155, default: 1) |
| `seller` | `string` | ❌ | Seller address (defaults to signer) |
| `options` | `TransactionOptions` | ❌ | Transaction options |

**Returns:**
- `auctionId`: The ID of the created auction
- `tx`: Transaction receipt

**Throws:**
- `INVALID_ADDRESS` - Invalid collection address
- `INVALID_TOKEN_ID` - Invalid token ID
- `INVALID_AMOUNT` - Invalid starting bid
- `INVALID_DURATION` - Invalid duration
- `TRANSACTION_FAILED` - Transaction failed

**Example:**
```typescript
const { auctionId, tx } = await sdk.auction.createEnglishAuction({
  collectionAddress: "0x1234567890123456789012345678901234567890",
  tokenId: "1",
  startingBid: "1.0",
  reservePrice: "5.0",
  duration: 86400 * 7, // 7 days
});

console.log(`Auction created with ID: ${auctionId}`);
console.log(`Transaction: ${tx.hash}`);
```

---

### createDutchAuction

Create a Dutch auction for an NFT.

**Signature:**
```typescript
async createDutchAuction(
  params: CreateDutchAuctionParams
): Promise<{ auctionId: string; tx: TransactionReceipt }>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `collectionAddress` | `string` | ✅ | NFT collection contract address |
| `tokenId` | `string` | ✅ | Token ID of the NFT to auction |
| `startPrice` | `string` | ✅ | Starting price in ETH (e.g., "10.0") |
| `endPrice` | `string` | ✅ | Ending price in ETH (e.g., "1.0") |
| `duration` | `number` | ✅ | Auction duration in seconds |
| `amount` | `number` | ❌ | Number of tokens (for ERC1155, default: 1) |
| `seller` | `string` | ❌ | Seller address (defaults to signer) |
| `options` | `TransactionOptions` | ❌ | Transaction options |

**Returns:**
- `auctionId`: The ID of the created auction
- `tx`: Transaction receipt

**Throws:**
- `INVALID_ADDRESS` - Invalid collection address
- `INVALID_TOKEN_ID` - Invalid token ID
- `INVALID_AMOUNT` - Invalid start or end price
- `INVALID_DURATION` - Invalid duration
- `TRANSACTION_FAILED` - Transaction failed

**Example:**
```typescript
const { auctionId, tx } = await sdk.auction.createDutchAuction({
  collectionAddress: "0x1234567890123456789012345678901234567890",
  tokenId: "1",
  startPrice: "10.0",
  endPrice: "1.0",
  duration: 86400, // 1 day
});

console.log(`Dutch auction created with ID: ${auctionId}`);
```

---

### placeBid

Place a bid on an English auction.

**Signature:**
```typescript
async placeBid(params: PlaceBidParams): Promise<TransactionReceipt>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `auctionId` | `string` | ✅ | ID of the auction to bid on |
| `amount` | `string` | ✅ | Bid amount in ETH (e.g., "2.0") |
| `options` | `TransactionOptions` | ❌ | Transaction options |

**Returns:**
- `TransactionReceipt`

**Throws:**
- `INVALID_TOKEN_ID` - Invalid auction ID
- `INVALID_AMOUNT` - Invalid bid amount
- `TRANSACTION_FAILED` - Transaction failed

**Example:**
```typescript
const receipt = await sdk.auction.placeBid({
  auctionId: "1",
  amount: "2.5"
});

console.log(`Bid placed in transaction: ${receipt.hash}`);
```

---

### endAuction

End an auction and finalize the sale.

**Signature:**
```typescript
async endAuction(
  auctionId: string,
  options?: TransactionOptions
): Promise<TransactionReceipt>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `auctionId` | `string` | ✅ | ID of the auction to end |
| `options` | `TransactionOptions` | ❌ | Transaction options |

**Returns:**
- `TransactionReceipt`

**Throws:**
- `INVALID_TOKEN_ID` - Invalid auction ID
- `TRANSACTION_FAILED` - Transaction failed

**Example:**
```typescript
const receipt = await sdk.auction.endAuction("1");
console.log(`Auction ended in transaction: ${receipt.hash}`);
```

---

### getAuction

Get detailed information about an auction.

**Signature:**
```typescript
async getAuction(auctionId: string): Promise<Auction>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `auctionId` | `string` | ✅ | ID of the auction to fetch |

**Returns:**
- `Auction` object with details

**Throws:**
- `INVALID_TOKEN_ID` - Invalid auction ID
- `CONTRACT_CALL_FAILED` - Auction not found

**Example:**
```typescript
const auction = await sdk.auction.getAuction("1");
console.log(`Auction type: ${auction.type}`);
console.log(`Current bid: ${auction.currentBid} ETH`);
console.log(`Status: ${auction.status}`);
```

---

### getCurrentPrice

Get the current price of a Dutch auction.

**Signature:**
```typescript
async getCurrentPrice(auctionId: string): Promise<string>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `auctionId` | `string` | ✅ | ID of the Dutch auction |

**Returns:**
- Current price in ETH as a string

**Throws:**
- `INVALID_TOKEN_ID` - Invalid auction ID
- `CONTRACT_CALL_FAILED` - Auction not found or not a Dutch auction

**Example:**
```typescript
const currentPrice = await sdk.auction.getCurrentPrice("1");
console.log(`Current price: ${currentPrice} ETH`);
```

---

## ExchangeModule

The ExchangeModule handles fixed-price NFT listings and purchases.

### listNFT

List an NFT for sale at a fixed price.

**Signature:**
```typescript
async listNFT(params: ListNFTParams): Promise<TransactionReceipt>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `collectionAddress` | `string` | ✅ | NFT collection contract address |
| `tokenId` | `string` | ✅ | Token ID to list |
| `price` | `string` | ✅ | Price in ETH (e.g., "1.5") |
| `duration` | `number` | ✅ | Listing duration in seconds |
| `options` | `TransactionOptions` | ❌ | Transaction options |

**Example:**
```typescript
const receipt = await sdk.exchange.listNFT({
  collectionAddress: "0x1234567890123456789012345678901234567890",
  tokenId: "1",
  price: "1.5",
  duration: 86400 * 7, // 7 days
});
```

---

### buyNFT

Buy a listed NFT.

**Signature:**
```typescript
async buyNFT(params: BuyNFTParams): Promise<TransactionReceipt>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `listingId` | `string` | ✅ | ID of the listing to buy |
| `value` | `string` | ❌ | ETH value to send |
| `options` | `TransactionOptions` | ❌ | Transaction options |

**Example:**
```typescript
const receipt = await sdk.exchange.buyNFT({
  listingId: "0xabc...",
  value: "1.5"
});
```

---

### cancelListing

Cancel an active listing.

**Signature:**
```typescript
async cancelListing(params: CancelListingParams): Promise<TransactionReceipt>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `listingId` | `string` | ✅ | ID of the listing to cancel |
| `options` | `TransactionOptions` | ❌ | Transaction options |

**Example:**
```typescript
const receipt = await sdk.exchange.cancelListing({
  listingId: "0xabc..."
});
```

---

### batchListNFT

List multiple NFTs in a single transaction.

**Signature:**
```typescript
async batchListNFT(params: BatchListNFTParams): Promise<TransactionReceipt>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `collectionAddress` | `string` | ✅ | NFT collection contract address |
| `tokenIds` | `string[]` | ✅ | Array of token IDs to list |
| `prices` | `string[]` | ✅ | Array of prices (must match tokenIds length) |
| `duration` | `number` | ✅ | Listing duration in seconds |
| `options` | `TransactionOptions` | ❌ | Transaction options |

**Example:**
```typescript
const receipt = await sdk.exchange.batchListNFT({
  collectionAddress: "0x1111...",
  tokenIds: ["1", "2", "3"],
  prices: ["0.5", "0.7", "1.0"],
  duration: 86400,
});
```

---

### batchBuyNFT

Buy multiple listed NFTs in a single transaction.

**Signature:**
```typescript
async batchBuyNFT(params: BatchBuyNFTParams): Promise<TransactionReceipt>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `listingIds` | `string[]` | ✅ | Array of listing IDs to buy |
| `value` | `string` | ❌ | Total ETH value to send |
| `options` | `TransactionOptions` | ❌ | Transaction options |

**Example:**
```typescript
const receipt = await sdk.exchange.batchBuyNFT({
  listingIds: ["0xaaa...", "0xbbb..."],
  value: "2.2"
});
```

---

## CollectionModule

The CollectionModule handles NFT collection creation and minting.

### createERC721

Create a new ERC721 NFT collection.

**Signature:**
```typescript
async createERC721(
  params: CreateERC721CollectionParams
): Promise<{ address: string; tx: TransactionReceipt }>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | Collection name |
| `symbol` | `string` | ✅ | Collection symbol |
| `baseUri` | `string` | ✅ | Base URI for token metadata |
| `maxSupply` | `number` | ✅ | Maximum supply of tokens |
| `options` | `TransactionOptions` | ❌ | Transaction options |

**Example:**
```typescript
const { address, tx } = await sdk.collection.createERC721({
  name: "My Collection",
  symbol: "MYC",
  baseUri: "ipfs://...",
  maxSupply: 10000
});
```

---

### createERC1155

Create a new ERC1155 NFT collection.

**Signature:**
```typescript
async createERC1155(
  params: CreateERC1155CollectionParams
): Promise<{ address: string; tx: TransactionReceipt }>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `uri` | `string` | ✅ | URI for token metadata |
| `options` | `TransactionOptions` | ❌ | Transaction options |

**Example:**
```typescript
const { address, tx } = await sdk.collection.createERC1155({
  uri: "ipfs://..."
});
```

---

### mintERC721

Mint a single ERC721 token.

**Signature:**
```typescript
async mintERC721(
  params: MintERC721Params
): Promise<{ tokenId: string; tx: TransactionReceipt }>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `collectionAddress` | `string` | ✅ | Collection contract address |
| `recipient` | `string` | ✅ | Recipient address |
| `value` | `string` | ❌ | ETH value (mint fee) |
| `options` | `TransactionOptions` | ❌ | Transaction options |

**Example:**
```typescript
const { tokenId, tx } = await sdk.collection.mintERC721({
  collectionAddress: "0x5678...",
  recipient: "0x9abc...",
  value: "0.1"
});
```

---

### mintERC1155

Mint ERC1155 tokens.

**Signature:**
```typescript
async mintERC1155(params: MintERC1155Params): Promise<TransactionReceipt>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `collectionAddress` | `string` | ✅ | Collection contract address |
| `recipient` | `string` | ✅ | Recipient address |
| `tokenId` | `string` | ✅ | Token ID to mint |
| `amount` | `number` | ✅ | Amount to mint |
| `data` | `string` | ❌ | Additional data |
| `options` | `TransactionOptions` | ❌ | Transaction options |

**Example:**
```typescript
const receipt = await sdk.collection.mintERC1155({
  collectionAddress: "0x1111...",
  recipient: "0x9abc...",
  tokenId: "1",
  amount: 100
});
```

---

## React Hooks

React hooks for integrating the SDK with React applications using React Query.

### useAuction

Hook for auction operations.

**Returns:**
```typescript
{
  createEnglishAuction: UseMutationResult<...>,
  createDutchAuction: UseMutationResult<...>,
  placeBid: UseMutationResult<...>,
  endAuction: UseMutationResult<...>
}
```

**Example:**
```typescript
import { useAuction } from 'zuno-marketplace-sdk/react';

function MyComponent() {
  const { createEnglishAuction, placeBid } = useAuction();

  const handleCreate = async () => {
    await createEnglishAuction.mutateAsync({
      collectionAddress: "0x123...",
      tokenId: "1",
      startingBid: "1.0",
      duration: 86400 * 7
    });
  };

  return (
    <button
      onClick={handleCreate}
      disabled={createEnglishAuction.isPending}
    >
      {createEnglishAuction.isPending ? 'Creating...' : 'Create Auction'}
    </button>
  );
}
```

---

### useExchange

Hook for exchange operations.

**Returns:**
```typescript
{
  listNFT: UseMutationResult<...>,
  buyNFT: UseMutationResult<...>,
  cancelListing: UseMutationResult<...>,
  batchListNFT: UseMutationResult<...>,
  batchBuyNFT: UseMutationResult<...>
}
```

**Example:**
```typescript
import { useExchange } from 'zuno-marketplace-sdk/react';

function MyComponent() {
  const { listNFT, buyNFT } = useExchange();

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

### useCollection

Hook for collection operations.

**Returns:**
```typescript
{
  createERC721: UseMutationResult<...>,
  createERC1155: UseMutationResult<...>,
  mintERC721: UseMutationResult<...>,
  mintERC1155: UseMutationResult<...>,
  batchMintERC721: UseMutationResult<...>
}
```

---

### useAuctionDetails

Hook to fetch auction details.

**Signature:**
```typescript
function useAuctionDetails(auctionId?: string): UseQueryResult<Auction>
```

**Example:**
```typescript
import { useAuctionDetails } from 'zuno-marketplace-sdk/react';

function AuctionView({ auctionId }) {
  const { data: auction, isLoading, error } = useAuctionDetails(auctionId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Auction #{auction.id}</h2>
      <p>Type: {auction.type}</p>
      <p>Status: {auction.status}</p>
      <p>Current Bid: {auction.currentBid} ETH</p>
    </div>
  );
}
```

---

### useDutchAuctionPrice

Hook to get current Dutch auction price (auto-refreshes every 10 seconds).

**Signature:**
```typescript
function useDutchAuctionPrice(auctionId?: string): UseQueryResult<string>
```

**Example:**
```typescript
import { useDutchAuctionPrice } from 'zuno-marketplace-sdk/react';

function DutchAuctionView({ auctionId }) {
  const { data: currentPrice } = useDutchAuctionPrice(auctionId);

  return <div>Current Price: {currentPrice} ETH</div>;
}
```

---

## Error Codes

The SDK throws `ZunoSDKError` with specific error codes:

| Code | Description |
|------|-------------|
| `INVALID_ADDRESS` | Invalid Ethereum address |
| `INVALID_TOKEN_ID` | Invalid token ID |
| `INVALID_AMOUNT` | Invalid amount (must be > 0) |
| `INVALID_DURATION` | Invalid duration |
| `TRANSACTION_FAILED` | Transaction failed |
| `CONTRACT_CALL_FAILED` | Contract call failed |
| `NOT_APPROVED` | NFT not approved for marketplace |
| `ALREADY_LISTED` | NFT already listed |
| `INSUFFICIENT_FUNDS` | Insufficient funds |
| `USER_REJECTED` | User rejected transaction |

**Example Error Handling:**
```typescript
import { ZunoSDKError } from 'zuno-marketplace-sdk';

try {
  await sdk.auction.createEnglishAuction({
    collectionAddress: "0x123...",
    tokenId: "1",
    startingBid: "1.0",
    duration: 86400
  });
} catch (error) {
  if (error instanceof ZunoSDKError) {
    switch (error.code) {
      case 'INVALID_ADDRESS':
        console.error('Please provide a valid address');
        break;
      case 'NOT_APPROVED':
        console.error('Please approve the marketplace first');
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

---

## Type Definitions

### TransactionOptions

```typescript
interface TransactionOptions {
  gasLimit?: number;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  value?: string;
  waitForConfirmations?: number;
  onSent?: (txHash: string) => void;
  onConfirmed?: (receipt: unknown) => void;
  onError?: (error: Error) => void;
}
```

### Auction

```typescript
interface Auction {
  id: string;
  type: 'english' | 'dutch';
  seller: string;
  collectionAddress: string;
  tokenId: string;
  startingBid?: string;
  startPrice?: string;
  endPrice?: string;
  reservePrice?: string;
  currentBid?: string;
  highestBidder?: string;
  startTime: number;
  endTime: number;
  status: 'active' | 'ended' | 'cancelled';
  createdAt: string;
}
```

### Listing

```typescript
interface Listing {
  id: string;
  seller: string;
  collectionAddress: string;
  tokenId: string;
  price: string;
  paymentToken: string;
  startTime: number;
  endTime: number;
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  createdAt: string;
}
```

---

## Support

For more examples and guides, see:
- [README](../README.md)
- [Migration Guide](./MIGRATION.md)
- [Examples](../examples/)
