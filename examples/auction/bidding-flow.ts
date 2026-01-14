/**
 * Bidding Flow Examples
 *
 * This file demonstrates the complete bidding workflow for auctions
 *
 * @module examples/auction/bidding-flow
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';
import type { PlaceBidParams } from 'zuno-marketplace-sdk';

// ============================================================================
// BASIC BID PLACEMENT
// ============================================================================

/**
 * Place a bid on an English auction
 */
export async function placeBid() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: PlaceBidParams = {
    auctionId: '1', // Auction ID
    amount: '2.5', // Bid amount in ETH
  };

  const { tx } = await sdk.auction.placeBid(params);

  console.log('Bid placed successfully!');
  console.log('Auction ID:', params.auctionId);
  console.log('Bid Amount:', params.amount, 'ETH');
  console.log('Transaction:', tx.hash);

  return { tx, amount: params.amount };
}

// ============================================================================
// COMPLETE BIDDING WORKFLOW
// ============================================================================

/**
 * Complete bidding workflow with verification
 */
export async function completeBiddingWorkflow() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';
  const bidAmount = '3.0';

  // Step 1: Get auction details
  console.log('Step 1: Fetching auction details...');
  const auction = await sdk.auction.getAuctionFromFactory(auctionId);

  if (auction.type !== 'english') {
    throw new Error('This is not an English auction');
  }

  console.log('Auction:', auction.collectionAddress, '#' + auction.tokenId);
  console.log('Current bid:', auction.currentBid, 'ETH');
  console.log('Highest bidder:', auction.highestBidder || 'None');

  // Step 2: Check if auction is active
  console.log('\nStep 2: Checking auction status...');
  const now = Math.floor(Date.now() / 1000);

  if (auction.status !== 'active') {
    throw new Error(`Auction is ${auction.status}. Cannot bid.`);
  }

  if (auction.endTime < now) {
    throw new Error('Auction has ended');
  }

  console.log('✓ Auction is active');

  // Step 3: Check if bid amount is sufficient
  console.log('\nStep 3: Validating bid amount...');
  const minBid = Number(auction.currentBid) + 0.01; // Must be higher than current bid

  if (Number(bidAmount) <= minBid) {
    throw new Error(`Bid must be higher than current bid. Minimum: ${minBid.toFixed(2)} ETH`);
  }

  console.log('✓ Bid amount is valid');

  // Step 4: Check bidder's balance
  console.log('\nStep 4: Checking wallet balance...');
  const bidderAddress = await sdk.getSignerAddress();
  const balance = await sdk.getBalance(bidderAddress);

  if (Number(balance) < Number(bidAmount)) {
    throw new Error(`Insufficient balance. Have ${balance} ETH, need ${bidAmount} ETH`);
  }

  console.log('✓ Sufficient balance');

  // Step 5: Check if bidding on own auction
  console.log('\nStep 5: Checking ownership...');
  if (auction.seller.toLowerCase() === bidderAddress.toLowerCase()) {
    throw new Error('Cannot bid on your own auction');
  }

  console.log('✓ Not the auction owner');

  // Step 6: Place bid
  console.log('\nStep 6: Placing bid...');
  const { tx } = await sdk.auction.placeBid({
    auctionId,
    amount: bidAmount,
  });

  console.log('✓ Bid placed');
  console.log('Transaction:', tx.hash);

  // Step 7: Wait for confirmation
  console.log('\nStep 7: Waiting for confirmation...');
  await tx.wait();

  console.log('✓ Bid confirmed!');

  return { tx, bidAmount, auction };
}

// ============================================================================
// BID WITH OUTBID PROTECTION
// ============================================================================

/**
 * Place a bid with automatic outbid protection
 */
export async function bidWithOutbidProtection() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';
  const maxBidAmount = '5.0'; // Maximum willing to pay

  // Get current auction state
  const auction = await sdk.auction.getAuctionFromFactory(auctionId);

  if (auction.type !== 'english') {
    throw new Error('This is not an English auction');
  }

  const currentBid = Number(auction.currentBid);

  // Calculate minimum bid (current + 5%)
  const minBid = currentBid * 1.05;

  // Place bid at minimum required amount
  const bidAmount = Math.min(Number(maxBidAmount), minBid);

  if (bidAmount > Number(maxBidAmount)) {
    throw new Error(`Auction exceeds your maximum bid of ${maxBidAmount} ETH`);
  }

  console.log('Placing bid:', bidAmount.toFixed(4), 'ETH');
  console.log('Max willing:', maxBidAmount, 'ETH');

  const { tx } = await sdk.auction.placeBid({
    auctionId,
    amount: bidAmount.toFixed(4),
  });

  console.log('Bid placed successfully');

  return { tx, bidAmount: bidAmount.toFixed(4), maxBidAmount };
}

// ============================================================================
// GET PENDING REFUND
// ============================================================================

/**
 * Check pending refund from being outbid
 */
export async function getPendingRefund() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';
  const bidderAddress = '0x...';

  const refund = await sdk.auction.getPendingRefund(auctionId, bidderAddress);

  if (Number(refund) > 0) {
    console.log('Pending refund:', refund, 'ETH');
    console.log('You were outbid and can withdraw your funds');
  } else {
    console.log('No pending refund');
    console.log('Either you are the highest bidder or have not bid on this auction');
  }

  return { refund, hasPendingRefund: Number(refund) > 0 };
}

