/**
 * Owner Operations Examples
 *
 * This file demonstrates collection owner operations like owner mint and analytics
 *
 * @module examples/collection/owner-operations
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';

// ============================================================================
// OWNER MINT (BYPASS RESTRICTIONS)
// ============================================================================

/**
 * Mint NFTs as collection owner (bypasses payment, limits, timing)
 */
export async function ownerMint() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...'; // Your collection address
  const recipient = '0x...'; // Recipient address

  // Mint 5 NFTs as owner
  const { tx } = await sdk.collection.ownerMint(
    collectionAddress,
    recipient,
    5 // Amount to mint
  );

  console.log('Owner minted 5 NFTs');
  console.log('Transaction:', tx.hash);

  return { tx, amount: 5 };
}

// ============================================================================
// OWNER MINT FOR TEAM/REWARDS
// ============================================================================

/**
 * Use owner mint for team allocations or rewards
 */
export async function ownerMintForRewards() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  // Team members to receive NFTs
  const teamAllocations = [
    { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', amount: 10 },
    { address: '0x1234567890abcdef1234567890abcdef12345678', amount: 5 },
    { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: 15 },
  ];

  const results = [];

  for (const allocation of teamAllocations) {
    try {
      const { tx } = await sdk.collection.ownerMint(
        collectionAddress,
        allocation.address,
        allocation.amount
      );

      results.push({
        address: allocation.address,
        amount: allocation.amount,
        tx,
        success: true,
      });

      console.log(`Minted ${allocation.amount} NFTs to ${allocation.address}`);

      // Wait between transactions
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      results.push({
        address: allocation.address,
        amount: allocation.amount,
        error: error.message,
        success: false,
      });
      console.error(`Failed to mint to ${allocation.address}:`, error.message);
    }
  }

  return results;
}

// ============================================================================
// GET COLLECTION ANALYTICS
// ============================================================================

/**
 * Get comprehensive analytics for a collection
 */
export async function getCollectionAnalytics() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  // Get collection info
  const collectionInfo = await sdk.collection.getCollectionInfo(collectionAddress);

  console.log('=== Collection Analytics ===');
  console.log('Name:', collectionInfo.name);
  console.log('Symbol:', collectionInfo.symbol);
  console.log('Token Type:', collectionInfo.tokenType);

  console.log('\n=== Supply Info ===');
  console.log('Max Supply:', collectionInfo.maxSupply);
  console.log('Total Minted:', collectionInfo.totalSupply);
  console.log('Remaining:', Number(collectionInfo.maxSupply) - Number(collectionInfo.totalSupply));
  console.log('Mint Progress:', `${((Number(collectionInfo.totalSupply) / Number(collectionInfo.maxSupply)) * 100).toFixed(2)}%`);

  console.log('\n=== Pricing Info ===');
  console.log('Mint Price:', collectionInfo.mintPrice, 'ETH');
  console.log('Royalty Fee:', collectionInfo.royaltyFee / 100, '%');
  console.log('Mint Limit Per Wallet:', collectionInfo.mintLimitPerWallet);

  console.log('\n=== Ownership Info ===');
  console.log('Owner:', collectionInfo.owner);
  console.log('Description:', collectionInfo.description);

  return collectionInfo;
}

// ============================================================================
// GET USER TOKENS (MINTED)
// ============================================================================

/**
 * Get tokens minted by a specific user
 */
export async function getUserMintedTokens() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const userAddress = '0x...';

  // Get tokens currently owned by user
  const ownedTokens = await sdk.collection.getUserOwnedTokens(
    collectionAddress,
    userAddress
  );

  console.log(`User ${userAddress} owns ${ownedTokens.length} NFTs:`);

  for (const token of ownedTokens) {
    console.log(`- Token #${token.tokenId} (Amount: ${token.amount})`);
  }

  return { ownedTokens, count: ownedTokens.length };
}

// ============================================================================
// GET CREATED COLLECTIONS
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

  // Get all collections created by this address
  const collections = await sdk.collection.getCreatedCollections({
    creator: creatorAddress,
  });

  console.log(`Found ${collections.length} collections created by ${creatorAddress}:`);

  for (const collection of collections) {
    console.log(`\n- ${collection.type} Collection`);
    console.log(`  Address: ${collection.address}`);
    console.log(`  Block: ${collection.blockNumber}`);
    console.log(`  TX: ${collection.transactionHash}`);
  }

  return collections;
}

// ============================================================================
// VERIFY COLLECTION OWNERSHIP
// ============================================================================

/**
 * Verify if an address is the collection owner
 */
export async function verifyCollectionOwnership() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const suspectedOwner = '0x...';

  const collectionInfo = await sdk.collection.getCollectionInfo(collectionAddress);

  const isOwner = collectionInfo.owner.toLowerCase() === suspectedOwner.toLowerCase();

  if (isOwner) {
    console.log('✓ Address is the collection owner');
  } else {
    console.log('✗ Address is NOT the collection owner');
    console.log('  Actual owner:', collectionInfo.owner);
  }

  return { isOwner, actualOwner: collectionInfo.owner };
}

// ============================================================================
// COLLECTION SUPPLY CHECK
// ============================================================================

/**
 * Check if collection has remaining supply for minting
 */
