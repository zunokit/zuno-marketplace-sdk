/**
 * Collection Info Query Examples
 *
 * This file demonstrates how to query collection information and metadata
 *
 * @module examples/collection/collection-info
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';

// ============================================================================
// GET BASIC COLLECTION INFO
// ============================================================================

/**
 * Get basic information about a collection
 */
export async function getCollectionInfo() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...'; // Your collection address

  const info = await sdk.collection.getCollectionInfo(collectionAddress);

  console.log('=== Collection Info ===');
  console.log('Name:', info.name);
  console.log('Symbol:', info.symbol);
  console.log('Token Type:', info.tokenType);
  console.log('Description:', info.description);
  console.log('Owner:', info.owner);

  return info;
}

// ============================================================================
// VERIFY COLLECTION
// ============================================================================

/**
 * Verify if a contract is a valid Zuno collection
 */
export async function verifyCollection() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  const verification = await sdk.collection.verifyCollection(collectionAddress);

  if (verification.isValid) {
    console.log('✓ Valid Zuno collection');
    console.log('Token Type:', verification.tokenType);
  } else {
    console.log('✗ Not a valid Zuno collection');
    console.log('Token Type:', verification.tokenType);
  }

  return verification;
}

// ============================================================================
// GET MINTING INFORMATION
// ============================================================================

/**
 * Get all minting-related information for a collection
 */
export async function getMintingInfo() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  const info = await sdk.collection.getCollectionInfo(collectionAddress);

  console.log('=== Minting Information ===');
  console.log('Max Supply:', info.maxSupply);
  console.log('Total Minted:', info.totalSupply);
  console.log('Remaining:', Number(info.maxSupply) - Number(info.info.totalSupply));
  console.log('\nPricing:');
  console.log('- Mint Price:', info.mintPrice, 'ETH');
  console.log('- Allowlist Price:', info.allowlistMintPrice || info.mintPrice, 'ETH');
  console.log('- Public Price:', info.publicMintPrice || info.mintPrice, 'ETH');
  console.log('\nLimits:');
  console.log('- Per Wallet:', info.mintLimitPerWallet);
  console.log('\nRoyalty:', info.royaltyFee / 100, '%');

  return info;
}

// ============================================================================
// GET COLLECTION SUPPLY STATUS
// ============================================================================

/**
 * Get detailed supply status for a collection
 */
export async function getSupplyStatus() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  const info = await sdk.collection.getCollectionInfo(collectionAddress);

  const maxSupply = Number(info.maxSupply);
  const totalMinted = Number(info.totalSupply);
  const remaining = maxSupply - totalMinted;
  const percentage = ((totalMinted / maxSupply) * 100).toFixed(2);

  console.log('=== Supply Status ===');
  console.log(`${totalMinted} / ${maxSupply} minted (${percentage}%)`);
  console.log(`${remaining} NFTs remaining`);

  // Visual progress bar
  const barLength = 40;
  const filled = Math.floor((totalMinted / maxSupply) * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
  console.log(`[${bar}]`);

  return { maxSupply, totalMinted, remaining, percentage };
}

// ============================================================================
// CHECK ALLOWLIST STATUS
// ============================================================================

/**
 * Check allowlist status for a collection
 */
export async function checkAllowlistStatus() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const userAddress = '0x...';

  // Check if collection is in allowlist-only mode
  const isAllowlistOnly = await sdk.collection.isAllowlistOnly(collectionAddress);

  console.log('=== Allowlist Status ===');
  console.log('Allowlist Mode:', isAllowlistOnly ? 'ENABLED' : 'DISABLED');

  if (isAllowlistOnly) {
    // Check if specific user is on allowlist
    const isAllowed = await sdk.collection.isInAllowlist(
      collectionAddress,
      userAddress
    );

    console.log(`User ${userAddress}:`, isAllowed ? 'ALLOWLISTED ✓' : 'NOT ON ALLOWLIST ✗');
  } else {
    console.log('Public minting is enabled');
  }

  return { isAllowlistOnly };
}

// ============================================================================
// GET USER'S COLLECTION TOKENS
// ============================================================================

/**
 * Get all tokens a user owns from a specific collection
 */
export async function getUserTokens() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const userAddress = '0x...';

  const tokens = await sdk.collection.getUserOwnedTokens(
    collectionAddress,
    userAddress
  );

  console.log(`=== ${tokens.length} Tokens Owned ===`);
  for (const token of tokens) {
    console.log(`Token #${token.tokenId} (Amount: ${token.amount})`);
  }

  return tokens;
}

