/**
 * English Auction Examples
 *
 * This file demonstrates how to create and manage English auctions
 *
 * @module examples/auction/english-auction
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';
import type { CreateEnglishAuctionParams } from 'zuno-marketplace-sdk';

// ============================================================================
// CREATE BASIC ENGLISH AUCTION
// ============================================================================

/**
 * Create a basic English auction
 */
export async function createBasicEnglishAuction() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: CreateEnglishAuctionParams = {
    collectionAddress: '0x...', // NFT collection address
    tokenId: '1', // Token ID to auction
    startingBid: '1.0', // Minimum starting bid in ETH
    duration: 86400 * 7, // Auction duration (7 days in seconds)
  };

  const { auctionId, tx } = await sdk.auction.createEnglishAuction(params);

  console.log('English auction created!');
  console.log('Auction ID:', auctionId);
  console.log('Transaction:', tx.hash);

  return { auctionId, tx };
}

// ============================================================================
// CREATE AUCTION WITH RESERVE PRICE
// ============================================================================

/**
 * Create an English auction with a reserve price
 */
export async function createAuctionWithReserve() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: CreateEnglishAuctionParams = {
    collectionAddress: '0x...',
    tokenId: '1',
    startingBid: '1.0', // Starting bid
    reservePrice: '5.0', // Minimum sale price (hidden from bidders)
    duration: 86400 * 7, // 7 days
  };

  const { auctionId, tx } = await sdk.auction.createEnglishAuction(params);

  console.log('English auction with reserve created!');
  console.log('Starting bid:', params.startingBid, 'ETH');
  console.log('Reserve price:', params.reservePrice, 'ETH');
  console.log('Auction ID:', auctionId);

  return { auctionId, tx };
}

// ============================================================================
// CREATE AUCTION WITH CUSTOM SELLER
// ============================================================================

/**
 * Create an auction on behalf of another address
 */
export async function createAuctionForSeller() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: CreateEnglishAuctionParams = {
    collectionAddress: '0x...',
    tokenId: '1',
    startingBid: '1.0',
    duration: 86400 * 7,
    seller: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', // Custom seller address
  };

  const { auctionId, tx } = await sdk.auction.createEnglishAuction(params);

  console.log('Auction created for seller:', params.seller);
  console.log('Auction ID:', auctionId);

  return { auctionId, tx, seller: params.seller };
}

// ============================================================================
// BATCH CREATE ENGLISH AUCTIONS
// ============================================================================

/**
 * Create multiple English auctions in one transaction
 */
export async function batchCreateEnglishAuctions() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params = {
    collectionAddress: '0x...', // All NFTs must be from same collection
    tokenIds: ['1', '2', '3'], // Token IDs to auction
    startingBid: '1.0', // Same starting bid for all
    reservePrice: '5.0', // Same reserve for all
    duration: 86400 * 7, // 7 days
  };

  const { auctionIds, tx } = await sdk.auction.batchCreateEnglishAuction(params);

  console.log('Batch created', auctionIds.length, 'English auctions!');
  console.log('Auction IDs:', auctionIds);
  console.log('Transaction:', tx.hash);

  return { auctionIds, tx };
}

// ============================================================================
// CREATE AUCTION WITH DIFFERENT DURATIONS
// ============================================================================

/**
 * Examples of different auction durations
 */
export async function createAuctionWithDuration(duration: string) {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const durations: Record<string, number> = {
    '1 hour': 3600,
    '6 hours': 21600,
    '24 hours': 86400,
    '3 days': 259200,
    '7 days': 604800,
    '14 days': 1209600,
    '30 days': 2592000,
  };

  const params: CreateEnglishAuctionParams = {
    collectionAddress: '0x...',
    tokenId: '1',
    startingBid: '1.0',
    duration: durations[duration] || durations['7 days'],
  };

  const { auctionId, tx } = await sdk.auction.createEnglishAuction(params);

  console.log(`Created ${duration} auction`);
  console.log('Auction ID:', auctionId);
  console.log('Ends:', new Date(Date.now() + params.duration * 1000).toISOString());

  return { auctionId, tx, duration: params.duration };
}

// ============================================================================
// CREATE EMERGENCY AUCTION (SHORT DURATION)
// ============================================================================

/**
 * Create a quick auction for urgent sales
 */
export async function createEmergencyAuction() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: CreateEnglishAuctionParams = {
    collectionAddress: '0x...',
    tokenId: '1',
    startingBid: '0.5', // Lower starting bid for quick sale
    duration: 3600, // 1 hour only
  };

  const { auctionId, tx } = await sdk.auction.createEnglishAuction(params);

  console.log('Emergency auction created (1 hour)');
  console.log('Auction ID:', auctionId);
  console.log('Ends:', new Date(Date.now() + 3600 * 1000).toLocaleString());

  return { auctionId, tx };
}

// ============================================================================
// CANCEL ENGLISH AUCTION
// ============================================================================

/**
 * Cancel an active English auction
 */
export async function cancelEnglishAuction() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1'; // Auction ID to cancel

  const { tx } = await sdk.auction.cancelAuction(auctionId);

  console.log('English auction cancelled');
  console.log('Transaction:', tx.hash);

  return { tx };
}

// ============================================================================
// BATCH CANCEL AUCTIONS
// ============================================================================

/**
 * Cancel multiple English auctions in one transaction
 */
export async function batchCancelAuctions() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionIds = ['1', '2', '3', '4', '5'];

  const { cancelledCount, tx } = await sdk.auction.batchCancelAuction(auctionIds);

  console.log('Cancelled', cancelledCount, 'auctions');
  console.log('Transaction:', tx.hash);

  return { cancelledCount, tx };
}

// ============================================================================
// SETTLE AUCTION
// ============================================================================

/**
 * Settle a finished English auction and transfer NFT
 */
export async function settleAuction() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';

  const { tx } = await sdk.auction.settleAuction(auctionId);

  console.log('Auction settled');
  console.log('Transaction:', tx.hash);

  return { tx };
}

// ============================================================================
// GET AUCTION DETAILS
// ============================================================================

/**
 * Get detailed information about an English auction
 */
export async function getEnglishAuctionDetails() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const auctionId = '1';

  const auction = await sdk.auction.getAuctionFromFactory(auctionId);

  if (auction.type !== 'english') {
    throw new Error('This is not an English auction');
  }

  console.log('=== English Auction Details ===');
  console.log('Auction ID:', auction.id);
  console.log('NFT:', `${auction.collectionAddress} #${auction.tokenId}`);
  console.log('Seller:', auction.seller);
  console.log('Starting Bid:', auction.startingBid, 'ETH');
  console.log('Current Bid:', auction.currentBid, 'ETH');
  console.log('Highest Bidder:', auction.highestBidder || 'None');
  console.log('Status:', auction.status);
  console.log('Start:', new Date(auction.startTime * 1000).toISOString());
  console.log('End:', new Date(auction.endTime * 1000).toISOString());

  return auction;
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all English auction examples
 */
export async function runEnglishAuctionExamples() {
  console.log('=== Basic English Auction ===');
  // Uncomment to test: await createBasicEnglishAuction();

  console.log('\n=== Auction with Reserve Price ===');
  // Uncomment to test: await createAuctionWithReserve();

  console.log('\n=== Batch Create Auctions ===');
  // Uncomment to test: await batchCreateEnglishAuctions();

  console.log('\n=== Get English Auction Details ===');
  // Uncomment to test: await getEnglishAuctionDetails();
}

// Run if executed directly
if (require.main === module) {
  runEnglishAuctionExamples().catch(console.error);
}
