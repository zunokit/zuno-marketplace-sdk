/**
 * Listing Workflow Examples
 *
 * This file demonstrates the complete listing workflow for NFT marketplace
 *
 * @module examples/exchange/listing-workflow
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';
import type { ListNFTParams } from 'zuno-marketplace-sdk';

// ============================================================================
// BASIC NFT LISTING
// ============================================================================

/**
 * List a single NFT for sale
 */
export async function listSingleNFT() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: ListNFTParams = {
    collectionAddress: '0x...', // NFT collection address
    tokenId: '1', // Token ID to list
    price: '1.5', // Listing price in ETH
    duration: 86400, // Listing duration in seconds (24 hours)
  };

  const { listingId, tx } = await sdk.exchange.listNFT(params);

  console.log('NFT listed successfully!');
  console.log('Listing ID:', listingId);
  console.log('Transaction:', tx.hash);

  return { listingId, tx };
}

// ============================================================================
// LIST WITH CUSTOM DURATION
// ============================================================================

/**
 * List NFT with custom listing duration
 */
export async function listWithCustomDuration() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const durations = {
    '1 hour': 3600,
    '1 day': 86400,
    '3 days': 259200,
    '7 days': 604800,
    '30 days': 2592000,
  };

  // List for 7 days
  const params: ListNFTParams = {
    collectionAddress: '0x...',
    tokenId: '1',
    price: '2.0',
    duration: durations['7 days'],
  };

  const { listingId, tx } = await sdk.exchange.listNFT(params);

  console.log('NFT listed for 7 days');
  console.log('Listing ID:', listingId);
  console.log('Expires at:', new Date(Date.now() + durations['7 days'] * 1000).toISOString());

  return { listingId, tx, expiresAt: Date.now() + durations['7 days'] * 1000 };
}

// ============================================================================
// COMPLETE LISTING WORKFLOW
// ============================================================================

/**
 * Complete listing workflow with pre-flight checks
 */
export async function completeListingWorkflow() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const tokenId = '1';
  const price = '1.5';
  const duration = 86400;

  // Step 1: Verify collection
  console.log('Step 1: Verifying collection...');
  const verification = await sdk.collection.verifyCollection(collectionAddress);

  if (!verification.isValid) {
    throw new Error('Invalid collection address');
  }
  console.log('✓ Collection verified');

  // Step 2: Check if user owns the NFT
  console.log('\nStep 2: Checking ownership...');
  const signerAddress = await sdk.getSignerAddress();
  const ownedTokens = await sdk.collection.getUserOwnedTokens(
    collectionAddress,
    signerAddress
  );

  const ownsToken = ownedTokens.some((t) => t.tokenId === tokenId);

  if (!ownsToken) {
    throw new Error('You do not own this NFT');
  }
  console.log('✓ Ownership confirmed');

  // Step 3: List the NFT
  console.log('\nStep 3: Creating listing...');
  const { listingId, tx } = await sdk.exchange.listNFT({
    collectionAddress,
    tokenId,
    price,
    duration,
  });

  console.log('✓ NFT listed successfully');
  console.log('Listing ID:', listingId);

  // Step 4: Verify listing
  console.log('\nStep 4: Verifying listing...');
  await tx.wait(); // Wait for transaction confirmation

  const listing = await sdk.exchange.getListing(listingId);
  console.log('✓ Listing verified');
  console.log('Price:', listing.price, 'ETH');
  console.log('Status:', listing.status);
  console.log('Ends:', new Date(listing.endTime * 1000).toISOString());

  return { listingId, tx, listing };
}

// ============================================================================
// LIST MULTIPLE NFTs SEQUENTIALLY
// ============================================================================

/**
 * List multiple NFTs one by one
 */
export async function listMultipleNFTsSequentially() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const nftsToList = [
    { collectionAddress: '0x...', tokenId: '1', price: '1.0' },
    { collectionAddress: '0x...', tokenId: '2', price: '1.5' },
    { collectionAddress: '0x...', tokenId: '3', price: '2.0' },
  ];

  const results = [];

  for (const nft of nftsToList) {
    try {
      const { listingId, tx } = await sdk.exchange.listNFT({
        collectionAddress: nft.collectionAddress,
        tokenId: nft.tokenId,
        price: nft.price,
        duration: 86400,
      });

      results.push({
        tokenId: nft.tokenId,
        listingId,
        tx,
        success: true,
      });

      console.log(`Listed token #${nft.tokenId}: ${listingId}`);

      // Wait between transactions
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      results.push({
        tokenId: nft.tokenId,
        error: error.message,
        success: false,
      });
      console.error(`Failed to list token #${nft.tokenId}:`, error.message);
    }
  }

  return results;
}

// ============================================================================
// CANCEL LISTING
// ============================================================================

/**
 * Cancel an active NFT listing
 */
