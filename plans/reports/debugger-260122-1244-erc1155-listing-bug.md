# Debug Report: ERC1155 Listing Bug (Issue #99)

**Date:** 2026-01-22
**Issue:** #99 - Bug listing ERC1155
**Status:** Root Cause Identified
**Severity:** Critical - Blocks all ERC1155 listing functionality

---

## Executive Summary

**Root Cause:** SDK's `ExchangeModule` functions are missing the `amount` parameter required for ERC1155 listings. The SDK passes 4 parameters to both `listNFT` and `batchListNFT` contracts, but ERC1155 contracts expect 5 parameters (including `amount`).

**Impact:**
- Single ERC1155 listings fail with: `invalid BigNumberish value (argument="value", value={  }, code=INVALID_ARGUMENT, version=6.15.0)`
- Batch ERC1155 listings fail with: `Gas estimation failed` + `invalid array value`

**Fix Required:** Update `ExchangeModule.ts` to include `amount` parameter for ERC1155 listings and update type definitions to support optional amount field.

---

## Technical Analysis

### Issue 1: Single Listing (`listNFT`)

**Location:** `E:\zuno-marketplace-sdk\src\modules\ExchangeModule.ts:158-163`

**Current Implementation:**
```typescript
const tx = await txManager.sendTransaction(
  exchangeContract,
  'listNFT',
  [collectionAddress, tokenId, priceInWei, duration],  // Missing amount!
  { ...options, module: 'Exchange' }
);
```

**ERC1155 Contract Signature:**
```solidity
// File: E:\zuno-marketplace-contracts\src\core\exchange\ERC1155NFTExchange.sol:41-47
function listNFT(
    address m_contractAddress,
    uint256 m_tokenId,
    uint256 m_amount,      // <-- REQUIRED for ERC1155
    uint256 m_price,
    uint256 m_listingDuration
) public
```

**ERC721 Contract Signature (for comparison):**
```solidity
// File: E:\zuno-marketplace-contracts\src\core\exchange\ERC721NFTExchange.sol
function listNFT(
    address m_contractAddress,
    uint256 m_tokenId,
    uint256 m_price,
    uint256 m_listingDuration
) public
```

**Error Cause:** When ethers.js tries to call the contract with only 4 parameters, the 5th parameter (`m_amount`) is implicitly `undefined` or an empty object `{}`, which causes the `invalid BigNumberish value` error.

---

### Issue 2: Batch Listing (`batchListNFT`)

**Location:** `E:\zuno-marketplace-sdk\src\modules\ExchangeModule.ts:588-593`

**Current Implementation:**
```typescript
const tx = await txManager.sendTransaction(
  exchangeContract,
  'batchListNFT',
  [normalizedCollection, tokenIds, pricesInWei, duration],  // Missing amounts!
  { ...options, module: 'Exchange' }
);
```

**ERC1155 Contract Signature:**
```solidity
// File: E:\zuno-marketplace-contracts\src\core\exchange\ERC1155NFTExchange.sol:75-81
function batchListNFT(
    address m_contractAddress,
    uint256[] memory m_tokenIds,
    uint256[] memory m_amounts,     // <-- REQUIRED for ERC1155
    uint256[] memory m_prices,
    uint256 m_listingDuration
) public
```

**Error Cause:** Missing the `amounts` array parameter causes `invalid array value` error during gas estimation.

---

### Issue 3: Type Definitions Missing Amount Field

**Location:** `E:\zuno-marketplace-sdk\src\types\contracts.ts:87-103`

**Current Type Definitions:**
```typescript
export interface ListNFTParams {
  collectionAddress: string;
  tokenId: string;
  price: string;
  duration: number;
  options?: TransactionOptions;
  // Missing: amount?: string;  <-- Required for ERC1155
}

export interface BatchListNFTParams {
  collectionAddress: string;
  tokenIds: string[];
  prices: string[];
  duration: number;
  options?: TransactionOptions;
  // Missing: amounts?: string[];  <-- Required for ERC1155
}
```

**Impact:** Developers cannot pass amount even if they wanted to.

---

### Issue 4: Listing Entity Missing Amount Field

**Location:** `E:\zuno-marketplace-sdk\src\types\entities.ts:50-61`

