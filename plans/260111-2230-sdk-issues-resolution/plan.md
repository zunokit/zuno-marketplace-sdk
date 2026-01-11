---
title: "SDK Issues Resolution - ERC1155, Address Normalization, Auction Cancellation"
description: "Comprehensive plan to resolve 11 SDK issues including ERC1155 exchange support, EIP-55 address normalization, and English auction cancellation fix"
status: pending
priority: P1
effort: 16h
branch: develop-claude
tags: [erc1155, address-validation, auction, contracts, critical-fixes]
created: 2026-01-11
---

# Implementation Plan: SDK Issues Resolution

## Executive Summary

This plan addresses **3 major solutions** agreed upon after brainstorm:

1. **PR #69 Partial Fix** - Keep `validateAddress()` EIP-55 normalization, remove broken `setupAllowlist()` and `ownerMint()`
2. **Full ERC1155 Exchange Integration** - Token standard auto-detection, dynamic contract selection
3. **English Auction Cancellation Fix** - Contract modification to allow cancellation with bids, proper bidder refunds

**Total Estimated Effort:** ~16 hours
**Risk Level:** Medium (involves contract changes)
**Dependencies:** zuno-marketplace-contracts for auction fix

---

## Phase 1: Fix PR #69 - Address Normalization (2h)

### Overview
PR #69 attempts to fix issues #65, #67 but includes broken functions. Keep only the working address normalization, remove non-existent contract functions.

### Tasks

#### 1.1 Update `validateAddress()` with EIP-55 Checksum (1h)

**File:** `E:\zuno-marketplace-sdk\src\utils\errors.ts`

**Changes:**
```typescript
/**
 * Validate Ethereum address with EIP-55 checksum normalization
 */
export function validateAddress(address: string, paramName = 'address'): string {
  const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

  assert(
    typeof address === 'string' && ADDRESS_REGEX.test(address),
    ErrorCodes.INVALID_ADDRESS,
    `Invalid ${paramName}: ${address}`
  );

  // Normalize to EIP-55 checksum format
  try {
    const { getAddress } = require('ethers');
    return getAddress(address); // Throws if invalid checksum
  } catch (error: unknown) {
    throw new ZunoSDKError(
      ErrorCodes.INVALID_ADDRESS,
      `Invalid checksum for ${paramName}: ${address}`,
      error
    );
  }
}
```

**Return Type Change:** `void` → `string` (returns normalized address)

**Affected Callers** (must update to use return value):
- `CollectionModule.ts:129,130` - `mintERC721()`
- `CollectionModule.ts:159,160` - `batchMintERC721()`
- `CollectionModule.ts:191,192` - `mintERC1155()`
- `CollectionModule.ts:219,220` - `batchMintERC1155()`
- `CollectionModule.ts:251,281` - `verifyCollection()`, `getCollectionInfo()`
- `CollectionModule.ts:467,468,480,492` - `getMintedTokens()`
- `CollectionModule.ts:568,591` - `getUserOwnedTokens()`
- `CollectionModule.ts:759,806,851,887,888,919` - Allowlist methods
- `ExchangeModule.ts:448,471` - `getListings()`, `getListingsBySeller()`
- `AuctionModule.ts:183,282,403,488,594,638,677,725,778,924` - All auction methods

#### 1.2 Apply Address Normalization Across All Modules (30m)

**Files:**
- `src/modules/CollectionModule.ts`
- `src/modules/ExchangeModule.ts`
- `src/modules/AuctionModule.ts`

**Pattern:**
```typescript
// Before
validateAddress(collectionAddress, 'collectionAddress');
const contract = new ethers.Contract(collectionAddress, abi, signer);

// After
const normalizedAddress = validateAddress(collectionAddress, 'collectionAddress');
const contract = new ethers.Contract(normalizedAddress, abi, signer);
```

**Critical Locations:**
1. **CollectionModule** - All `ethers.Contract()` instantiations with collection addresses
2. **ExchangeModule** - Contract address retrieval in `ensureApproval()`, `listNFT()`, `buyNFT()`, `cancelListing()`
3. **AuctionModule** - All address parameters to contract calls

#### 1.3 Remove Broken Functions from PR #69 (30m)

