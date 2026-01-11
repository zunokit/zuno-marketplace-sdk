# Brainstorm Report: SDK Issues Resolution Strategy

**Date:** 2026-01-11
**Context:** Resolving 11 open issues in zunokit/zuno-marketplace-sdk
**Branch:** develop-claude

---

## Executive Summary

After thorough analysis of all 11 issues + PR #69, I found **critical problems**:

1. **PR #69 calls non-existent contract functions** - `setupAllowlist()` and `ownerMint()` do NOT exist in `BaseCollection.sol`. This PR will cause runtime failures.
2. **ERC1155 Exchange not implemented** - Contracts exist but SDK hardcoded to ERC721NFTExchange
3. **English auctions with bids cannot be cancelled** - Contract design choice, not a bug

**Recommendation:** Reject/fix PR #69, prioritize ERC1155 implementation, document auction cancellation behavior.

---

## Issue Analysis (All 11 Issues)

### PRIORITY 1: CRITICAL (Must Fix)

#### Issue #58 - Single list Exchange ERC1155 error
**Error:** `data="0x400351a8"` - execution reverted
**Root Cause:** SDK modules hardcoded to use `ERC721NFTExchange` contract
**Files:**
- `src/modules/ExchangeModule.ts:71,118` - hardcoded `'ERC721NFTExchange'`
- `src/react/hooks/useExchange.ts` - no ERC1155 support

**Impact:** ERC1155 NFTs cannot be listed on marketplace

**Solution Options:**
| Option | Effort | Risk | Pros | Cons |
|--------|--------|------|------|------|
| A: Full ERC1155 integration | High | Medium | Complete feature parity | More testing needed |
| B: Dynamic contract selection | Medium | Low | Flexible, minimal changes | Requires caller to specify |

**Recommended:** Option A - Full ERC1155 integration with token standard detection

---

#### Issue #60 - Buy NFT (ERC1155) error
**Error:** `data="0x2cfc4631"` - execution reverted
**Root Cause:** Same as #58 - no ERC1155 support
**Solution:** Part of ERC1155 integration above

---

### PRIORITY 2: HIGH (User Experience)

#### Issue #62 - Cannot cancel auction with bids
**Error:** `data="0x70d495b2"` - `Auction__CannotCancelWithBids`
**Finding:** This is **intentional contract behavior**, not a bug!
**Evidence:** `EnglishAuction.sol:459-462`
```solidity
// If there are bids, cancellation is not allowed for English auctions
if (auction.bidCount > 0) {
    revert Auction__CannotCancelWithBids();
}
```

**Solution Options:**
| Option | Effort | Pros | Cons |
|--------|--------|------|------|
| A: Document behavior | Low | Clear expectations | No code change |
| B: Add pre-check API | Medium | Better UX | Requires extra RPC call |
| C: Add UI warning | Low | User awareness | Frontend-only |

**Recommended:** Option A + B - Document AND add `canCancelAuction()` helper

---

#### Issue #67 - Address checksum error (bad checksum)
**Error:** `bad address checksum` for `0x90F79bf6EB2c4f8703652285982E1f101E93b906`
**Root Cause:** `validateAddress()` in SDK uses regex only, no EIP-55 normalization
**Status:** PR #69 attempts to fix but has issues (see below)

---

#### Issue #65 - Address checksum UX error
**Error:** Same as #67
**Status:** PR #69 attempts to fix

---

### PRIORITY 3: MEDIUM (Improvements)

#### Issue #64 - 3 Metamask confirmations for allowlist
**Problem:** Creating collection + allowlist requires 3 confirmations
**PR #69 Claim:** Adds `setupAllowlist()` to reduce to 1 confirmation
**CRITICAL FINDING:** `setupAllowlist()` function **does NOT exist** in `BaseCollection.sol`

**Contract has:**
- `addToAllowlist(address[])` - line 56
- `setAllowlistOnly(bool)` - line 89
- **NO** `setupAllowlist(address[], bool)` function

**PR #69 will FAIL at runtime** when calling non-existent function.

---

#### Issue #56 - Multi-confirmation investigation
**Status:** Same as #64, incorrectly "fixed" by PR #69

---

### PRIORITY 4: LOW (Enhancement)

#### Issue #68 - Owner mint their own collections
**PR #69 Claim:** Adds `ownerMint()` function
**CRITICAL FINDING:** `ownerMint()` **does NOT exist** in contracts

**Available mint functions:**
- `mint(address to)` - public mint with restrictions
- `batchMintERC721(address to, uint256 amount)` - batch mint
- **NO** `ownerMint(address to, uint256 amount)` function

PR #69 will FAIL at runtime.

---

#### Issue #66 - Allowlist only mode UX error
**Error:** User rejected transaction (UX issue, not code)
**Related:** Address checksum issues may contribute to poor UX

---

#### Issue #59 - UX when cancel in Metamask
**Description:** Rejection handling UX issues
**Type:** Enhancement (not a bug)

---

#### Issue #61 - My auction tab shows canceled auctions
**Scope:** UI integration project (zuno-marketplace-mini), not SDK
**Action:** N/A - out of scope for SDK

---

#### Issue #55 - Hardcoded ABI in Zuno Contracts
**Scope:** Contracts project, not SDK
**Action:** N/A - out of scope for SDK