**Current Listing Interface:**
```typescript
export interface Listing {
  id: string;
  seller: string;
  collectionAddress: string;
  tokenId: string;
  price: string;
  paymentToken: string;
  startTime: number;
  endTime: number;
  status: 'pending' | 'active' | 'sold' | 'cancelled' | 'expired';
  createdAt: string;
  // Missing: amount?: string;  <-- Required for ERC1155 to show quantity
}
```

**Contract Listing Struct:**
```solidity
// From BaseNFTExchange.sol - includes amount field
struct Listing {
    address contractAddress;
    uint256 tokenId;
    uint256 price;
    address seller;
    uint256 listingDuration;
    uint256 listingStart;
    ListingStatus status;
    uint256 amount;  // <-- This field exists in contract but not in SDK type
}
```

**Note:** The `formatListing` function (line 523 in ExchangeModule.ts) has a comment mentioning `amount` but doesn't extract it from the contract data.

---

## Affected Files

| File | Lines | Issue |
|------|-------|-------|
| `src/modules/ExchangeModule.ts` | 158-163 | Missing `amount` param in `listNFT` call |
| `src/modules/ExchangeModule.ts` | 588-593 | Missing `amounts` param in `batchListNFT` call |
| `src/modules/ExchangeModule.ts` | 523 | `formatListing` doesn't extract `amount` field |
| `src/types/contracts.ts` | 87-93 | `ListNFTParams` missing `amount?` field |
| `src/types/contracts.ts` | 98-103 | `BatchListNFTParams` missing `amounts?` field |
| `src/types/entities.ts` | 50-61 | `Listing` interface missing `amount?` field |

---

## Suggested Fix Approach

### Step 1: Update Type Definitions

**File:** `src/types/contracts.ts`

```typescript
export interface ListNFTParams {
  collectionAddress: string;
  tokenId: string;
  price: string;
  duration: number;
  amount?: string;  // Optional for ERC721, required for ERC1155
  options?: TransactionOptions;
}

export interface BatchListNFTParams {
  collectionAddress: string;
  tokenIds: string[];
  prices: string[];
  duration: number;
  amounts?: string[];  // Optional for ERC721, required for ERC1155
  options?: TransactionOptions;
}
```

**File:** `src/types/entities.ts`

```typescript
export interface Listing {
  id: string;
  seller: string;
  collectionAddress: string;
  tokenId: string;
  price: string;
  paymentToken: string;
  startTime: number;
  endTime: number;
  status: 'pending' | 'active' | 'sold' | 'cancelled' | 'expired';
  createdAt: string;
  amount?: string;  // Quantity for ERC1155 listings
}
```

### Step 2: Update Single Listing Function

**File:** `src/modules/ExchangeModule.ts`

```typescript
async listNFT(params: ListNFTParams): Promise<{ listingId: string; tx: TransactionReceipt }> {
  // Runtime validation
  validateListNFTParams(params);

  const { collectionAddress, tokenId, price, duration, amount, options } = params;

  // ... existing code ...

  // Get appropriate exchange contract based on token standard
  const exchangeContract = await this.getExchangeContract(
    collectionAddress,
    provider,
    this.signer
  );

  // Prepare parameters - contract expects different params for ERC721 vs ERC1155
  const priceInWei = ethers.parseEther(price);
  const tokenType = await this.contractRegistry.verifyTokenStandard(
    collectionAddress,
    provider
  );

  // Call contract method with correct parameters based on token type
  const tx = await txManager.sendTransaction(
    exchangeContract,
    'listNFT',
    tokenType === 'ERC1155'
      ? [collectionAddress, tokenId, amount || '1', priceInWei, duration]  // ERC1155: 5 params
      : [collectionAddress, tokenId, priceInWei, duration],  // ERC721: 4 params
    { ...options, module: 'Exchange' }
  );

  // ... rest of function ...
}
```

### Step 3: Update Batch Listing Function

**File:** `src/modules/ExchangeModule.ts`

