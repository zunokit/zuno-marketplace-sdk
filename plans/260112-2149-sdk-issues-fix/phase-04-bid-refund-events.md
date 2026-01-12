# Phase 04: Bid Refund Events Fix

**Related Issue:** #82
**Status:** 🔄 Pending
**Priority:** MEDIUM
**Repository:** zuno-marketplace-contracts

---

## Context Links

- Research: `E:/zuno-marketplace-contracts/plans/reports/researcher-260112-2149-eth-bid-refund-issue.md`
- File: `E:/zuno-marketplace-contracts/src/core/auction/EnglishAuction.sol`

---

## Overview

Add `BidRefunded` event emissions for ALL pending refunds when auction is cancelled. Currently only emits for highest bidder, leaving other bidders without explicit notification.

---

## Root Cause

**Missing event emissions** in `cancelAuctionFor()`:

```solidity
// Current: Only emits BidRefunded for highest bidder
if (highestBidder != address(0) && highestBid > 0) {
    pendingRefunds[auctionId][highestBidder] += highestBid;
    emit BidRefunded(auctionId, highestBidder, highestBid);  // ❌ Only highest
}
// Previous bidders already have refunds in pendingRefunds
// But no event emitted for them!
```

---

## Implementation Steps

### Step 1: Add Event Emissions for All Pending Refunds

**File:** `src/core/auction/EnglishAuction.sol`
**Lines:** 485-531 (cancelAuctionFor function)

```solidity
function cancelAuctionFor(bytes32 auctionId, address seller) external {
    // ... existing validation ...

    address highestBidder = auction.highestBidder;
    uint256 highestBid = auction.highestBid;

    // Mark as cancelled
    auction.status = AuctionStatus.CANCELLED;

    // Refund highest bidder
    if (highestBidder != address(0) && highestBid > 0) {
        pendingRefunds[auctionId][highestBidder] += highestBid;
        emit BidRefunded(auctionId, highestBidder, highestBid);
    }

    // ✅ NEW: Emit events for ALL other pending refunds
    Bid[] storage bids = auctionBids[auctionId];
    for (uint256 i = 0; i < bids.length; i++) {
        address bidder = bids[i].bidder;
        uint256 pending = pendingRefunds[auctionId][bidder];

        if (pending > 0 && bidder != highestBidder) {
            emit BidRefunded(auctionId, bidder, pending);
        }
    }

    // Transfer NFT back to seller
    _transferNFT(auction, seller);
}
```

### Step 2: Update Test Expectations

**File:** `test/unit/auction/AuctionCancellation.t.sol`

```solidity
// ✅ New test: Cancel with bids should refund all bidders
function test_EnglishAuction_CancelWithBids_RefundsAllBidders() public {
    // Create auction
    bytes32 auctionId = _createEnglishAuction(alice, tokenIds, startingPrice, duration);

    // Place multiple bids
    vm.prank(bidder1);
    auctionFactory.placeBid{value: 1 ether}(auctionId);

    vm.prank(bidder2);
    auctionFactory.placeBid{value: 2 ether}(auctionId);

    // Cancel auction
    vm.prank(alice);
    auctionFactory.cancelAuction(auctionId);

    // Verify all bidders can withdraw
    assertEq(englishAuction.getPendingRefund(auctionId, bidder1), 1 ether);
    assertEq(englishAuction.getPendingRefund(auctionId, bidder2), 2 ether);
}
```

---

## Testing

```solidity
// Test scenarios:
1. Cancel auction with no bids → NFT returned, no refunds
2. Cancel auction with 1 bid → highest bidder refunded
3. Cancel auction with 3 bids → ALL 3 bidders can withdraw
4. Verify BidRefunded events emitted for all pending refunds
```

---

## Success Criteria

- [ ] `BidRefunded` event emitted for ALL pending refunds
- [ ] Tests updated to reflect new behavior
- [ ] No breaking changes to refund mechanism
- [ ] All tests pass

---

## Risk Assessment

- **Risk:** LOW - additive change only (events)
- **Breaking Changes:** None (only adds events)
- **Test Impact:** Update cancellation tests

---

## Next Steps

After this phase:
1. Create PR for issue #82
2. Move to Phase 05: Testing & Validation
