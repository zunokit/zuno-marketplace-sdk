/**
 * Dutch Auction Examples
 *
 * This file demonstrates how to create and manage Dutch auctions
 *
 * @module examples/auction/dutch-auction
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';
import type { CreateDutchAuctionParams } from 'zuno-marketplace-sdk';

// ============================================================================
// CREATE BASIC DUTCH AUCTION
// ============================================================================

/**
 * Create a basic Dutch auction
 */
export async function createBasicDutchAuction() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: CreateDutchAuctionParams = {
    collectionAddress: '0x...', // NFT collection address
    tokenId: '1', // Token ID to auction
    startPrice: '10.0', // Starting price in ETH
    endPrice: '1.0', // Ending price in ETH
    duration: 86400, // Auction duration (24 hours in seconds)
  };

  const { auctionId, tx } = await sdk.auction.createDutchAuction(params);

  console.log('Dutch auction created!');
  console.log('Auction ID:', auctionId);
  console.log('Transaction:', tx.hash);

  return { auctionId, tx };
}

// ============================================================================
// CREATE AUCTION WITH GRADUAL DECREASE
// ============================================================================

/**
 * Create a Dutch auction with gradual price decrease
 */
export async function createGradualDutchAuction() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: CreateDutchAuctionParams = {
    collectionAddress: '0x...',
    tokenId: '1',
    startPrice: '5.0', // Start at 5 ETH
    endPrice: '2.0', // End at 2 ETH
    duration: 86400 * 3, // Over 3 days for gradual decrease
  };

  const { auctionId, tx } = await sdk.auction.createDutchAuction(params);

  console.log('Gradual Dutch auction created!');
  console.log('Price decreases from', params.startPrice, 'to', params.endPrice, 'ETH over 3 days');
  console.log('Auction ID:', auctionId);

  return { auctionId, tx };
}

// ============================================================================
// CREATE FLASH DUTCH AUCTION (RAPID DECREASE)
// ============================================================================

/**
 * Create a Dutch auction with rapid price decrease
 */
export async function createFlashDutchAuction() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: CreateDutchAuctionParams = {
    collectionAddress: '0x...',
    tokenId: '1',
    startPrice: '2.0', // Start at 2 ETH
    endPrice: '0.5', // Drop to 0.5 ETH
    duration: 3600, // Over 1 hour (rapid decrease)
  };

  const { auctionId, tx } = await sdk.auction.createDutchAuction(params);

  console.log('Flash Dutch auction created!');
  console.log('Price drops rapidly from', params.startPrice, 'to', params.endPrice, 'ETH in 1 hour');
  console.log('Auction ID:', auctionId);

  return { auctionId, tx };
}

// ============================================================================
// BATCH CREATE DUTCH AUCTIONS
// ============================================================================

/**
 * Create multiple Dutch auctions in one transaction
 */
export async function batchCreateDutchAuctions() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params = {
    collectionAddress: '0x...', // All NFTs must be from same collection
    tokenIds: ['1', '2', '3'], // Token IDs to auction
    startPrice: '5.0', // Same start price for all
    endPrice: '1.0', // Same end price for all
    duration: 86400, // 24 hours
  };

  const { auctionIds, tx } = await sdk.auction.batchCreateDutchAuction(params);

  console.log('Batch created', auctionIds.length, 'Dutch auctions!');
  console.log('Auction IDs:', auctionIds);
  console.log('Transaction:', tx.hash);

  return { auctionIds, tx };
}

// ============================================================================
// BUY NOW IN DUTCH AUCTION
// ============================================================================

/**
 * Buy NFT at current Dutch auction price
 */
export async function buyNowDutchAuction() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';

  // Get current price first
  const currentPrice = await sdk.auction.getCurrentPrice(auctionId);
  console.log('Current price:', currentPrice, 'ETH');

  // Buy now at current price
  const { tx } = await sdk.auction.buyNow(auctionId);

  console.log('Purchased at current price!');
  console.log('Transaction:', tx.hash);

  return { tx, pricePaid: currentPrice };
}

// ============================================================================
// GET CURRENT DUTCH AUCTION PRICE
// ============================================================================

/**
 * Get the current price of a Dutch auction
 */
export async function getDutchAuctionPrice() {
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

  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - auction.startTime;
  const totalDuration = auction.endTime - auction.startTime;
  const progress = (elapsed / totalDuration) * 100;

  console.log('=== Dutch Auction Price ===');
  console.log('Start Price:', auction.startPrice, 'ETH');
  console.log('End Price:', auction.endPrice, 'ETH');
  console.log('Current Price:', currentPrice, 'ETH');
  console.log('Progress:', progress.toFixed(2), '%');
  console.log('Time elapsed:', formatTime(elapsed));
  console.log('Time remaining:', formatTime(totalDuration - elapsed));

  return { auction, currentPrice, progress };
}

// ============================================================================
// DUTCH AUCTION PRICE PROJECTION
// ============================================================================

/**
 * Project Dutch auction prices over time
 */
