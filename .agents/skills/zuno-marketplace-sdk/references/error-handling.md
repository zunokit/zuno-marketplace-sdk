# Zuno SDK Error Handling

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `INSUFFICIENT_BALANCE` | Not enough ETH | Check wallet balance |
| `INSUFFICIENT_ALLOWANCE` | Token not approved | Call approveToken first |
| `LISTING_NOT_FOUND` | Invalid listing ID | Verify listing exists |
| `AUCTION_ENDED` | Auction already ended | Check auction status |
| `BID_TOO_LOW` | Bid below minimum | Increase bid amount |
| `INVALID_AMOUNT` | Wrong amount for ERC1155 | Check token standard |
| `NETWORK_MISMATCH` | Wrong network | Switch wallet network |
| `USER_REJECTED` | User rejected tx | Prompt user to retry |

## Common Errors

### ERC1155 Amount Validation

```typescript
// Error: INVALID_AMOUNT if omitted for ERC1155
await sdk.exchange.listNFT({
  collectionAddress: "0x...",
  tokenId: "1",
  // amount: "10", // Required for ERC1155!
  price: "1.5",
  duration: 86400,
});
```

### Listing ID Format

```typescript
// Must be valid bytes32 hex string
const validId = "0x1234567890abcdef..."; // 66 chars
const invalidId = "123"; // Missing 0x prefix
```

### Retry Configuration

```typescript
import { transactionStore } from "zuno-marketplace-sdk";

// Configure global retry
const tx = await sdk.exchange.buyNFT({ listingId: "0x..." });

// Retry failed tx with custom config
await transactionStore.retryTransaction(tx.id, {
  maxRetries: 5,
  retryDelay: 3000,
});
```

## Error Handling Pattern

```tsx
const { listNFT } = useExchange();

const handleList = async () => {
  try {
    const result = await listNFT.mutateAsync({...});
  } catch (error) {
    if (error.code === "INSUFFICIENT_ALLOWANCE") {
      // Handle approval
    } else if (error.code === "USER_REJECTED") {
      // User cancelled
    } else {
      // Generic error
    }
  }
};
```
