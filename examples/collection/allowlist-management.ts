/**
 * Allowlist Management Examples
 *
 * This file demonstrates allowlist CRUD operations for NFT collections
 *
 * @module examples/collection/allowlist-management
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';

// ============================================================================
// ADD ADDRESSES TO ALLOWLIST
// ============================================================================

/**
 * Add addresses to collection allowlist
 */
export async function addToAllowlist() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...'; // Your collection address
  const addressesToAdd = [
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    '0x1234567890abcdef1234567890abcdef12345678',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  ];

  const { tx } = await sdk.collection.addToAllowlist(
    collectionAddress,
    addressesToAdd
  );

  console.log('Added', addressesToAdd.length, 'addresses to allowlist');
  console.log('Transaction:', tx.hash);

  return { tx, count: addressesToAdd.length };
}

// ============================================================================
// REMOVE ADDRESSES FROM ALLOWLIST
// ============================================================================

/**
 * Remove addresses from collection allowlist
 */
export async function removeFromAllowlist() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...'; // Your collection address
  const addressesToRemove = [
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    '0x1234567890abcdef1234567890abcdef12345678',
  ];

  const { tx } = await sdk.collection.removeFromAllowlist(
    collectionAddress,
    addressesToRemove
  );

  console.log('Removed', addressesToRemove.length, 'addresses from allowlist');
  console.log('Transaction:', tx.hash);

  return { tx, count: addressesToRemove.length };
}

// ============================================================================
// ENABLE ALLOWLIST-ONLY MODE
// ============================================================================

/**
 * Enable allowlist-only minting mode
 */
export async function enableAllowlistOnly() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...'; // Your collection address

  const { tx } = await sdk.collection.setAllowlistOnly(
    collectionAddress,
    true // Enable allowlist-only mode
  );

  console.log('Allowlist-only mode enabled');
  console.log('Transaction:', tx.hash);

  return { tx };
}

// ============================================================================
// DISABLE ALLOWLIST-ONLY MODE (PUBLIC MINTING)
// ============================================================================

/**
 * Disable allowlist-only mode (enable public minting)
 */
export async function disableAllowlistOnly() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...'; // Your collection address

  const { tx } = await sdk.collection.setAllowlistOnly(
    collectionAddress,
    false // Disable allowlist-only mode (public mint)
  );

  console.log('Public minting enabled');
  console.log('Transaction:', tx.hash);

  return { tx };
}

// ============================================================================
// CHECK IF ADDRESS IS ON ALLOWLIST
// ============================================================================

/**
 * Check if an address is on the allowlist
 */
export async function checkAllowlistStatus() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const addressToCheck = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';

  const isAllowed = await sdk.collection.isInAllowlist(
    collectionAddress,
    addressToCheck
  );

  if (isAllowed) {
    console.log('Address is on the allowlist');
  } else {
    console.log('Address is NOT on the allowlist');
  }

  return { isAllowed };
}

// ============================================================================
// CHECK IF COLLECTION IS IN ALLOWLIST-ONLY MODE
// ============================================================================

/**
 * Check if collection is in allowlist-only mode
 */
export async function checkAllowlistOnlyMode() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  const isAllowlistOnly = await sdk.collection.isAllowlistOnly(collectionAddress);

  if (isAllowlistOnly) {
    console.log('Collection is in allowlist-only mode');
    console.log('Only allowlisted addresses can mint');
  } else {
    console.log('Collection is in public minting mode');
    console.log('Anyone can mint');
  }

  return { isAllowlistOnly };
}

// ============================================================================
// SETUP ALLOWLIST (COMBINE ADD + ENABLE)
// ============================================================================

/**
 * Setup allowlist in a single transaction
 * Combines adding addresses + enabling allowlist-only mode
 */
export async function setupAllowlist() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const allowlistAddresses = [
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    '0x1234567890abcdef1234567890abcdef12345678',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    // ... up to 100 addresses
  ];

  // Setup allowlist and enable allowlist-only mode in one transaction
  const { tx } = await sdk.collection.setupAllowlist(
    collectionAddress,
    allowlistAddresses,
    true // Enable allowlist-only mode
  );

  console.log('Allowlist setup complete!');
  console.log('Added', allowlistAddresses.length, 'addresses');
  console.log('Allowlist-only mode enabled');
  console.log('Transaction:', tx.hash);

  return { tx, count: allowlistAddresses.length };
}

// ============================================================================
// BATCH ALLOWLIST MANAGEMENT
// ============================================================================

/**
 * Manage allowlist in batches (for large lists)
 */