export async function projectDutchAuctionPrices() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';
  const auction = await sdk.auction.getAuctionFromFactory(auctionId);

  if (auction.type !== 'dutch') {
    throw new Error('This is not a Dutch auction');
  }

  const startPrice = Number(auction.startPrice!);
  const endPrice = Number(auction.endPrice!);
  const totalDuration = auction.endTime - auction.startTime;

  console.log('=== Price Projection ===');
  console.log('Start:', auction.startPrice, 'ETH at', new Date(auction.startTime * 1000).toLocaleString());
  console.log('End:', auction.endPrice, 'ETH at', new Date(auction.endTime * 1000).toLocaleString());

  // Project prices at different times
  const checkpoints = [0.25, 0.5, 0.75, 1.0]; // 25%, 50%, 75%, 100%

  for (const checkpoint of checkpoints) {
    const elapsed = totalDuration * checkpoint;
    const priceDrop = (startPrice - endPrice) * checkpoint;
    const projectedPrice = startPrice - priceDrop;

    console.log(
      `${(checkpoint * 100).toFixed(0)}%: ${projectedPrice.toFixed(4)} ETH ` +
      `(${formatTime(elapsed)} elapsed)`
    );
  }

  return { auction, startPrice, endPrice, totalDuration };
}

// ============================================================================
// OPTIMAL BUY TIME CALCULATOR
// ============================================================================

/**
 * Calculate optimal time to buy based on price target
 */
export async function calculateOptimalBuyTime() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';
  const targetPrice = 2.5; // Want to buy when price drops to 2.5 ETH

  const auction = await sdk.auction.getAuctionFromFactory(auctionId);

  if (auction.type !== 'dutch') {
    throw new Error('This is not a Dutch auction');
  }

  const startPrice = Number(auction.startPrice!);
  const endPrice = Number(auction.endPrice!);
  const totalDuration = auction.endTime - auction.startTime;
  const now = Math.floor(Date.now() / 1000);

  // Check if target price is achievable
  if (targetPrice < endPrice || targetPrice > startPrice) {
    throw new Error(`Target price ${targetPrice} is outside auction range (${endPrice}-${startPrice})`);
  }

  // Calculate when price will reach target
  const priceDropNeeded = startPrice - targetPrice;
  const totalPriceDrop = startPrice - endPrice;
  const progressNeeded = priceDropNeeded / totalPriceDrop;
  const timeToWait = totalDuration * progressNeeded;
  const targetTime = auction.startTime + timeToWait;

  console.log('=== Optimal Buy Time ===');
  console.log('Target Price:', targetPrice.toFixed(4), 'ETH');
  console.log('Wait Time:', formatTime(timeToWait));
  console.log('Buy At:', new Date(targetTime * 1000).toLocaleString());

  // Check if we've already passed that time
  if (now > targetTime) {
    console.log('✓ Target price already reached!');
    const currentPrice = await sdk.auction.getCurrentPrice(auctionId);
    console.log('Current price:', currentPrice, 'ETH');
  } else {
    const waitMs = (targetTime - now) * 1000;
    console.log('Wait', formatDuration(waitMS));
  }

  return { targetTime, timeToWait, targetPrice };
}

// ============================================================================
// CANCEL DUTCH AUCTION
// ============================================================================

/**
 * Cancel an active Dutch auction
 */
export async function cancelDutchAuction() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';

  const { tx } = await sdk.auction.cancelAuction(auctionId);

  console.log('Dutch auction cancelled');
  console.log('Transaction:', tx.hash);

  return { tx };
}

// ============================================================================
// GET DUTCH AUCTION DETAILS
// ============================================================================

/**
 * Get detailed information about a Dutch auction
 */
export async function getDutchAuctionDetails() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';

  const auction = await sdk.auction.getAuctionFromFactory(auctionId);

  if (auction.type !== 'dutch') {
    throw new Error('This is not a Dutch auction');
  }

  console.log('=== Dutch Auction Details ===');
  console.log('Auction ID:', auction.id);
  console.log('NFT:', `${auction.collectionAddress} #${auction.tokenId}`);
  console.log('Seller:', auction.seller);
  console.log('Start Price:', auction.startPrice, 'ETH');
  console.log('End Price:', auction.endPrice, 'ETH');
  console.log('Status:', auction.status);
  console.log('Start:', new Date(auction.startTime * 1000).toISOString());
  console.log('End:', new Date(auction.endTime * 1000).toISOString());

  // Get current price
  const currentPrice = await sdk.auction.getCurrentPrice(auctionId);
  console.log('Current Price:', currentPrice, 'ETH');

  return auction;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return formatTime(seconds);
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all Dutch auction examples
 */
export async function runDutchAuctionExamples() {
  console.log('=== Basic Dutch Auction ===');
  // Uncomment to test: await createBasicDutchAuction();

  console.log('\n=== Get Current Price ===');
  // Uncomment to test: await getDutchAuctionPrice();

  console.log('\n=== Price Projection ===');
  // Uncomment to test: await projectDutchAuctionPrices();

  console.log('\n=== Optimal Buy Time ===');
  // Uncomment to test: await calculateOptimalBuyTime();
}

// Run if executed directly
if (require.main === module) {
  runDutchAuctionExamples().catch(console.error);
}
