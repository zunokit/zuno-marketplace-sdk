/**
 * Buying Flow Examples
 *
 * This file demonstrates the complete buying workflow for NFT marketplace
 *
 * @module examples/exchange/buying-flow
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';
import type { BuyNFTParams } from 'zuno-marketplace-sdk';

// ============================================================================
// BASIC NFT PURCHASE
// ============================================================================

/**
 * Buy a single NFT from a listing
 */
export async function buySingleNFT() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: BuyNFTParams = {
    listingId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    value: '1.5', // Total price in ETH
  };

  const { tx } = await sdk.exchange.buyNFT(params);

  console.log('NFT purchased successfully!');
  console.log('Transaction:', tx.hash);

  return { tx };
}

// ============================================================================
// COMPLETE BUYING WORKFLOW
// ============================================================================

/**
 * Complete buying workflow with verification
 */
export async function completeBuyingWorkflow() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const listingId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  // Step 1: Get listing details
  console.log('Step 1: Fetching listing details...');
  const listing = await sdk.exchange.getListing(listingId);

  console.log('Collection:', listing.collectionAddress);
  console.log('Token ID:', listing.tokenId);
  console.log('Price:', listing.price, 'ETH');
  console.log('Seller:', listing.seller);

  // Step 2: Check if listing is active
  console.log('\nStep 2: Checking listing status...');
  const now = Math.floor(Date.now() / 1000);

  if (listing.status !== 'active') {
    throw new Error(`Listing is not active (status: ${listing.status})`);
  }

  if (listing.endTime < now) {
    throw new Error('Listing has expired');
  }

  console.log('✓ Listing is active');

  // Step 3: Calculate total price (including fees)
  console.log('\nStep 3: Calculating total price...');
  const totalPrice = await sdk.exchange.getBuyerPrice(listingId);

  console.log('Base price:', listing.price, 'ETH');
  console.log('Total price:', totalPrice, 'ETH');
  console.log('(Includes royalty + marketplace fee)');

  // Step 4: Check buyer's balance
  console.log('\nStep 4: Checking buyer balance...');
  const buyerAddress = await sdk.getSignerAddress();
  const balance = await sdk.getBalance(buyerAddress);

  const balanceInEth = Number(balance);
  const totalPriceInEth = Number(totalPrice);

  if (balanceInEth < totalPriceInEth) {
    throw new Error(`Insufficient balance. Have ${balanceInEth} ETH, need ${totalPriceInEth} ETH`);
  }

  console.log('✓ Sufficient balance:', balanceInEth.toFixed(4), 'ETH');

  // Step 5: Execute purchase
  console.log('\nStep 5: Purchasing NFT...');
  const { tx } = await sdk.exchange.buyNFT({
    listingId,
    value: totalPrice,
  });

  console.log('✓ Purchase initiated');
  console.log('Transaction:', tx.hash);

  // Step 6: Wait for confirmation
  console.log('\nStep 6: Waiting for confirmation...');
  await tx.wait();

  console.log('✓ Purchase confirmed!');

  // Step 7: Verify ownership
  console.log('\nStep 7: Verifying ownership...');
  const ownedTokens = await sdk.collection.getUserOwnedTokens(
    listing.collectionAddress,
    buyerAddress
  );

  const ownsToken = ownedTokens.some((t) => t.tokenId === listing.tokenId);

  if (ownsToken) {
    console.log('✓ NFT ownership confirmed');
    console.log(`You now own token #${listing.tokenId}`);
  } else {
    console.log('⚠ Ownership verification pending (may need to wait longer)');
  }

  return { tx, listing, totalPrice };
}

// ============================================================================
// BUY WITH PROGRESS TRACKING
// ============================================================================

/**
 * Buy NFT with progress callbacks
 */
export async function buyWithProgress(
  listingId: string,
  onProgress?: (step: string, status: string) => void
) {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  try {
    onProgress?.('validation', 'Fetching listing details...');
    const listing = await sdk.exchange.getListing(listingId);

    onProgress?.('validation', 'Checking listing status...');
    if (listing.status !== 'active') {
      throw new Error(`Listing is not active`);
    }

    onProgress?.('pricing', 'Calculating total price...');
    const totalPrice = await sdk.exchange.getBuyerPrice(listingId);

    onProgress?.('balance', 'Checking wallet balance...');
    const buyerAddress = await sdk.getSignerAddress();
    const balance = await sdk.getBalance(buyerAddress);

    if (Number(balance) < Number(totalPrice)) {
      throw new Error(`Insufficient balance. Need ${totalPrice} ETH`);
    }

    onProgress?.('purchase', 'Executing purchase...');
    const { tx } = await sdk.exchange.buyNFT({
      listingId,
      value: totalPrice,
    });

    onProgress?.('confirming', 'Waiting for confirmation...');
    await tx.wait();

    onProgress?.('success', `NFT purchased successfully!`);
    return { tx, listing, totalPrice };

  } catch (error: any) {
    onProgress?.('error', error.message);
    throw error;
  }
}