// ============================================================================
// WITHDRAW BID REFUND
// ============================================================================

/**
 * Withdraw refund after being outbid
 */
export async function withdrawRefund() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';

  // First check if there's a pending refund
  const bidderAddress = await sdk.getSignerAddress();
  const refund = await sdk.auction.getPendingRefund(auctionId, bidderAddress);

  if (Number(refund) === 0) {
    console.log('No refund to withdraw');
    return null;
  }

  console.log('Withdrawing refund:', refund, 'ETH');

  const { tx } = await sdk.auction.withdrawBid(auctionId);

  console.log('Refund withdrawn');
  console.log('Transaction:', tx.hash);

  return { tx, refundAmount: refund };
}

// ============================================================================
// BID WITH PROGRESS TRACKING
// ============================================================================

/**
 * Place bid with progress callbacks
 */
export async function bidWithProgress(
  auctionId: string,
  amount: string,
  onProgress?: (step: string, status: string) => void
) {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  try {
    onProgress?.('validation', 'Fetching auction details...');
    const auction = await sdk.auction.getAuctionFromFactory(auctionId);

    onProgress?.('validation', 'Checking auction status...');
    if (auction.status !== 'active') {
      throw new Error(`Auction is ${auction.status}`);
    }

    onProgress?.('validation', 'Validating bid amount...');
    if (Number(amount) <= Number(auction.currentBid || auction.startingBid)) {
      throw new Error('Bid must be higher than current bid');
    }

    onProgress?.('balance', 'Checking wallet balance...');
    const bidderAddress = await sdk.getSignerAddress();
    const balance = await sdk.getBalance(bidderAddress);

    if (Number(balance) < Number(amount)) {
      throw new Error(`Insufficient balance. Need ${amount} ETH`);
    }

    onProgress?.('bidding', 'Placing bid...');
    const { tx } = await sdk.auction.placeBid({ auctionId, amount });

    onProgress?.('confirming', 'Waiting for confirmation...');
    await tx.wait();

    onProgress?.('success', `Bid of ${amount} ETH placed successfully!`);
    return { tx, amount };

  } catch (error: any) {
    onProgress?.('error', error.message);
    throw error;
  }
}

// ============================================================================
// SNIPING BID (LAST MINUTE)
// ============================================================================

/**
 * Place a bid in the final moments of an auction
 */
export async function placeSnipingBid() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';

  const auction = await sdk.auction.getAuctionFromFactory(auctionId);

  if (auction.type !== 'english') {
    throw new Error('This is not an English auction');
  }

  const now = Math.floor(Date.now() / 1000);
  const timeLeft = auction.endTime - now;
  const timeLeftMinutes = timeLeft / 60;

  // Only allow sniping in last 5 minutes
  if (timeLeft > 300) {
    console.log(`Auction ends in ${timeLeftMinutes.toFixed(0)} minutes. Too early to snipe.`);
    console.log('Come back when there are less than 5 minutes remaining.');
    return null;
  }

  console.log(`⚡ Sniping! Only ${timeLeftMinutes.toFixed(1)} minutes left!`);

  // Calculate minimum bid to win
  const currentBid = Number(auction.currentBid);
  const snipeBid = (currentBid * 1.1).toFixed(4); // Bid 10% above current

  console.log('Placing snipe bid:', snipeBid, 'ETH');

  const { tx } = await sdk.auction.placeBid({
    auctionId,
    amount: snipeBid,
  });

  console.log('Snipe bid placed!');
  console.log('Transaction:', tx.hash);

  return { tx, bidAmount: snipeBid, timeLeft };
}

// ============================================================================
// BIDDING HISTORY TRACKING
// ============================================================================

/**
 * Track your bidding activity on an auction
 */
export async function trackBiddingHistory() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';
  const bidderAddress = await sdk.getSignerAddress();

  // Get current auction state
  const auction = await sdk.auction.getAuctionFromFactory(auctionId);

  if (auction.type !== 'english') {
    throw new Error('This is not an English auction');
  }

  // Check if user is currently winning
  const isWinning = auction.highestBidder?.toLowerCase() === bidderAddress.toLowerCase();

  // Check for pending refund
  const refund = await sdk.auction.getPendingRefund(auctionId, bidderAddress);

  console.log('=== Bidding Status ===');
  console.log('Auction:', auction.collectionAddress, '#' + auction.tokenId);
  console.log('Current bid:', auction.currentBid, 'ETH');
  console.log('Your status:', isWinning ? '✓ WINNING' : '✗ OUTBID');

  if (isWinning) {
    console.log('Your bid: ', auction.currentBid, 'ETH');
  } else {
    console.log('Highest bidder:', auction.highestBidder);
    console.log('Pending refund:', refund, 'ETH');
  }

  return { auction, isWinning, pendingRefund: refund };
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all bidding flow examples
 */
export async function runBiddingFlowExamples() {
  console.log('=== Basic Bid Placement ===');
  // Uncomment to test: await placeBid();

  console.log('\n=== Get Pending Refund ===');
  // Uncomment to test: await getPendingRefund();

  console.log('\n=== Track Bidding History ===');
  // Uncomment to test: await trackBiddingHistory();

  console.log('\n=== Place Sniping Bid ===');
  // Uncomment to test: await placeSnipingBid();
}

// Run if executed directly
if (require.main === module) {
  runBiddingFlowExamples().catch(console.error);
}
