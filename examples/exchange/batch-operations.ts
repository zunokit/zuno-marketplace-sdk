/**
 * Batch Operations Examples
 *
 * This file demonstrates batch listing, buying, and cancellation operations
 *
 * @module examples/exchange/batch-operations
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';

// ============================================================================
// BATCH LIST NFTs
// ============================================================================

/**
 * List multiple NFTs from the same collection in one transaction
 */
export async function batchListNFTs() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params = {
    collectionAddress: '0x...', // All NFTs must be from same collection
    tokenIds: ['1', '2', '3', '4', '5'], // Token IDs to list
    prices: ['0.5', '0.7', '1.0', '1.2', '1.5'], // Price for each token
    duration: 86400, // Same duration for all (24 hours)
  };

  const { listingIds, tx } = await sdk.exchange.batchListNFT(params);

  console.log('Batch listed', listingIds.length, 'NFTs in one transaction!');
  console.log('Listing IDs:', listingIds);
  console.log('Transaction:', tx.hash);

  return { listingIds, tx };
}

// ============================================================================
// BATCH BUY NFTs
// ============================================================================

/**
 * Buy multiple NFTs in one transaction
 */
export async function batchBuyNFTs() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const listingIds = [
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    '0x5678567856785678567856785678567856785678567856785678567856785678',
  ];

  // Calculate total price (sum of all listing prices + fees)
  const totalValue = '3.0'; // Total ETH for all NFTs

  const { tx } = await sdk.exchange.batchBuyNFT({
    listingIds,
    value: totalValue,
  });

  console.log('Batch bought', listingIds.length, 'NFTs in one transaction!');
  console.log('Transaction:', tx.hash);

  return { tx, count: listingIds.length };
}

// ============================================================================
// BATCH CANCEL LISTINGS
// ============================================================================

/**
 * Cancel multiple listings in one transaction
 */
export async function batchCancelListings() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const listingIds = [
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    '0x5678567856785678567856785678567856785678567856785678567856785678',
  ];

  const { tx } = await sdk.exchange.batchCancelListing({
    listingIds,
  });

  console.log('Batch cancelled', listingIds.length, 'listings in one transaction!');
  console.log('Transaction:', tx.hash);

  return { tx, count: listingIds.length };
}

// ============================================================================
// BATCH LIST WITH PROGRESS TRACKING
// ============================================================================

/**
 * Batch list with progress events for UI updates
 */
export async function batchListWithProgress(
  onProgress?: (current: number, total: number, stage: string) => void
) {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const tokenIds = ['1', '2', '3', '4', '5'];
  const prices = ['0.5', '0.7', '1.0', '1.2', '1.5'];
  const duration = 86400;

  try {
    onProgress?.(0, tokenIds.length, 'Validating ownership...');

    // Verify ownership of all tokens
    const signerAddress = await sdk.getSignerAddress();
    const ownedTokens = await sdk.collection.getUserOwnedTokens(
      collectionAddress,
      signerAddress
    );

    const ownedTokenIds = ownedTokens.map((t) => t.tokenId);

    for (const tokenId of tokenIds) {
      if (!ownedTokenIds.includes(tokenId)) {
        throw new Error(`You do not own token #${tokenId}`);
      }
    }

    onProgress?.(0, tokenIds.length, 'Creating batch listing...');

    const { listingIds, tx } = await sdk.exchange.batchListNFT({
      collectionAddress,
      tokenIds,
      prices,
      duration,
    });

    onProgress?.(tokenIds.length, tokenIds.length, 'Confirming...');
    await tx.wait();

    onProgress?.(tokenIds.length, tokenIds.length, 'Complete');
    return { listingIds, tx };

  } catch (error: any) {
    onProgress?.(0, tokenIds.length, `Error: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// BATCH BUY WITH PRICE CALCULATION
// ============================================================================

/**
 * Batch buy with automatic price calculation
 */
export async function batchBuyWithPriceCalculation() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const listingIds = [
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  ];

  console.log('Calculating total price...');

  // Get price for each listing
  const prices = await Promise.all(
    listingIds.map((id) => sdk.exchange.getBuyerPrice(id))
  );

  const totalPrice = prices.reduce((sum, price) => sum + Number(price), 0);

  console.log('Total price:', totalPrice.toFixed(4), 'ETH');

  // Check balance
  const buyerAddress = await sdk.getSignerAddress();
  const balance = await sdk.getBalance(buyerAddress);

  if (Number(balance) < totalPrice) {
    throw new Error(`Insufficient balance. Need ${totalPrice.toFixed(4)} ETH`);
  }

  // Execute batch buy
  const { tx } = await sdk.exchange.batchBuyNFT({
    listingIds,
    value: totalPrice.toFixed(4),
  });

  console.log('Batch purchase complete!');
  console.log('Transaction:', tx.hash);

  return { tx, totalPrice };
}

// ============================================================================
// BATCH LIST DIFFERENT PRICES
// ============================================================================

/**
 * Batch list NFTs with individual pricing strategies
 */
export async function batchListWithDifferentPrices() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  // Define tokens with individual pricing strategies
  const listings = [
    { tokenId: '1', strategy: 'floor', price: '0.5' },
    { tokenId: '2', strategy: 'below_floor', price: '0.4' },
    { tokenId: '3', strategy: 'floor', price: '0.5' },
    { tokenId: '4', strategy: 'premium', price: '1.0' },
    { tokenId: '5', strategy: 'rare', price: '2.0' },
  ];

  const tokenIds = listings.map((l) => l.tokenId);
  const prices = listings.map((l) => l.price);

  console.log('Listing', tokenIds.length, 'NFTs with different pricing:');

  for (const listing of listings) {
    console.log(`  Token #${listing.tokenId}: ${listing.price} ETH (${listing.strategy})`);
  }

  const { listingIds, tx } = await sdk.exchange.batchListNFT({
    collectionAddress,
    tokenIds,
    prices,
    duration: 86400,
  });

  console.log('\nAll listings created!');
  console.log('Transaction:', tx.hash);

  return { listingIds, tx };
}

// ============================================================================
// BATCH OPERATIONS ERROR HANDLING
// ============================================================================

/**
 * Batch operations with error handling and partial success tracking
 */
export async function batchWithErrorHandling() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const tokenIds = ['1', '2', '3', '999', '5']; // Token 999 doesn't exist
  const prices = ['0.5', '0.7', '1.0', '1.2', '1.5'];

  try {
    // Verify ownership first
    const signerAddress = await sdk.getSignerAddress();
    const ownedTokens = await sdk.collection.getUserOwnedTokens(
      collectionAddress,
      signerAddress
    );

    const ownedTokenIds = ownedTokens.map((t) => t.tokenId);

    // Find invalid tokens
    const invalidTokens = tokenIds.filter((id) => !ownedTokenIds.includes(id));

    if (invalidTokens.length > 0) {
      console.error('Error: You do not own these tokens:', invalidTokens);
      throw new Error(`Cannot list tokens you don't own: ${invalidTokens.join(', ')}`);
    }

    // Proceed with batch list
    const { listingIds, tx } = await sdk.exchange.batchListNFT({
      collectionAddress,
      tokenIds,
      prices,
      duration: 86400,
    });

    console.log('Successfully listed', listingIds.length, 'NFTs');
    return { listingIds, tx };

  } catch (error: any) {
    console.error('Batch operation failed:', error.message);

    // Suggestion: Retry with valid tokens only
    const signerAddress = await sdk.getSignerAddress();
    const ownedTokens = await sdk.collection.getUserOwnedTokens(
      collectionAddress,
      signerAddress
    );

    const ownedTokenIds = ownedTokens.map((t) => t.tokenId);
    const validTokens = tokenIds.filter((id) => ownedTokenIds.includes(id));
    const validPrices = tokenIds
      .map((id, i) => ({ id, price: prices[i] }))
      .filter((t) => validTokens.includes(t.id))
      .map((t) => t.price);

    if (validTokens.length > 0) {
      console.log('Retrying with valid tokens only...');
      const { listingIds, tx } = await sdk.exchange.batchListNFT({
        collectionAddress,
        tokenIds: validTokens,
        prices: validPrices,
        duration: 86400,
      });

      console.log('Listed', listingIds.length, 'valid tokens');
      return { listingIds, tx };
    }

    throw error;
  }
}

