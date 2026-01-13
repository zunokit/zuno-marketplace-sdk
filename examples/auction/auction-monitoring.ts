/**
 * Auction Monitoring Examples
 *
 * This file demonstrates how to monitor and track active auctions
 *
 * @module examples/auction/auction-monitoring
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';

// ============================================================================
// GET AUCTION DETAILS
// ============================================================================

/**
 * Get detailed information about an auction
 */
export async function getAuctionDetails() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';

  const auction = await sdk.auction.getAuctionFromFactory(auctionId);

  console.log('=== Auction Details ===');
  console.log('Auction ID:', auction.id);
  console.log('Type:', auction.type);
  console.log('NFT:', `${auction.collectionAddress} #${auction.tokenId}`);
  console.log('Seller:', auction.seller);
  console.log('Status:', auction.status);
  console.log('Start:', new Date(auction.startTime * 1000).toISOString());
  console.log('End:', new Date(auction.endTime * 1000).toISOString());

  if (auction.type === 'english') {
    console.log('Starting Bid:', auction.startingBid, 'ETH');
    console.log('Current Bid:', auction.currentBid, 'ETH');
    console.log('Highest Bidder:', auction.highestBidder || 'None');
  } else {
    console.log('Start Price:', auction.startPrice, 'ETH');
    console.log('End Price:', auction.endPrice, 'ETH');
  }

  return auction;
}

// ============================================================================
// GET CURRENT DUTCH AUCTION PRICE
// ============================================================================

/**
 * Get the current price of a Dutch auction
 */
export async function getCurrentDutchPrice() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';

  const currentPrice = await sdk.auction.getCurrentPrice(auctionId);

  console.log('Current Dutch auction price:', currentPrice, 'ETH');

  return currentPrice;
}

// ============================================================================
// CHECK AUCTION STATUS
// ============================================================================

/**
 * Check the current status of an auction
 */
export async function checkAuctionStatus() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';
  const auction = await sdk.auction.getAuctionFromFactory(auctionId);

  const now = Math.floor(Date.now() / 1000);

  let status: string;
  let timeLeft: number;

  if (auction.status === 'active' && auction.endTime > now) {
    status = 'ACTIVE';
    timeLeft = auction.endTime - now;
  } else if (auction.status === 'active' && auction.endTime <= now) {
    status = 'ENDED (AWAITING SETTLEMENT)';
    timeLeft = 0;
  } else {
    status = auction.status.toUpperCase();
    timeLeft = 0;
  }

  console.log('=== Auction Status ===');
  console.log('Status:', status);
  console.log('Type:', auction.type);

  if (timeLeft > 0) {
    console.log('Time Remaining:', formatTimeLeft(timeLeft));
  }

  if (auction.type === 'english' && auction.status === 'active') {
    console.log('Current Bid:', auction.currentBid, 'ETH');
    console.log('Highest Bidder:', auction.highestBidder || 'None');
  }

  return { auction, status, timeLeft };
}

// ============================================================================
// MONITOR ENGLISH AUCTION ACTIVITY
// ============================================================================

/**
 * Monitor an English auction's bidding activity
 */
export async function monitorEnglishAuction() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';
  const auction = await sdk.auction.getAuctionFromFactory(auctionId);

  if (auction.type !== 'english') {
    throw new Error('This is not an English auction');
  }

  console.log('=== English Auction Monitor ===');
  console.log('NFT:', `${auction.collectionAddress} #${auction.tokenId}`);
  console.log('Starting Bid:', auction.startingBid, 'ETH');
  console.log('Current Bid:', auction.currentBid, 'ETH');
  console.log('Highest Bidder:', auction.highestBidder || 'None');

  // Calculate bidding statistics
  const currentBid = Number(auction.currentBid);
  const startingBid = Number(auction.startingBid);
  const totalIncrease = currentBid - startingBid;
  const percentageIncrease = startingBid > 0 ? (totalIncrease / startingBid) * 100 : 0;

  console.log('\nBidding Activity:');
  console.log('Total Increase:', totalIncrease.toFixed(4), 'ETH');
  console.log('Percentage Increase:', percentageIncrease.toFixed(2), '%');

  // Check user's refund status
  const userAddress = await sdk.getSignerAddress();
  const pendingRefund = await sdk.auction.getPendingRefund(auctionId, userAddress);

  if (Number(pendingRefund) > 0) {
    console.log('\nYou have a pending refund:', pendingRefund, 'ETH');
  } else if (auction.highestBidder?.toLowerCase() === userAddress.toLowerCase()) {
    console.log('\nYou are currently the highest bidder!');
  } else {
    console.log('\nYou are not participating in this auction');
  }

  return { auction, totalIncrease, percentageIncrease, pendingRefund };
}

