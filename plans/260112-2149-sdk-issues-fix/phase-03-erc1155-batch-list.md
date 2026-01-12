# Phase 03: ERC1155 Batch List Fix

**Related Issue:** #81
**Status:** 🔄 Pending
**Priority:** HIGH

---

## Context Links

- Research: `E:/zuno-marketplace-contracts/plans/reports/researcher-260112-2149-erc1155-batchlist-fix.md`
- File: `E:/zuno-marketplace-sdk/src/modules/ExchangeModule.ts`

---

## Overview

Fix `invalid array value` error when batch listing ERC1155 NFTs. ERC1155 requires `amounts` array parameter (5 params total) while ERC721 uses 4 params.

---

## Root Cause

**Missing `amounts` array** in `batchListNFT()`:

```typescript
// ERC721: batchListNFT(address, tokenIds[], prices[], duration) = 4 params
// ERC1155: batchListNFT(address, tokenIds[], amounts[], prices[], duration) = 5 params

// Current SDK sends:
[normalizedCollection, tokenIds, pricesInWei, duration]  // ❌ Missing amounts for ERC1155
```

---

## Implementation Steps

### Step 1: Update Type Definition

**File:** `src/types/contracts.ts`

```typescript
export interface BatchListNFTParams {
  collectionAddress: string;
  tokenIds: string[];
  amounts?: number[];  // ← Add: defaults to [1,1,1...] for ERC721
  prices: string[];
  duration: number;
  options?: TransactionOptions;
}
```

### Step 2: Update `batchListNFT()` Function

**File:** `src/modules/ExchangeModule.ts`
**Lines:** 561-597

```typescript
async batchListNFT(params: BatchListNFTParams): Promise<{ listingIds: string[]; tx: TransactionReceipt }> {
  const { collectionAddress, tokenIds, prices, amounts, duration, options } = params;

  // ✅ Default amounts to 1 for each token if not provided (ERC721 compatible)
  const normalizedAmounts = amounts || tokenIds.map(() => 1);

  // ✅ Validation
  if (tokenIds.length !== normalizedAmounts.length) {
    throw this.error(ErrorCodes.INVALID_PARAMETER,
      'Token IDs and amounts arrays must have same length');
  }

  // ... rest of validation ...

  // ✅ Detect token type
  const tokenType = await this.contractRegistry.verifyTokenStandard(
    normalizedCollection,
    provider
  );

  if (tokenType === 'ERC1155') {
    const tx = await txManager.sendTransaction(
      exchangeContract,
      'batchListNFT',
      [normalizedCollection, tokenIds, normalizedAmounts, pricesInWei, duration],  // 5 params
      { ...options, module: 'Exchange' }
    );
  } else {
    // ERC721 - 4 params (original behavior)
    const tx = await txManager.sendTransaction(
      exchangeContract,
      'batchListNFT',
      [normalizedCollection, tokenIds, pricesInWei, duration],
      { ...options, module: 'Exchange' }
    );
  }
  // ...
}
```

---

## Testing

```typescript
// Test cases:
1. Batch list ERC721 without amounts → works (backward compatible)
2. Batch list ERC1155 with amounts=[1,1,1] → works
3. Batch list ERC1155 with amounts=[5,10,2] → works
4. Batch list with mismatched lengths → throws error
```

---

## Success Criteria

- [ ] ERC1155 batch listing succeeds
- [ ] ERC721 batch listing still works (no regression)
- [ ] Type definition includes optional `amounts`
- [ ] Validation for array lengths
- [ ] All tests pass

---

## Risk Assessment

- **Risk:** LOW - isolated change, follows single list pattern
- **Breaking Changes:** None (optional parameter)
- **Test Impact:** Add ERC1155 batch listing tests

---

## Next Steps

After this phase:
1. Create PR for issue #81
2. Move to Phase 04: Bid Refund Events