**Files to Check:** (PR #69 may have added these, verify and remove)

- `src/modules/CollectionModule.ts` - Remove `setupAllowlist()`, `ownerMint()` if present
- `src/react/hooks/useCollection.ts` - Remove hook methods if added

**Expected:**
```typescript
// REMOVE (do not exist in contracts):
async setupAllowlist(collectionAddress, addresses, enableAllowlistOnly) { ... }
async ownerMint(collectionAddress, recipient, amount) { ... }
```

### Testing

```typescript
// Test EIP-55 normalization
const addr1 = validateAddress('0x90f79bf6eb2c4f8703652285982e1f101e93b906'); // lowercase
const addr2 = validateAddress('0x90F79bf6EB2c4f87036522 85982E1F101E93B906'); // mixed case
// Both should return: 0x90F79bf6EB2c4f8703652285982E1F101E93B906

// Test invalid checksum throws
try {
  validateAddress('0x90f79bf6eb2c4f8703652285982e1f101e93b906'); // Valid
  validateAddress('0x0000000000000000000000000000000000000001'); // Checksum mismatch
} catch (e) {
  console.log('Caught invalid checksum');
}
```

### Success Criteria
- [ ] All addresses normalized via EIP-55 before contract calls
- [ ] `validateAddress()` returns normalized address
- [ ] No `setupAllowlist()` or `ownerMint()` functions in SDK
- [ ] All existing tests pass

---

## Phase 2: Full ERC1155 Exchange Integration (8h)

### Overview
SDK currently hardcoded to `ERC721NFTExchange`. Must detect token standard and use appropriate contract (`ERC721NFTExchange` or `ERC1155NFTExchange`).

### Tasks

#### 2.1 Add Token Standard Detection Helper (1h)

**File:** `E:\zuno-marketplace-sdk\src\utils\contracts.ts` (new file)

**Create:**
```typescript
import type { Provider } from 'ethers';
import type { TokenStandard } from '../types/contracts';

/**
 * Detect token standard (ERC721 vs ERC1155) from collection address
 * Uses ERC165 supportsInterface detection
 */
export async function detectTokenStandard(
  collectionAddress: string,
  provider: Provider
): Promise<TokenStandard> {
  // ERC165 interface IDs
  const ERC721_ID = '0x80ac58cd';
  const ERC1155_ID = '0xd9b67a26';

  const detectionABI = [
    'function supportsInterface(bytes4) view returns (bool)'
  ];

  const { ethers } = await import('ethers');
  const contract = new ethers.Contract(collectionAddress, detectionABI, provider);

  try {
    const isERC721 = await contract.supportsInterface(ERC721_ID);
    if (isERC721) return 'ERC721';

    const isERC1155 = await contract.supportsInterface(ERC1155_ID);
    if (isERC1155) return 'ERC1155';
  } catch {
    // Fallback to unknown
  }

  return 'Unknown';
}
```

#### 2.2 Update ExchangeModule for Dynamic Contract Selection (3h)

**File:** `E:\zuno-marketplace-sdk\src\modules\ExchangeModule.ts`

**Changes:**

1. **Add helper method:**
```typescript
/**
 * Get appropriate exchange contract based on token standard
 */
private async getExchangeContract(
  collectionAddress: string,
  provider: Provider,
  signer?: any
): Promise<any> {
  // Detect token standard
  const tokenType = await this.contractRegistry.verifyTokenStandard(
    collectionAddress,
    provider
  );

  // Select appropriate contract
  const contractType = tokenType === 'ERC1155'
    ? 'ERC1155NFTExchange'
    : 'ERC721NFTExchange';

  this.log('Using exchange contract', { collectionAddress, tokenType, contractType });

  return this.contractRegistry.getContract(
    contractType,
    this.getNetworkId(),
    provider,
    undefined,
    signer
  );
}
```

2. **Update `listNFT()`:**
```typescript
async listNFT(params: ListNFTParams): Promise<{ listingId: string; tx: TransactionReceipt }> {
  validateListNFTParams(params);
  const { collectionAddress, tokenId, price, duration, options } = params;

  const txManager = this.ensureTxManager();
  const provider = this.ensureProvider();
  const sellerAddress = this.signer ? await this.signer.getAddress() : ethers.ZeroAddress;

  // Normalize address
  const normalizedCollection = validateAddress(collectionAddress, 'collectionAddress');

  // Ensure approval
  await this.ensureApproval(normalizedCollection, sellerAddress);

  // Get correct exchange contract (ERC721 or ERC1155)
  const exchangeContract = await this.getExchangeContract(
    normalizedCollection,
    provider,
    this.signer
  );

  // List NFT (same interface for both contracts)
  const priceInWei = ethers.parseEther(price);
  const tx = await txManager.sendTransaction(
    exchangeContract,
    'listNFT',
    [normalizedCollection, tokenId, priceInWei, duration],
    { ...options, module: 'Exchange' }
  );

  const listingId = await this.extractListingId(tx);
  return { listingId, tx };
}
```

3. **Update `buyNFT()`:**
```typescript
async buyNFT(params: BuyNFTParams): Promise<{ tx: TransactionReceipt }> {
  const { listingId, value, options } = params;

  validateBytes32(listingId, 'listingId');
  const txManager = this.ensureTxManager();
  const provider = this.ensureProvider();

  // Get listing details to determine collection address
  const listing = await this.getListing(listingId);
  const normalizedCollection = validateAddress(listing.collectionAddress, 'collectionAddress');

  // Get correct exchange contract
  const exchangeContract = await this.getExchangeContract(
    normalizedCollection,
    provider,
    this.signer
  );

  const valueInWei = value ? ethers.parseEther(value).toString() : options?.value;
  const txOptions: TransactionOptions = {
    ...options,
    value: valueInWei,
  };

  const tx = await txManager.sendTransaction(
    exchangeContract,
    'buyNFT',
    [listingId],
    { ...txOptions, module: 'Exchange' }
  );

  return { tx };
}
```

4. **Update `ensureApproval()` for ERC1155:**
```typescript
private async ensureApproval(
  collectionAddress: string,
  ownerAddress: string
): Promise<void> {
  const cacheKey = `${collectionAddress.toLowerCase()}-${ownerAddress.toLowerCase()}`;

  if (this.approvalCache.get(cacheKey)) {
    this.log('Approval cache hit', { collectionAddress, ownerAddress });
    return;
  }

  const provider = this.ensureProvider();
  const signer = this.ensureSigner();

  // Get correct exchange contract address
  const exchangeContract = await this.getExchangeContract(
    collectionAddress,
    provider
  );
  const operatorAddress = await exchangeContract.getAddress();

  const approvalAbi = [
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'function setApprovalForAll(address operator, bool approved)',
  ];
  const nftContract = new ethers.Contract(collectionAddress, approvalAbi, signer);

  const isApproved = await nftContract.isApprovedForAll(ownerAddress, operatorAddress);

  if (isApproved) {
    this.approvalCache.set(cacheKey, true);
    this.log('Approval already granted, cached', { collectionAddress, ownerAddress });
    return;
  }

  this.log('Approving Exchange for collection', { collectionAddress, operatorAddress });
  const tx = await nftContract.setApprovalForAll(operatorAddress, true);
  await tx.wait();
  this.approvalCache.set(cacheKey, true);
  this.log('Approval confirmed and cached');
}
```

5. **Apply similar changes to:**
   - `batchListNFT()`
   - `batchBuyNFT()`
   - `cancelListing()`
   - `batchCancelListing()`

#### 2.3 Update React Hooks for ERC1155 (2h)

**File:** `E:\zuno-marketplace-sdk\src\react\hooks\useExchange.ts`

**No changes needed** - hooks call module methods which now handle ERC1155 automatically.

**Add documentation comment:**
```typescript
/**
 * Hook for exchange operations (list, buy, cancel)
 *
 * Supports both ERC721 and ERC1155 NFTs. Token standard is auto-detected
 * from the collection contract.
 */
export function useExchange() {
  // ... existing implementation
}
```

#### 2.4 Update Type Definitions (1h)

**File:** `E:\zuno-marketplace-sdk\src\types\contracts.ts`

**Add amount parameter for ERC1155:**
```typescript
export interface ListNFTParams {
  collectionAddress: string;
  tokenId: string;
  price: string;
  duration: number;
  amount?: number; // For ERC1155, defaults to 1
  options?: TransactionOptions;
}

export interface BatchListNFTParams {
  collectionAddress: string;
  tokenIds: string[];
  prices: string[];
  duration: number;
  amounts?: number[]; // For ERC1155, defaults to [1,1,1,...]
  options?: TransactionOptions;
}
```

#### 2.5 Update AuctionModule for ERC1155 (1h)

**File:** `E:\zuno-marketplace-sdk\src\modules\AuctionModule.ts`

**Already supports `amount` parameter** - verify ERC1155 compatibility:
- `createEnglishAuction()` - has `amount` parameter
- `createDutchAuction()` - has `amount` parameter
- Batch methods - have `amounts` parameter

**No changes needed** - auction creation already supports ERC1155 amounts.

### Testing

```typescript
// Test ERC1155 listing
const { listingId } = await sdk.exchange.listNFT({
  collectionAddress: '0x...ERC1155...',
  tokenId: '1',
  amount: 5, // List 5 tokens
  price: '1.0',
  duration: 86400,
});

// Test ERC1155 buy
await sdk.exchange.buyNFT({
  listingId: '0x...',
  value: '1.0',
});

// Test auto-detection
const info = await sdk.collection.getCollectionInfo('0x...');
console.log(info.tokenType); // 'ERC721' or 'ERC1155'
```

### Success Criteria
- [ ] ERC1155 NFTs can be listed on marketplace
- [ ] ERC1155 NFTs can be bought
- [ ] Token standard auto-detection works
- [ ] Batch operations support ERC1155 amounts
- [ ] All existing tests pass
- [ ] React hooks work for both standards

---

## Phase 3: English Auction Cancellation Fix (4h)

### Overview
Currently English auctions with bids cannot be cancelled (`Auction__CannotCancelWithBids`). Modify contract to allow cancellation with proper bidder refunds.

### Tasks

#### 3.1 Contract Changes (2h)

**Repository:** `E:\zuno-marketplace-contracts`

**File:** `src/core/auction/EnglishAuction.sol`

**Current restriction (line 459-462):**
```solidity
// If there are bids, cancellation is not allowed for English auctions
if (auction.bidCount > 0) {
    revert Auction__CannotCancelWithBids();
}
```

**Change to allow cancellation with refunds:**
```solidity
/**
 * @dev Cancel auction and refund all bidders
 * - Returns NFT to seller
 * - Refunds all bidders their bid amounts
 * - Marks auction as cancelled
 */
function cancelAuction() external override nonReentrant {
    Auction storage auction = s_auctions[auctionId];

    // Only seller can cancel
    if (msg.sender != auction.seller) {
        revert Auction__NotSeller();
    }

    // Cannot cancel settled auctions
    if (auction.status != AuctionStatus.ACTIVE) {
        revert Auction__NotActive();
    }

    // Store auction data for refunds
    address highestBidder = auction.highestBidder;
    uint256 highestBid = auction.highestBid;

    // Mark as cancelled BEFORE refunds to prevent reentrancy
    auction.status = AuctionStatus.CANCELLED;
    auction.endTime = 0;

    // Refund highest bidder if exists
    if (highestBidder != address(0) && highestBid > 0) {
        _safeTransferETH(highestBidder, highestBid);
        emit AuctionBidRefunded(auctionId, highestBidder, highestBid);
    }

    // Return NFT to seller
    uint256 tokenId = auction.tokenId;
    uint256 amount = auction.amount;

    if (auction.nftContract != address(this)) {
        IERC721(auction.nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId
        );
    } else {
        _mintNFT(msg.sender, tokenId, amount);
    }

    emit AuctionCancelled(auctionId);
}
```

**Add new event:**
```solidity
event AuctionBidRefunded(
    uint256 indexed auctionId,
    address indexed bidder,
    uint256 amount
);
```

**Update AuctionFactory cancelAuction() to handle refunds transparently.**

#### 3.2 SDK Updates for Auction Cancellation (1h)

**File:** `E:\zuno-marketplace-sdk\src\modules\AuctionModule.ts`

**Add `canCancelAuction()` helper:**
```typescript
/**
 * Check if an auction can be cancelled
 *
 * After contract update: English auctions can be cancelled even with bids
 * Only the seller can cancel, and auction must be active
 *
 * @param auctionId - ID of the auction to check
 * @returns Promise resolving to true if cancellation is allowed
 *
 * @example
 * ```typescript
 * const canCancel = await sdk.auction.canCancelAuction("123");
 * if (canCancel) {
 *   await sdk.auction.cancelAuction("123");
 * }
 * ```
 */
async canCancelAuction(auctionId: string): Promise<boolean> {
  validateTokenId(auctionId, 'auctionId');

  try {
    const auction = await this.getAuctionFromFactory(auctionId);

    // Only seller can cancel
    const sellerAddress = this.signer ? await this.signer.getAddress() : '';
    if (auction.seller.toLowerCase() !== sellerAddress.toLowerCase()) {
      return false;
    }

    // Must be active
    return auction.status === 'active';
  } catch {
    return false;
  }
}
```

**Update `cancelAuction()` docs:**
```typescript
/**
 * Cancel an auction
 *
 * Cancels an active auction before it ends. Can only be called by the auction seller.
 * Returns the NFT to the seller and refunds any bids (English auctions).
 *
 * NOTE: After contract update, English auctions CAN be cancelled even with bids.
 * All bidders will be automatically refunded.
 *
 * @param auctionId - ID of the auction to cancel
 * @param options - Optional transaction options
 *
 * @returns Promise resolving to transaction receipt
 *
 * @throws {ZunoSDKError} INVALID_TOKEN_ID - If the auction ID is invalid
 * @throws {ZunoSDKError} TRANSACTION_FAILED - If the transaction fails
 * @throws {ZunoSDKError} NOT_OWNER - If caller is not the auction seller
 *
 * @example
 * ```typescript
 * // Check if can cancel first (recommended)
 * const canCancel = await sdk.auction.canCancelAuction("1");
 * if (canCancel) {
 *   await sdk.auction.cancelAuction("1");
 * }
 * ```
 */
```

#### 3.3 React Hook for canCancelAuction (30m)

**File:** `E:\zuno-marketplace-sdk\src\react\hooks\useAuction.ts` (or update existing)

**Add:**
```typescript
/**
 * Hook to check if auction can be cancelled
 */
export function useCanCancelAuction(auctionId?: string) {
  const sdk = useZuno();

  return useQuery({
    queryKey: ['canCancelAuction', auctionId],
    queryFn: () => sdk.auction.canCancelAuction(auctionId!),
    enabled: !!auctionId,
  });
}
```

**Update `useAuction()` hook:**
```typescript
export function useAuction() {
  const sdk = useZuno();
  const queryClient = useQueryClient();

  // ... existing mutations ...

  const canCancelAuction = useMutation({
    mutationFn: (auctionId: string) => sdk.auction.canCancelAuction(auctionId),
  });

  return {
    // ... existing returns ...
    canCancelAuction,
  };
}
```

#### 3.4 Documentation Updates (30m)

**File:** `E:\zuno-marketplace-sdk\docs\` (create or update auction docs)

**Create:** `docs/auction-cancellation-guide.md`
```markdown
# Auction Cancellation Guide

## English Auctions

### Before Contract Update
- Could NOT cancel if auction had bids
- Error: `Auction__CannotCancelWithBids`

### After Contract Update
- CAN cancel even with bids
- All bidders automatically refunded
- Only seller can cancel
- Auction must be active

### Best Practices

```typescript
// Always check before cancel
const canCancel = await sdk.auction.canCancelAuction(auctionId);
if (canCancel) {
  await sdk.auction.cancelAuction(auctionId);
}
```

## Dutch Auctions

- Can always cancel (no bids involved)
- NFT returned to seller immediately
```

### Testing

```typescript
// Test 1: Cancel auction without bids
const { auctionId } = await sdk.auction.createEnglishAuction({...});
await sdk.auction.cancelAuction(auctionId);
// Should succeed

// Test 2: Cancel auction WITH bids (after contract update)
const { auctionId } = await sdk.auction.createEnglishAuction({...});
await sdk.auction.placeBid({ auctionId, amount: '2.0' });
const canCancel = await sdk.auction.canCancelAuction(auctionId);
console.log(canCancel); // true
await sdk.auction.cancelAuction(auctionId);
// Should succeed, bidder refunded

// Test 3: Non-seller cannot cancel
const canCancel2 = await sdk.auction.canCancelAuction(auctionId);
console.log(canCancel2); // false (different signer)
```

### Success Criteria
- [ ] Contract allows cancellation with bids
- [ ] Bidders are refunded properly
- [ ] `canCancelAuction()` helper available
- [ ] React hook available
- [ ] Documentation updated
- [ ] Tests pass for cancellation scenarios

---

## Phase 4: Testing & Validation (2h)

### Integration Testing

#### 4.1 Test Address Normalization (30m)
```typescript
describe('Address Normalization', () => {
  it('should normalize lowercase addresses', () => {
    const input = '0x90f79bf6eb2c4f8703652285982e1f101e93b906';
    const expected = '0x90F79bf6EB2c4f8703652285982E1F101E93B906';
    expect(validateAddress(input)).toBe(expected);
  });

  it('should throw on invalid checksum', () => {
    expect(() => validateAddress('0x0000000000000000000000000000000000000001'))
      .toThrow('Invalid checksum');
  });

  it('should normalize addresses in all modules', async () => {
    // Test Collection, Exchange, Auction modules
  });
});
```

#### 4.2 Test ERC1155 Exchange (45m)
```typescript
describe('ERC1155 Exchange', () => {
  it('should auto-detect ERC1155 collection', async () => {
    const info = await sdk.collection.getCollectionInfo(erc1155Collection);
    expect(info.tokenType).toBe('ERC1155');
  });

  it('should list ERC1155 NFTs', async () => {
    const { listingId } = await sdk.exchange.listNFT({
      collectionAddress: erc1155Collection,
      tokenId: '1',
      amount: 5,
      price: '1.0',
      duration: 86400,
    });
    expect(listingId).toBeTruthy();
  });

  it('should buy ERC1155 NFTs', async () => {
    const { tx } = await sdk.exchange.buyNFT({
      listingId: erc1155ListingId,
      value: '1.0',
    });
    expect(tx.hash).toBeTruthy();
  });

  it('should batch list ERC1155 NFTs', async () => {
    const { listingIds } = await sdk.exchange.batchListNFT({
      collectionAddress: erc1155Collection,
      tokenIds: ['1', '2', '3'],
      amounts: [1, 2, 3],
      prices: ['1.0', '1.0', '1.0'],
      duration: 86400,
    });
    expect(listingIds.length).toBe(3);
  });
});
```

#### 4.3 Test Auction Cancellation (30m)
```typescript
describe('Auction Cancellation', () => {
  it('should cancel auction without bids', async () => {
    const { auctionId } = await sdk.auction.createEnglishAuction({...});
    await sdk.auction.cancelAuction(auctionId);
    const auction = await sdk.auction.getAuctionFromFactory(auctionId);
    expect(auction.status).toBe('cancelled');
  });

  it('should cancel auction with bids and refund', async () => {
    const { auctionId } = await sdk.auction.createEnglishAuction({...});
    await sdk.auction.placeBid({ auctionId, amount: '2.0' });

    const canCancel = await sdk.auction.canCancelAuction(auctionId);
    expect(canCancel).toBe(true);

    await sdk.auction.cancelAuction(auctionId);

    // Verify refund (check bidder balance)
  });

  it('should not allow non-seller to cancel', async () => {
    const canCancel = await sdk.auction.canCancelAuction(auctionId);
    expect(canCancel).toBe(false);
  });
});
```

#### 4.4 React Hooks Testing (15m)
```typescript
describe('React Hooks', () => {
  it('useExchange should work for ERC1155', () => {
    const { listNFT } = useExchange();
    // Test mutation
  });

  it('useCanCancelAuction should return correct status', () => {
    const { data: canCancel } = useCanCancelAuction(auctionId);
    expect(canCancel).toBe(true);
  });
});
```

### Regression Testing
- [ ] All existing tests pass
- [ ] No breaking changes to existing APIs
- [ ] Backward compatibility maintained

---

## Phase 5: Documentation & Release (2h)

### 5.1 Update README.md
- Document ERC1155 support
- Update examples to show ERC1155 usage
- Add auction cancellation notes

### 5.2 Create Migration Guide
**File:** `docs/migration-guide-v2.2.0.md`
```markdown
# Migration Guide v2.2.0

## Breaking Changes
- `validateAddress()` now returns normalized address (was void)

## New Features
- Full ERC1155 exchange support
- English auction cancellation now allows bids
- `canCancelAuction()` helper method

## Migration Steps
1. Update address validation calls
2. Test ERC1155 collections
3. Update auction cancellation logic
```

### 5.3 Update CHANGELOG.md
```markdown
## [2.2.0] - 2026-01-XX

### Added
- Full ERC1155 NFT exchange support
- Token standard auto-detection
- `canCancelAuction()` helper method
- `useCanCancelAuction()` React hook

### Changed
- `validateAddress()` now returns EIP-55 normalized address
- English auctions can now be cancelled even with bids
- All addresses normalized to EIP-55 checksum format

### Fixed
- Issue #58: ERC1155 NFTs can now be listed on marketplace
- Issue #60: ERC1155 NFTs can now be bought
- Issue #62: English auction cancellation restriction removed
- Issue #65, #67: Address checksum errors fixed
```

### 5.4 Release PR
Create PR to merge `develop-claude` → `main` with:
- All code changes
- Updated tests
- Documentation updates
- CHANGELOG entry

---

## Dependencies & Blockers

### External Dependencies
1. **zuno-marketplace-contracts** - Must merge auction cancellation fix first
2. **Contract deployment** - Updated contracts must be deployed to testnet/mainnet

### Internal Dependencies
1. **Phase 1** must complete before **Phase 2** (address normalization needed for ERC1155)
2. **Phase 3** depends on contract changes (can work in parallel but needs deployment)

### Blockers
- [ ] Contract changes approved and deployed
- [ ] Testnet deployment verified
- [ ] ABI updates in zuno-abis API

---

## Rollback Plan

If critical issues arise:

### Phase 1 Rollback
- Revert `validateAddress()` return type to `void`
- Remove address normalization from callers
- Time: 1h

### Phase 2 Rollback
- Revert `getExchangeContract()` changes
- Hardcode back to `ERC721NFTExchange`
- Remove ERC1155 support from types
- Time: 2h

### Phase 3 Rollback
- Revert contract changes
- Remove `canCancelAuction()` from SDK
- Update documentation to reflect old behavior
- Time: 1h

### Full Rollback
- Revert entire branch
- Issue patch release with fixes only
- Time: 30m

---

## Success Metrics

### Phase 1
- [ ] All 11 issues addressed or documented
- [ ] PR #69 reviewed and fixed
- [ ] No regression in address handling

### Phase 2
- [ ] ERC1155 NFTs can be listed
- [ ] ERC1155 NFTs can be bought
- [ ] Auto-detection works reliably
- [ ] React hooks support ERC1155

### Phase 3
- [ ] Auctions with bids can be cancelled
- [ ] Bidders receive refunds
- [ ] `canCancelAuction()` helper works

### Overall
- [ ] All tests pass
- [ ] Documentation complete
- [ ] Migration guide available
- [ ] Release PR created and reviewed

---

## Unresolved Questions

1. **Contract Deployment Timeline** - When will updated auction contracts be deployed?
2. **ABI Update** - Will zuno-abis API include ERC1155NFTExchange ABI?
3. **UI Updates** - Does zuno-marketplace-mini need updates for ERC1155 support?
4. **Backward Compatibility** - Should we maintain support for old `validateAddress()` void return?
5. **Gas Costs** - What are gas implications of auction cancellation with refunds?

---

## References

**Brainstorm Report:** `E:\zuno-marketplace-sdk\plans\reports\brainstorm-260111-2220-sdk-issues-resolution.md`

**Contract Files:**
- `E:\zuno-marketplace-contracts\src\core\auction\EnglishAuction.sol`
- `E:\zuno-marketplace-contracts\src\common\BaseCollection.sol`

**SDK Files:**
- `E:\zuno-marketplace-sdk\src\modules\CollectionModule.ts`
- `E:\zuno-marketplace-sdk\src\modules\ExchangeModule.ts`
- `E:\zuno-marketplace-sdk\src\modules\AuctionModule.ts`
- `E:\zuno-marketplace-sdk\src\utils\errors.ts`
- `E:\zuno-marketplace-sdk\src\react\hooks\useExchange.ts`
- `E:\zuno-marketplace-sdk\src\react\hooks\useCollection.ts`

**Original Issues:**
- #58: Single list Exchange ERC1155 error
- #60: Buy NFT (ERC1155) error
- #62: Cannot cancel auction with bids
- #65, #67: Address checksum errors
- #64: 3 Metamask confirmations for allowlist
- #68: Owner mint their own collections

---

## Next Steps

1. **Review and approve this plan** with team
2. **Create separate plan** for contract changes (Phase 3.1)
3. **Begin Phase 1** immediately (can start without contract changes)
4. **Phase 2** can proceed after Phase 1 completion
5. **Phase 3** waits for contract deployment

**Estimated Timeline:**
- Phase 1: 1 day
- Phase 2: 2 days
- Phase 3: 1-2 days (depends on contract deployment)
- Phase 4: 1 day
- Phase 5: 1 day

**Total: 5-7 days** depending on contract deployment timeline