export async function checkSupplyRemaining() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const amountToMint = 5;

  const collectionInfo = await sdk.collection.getCollectionInfo(collectionAddress);

  const maxSupply = Number(collectionInfo.maxSupply);
  const totalMinted = Number(collectionInfo.totalSupply);
  const remaining = maxSupply - totalMinted;

  console.log('=== Supply Check ===');
  console.log('Max Supply:', maxSupply);
  console.log('Total Minted:', totalMinted);
  console.log('Remaining:', remaining);
  console.log('Requested:', amountToMint);

  if (remaining >= amountToMint) {
    console.log('✓ Sufficient supply available');
    return { canMint: true, remaining };
  } else {
    console.log('✗ Insufficient supply');
    console.log(`  Only ${remaining} NFTs remaining, but ${amountToMint} requested`);
    return { canMint: false, remaining };
  }
}

// ============================================================================
// MINTING STATUS DASHBOARD
// ============================================================================

/**
 * Get a complete minting status dashboard for a collection
 */
export async function getMintingDashboard() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const userAddress = '0x...';

  // Get all relevant data
  const [collectionInfo, userTokens] = await Promise.all([
    sdk.collection.getCollectionInfo(collectionAddress),
    sdk.collection.getUserOwnedTokens(collectionAddress, userAddress),
  ]);

  // Check allowlist status
  const isAllowlistOnly = await sdk.collection.isAllowlistOnly(collectionAddress);
  const isUserOnAllowlist = isAllowlistOnly
    ? await sdk.collection.isInAllowlist(collectionAddress, userAddress)
    : null;

  // Build dashboard
  const dashboard = {
    collection: {
      name: collectionInfo.name,
      address: collectionAddress,
      type: collectionInfo.tokenType,
    },

    supply: {
      max: Number(collectionInfo.maxSupply),
      minted: Number(collectionInfo.totalSupply),
      remaining: Number(collectionInfo.maxSupply) - Number(collectionInfo.totalSupply),
      progress: (Number(collectionInfo.totalSupply) / Number(collectionInfo.maxSupply)) * 100,
    },

    pricing: {
      mintPrice: collectionInfo.mintPrice,
      royaltyFee: collectionInfo.royaltyFee,
      limitPerWallet: collectionInfo.mintLimitPerWallet,
    },

    restrictions: {
      allowlistOnly: isAllowlistOnly,
      userOnAllowlist: isUserOnAllowlist,
      userCanMint: isAllowlistOnly ? isUserOnAllowlist : true,
    },

    user: {
      address: userAddress,
      tokensOwned: userTokens.length,
      canMintMore: collectionInfo.mintLimitPerWallet > userTokens.length,
      remainingAllowance: Math.max(0, collectionInfo.mintLimitPerWallet - userTokens.length),
    },
  };

  // Display dashboard
  console.log('\n=== Minting Dashboard ===');
  console.log(`Collection: ${dashboard.collection.name} (${dashboard.collection.type})`);
  console.log(`\nSupply: ${dashboard.supply.minted}/${dashboard.supply.max} (${dashboard.supply.progress.toFixed(2)}%)`);
  console.log(`Remaining: ${dashboard.supply.remaining}`);

  console.log(`\nPricing: ${dashboard.pricing.mintPrice} ETH`);
  console.log(`Wallet Limit: ${dashboard.pricing.limitPerWallet} NFTs`);

  console.log(`\nRestrictions: ${dashboard.restrictions.allowlistOnly ? 'Allowlist Only' : 'Public Minting'}`);
  if (isAllowlistOnly) {
    console.log(`User Allowlisted: ${dashboard.restrictions.userOnAllowlist ? 'Yes' : 'No'}`);
  }

  console.log(`\nUser Stats: ${dashboard.user.tokensOwned}/${dashboard.pricing.limitPerWallet} owned`);
  console.log(`Can mint more: ${dashboard.user.canMintMore ? 'Yes' : 'No'}`);

  return dashboard;
}

// ============================================================================
// OWNER MINT FOR RESERVE
// ============================================================================

/**
 * Owner mint NFTs for reserve/marketing purposes
 */
export async function ownerMintReserve() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const reserveWallet = '0x...'; // Treasury/marketing wallet

  // Check supply first
  const collectionInfo = await sdk.collection.getCollectionInfo(collectionAddress);
  const remaining = Number(collectionInfo.maxSupply) - Number(collectionInfo.totalSupply);

  const reserveAmount = Math.min(100, remaining); // Reserve up to 100 or whatever remains

  console.log(`Minting ${reserveAmount} NFTs to reserve wallet...`);

  const { tx } = await sdk.collection.ownerMint(
    collectionAddress,
    reserveWallet,
    reserveAmount
  );

  console.log('Reserve minted successfully');
  console.log('Transaction:', tx.hash);

  return { tx, amount: reserveAmount };
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all owner operation examples
 */
export async function runOwnerOperationExamples() {
  console.log('=== Collection Analytics ===');
  // Uncomment to test: await getCollectionAnalytics();

  console.log('\n=== Minting Dashboard ===');
  // Uncomment to test: await getMintingDashboard();

  console.log('\n=== User Minted Tokens ===');
  // Uncomment to test: await getUserMintedTokens();

  console.log('\n=== Created Collections ===');
  // Uncomment to test: await getCreatedCollections();
}

// Run if executed directly
if (require.main === module) {
  runOwnerOperationExamples().catch(console.error);
}