export async function batchAllowlistManagement() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  // Large list of addresses (example: from a CSV file or database)
  const allAddresses = [
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    '0x1234567890abcdef1234567890abcdef12345678',
    // ... 200+ addresses
  ];

  const batchSize = 100; // Max 100 addresses per transaction
  const results = [];

  // Process in batches
  for (let i = 0; i < allAddresses.length; i += batchSize) {
    const batch = allAddresses.slice(i, i + batchSize);

    try {
      const { tx } = await sdk.collection.addToAllowlist(
        collectionAddress,
        batch
      );

      results.push({ batch: i / batchSize + 1, tx, success: true });
      console.log(`Batch ${i / batchSize + 1}: Added ${batch.length} addresses`);

      // Wait between batches
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      results.push({ batch: i / batchSize + 1, error: error.message, success: false });
      console.error(`Batch ${i / batchSize + 1}: Failed -`, error.message);
    }
  }

  return results;
}

// ============================================================================
// MINTING STAGE SETUP
// ============================================================================

/**
 * Setup collection with allowlist stage then public stage
 */
export async function setupMintingStages() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  // Allowlist addresses
  const allowlistAddresses = [
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    '0x1234567890abcdef1234567890abcdef12345678',
  ];

  // Step 1: Setup allowlist and enable allowlist-only mode
  console.log('Step 1: Setting up allowlist...');
  const { tx: setupTx } = await sdk.collection.setupAllowlist(
    collectionAddress,
    allowlistAddresses,
    true // Enable allowlist-only mode
  );

  console.log('Allowlist setup complete');
  console.log('Transaction:', setupTx.hash);

  // Note: To transition to public minting later:
  // await sdk.collection.setAllowlistOnly(collectionAddress, false);

  return { setupTx };
}

// ============================================================================
// VERIFY ALLOWLIST BEFORE MINT
// ============================================================================

/**
 * Verify allowlist status before attempting to mint
 */
export async function verifyAllowlistBeforeMint() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const userAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';

  // Check if collection is in allowlist-only mode
  const isAllowlistOnly = await sdk.collection.isAllowlistOnly(collectionAddress);

  if (isAllowlistOnly) {
    console.log('Collection is in allowlist-only mode');

    // Check if user is on allowlist
    const isAllowed = await sdk.collection.isInAllowlist(
      collectionAddress,
      userAddress
    );

    if (!isAllowed) {
      throw new Error('User is not on the allowlist');
    }

    console.log('User is on the allowlist - can mint');
  } else {
    console.log('Public minting is enabled - anyone can mint');
  }

  // Proceed with minting
  console.log('User can mint from this collection');
  return { canMint: true };
}

// ============================================================================
// IMPORT ALLOWLIST FROM CSV/FILE
// ============================================================================

/**
 * Example: Import allowlist from an array (simulating CSV import)
 */
export async function importAllowlistFromFile() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';

  // Simulated CSV data (in production, read from actual file)
  const csvData = [
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0,alice',
    '0x1234567890abcdef1234567890abcdef12345678,bob',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd,charlie',
  ];

  // Parse addresses from CSV data
  const addresses = csvData.map((line) => line.split(',')[0]);

  // Add to allowlist
  const { tx } = await sdk.collection.addToAllowlist(
    collectionAddress,
    addresses
  );

  console.log('Imported', addresses.length, 'addresses from CSV');
  console.log('Transaction:', tx.hash);

  return { tx, count: addresses.length };
}

// ============================================================================
// MERKLIZED ALLOWLIST (ADVANCED)
// ============================================================================

/**
 * Note: For large allowlists (1000+ addresses), consider using Merkle trees
 * for gas-efficient verification. This is an advanced pattern.
 *
 * The SDK currently supports direct allowlist management.
 * For Merkle tree allowlists, you would need to implement:
 * 1. Generate Merkle tree from allowlist addresses
 * 2. Store root hash in collection contract
 * 3. Users provide Merkle proof when minting
 *
 * This pattern is not yet implemented in the core SDK but can be added.
 */

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all allowlist management examples
 */
export async function runAllowlistExamples() {
  console.log('=== Add to Allowlist ===');
  // Uncomment to test: await addToAllowlist();

  console.log('\n=== Remove from Allowlist ===');
  // Uncomment to test: await removeFromAllowlist();

  console.log('\n=== Enable Allowlist-Only Mode ===');
  // Uncomment to test: await enableAllowlistOnly();

  console.log('\n=== Check Allowlist Status ===');
  // Uncomment to test: await checkAllowlistStatus();

  console.log('\n=== Setup Allowlist (Combined) ===');
  // Uncomment to test: await setupAllowlist();
}

// Run if executed directly
if (require.main === module) {
  runAllowlistExamples().catch(console.error);
}
