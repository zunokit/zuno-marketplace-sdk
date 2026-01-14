/**
 * Market Data Query Examples
 *
 * This file demonstrates how to query marketplace data and statistics
 *
 * @module examples/exchange/market-data
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';

// ============================================================================
// GET SINGLE LISTING
// ============================================================================

/**
 * Get detailed information about a specific listing
 */
export async function getSingleListing() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const listingId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  const listing = await sdk.exchange.getListing(listingId);

  console.log('=== Listing Details ===');
  console.log('Listing ID:', listing.id);
  console.log('Collection:', listing.collectionAddress);
  console.log('Token ID:', listing.tokenId);
  console.log('Price:', listing.price, 'ETH');
  console.log('Seller:', listing.seller);
  console.log('Status:', listing.status);
  console.log('Created:', new Date(listing.createdAt).toLocaleString());
  console.log('Start:', new Date(listing.startTime * 1000).toLocaleString());
  console.log('End:', new Date(listing.endTime * 1000).toLocaleString());

  return listing;
}

// ============================================================================
// GET ALL LISTINGS BY COLLECTION
// ============================================================================

/**
 * Get all listings for a specific collection
 */
export async function getListingsByCollection() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  const listings = await sdk.exchange.getListings(collectionAddress);

  console.log(`Found ${listings.length} listings for collection`);

  // Group by status
  const byStatus = listings.reduce((acc, listing) => {
    acc[listing.status] = (acc[listing.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nBy Status:', byStatus);

  // Show active listings
  const activeListings = listings.filter((l) => l.status === 'active');
  console.log(`\nActive Listings: ${activeListings.length}`);

  for (const listing of activeListings) {
    console.log(`\n  Token #${listing.tokenId}`);
    console.log(`  Price: ${listing.price} ETH`);
    console.log(`  Seller: ${listing.seller}`);
  }

  return { listings, byStatus, activeListings };
}

// ============================================================================
// GET ALL LISTINGS BY SELLER
// ============================================================================

/**
 * Get all listings from a specific seller
 */
export async function getListingsBySeller() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const sellerAddress = '0x...';

  const listings = await sdk.exchange.getListingsBySeller(sellerAddress);

  console.log(`Found ${listings.length} listings from seller`);

  // Calculate statistics
  let totalValue = 0;
  let activeCount = 0;
  let soldCount = 0;
  let expiredCount = 0;

  for (const listing of listings) {
    totalValue += Number(listing.price);

    switch (listing.status) {
      case 'active':
        activeCount++;
        break;
      case 'sold':
        soldCount++;
        break;
      case 'expired':
      case 'cancelled':
        expiredCount++;
        break;
    }
  }

  console.log('\n=== Seller Statistics ===');
  console.log('Total Listings:', listings.length);
  console.log('Active:', activeCount);
  console.log('Sold:', soldCount);
  console.log('Expired/Cancelled:', expiredCount);
  console.log('Total Value:', totalValue.toFixed(2), 'ETH');

  return { listings, stats: { totalValue, activeCount, soldCount, expiredCount } };
}

// ============================================================================
// CALCULATE BUYER PRICE
// ============================================================================

/**
 * Calculate total price including fees for a listing
 */
export async function calculateBuyerPrice() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const listingId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  const listing = await sdk.exchange.getListing(listingId);
  const buyerPrice = await sdk.exchange.getBuyerPrice(listingId);

  const basePrice = Number(listing.price);
  const total = Number(buyerPrice);
  const fees = total - basePrice;
  const feePercentage = ((fees / basePrice) * 100).toFixed(2);

  console.log('=== Price Calculation ===');
  console.log('List Price:', listing.price, 'ETH');
  console.log('Buyer Price:', buyerPrice, 'ETH');
  console.log('Fees:', fees.toFixed(4), 'ETH');
  console.log('Fee Rate:', feePercentage + '%');

  return { basePrice, buyerPrice, fees, feePercentage };
}

// ============================================================================
// SEARCH AND FILTER LISTINGS
// ============================================================================

/**
 * Search and filter listings based on criteria
 */
export async function filterListings() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  // Get all listings
  const listings = await sdk.exchange.getListings(collectionAddress);

  // Filter: Only active listings under 1 ETH
  const affordableListings = listings.filter(
    (l) => l.status === 'active' && Number(l.price) < 1.0
  );

  console.log(`Found ${affordableListings.length} affordable listings (< 1 ETH):`);

  // Sort by price ascending
  affordableListings.sort((a, b) => Number(a.price) - Number(b.price));

  for (const listing of affordableListings) {
    console.log(`Token #${listing.tokenId}: ${listing.price} ETH`);
  }

  return affordableListings;
}

// ============================================================================
// MARKET STATISTICS
// ============================================================================

/**
 * Get comprehensive market statistics for a collection
 */
export async function getMarketStatistics() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  const listings = await sdk.exchange.getListings(collectionAddress);

  // Calculate statistics
  const activeListings = listings.filter((l) => l.status === 'active');
  const soldListings = listings.filter((l) => l.status === 'sold');

  const prices = activeListings.map((l) => Number(l.price));
  const soldPrices = soldListings.map((l) => Number(l.price));

  // Floor price (lowest active listing)
  const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;

  // Average price
  const avgPrice = prices.length > 0
    ? prices.reduce((sum, p) => sum + p, 0) / prices.length
    : 0;

  // Price range
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  // Volume (sold listings)
  const totalVolume = soldPrices.reduce((sum, p) => sum + p, 0);

  console.log('=== Market Statistics ===');
  console.log('Active Listings:', activeListings.length);
  console.log('Sold Listings:', soldListings.length);
  console.log('\nPrice Data:');
  console.log('  Floor Price:', floorPrice.toFixed(4), 'ETH');
  console.log('  Average Price:', avgPrice.toFixed(4), 'ETH');
  console.log('  Price Range:', minPrice.toFixed(4), '-', maxPrice.toFixed(4), 'ETH');
  console.log('\nVolume:');
  console.log('  Total Volume:', totalVolume.toFixed(4), 'ETH');

  return {
    activeCount: activeListings.length,
    soldCount: soldListings.length,
    floorPrice,
    avgPrice,
    minPrice,
    maxPrice,
    totalVolume,
  };
}