```typescript
async batchListNFT(params: BatchListNFTParams): Promise<{ listingIds: string[]; tx: TransactionReceipt }> {
  const { collectionAddress, tokenIds, prices, duration, amounts, options } = params;

  // ... existing validation ...

  const txManager = this.ensureTxManager();
  const provider = this.ensureProvider();
  const sellerAddress = this.signer ? await this.signer.getAddress() : ethers.ZeroAddress;

  await this.ensureApproval(normalizedCollection, sellerAddress);

  // Get appropriate exchange contract based on token standard
  const exchangeContract = await this.getExchangeContract(
    normalizedCollection,
    provider,
    this.signer
  );

  const pricesInWei = prices.map(p => ethers.parseEther(p));
  const tokenType = await this.contractRegistry.verifyTokenStandard(
    normalizedCollection,
    provider
  );

  // Call contract method with correct parameters based on token type
  const tx = await txManager.sendTransaction(
    exchangeContract,
    'batchListNFT',
    tokenType === 'ERC1155'
      ? [normalizedCollection, tokenIds, amounts || tokenIds.map(() => '1'), pricesInWei, duration]  // ERC1155: 5 params
      : [normalizedCollection, tokenIds, pricesInWei, duration],  // ERC721: 4 params
    { ...options, module: 'Exchange' }
  );

  // ... rest of function ...
}
```

### Step 4: Update formatListing Function

**File:** `src/modules/ExchangeModule.ts`

```typescript
private formatListing(id: string, data: ethers.Result): Listing {
  const contractAddress = String(data.contractAddress);
  const tokenId = BigInt(data.tokenId);
  const price = BigInt(data.price);
  const seller = String(data.seller);
  const listingDuration = BigInt(data.listingDuration);
  const listingStart = BigInt(data.listingStart);
  const status = Number(data.status);
  const amount = data.amount ? BigInt(data.amount).toString() : undefined;  // Extract amount

  // Contract enum: 0=Pending, 1=Active, 2=Sold, 3=Failed, 4=Cancelled
  const statusMap: Record<number, Listing['status']> = {
    0: 'pending',
    1: 'active',
    2: 'sold',
    3: 'expired',
    4: 'cancelled',
  };

  const startTime = Number(listingStart);
  const endTime = startTime + Number(listingDuration);

  return {
    id,
    seller,
    collectionAddress: contractAddress,
    tokenId: tokenId.toString(),
    price: ethers.formatEther(price),
    paymentToken: ethers.ZeroAddress,
    startTime,
    endTime,
    status: statusMap[status] || 'active',
    createdAt: new Date(startTime * 1000).toISOString(),
    amount,  // Include amount in returned Listing
  };
}
```

---

## Validation Strategy

### Test Cases Required

1. **Single ERC1155 Listing:**
   - List with `amount: '1'` (single token)
   - List with `amount: '10'` (multiple tokens)
   - Verify listing is created correctly
   - Verify `amount` field is returned in `getListing()`

2. **Batch ERC1155 Listing:**
   - Batch list with `amounts: ['1', '5', '10']`
   - Verify all listings created
   - Verify amounts are correct

3. **Backward Compatibility (ERC721):**
   - Ensure ERC721 listings still work without `amount` parameter
   - Ensure ERC721 batch listings still work

4. **Edge Cases:**
   - Missing `amount` for ERC1155 should default to '1' or throw error
   - `amount: '0'` should be rejected
   - Array length mismatch in batch (tokenIds.length !== amounts.length)

---

## Unresolved Questions

1. **Default Amount Behavior:** Should missing `amount` parameter default to '1' for ERC1155, or should it throw a validation error requiring explicit amount?

2. **Validation Layer:** Should we add validation in `validateListNFTParams()` to ensure ERC1155 listings always have `amount` specified?

3. **Breaking Changes:** Is this considered a breaking change for existing SDK users? (Probably yes, type definitions are changing)

4. **Documentation:** Need to update SDK documentation to explain `amount` parameter is required for ERC1155 but optional for ERC721.

5. **Contract Auto-Detection:** The current approach requires calling `verifyTokenStandard()` before listing. Is there a performance impact? Should we cache the token standard detection result?

---

## Priority Assessment

**Severity:** Critical
**Impact:** All ERC1155 listings are broken
**User Impact:** High - Core functionality non-functional
**Effort:** Medium - Requires changes to multiple files but logic is straightforward

**Recommendation:** Fix immediately before next release.

---

## References

- GitHub Issue: #99
- ERC1155 Exchange Contract: `E:\zuno-marketplace-contracts\src\core\exchange\ERC1155NFTExchange.sol`
- ERC721 Exchange Contract: `E:\zuno-marketplace-contracts\src\core\exchange\ERC721NFTExchange.sol`
- SDK Exchange Module: `E:\zuno-marketplace-sdk\src\modules\ExchangeModule.ts`