// ============================================================================
// MONITOR DUTCH AUCTION PROGRESS
// ============================================================================

/**
 * Monitor a Dutch auction's price progress
 */
export async function monitorDutchAuctionProgress() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';
  const auction = await sdk.auction.getAuctionFromFactory(auctionId);

  if (auction.type !== 'dutch') {
    throw new Error('This is not a Dutch auction');
  }

  const currentPrice = await sdk.auction.getCurrentPrice(auctionId);

  console.log('=== Dutch Auction Monitor ===');
  console.log('NFT:', `${auction.collectionAddress} #${auction.tokenId}`);

  const startPrice = Number(auction.startPrice!);
  const endPrice = Number(auction.endPrice!);
  const totalDuration = auction.endTime - auction.startTime;
  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - auction.startTime;

  const progress = (elapsed / totalDuration) * 100;
  const priceDrop = startPrice - Number(currentPrice);
  const totalDrop = startPrice - endPrice;
  const dropProgress = (priceDrop / totalDrop) * 100;

  console.log('\nPrice Progress:');
  console.log('Start:', startPrice.toFixed(4), 'ETH');
  console.log('Current:', currentPrice, 'ETH');
  console.log('End:', endPrice.toFixed(4), 'ETH');
  console.log('Price Drop:', priceDrop.toFixed(4), 'ETH');

  console.log('\nTime Progress:');
  console.log('Elapsed:', formatTimeLeft(elapsed));
  console.log('Remaining:', formatTimeLeft(totalDuration - elapsed));
  console.log('Progress:', progress.toFixed(2), '%');

  console.log('\nPrice Drop Progress:', dropProgress.toFixed(2), '%');

  // Visual progress bar
  const barLength = 40;
  const filled = Math.floor((elapsed / totalDuration) * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
  console.log(`[${bar}]`);

  return { auction, currentPrice, progress, dropProgress };
}

// ============================================================================
// GET PENDING REFUND
// ============================================================================

/**
 * Check pending refund for a bidder
 */
export async function checkPendingRefund() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';
  const bidderAddress = '0x...';

  const refund = await sdk.auction.getPendingRefund(auctionId, bidderAddress);

  if (Number(refund) > 0) {
    console.log('Pending refund:', refund, 'ETH');
    console.log('You were outbid and can withdraw your bid');
  } else {
    console.log('No pending refund');
    console.log('Either you are the highest bidder or have not bid');
  }

  return { refund, hasRefund: Number(refund) > 0 };
}

// ============================================================================
// AUCTION END TIME ALERT
// ============================================================================

/**
 * Get alerts for auctions ending soon
 */
export async function getAuctionEndTimeAlert() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';
  const auction = await sdk.auction.getAuctionFromFactory(auctionId);

  const now = Math.floor(Date.now() / 1000);
  const timeLeft = auction.endTime - now;

  console.log('=== Auction Time Alert ===');
  console.log('Time Remaining:', formatTimeLeft(timeLeft));

  // Alert levels
  if (timeLeft <= 0) {
    console.log('🔴 AUCTION ENDED');
  } else if (timeLeft <= 300) {
    console.log('🟠 ENDING SOON! Less than 5 minutes!');
  } else if (timeLeft <= 3600) {
    console.log('🟡 Ending in less than 1 hour');
  } else if (timeLeft <= 86400) {
    console.log('🟢 Ending in less than 24 hours');
  } else {
    console.log('⚪ More than 24 hours remaining');
  }

  return { auction, timeLeft };
}

// ============================================================================
// BATCH MONITOR MULTIPLE AUCTIONS
// ============================================================================

/**
 * Monitor multiple auctions at once
 */