// ============================================================================
// BATCH LIST IN CHUNKS
// ============================================================================

/**
 * List many NFTs in chunks (for large batches)
 */
export async function batchListInChunks() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  // Large number of tokens to list
  const allTokenIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const allPrices = allTokenIds.map(() => '0.5');

  const chunkSize = 5; // Process 5 at a time
  const results = [];

  for (let i = 0; i < allTokenIds.length; i += chunkSize) {
    const chunkIds = allTokenIds.slice(i, i + chunkSize);
    const chunkPrices = allPrices.slice(i, i + chunkSize);

    try {
      const { listingIds, tx } = await sdk.exchange.batchListNFT({
        collectionAddress,
        tokenIds: chunkIds,
        prices: chunkPrices,
        duration: 86400,
      });

      results.push({
        chunk: i / chunkSize + 1,
        listingIds,
        tx,
        success: true,
      });

      console.log(`Chunk ${i / chunkSize + 1}: Listed ${listingIds.length} NFTs`);

      // Wait between chunks
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      results.push({
        chunk: i / chunkSize + 1,
        error: error.message,
        success: false,
      });
      console.error(`Chunk ${i / chunkSize + 1}: Failed -`, error.message);
    }
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`\nBatch complete: ${successful} successful, ${failed} failed`);

  return results;
}

// ============================================================================
// CLEAR APPROVAL CACHE
// ============================================================================

/**
 * Clear the approval cache before batch operations
 */
export async function clearCacheAndBatch() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  // Clear approval cache to force re-check
  sdk.exchange.clearApprovalCache();
  console.log('Approval cache cleared');

  // Now proceed with batch operations
  const { listingIds, tx } = await sdk.exchange.batchListNFT({
    collectionAddress: '0x...',
    tokenIds: ['1', '2', '3'],
    prices: ['0.5', '0.7', '1.0'],
    duration: 86400,
  });

  console.log('Batch listed', listingIds.length, 'NFTs');
  return { listingIds, tx };
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all batch operations examples
 */
export async function runBatchOperationsExamples() {
  console.log('=== Batch List NFTs ===');
  // Uncomment to test: await batchListNFTs();

  console.log('\n=== Batch Buy NFTs ===');
  // Uncomment to test: await batchBuyNFTs();

  console.log('\n=== Batch Cancel Listings ===');
  // Uncomment to test: await batchCancelListings();

  console.log('\n=== Batch List with Different Prices ===');
  // Uncomment to test: await batchListWithDifferentPrices();

  console.log('\n=== Batch List in Chunks ===');
  // Uncomment to test: await batchListInChunks();
}

// Run if executed directly
if (require.main === module) {
  runBatchOperationsExamples().catch(console.error);
}