// ============================================================================
// GET BUYER PRICE
// ============================================================================

/**
 * Calculate total price buyer needs to pay
 */
export async function getBuyerPrice() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const listingId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  const listing = await sdk.exchange.getListing(listingId);
  const totalPrice = await sdk.exchange.getBuyerPrice(listingId);

  const basePrice = Number(listing.price);
  const total = Number(totalPrice);
  const fees = total - basePrice;
  const feePercentage = ((fees / basePrice) * 100).toFixed(2);

  console.log('=== Price Breakdown ===');
  console.log('Base Price:', listing.price, 'ETH');
  console.log('Fees:', fees.toFixed(4), 'ETH');
  console.log(`Fee Rate: ${feePercentage}%`);
  console.log('Total Price:', totalPrice, 'ETH');

  return { basePrice, fees, totalPrice, listing };
}

// ============================================================================
// PURCHASE WITH ERROR HANDLING
// ============================================================================

/**
 * Buy NFT with comprehensive error handling
 */
export async function buyWithErrorHandling() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const listingId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  try {
    const listing = await sdk.exchange.getListing(listingId);

    // Check listing status
    if (listing.status !== 'active') {
      throw new Error(`Listing is ${listing.status}. Cannot purchase.`);
    }

    // Check if expired
    const now = Math.floor(Date.now() / 1000);
    if (listing.endTime < now) {
      throw new Error('Listing has expired');
    }

    // Check if buying own listing
    const buyerAddress = await sdk.getSignerAddress();
    if (listing.seller.toLowerCase() === buyerAddress.toLowerCase()) {
      throw new Error('Cannot buy your own listing');
    }

    // Calculate and check price
    const totalPrice = await sdk.exchange.getBuyerPrice(listingId);
    const balance = await sdk.getBalance(buyerAddress);

    if (Number(balance) < Number(totalPrice)) {
      throw new Error(`Insufficient balance. Need ${totalPrice} ETH`);
    }

    // Execute purchase
    const { tx } = await sdk.exchange.buyNFT({
      listingId,
      value: totalPrice,
    });

    console.log('Purchase successful:', tx.hash);
    return { tx };

  } catch (error: any) {
    // Handle specific errors
    if (error.message.includes('Insufficient balance')) {
      console.error('Error: Insufficient funds for purchase');
    } else if (error.message.includes('expired')) {
      console.error('Error: Listing has expired');
    } else if (error.message.includes('not active')) {
      console.error('Error: Listing is no longer available');
    } else if (error.message.includes('own listing')) {
      console.error('Error: Cannot purchase your own NFT');
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// ============================================================================
// ESTIMATE PURCHASE COST
// ============================================================================

/**
 * Estimate total cost including gas for purchase
 */
export async function estimatePurchaseCost() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const listingId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  // Get listing and price
  const listing = await sdk.exchange.getListing(listingId);
  const totalPrice = await sdk.exchange.getBuyerPrice(listingId);

  // Note: Gas estimation would require additional provider calls
  // This is a simplified example
  const estimatedGasPrice = 0.0001; // Example gas price in ETH
  const estimatedGasUnits = 150000; // Example gas units for buy

  const gasCost = estimatedGasPrice * estimatedGasUnits;
  const totalCost = Number(totalPrice) + gasCost;

  console.log('=== Purchase Cost Estimate ===');
  console.log('NFT Price:', totalPrice, 'ETH');
  console.log('Estimated Gas:', gasCost.toFixed(4), 'ETH');
  console.log('Total Cost:', totalCost.toFixed(4), 'ETH');

  return { nftPrice: totalPrice, gasCost, totalCost };
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all buying flow examples
 */
export async function runBuyingFlowExamples() {
  console.log('=== Basic NFT Purchase ===');
  // Uncomment to test: await buySingleNFT();

  console.log('\n=== Get Buyer Price ===');
  // Uncomment to test: await getBuyerPrice();

  console.log('\n=== Estimate Purchase Cost ===');
  // Uncomment to test: await estimatePurchaseCost();

  console.log('\n=== Buy with Error Handling ===');
  // Uncomment to test: await buyWithErrorHandling();
}

// Run if executed directly
if (require.main === module) {
  runBuyingFlowExamples().catch(console.error);
}