// ============================================================================
// GET ALL CREATED COLLECTIONS
// ============================================================================

/**
 * Get all collections created by a specific address
 */
export async function getCreatedCollections() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const creatorAddress = '0x...';

  const collections = await sdk.collection.getCreatedCollections({
    creator: creatorAddress,
  });

  console.log(`=== ${collections.length} Collections by ${creatorAddress} ===`);

  for (const collection of collections) {
    console.log(`\n[${collection.type}] ${collection.address}`);
    console.log(`  Created at block: ${collection.blockNumber}`);
    console.log(`  TX: ${collection.transactionHash}`);
  }

  return collections;
}

// ============================================================================
// COMPARE COLLECTIONS
// ============================================================================

/**
 * Compare information between multiple collections
 */
export async function compareCollections() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddresses = [
    '0x...', // Collection A
    '0x...', // Collection B
    '0x...', // Collection C
  ];

  console.log('=== Collection Comparison ===');

  const comparisons = [];

  for (const address of collectionAddresses) {
    try {
      const info = await sdk.collection.getCollectionInfo(address);

      comparisons.push({
        address,
        name: info.name,
        symbol: info.symbol,
        totalMinted: info.totalSupply,
        maxSupply: info.maxSupply,
        mintPrice: info.mintPrice,
      });
    } catch (error) {
      console.error(`Failed to fetch info for ${address}:`, error);
    }
  }

  // Display comparison table
  console.log('\n| Name | Symbol | Minted | Max Supply | Price |');
  console.log('|------|--------|--------|------------|------|');

  for (const col of comparisons) {
    console.log(
      `| ${col.name} | ${col.symbol} | ${col.totalMinted} | ${col.maxSupply} | ${col.mintPrice} |`
    );
  }

  return comparisons;
}

// ============================================================================
// COLLECTION SUMMARY
// ============================================================================

/**
 * Get a complete summary of a collection
 */
export async function getCollectionSummary() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  // Get all collection data
  const [info, verification] = await Promise.all([
    sdk.collection.getCollectionInfo(collectionAddress),
    sdk.collection.verifyCollection(collectionAddress),
  ]);

  const summary = {
    // Basic info
    address: collectionAddress,
    name: info.name,
    symbol: info.symbol,
    type: info.tokenType,

    // Validation
    isValid: verification.isValid,

    // Supply
    maxSupply: info.maxSupply,
    totalMinted: info.totalSupply,
    remaining: Number(info.maxSupply) - Number(info.totalSupply),

    // Pricing
    mintPrice: info.mintPrice,
    royaltyFee: info.royaltyFee,

    // Limits
    mintLimitPerWallet: info.mintLimitPerWallet,

    // Ownership
    owner: info.owner,

    // Description
    description: info.description,
  };

  console.log('\n=== Collection Summary ===');
  console.log(JSON.stringify(summary, null, 2));

  return summary;
}

// ============================================================================
// QUERY MULTIPLE COLLECTIONS IN PARALLEL
// ============================================================================

/**
 * Query multiple collections efficiently in parallel
 */
export async function queryMultipleCollections() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddresses = [
    '0x...',
    '0x...',
    '0x...',
  ];

  // Query all collections in parallel
  const results = await Promise.allSettled(
    collectionAddresses.map((address) =>
      sdk.collection.getCollectionInfo(address)
    )
  );

  console.log('=== Query Results ===');

  const successful = [];
  const failed = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push({
        address: collectionAddresses[index],
        name: result.value.name,
        totalMinted: result.value.totalSupply,
      });
    } else {
      failed.push({
        address: collectionAddresses[index],
        error: result.reason.message,
      });
    }
  });

  console.log(`\nSuccessful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  return { successful, failed };
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all collection info examples
 */
export async function runCollectionInfoExamples() {
  console.log('=== Get Collection Info ===');
  // Uncomment to test: await getCollectionInfo();

  console.log('\n=== Verify Collection ===');
  // Uncomment to test: await verifyCollection();

  console.log('\n=== Get Supply Status ===');
  // Uncomment to test: await getSupplyStatus();

  console.log('\n=== Collection Summary ===');
  // Uncomment to test: await getCollectionSummary();
}

// Run if executed directly
if (require.main === module) {
  runCollectionInfoExamples().catch(console.error);
}