export async function batchMonitorAuctions() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionIds = ['1', '2', '3', '4', '5'];
  const results = [];

  console.log('=== Batch Auction Monitor ===');

  for (const auctionId of auctionIds) {
    try {
      const auction = await sdk.auction.getAuctionFromFactory(auctionId);
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = auction.endTime - now;

      let info: any = {
        auctionId,
        type: auction.type,
        status: auction.status,
        timeLeft: formatTimeLeft(Math.max(0, timeLeft)),
      };

      if (auction.type === 'english') {
        info.currentBid = auction.currentBid + ' ETH';
        info.highestBidder = auction.highestBidder || 'None';
      } else {
        const currentPrice = await sdk.auction.getCurrentPrice(auctionId);
        info.currentPrice = currentPrice + ' ETH';
      }

      results.push(info);

      console.log(`\nAuction #${auctionId}:`);
      console.log(`  Type: ${info.type}`);
      console.log(`  Status: ${info.status}`);
      console.log(`  Time Left: ${info.timeLeft}`);
      console.log(`  ${info.type === 'english' ? 'Current Bid' : 'Current Price'}: ${info.type === 'english' ? info.currentBid : info.currentPrice}`);

    } catch (error: any) {
      console.error(`Failed to fetch auction #${auctionId}:`, error.message);
    }
  }

  return results;
}

// ============================================================================
// AUCTION SUMMARY DASHBOARD
// ============================================================================

/**
 * Get a complete summary dashboard for an auction
 */
export async function getAuctionDashboard() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';
  const userAddress = await sdk.getSignerAddress();

  // Get all auction data
  const [auction, pendingRefund] = await Promise.all([
    sdk.auction.getAuctionFromFactory(auctionId),
    sdk.auction.getPendingRefund(auctionId, userAddress),
  ]);

  const now = Math.floor(Date.now() / 1000);
  const timeLeft = Math.max(0, auction.endTime - now);

  // Build dashboard
  const dashboard = {
    // Auction info
    auction: {
      id: auction.id,
      type: auction.type,
      nft: `${auction.collectionAddress} #${auction.tokenId}`,
      seller: auction.seller,
    },

    // Status
    status: {
      state: auction.status,
      timeLeft: formatTimeLeft(timeLeft),
      timeLeftSeconds: timeLeft,
      startTime: new Date(auction.startTime * 1000).toISOString(),
      endTime: new Date(auction.endTime * 1000).toISOString(),
    },

    // Pricing
    pricing:
      auction.type === 'english'
        ? {
            startingBid: auction.startingBid,
            currentBid: auction.currentBid,
            highestBidder: auction.highestBidder,
          }
        : {
            startPrice: auction.startPrice,
            endPrice: auction.endPrice,
            currentPrice: await sdk.auction.getCurrentPrice(auctionId),
          },

    // User info
    user: {
      address: userAddress,
      isHighestBidder:
        auction.type === 'english' && auction.highestBidder?.toLowerCase() === userAddress.toLowerCase(),
      pendingRefund: pendingRefund,
    },
  };

  // Display dashboard
  console.log('\n=== Auction Dashboard ===');
  console.log('NFT:', dashboard.auction.nft);
  console.log('Type:', dashboard.auction.type);
  console.log('Status:', dashboard.status.state);
  console.log('Time Left:', dashboard.status.timeLeft);

  if (auction.type === 'english') {
    console.log('Starting Bid:', dashboard.pricing.startingBid, 'ETH');
    console.log('Current Bid:', dashboard.pricing.currentBid, 'ETH');
    console.log('Highest Bidder:', dashboard.pricing.highestBidder || 'None');
  } else {
    console.log('Start Price:', dashboard.pricing.startPrice, 'ETH');
    console.log('Current Price:', dashboard.pricing.currentPrice, 'ETH');
    console.log('End Price:', dashboard.pricing.endPrice, 'ETH');
  }

  console.log('\nYour Status:');
  if (dashboard.user.isHighestBidder) {
    console.log('  ✓ You are the highest bidder');
  } else if (Number(dashboard.user.pendingRefund) > 0) {
    console.log('  ✗ You have been outbid');
    console.log('  Pending refund:', dashboard.user.pendingRefund, 'ETH');
  } else {
    console.log('  You are not bidding on this auction');
  }

  return dashboard;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return 'Ended';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all auction monitoring examples
 */
export async function runAuctionMonitoringExamples() {
  console.log('=== Get Auction Details ===');
  // Uncomment to test: await getAuctionDetails();

  console.log('\n=== Check Auction Status ===');
  // Uncomment to test: await checkAuctionStatus();

  console.log('\n=== Monitor English Auction ===');
  // Uncomment to test: await monitorEnglishAuction();

  console.log('\n=== Monitor Dutch Auction Progress ===');
  // Uncomment to test: await monitorDutchAuctionProgress();

  console.log('\n=== Get Auction Dashboard ===');
  // Uncomment to test: await getAuctionDashboard();
}

// Run if executed directly
if (require.main === module) {
  runAuctionMonitoringExamples().catch(console.error);
}
