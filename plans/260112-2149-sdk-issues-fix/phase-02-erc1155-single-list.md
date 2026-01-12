# Phase 02: ERC1155 Single List Fix

**Related Issue:** #80
**Status:** 🔄 Pending
**Priority:** HIGH

---

## Context Links

- Research: `E:/zuno-marketplace-contracts/plans/reports/researcher-260112-2149-erc1155-listing-bignumberish-error.md`
- File: `E:/zuno-marketplace-sdk/src/modules/ExchangeModule.ts`

---

## Overview

Fix `invalid BigNumberish value` error when listing ERC1155 NFTs. ERC1155 requires `amount` parameter (5 params total) while ERC721 uses 4 params.

---

## Root Cause

**Missing `amount` parameter** in `listNFT()`:

```typescript
// ERC721: listNFT(address, tokenId, price, duration) = 4 params
// ERC1155: listNFT(address, tokenId, price, amount, duration) = 5 params

// Current SDK always sends 4 params:
[collectionAddress, tokenId, priceInWei, duration]  // ❌ Missing amount for ERC1155
```

---

## Implementation Steps

### Step 1: Update Type Definition

**File:** `src/types/contracts.ts`

```typescript
export interface ListNFTParams {
  collectionAddress: string;
  tokenId: string;
  price: string;
  amount?: number;  // ← Add: defaults to 1 (ERC721), configurable for ERC1155
  duration: number;
  options?: TransactionOptions;
}
```

### Step 2: Update `listNFT()` Function

**File:** `src/modules/ExchangeModule.ts`
**Lines:** 154-163

```typescript
async listNFT(params: ListNFTParams): Promise<{ listingId: string; tx: TransactionReceipt }> {
  validateListNFTParams(params);

  // ✅ Extract with default
  const { collectionAddress, tokenId, price, amount = 1, duration, options } = params;
  // ... validation code ...

  const priceInWei = ethers.parseEther(price);

  // ✅ Detect token type
  const tokenType = await this.contractRegistry.verifyTokenStandard(
    collectionAddress,
    provider
  );

  // ✅ ERC1155 needs amount parameter
  if (tokenType === 'ERC1155') {
    const tx = await txManager.sendTransaction(
      exchangeContract,
      'listNFT',
      [collectionAddress, tokenId, priceInWei, amount, duration],  // 5 params
      { ...options, module: 'Exchange' }
    );
  } else {
    // ERC721 - 4 params (original behavior)
    const tx = await txManager.sendTransaction(
      exchangeContract,
      'listNFT',
      [collectionAddress, tokenId, priceInWei, duration],
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
1. List ERC721 without amount → works (backward compatible)
2. List ERC1155 with amount=1 → works
3. List ERC1155 with amount=5 → works
4. List ERC721 with explicit amount → ignored (uses 4 params)
```

---

## Success Criteria

- [ ] ERC1155 single listing succeeds
- [ ] ERC721 listing still works (no regression)
- [ ] Type definition includes optional `amount`
- [ ] All tests pass

---

## Risk Assessment

- **Risk:** LOW - follows AuctionModule pattern
- **Breaking Changes:** None (optional parameter)
- **Test Impact:** Add ERC1155 listing tests

---

## Next Steps

After this phase:
1. Create PR for issue #80
2. Move to Phase 03: ERC1155 Batch List