// ============================================================================
// LISTING TIME ANALYSIS
// ============================================================================

/**
 * Analyze listing expiration times
 */
export async function analyzeListingTimes() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const listings = await sdk.exchange.getListings(collectionAddress);

  const now = Math.floor(Date.now() / 1000);

  // Categorize by time remaining
  const expiringSoon = []; // < 6 hours
  const expiringToday = []; // < 24 hours
  const expiringThisWeek = []; // < 7 days
  const longerTerm = []; // > 7 days

  for (const listing of listings) {
    if (listing.status !== 'active') continue;

    const timeLeft = listing.endTime - now;

    if (timeLeft < 6 * 3600) {
      expiringSoon.push(listing);
    } else if (timeLeft < 24 * 3600) {
      expiringToday.push(listing);
    } else if (timeLeft < 7 * 24 * 3600) {
      expiringThisWeek.push(listing);
    } else {
      longerTerm.push(listing);
    }
  }

  console.log('=== Listing Time Analysis ===');
  console.log('Expiring Soon (< 6h):', expiringSoon.length);
  console.log('Expiring Today (< 24h):', expiringToday.length);
  console.log('Expiring This Week (< 7d):', expiringThisWeek.length);
  console.log('Longer Term (> 7d):', longerTerm.length);

  // Show expiring soon listings
  if (expiringSoon.length > 0) {
    console.log('\nExpiring Soon:');
    for (const listing of expiringSoon) {
      const hoursLeft = ((listing.endTime - now) / 3600).toFixed(1);
      console.log(`  Token #${listing.tokenId}: ${listing.price} ETH (${hoursLeft}h left)`);
    }
  }

  return { expiringSoon, expiringToday, expiringThisWeek, longerTerm };
}

// ============================================================================
// SELLER PORTFOLIO ANALYSIS
// ============================================================================

/**
 * Analyze a seller's portfolio and listings
 */
export async function analyzeSellerPortfolio() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const sellerAddress = '0x...';
  const listings = await sdk.exchange.getListingsBySeller(sellerAddress);

  // Group by collection
  const byCollection = listings.reduce((acc, listing) => {
    const collection = listing.collectionAddress;
    if (!acc[collection]) {
      acc[collection] = [];
    }
    acc[collection].push(listing);
    return acc;
  }, {} as Record<string, typeof listings>);

  console.log('=== Seller Portfolio Analysis ===');
  console.log('Total Listings:', listings.length);
  console.log('Collections:', Object.keys(byCollection).length);

  // Analyze each collection
  for (const [collectionAddress, collectionListings] of Object.entries(byCollection)) {
    const active = collectionListings.filter((l) => l.status === 'active');
    const sold = collectionListings.filter((l) => l.status === 'sold');
    const totalValue = active.reduce((sum, l) => sum + Number(l.price), 0);

    console.log(`\nCollection ${collectionAddress}:`);
    console.log(`  Active: ${active.length}`);
    console.log(`  Sold: ${sold.length}`);
    console.log(`  Total Value: ${totalValue.toFixed(2)} ETH`);
  }

  return { listings, byCollection };
}

// ============================================================================
// COMPARE LISTINGS
// ============================================================================

/**
 * Compare listings across multiple collections
 */
export async function compareListings() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collections = ['0x...', '0x...', '0x...'];

  console.log('=== Collection Comparison ===');

  const comparison = [];

  for (const collectionAddress of collections) {
    try {
      const listings = await sdk.exchange.getListings(collectionAddress);
      const activeListings = listings.filter((l) => l.status === 'active');

      const prices = activeListings.map((l) => Number(l.price));
      const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const avgPrice = prices.length > 0
        ? prices.reduce((sum, p) => sum + p, 0) / prices.length
        : 0;

      comparison.push({
        collection: collectionAddress,
        activeListings: activeListings.length,
        floorPrice,
        avgPrice,
      });

      console.log(`\n${collectionAddress}:`);
      console.log(`  Active: ${activeListings.length}`);
      console.log(`  Floor: ${floorPrice.toFixed(4)} ETH`);
      console.log(`  Average: ${avgPrice.toFixed(4)} ETH`);
    } catch (error) {
      console.error(`Failed to fetch ${collectionAddress}:`, error);
    }
  }

  return comparison;
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all market data examples
 */
export async function runMarketDataExamples() {
  console.log('=== Get Single Listing ===');
  // Uncomment to test: await getSingleListing();

  console.log('\n=== Get Listings by Collection ===');
  // Uncomment to test: await getListingsByCollection();

  console.log('\n=== Get Listings by Seller ===');
  // Uncomment to test: await getListingsBySeller();

  console.log('\n=== Market Statistics ===');
  // Uncomment to test: await getMarketStatistics();

  console.log('\n=== Listing Time Analysis ===');
  // Uncomment to test: await analyzeListingTimes();
}

// Run if executed directly
if (require.main === module) {
  runMarketDataExamples().catch(console.error);
}