---

## PR #69 Analysis: Critical Issues Found

### Claimed Fixes:
| Issue | Fix Attempt | Status |
|-------|-------------|--------|
| #65, #67 | `validateAddress()` with EIP-55 | **Valid** |
| #64, #56 | `setupAllowlist()` | **BROKEN** - function doesn't exist |
| #68 | `ownerMint()` | **BROKEN** - function doesn't exist |

### validateAddress Fix (Valid)
```typescript
// PR #69 change in src/utils/errors.ts
export function validateAddress(address: string, paramName = 'address'): string {
  // ...
  try {
    const { getAddress } = require('ethers');
    return getAddress(address); // EIP-55 checksum validation
  } catch (error: unknown) {
    // Error handling...
  }
}
```
**Assessment:** This part is **correct** and will fix address checksum issues.

### setupAllowlist (BROKEN)
```typescript
// PR #69 adds to CollectionModule.ts
async setupAllowlist(
  collectionAddress: string,
  addresses: string[],
  enableAllowlistOnly: boolean
): Promise<{ tx: TransactionReceipt }> {
  const abi = ['function setupAllowlist(address[] calldata addresses, bool enableAllowlistOnly) external'];
  // ...
}
```
**Problem:** This function signature does NOT exist in `BaseCollection.sol`. Transaction will revert with "function selector not found".

### ownerMint (BROKEN)
```typescript
// PR #69 adds to CollectionModule.ts
async ownerMint(
  collectionAddress: string,
  recipient: string,
  amount: number
): Promise<{ tx: TransactionReceipt }> {
  const abi = ['function ownerMint(address to, uint256 amount) external'];
  // ...
}
```
**Problem:** This function does NOT exist in contracts. Transaction will revert.

---

## Recommended Action Plan

### Phase 1: Fix PR #69 (CRITICAL)
1. **Remove broken functions:**
   - Remove `setupAllowlist()` from SDK
   - Remove `ownerMint()` from SDK
   - Remove from React hooks

2. **Keep valid fix:**
   - Keep `validateAddress()` EIP-55 checksum normalization
   - Apply normalization across ALL modules (not just Collection)

3. **Alternative for #64:**
   - Document that 2-3 confirmations are required by contract design
   - Or: Add contract-level `setupAllowlist()` function to contracts repo

### Phase 2: ERC1155 Integration (Issues #58, #60)
**Files to modify:**
- `src/modules/ExchangeModule.ts` - add ERC1155 support
- `src/types/contracts.ts` - add token standard detection
- `src/react/hooks/useExchange.ts` - add ERC1155 hooks

**Approach:**
```typescript
// Auto-detect token standard and select appropriate contract
const tokenType = await this.contractRegistry.verifyTokenStandard(collectionAddress, provider);
const contractType = tokenType === 'ERC1155' ? 'ERC1155NFTExchange' : 'ERC721NFTExchange';
```

### Phase 3: Auction UX Improvement (Issue #62)
1. Add `canCancelAuction(auctionId)` helper function
2. Document English auction cancellation rules
3. Return clear error messages

### Phase 4: Remaining Enhancements
- Issue #59: Better transaction rejection UX
- Issue #61: Out of scope (UI project)
- Issue #55: Out of scope (contracts project)
- Issue #68: Rejected (owner mint not supported by contract)

---

## User Decisions (Final)

### Question 1: PR #69 Action
**User Choice:** Fix PR #69 (partial)
- Keep: `validateAddress()` with EIP-55 checksum normalization
- Remove: `setupAllowlist()` and `ownerMint()` (don't exist in contracts)
- Apply address normalization across ALL SDK modules

### Question 2: Auction Cancel Behavior
**User Choice:** Change contract
- Modify `EnglishAuction.sol` to allow cancellation even with bids
- Implement bidder refund mechanism
- Update SDK accordingly

### Question 3: ERC1155 Timeline
**User Choice:** Fix everything now
- Full ERC1155 Exchange integration
- Token standard auto-detection
- React hooks for ERC1155 operations

---

## Success Metrics

- [ ] PR #69 either fixed (remove broken functions) or rejected
- [ ] All addresses normalized via EIP-55 checksum
- [ ] ERC1155 NFTs can be listed/bought on marketplace
- [ ] Auction cancellation behavior documented
- [ ] `canCancelAuction()` helper available
- [ ] All tests passing

---

## References

**Contract Files:**
- `E:\zuno-marketplace-contracts\src\common\BaseCollection.sol` - allowlist functions
- `E:\zuno-marketplace-contracts\src\core\auction\EnglishAuction.sol:459-462` - cancel restriction
- `E:\zuno-marketplace-contracts\src\core\factory\AuctionFactory.sol:393-453` - cancel logic

**SDK Files:**
- `E:\zuno-marketplace-sdk\src\modules\CollectionModule.ts` - allowlist operations
- `E:\zuno-marketplace-sdk\src\modules\ExchangeModule.ts` - ERC721 hardcoded
- `E:\zuno-marketplace-sdk\src\modules\AuctionModule.ts` - auction operations
- `E:\zuno-marketplace-sdk\src\utils\errors.ts` - address validation

**PR #69:**
- https://github.com/zunokit/zuno-marketplace-sdk/pull/69
- Branch: `fix/issue-65-67-address-checksum`