export async function cancelListing() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const listingId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  const { tx } = await sdk.exchange.cancelListing(listingId);

  console.log('Listing cancelled successfully');
  console.log('Transaction:', tx.hash);

  return { tx };
}

// ============================================================================
// LISTING WITH PROGRESS CALLBACKS
// ============================================================================

/**
 * List NFT with progress tracking
 */
export async function listWithProgress(
  onProgress?: (step: string, status: string) => void
) {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  try {
    onProgress?.('validation', 'Validating NFT ownership...');

    const collectionAddress = '0x...';
    const tokenId = '1';
    const signerAddress = await sdk.getSignerAddress();

    const ownedTokens = await sdk.collection.getUserOwnedTokens(
      collectionAddress,
      signerAddress
    );

    if (!ownedTokens.some((t) => t.tokenId === tokenId)) {
      throw new Error('You do not own this NFT');
    }

    onProgress?.('approval', 'Checking marketplace approval...');
    // SDK handles approval automatically

    onProgress?.('listing', 'Creating listing...');
    const { listingId, tx } = await sdk.exchange.listNFT({
      collectionAddress,
      tokenId,
      price: '1.5',
      duration: 86400,
    });

    onProgress?.('confirming', 'Waiting for confirmation...');
    await tx.wait();

    onProgress?.('success', `NFT listed: ${listingId}`);
    return { listingId, tx };

  } catch (error: any) {
    onProgress?.('error', error.message);
    throw error;
  }
}

// ============================================================================
// GET LISTING DETAILS
// ============================================================================

/**
 * Get details of a specific listing
 */
export async function getListingDetails() {
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
  console.log('Start Time:', new Date(listing.startTime * 1000).toISOString());
  console.log('End Time:', new Date(listing.endTime * 1000).toISOString());

  return listing;
}

// ============================================================================
// GET LISTINGS BY COLLECTION
// ============================================================================

/**
 * Get all active listings for a collection
 */
export async function getListingsByCollection() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  const listings = await sdk.exchange.getListings(collectionAddress);

  console.log(`Found ${listings.length} listings for collection:`);

  for (const listing of listings) {
    if (listing.status === 'active') {
      console.log(`\nToken #${listing.tokenId}:`);
      console.log(`  Price: ${listing.price} ETH`);
      console.log(`  Status: ${listing.status}`);
      console.log(`  Ends: ${new Date(listing.endTime * 1000).toLocaleString()}`);
    }
  }

  return listings;
}

// ============================================================================
// GET LISTINGS BY SELLER
// ============================================================================

/**
 * Get all active listings for a specific seller
 */
export async function getListingsBySeller() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const sellerAddress = '0x...';

  const listings = await sdk.exchange.getListingsBySeller(sellerAddress);

  console.log(`Found ${listings.length} active listings by ${sellerAddress}:`);

  let totalPrice = 0;
  for (const listing of listings) {
    if (listing.status === 'active') {
      console.log(`\n${listing.collectionAddress} #${listing.tokenId}`);
      console.log(`  Price: ${listing.price} ETH`);
      totalPrice += Number(listing.price);
    }
  }

  console.log(`\nTotal value: ${totalPrice.toFixed(2)} ETH`);

  return listings;
}

// ============================================================================
// CALCULATE BUYER PRICE
// ============================================================================

/**
 * Calculate total price buyer needs to pay (including fees)
 */
export async function calculateBuyerPrice() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const listingId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  const totalPrice = await sdk.exchange.getBuyerPrice(listingId);

  console.log('Total buyer price:', totalPrice, 'ETH');
  console.log('(Includes listing price + royalty + marketplace fee)');

  return totalPrice;
}

// ============================================================================
// LISTING STATUS CHECK
// ============================================================================

/**
 * Check if a listing is still active
 */
export async function checkListingStatus() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const listingId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  const listing = await sdk.exchange.getListing(listingId);

  const now = Math.floor(Date.now() / 1000);
  const isActive = listing.status === 'active' && listing.endTime > now;

  if (isActive) {
    const timeLeft = listing.endTime - now;
    console.log('Listing is ACTIVE');
    console.log('Time remaining:', formatTimeLeft(timeLeft));
  } else {
    console.log('Listing is NOT ACTIVE');
    console.log('Status:', listing.status);
  }

  return { isActive, listing };
}

// Helper: Format time left
function formatTimeLeft(seconds: number): string {
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

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all listing workflow examples
 */
export async function runListingWorkflowExamples() {
  console.log('=== Basic NFT Listing ===');
  // Uncomment to test: await listSingleNFT();

  console.log('\n=== Complete Listing Workflow ===');
  // Uncomment to test: await completeListingWorkflow();

  console.log('\n=== Get Listing Details ===');
  // Uncomment to test: await getListingDetails();

  console.log('\n=== Check Listing Status ===');
  // Uncomment to test: await checkListingStatus();
}

// Run if executed directly
if (require.main === module) {
  runListingWorkflowExamples().catch(console.error);
}
