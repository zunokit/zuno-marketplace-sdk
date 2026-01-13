/**
 * Collection Creation Examples
 *
 * This file demonstrates how to create NFT collections using the Zuno Marketplace SDK
 *
 * @module examples/collection/create-collection
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';
import type { CreateERC721CollectionParams, CreateERC1155CollectionParams } from 'zuno-marketplace-sdk';

// ============================================================================
// BASIC ERC721 COLLECTION CREATION
// ============================================================================

/**
 * Create a basic ERC721 NFT collection
 */
export async function createBasicERC721Collection() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: CreateERC721CollectionParams = {
    name: 'My NFT Collection',
    symbol: 'MNC',
    maxSupply: 10000,
    mintPrice: '0.1',
    royaltyFee: 500, // 5% in basis points
    tokenURI: 'ipfs://QmExample...',
  };

  const { address, tx } = await sdk.collection.createERC721Collection(params);

  console.log('ERC721 Collection created:', address);
  console.log('Transaction hash:', tx.hash);

  return { address, tx };
}

// ============================================================================
// FULLY CONFIGURED ERC721 COLLECTION
// ============================================================================

/**
 * Create an ERC721 collection with all configuration options
 */
export async function createFullConfigERC721Collection() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: CreateERC721CollectionParams = {
    // Basic info
    name: 'Premium NFT Collection',
    symbol: 'PRM',
    description: 'A premium collection of unique digital assets',

    // Supply and pricing
    maxSupply: 5000,
    mintPrice: '0.05',

    // Royalty (5% = 500 basis points)
    royaltyFee: 500,

    // Metadata
    tokenURI: 'ipfs://QmPremiumCollection...',

    // Minting limits
    mintLimitPerWallet: 5,

    // Minting schedule (start 1 hour from now)
    mintStartTime: Math.floor(Date.now() / 1000) + 3600,

    // Optional: Custom owner (defaults to signer)
    owner: '0x...', // Leave undefined to use signer address
  };

  const { address, tx } = await sdk.collection.createERC721Collection(params);

  console.log('Premium ERC721 Collection created:', address);
  console.log('Transaction:', tx.hash);

  return { address, tx };
}

// ============================================================================
// ALLOWLIST-STAGE ERC721 COLLECTION
// ============================================================================

/**
 * Create an ERC721 collection with allowlist stage pricing
 */
export async function createAllowlistERC721Collection() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: CreateERC721CollectionParams = {
    name: 'Allowlist NFT Collection',
    symbol: 'ALC',

    // Maximum supply
    maxSupply: 10000,

    // Different pricing for different stages
    mintPrice: '0.1', // Default/public price
    allowlistMintPrice: '0.05', // Cheaper price for allowlist
    publicMintPrice: '0.15', // Higher price for public mint

    // Allowlist stage duration (24 hours)
    allowlistStageDuration: 86400,

    // Minting schedule
    mintStartTime: Math.floor(Date.now() / 1000) + 3600,

    // Limits
    mintLimitPerWallet: 3,

    // Other settings
    royaltyFee: 750, // 7.5%
    tokenURI: 'ipfs://QmAllowlist...',
  };

  const { address, tx } = await sdk.collection.createERC721Collection(params);

  console.log('Allowlist ERC721 Collection created:', address);
  console.log('Transaction:', tx.hash);

  return { address, tx };
}

// ============================================================================
// FREE MINT ERC721 COLLECTION
// ============================================================================

/**
 * Create an ERC721 collection with free minting
 */
export async function createFreeMintERC721Collection() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: CreateERC721CollectionParams = {
    name: 'Free Mint Collection',
    symbol: 'FREE',

    maxSupply: 10000,
    mintPrice: '0', // Free mint
    royaltyFee: 500,
    tokenURI: 'ipfs://QmFreeMint...',

    // Limit to prevent abuse
    mintLimitPerWallet: 1,

    // Start immediately
    mintStartTime: Math.floor(Date.now() / 1000),
  };

  const { address, tx } = await sdk.collection.createERC721Collection(params);

  console.log('Free Mint ERC721 Collection created:', address);
  console.log('Transaction:', tx.hash);

  return { address, tx };
}

// ============================================================================
// BASIC ERC1155 COLLECTION CREATION
// ============================================================================

/**
 * Create a basic ERC1155 multi-token collection
 */
export async function createBasicERC1155Collection() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: CreateERC1155CollectionParams = {
    name: 'Multi-Token Collection',
    symbol: 'MTC',
    maxSupply: 100000,
    mintPrice: '0.01',
    royaltyFee: 500,
    tokenURI: 'ipfs://QmMultiToken...',
  };

  const { address, tx } = await sdk.collection.createERC1155Collection(params);

  console.log('ERC1155 Collection created:', address);
  console.log('Transaction hash:', tx.hash);

  return { address, tx };
}

// ============================================================================
// VERIFICATION AFTER CREATION
// ============================================================================

/**
 * Create collection and verify it was created successfully
 */
export async function createAndVerifyCollection() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  // Create collection
  const params: CreateERC721CollectionParams = {
    name: 'Verified Collection',
    symbol: 'VFC',
    maxSupply: 1000,
    mintPrice: '0.1',
    royaltyFee: 500,
    tokenURI: 'ipfs://QmVerified...',
  };

  const { address, tx } = await sdk.collection.createERC721Collection(params);

  console.log('Collection created at:', address);

  // Wait for transaction to be mined
  await tx.wait();

  // Verify collection
  const verification = await sdk.collection.verifyCollection(address);

  console.log('Collection verification:', {
    isValid: verification.isValid,
    tokenType: verification.tokenType,
  });

  // Get collection info
  const info = await sdk.collection.getCollectionInfo(address);

  console.log('Collection info:', {
    name: info.name,
    symbol: info.symbol,
    maxSupply: info.maxSupply,
    mintPrice: info.mintPrice,
  });

  return { address, tx, verification, info };
}

// ============================================================================
// BULK COLLECTION CREATION
// ============================================================================

/**
 * Create multiple collections (useful for testing or batch deployment)
 */
export async function createMultipleCollections() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collections: CreateERC721CollectionParams[] = [
    {
      name: 'Collection Alpha',
      symbol: 'ALPHA',
      maxSupply: 1000,
      mintPrice: '0.1',
      royaltyFee: 500,
      tokenURI: 'ipfs://QmAlpha...',
    },
    {
      name: 'Collection Beta',
      symbol: 'BETA',
      maxSupply: 2000,
      mintPrice: '0.05',
      royaltyFee: 500,
      tokenURI: 'ipfs://QmBeta...',
    },
    {
      name: 'Collection Gamma',
      symbol: 'GAMMA',
      maxSupply: 500,
      mintPrice: '0.2',
      royaltyFee: 750,
      tokenURI: 'ipfs://QmGamma...',
    },
  ];

  const results = [];

  for (const params of collections) {
    try {
      const { address, tx } = await sdk.collection.createERC721Collection(params);
      results.push({ name: params.name, address, tx });
      console.log(`Created ${params.name}:`, address);

      // Wait between transactions to avoid nonce issues
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to create ${params.name}:`, error);
    }
  }

  return results;
}

// ============================================================================
// CUSTOM OWNER COLLECTION
// ============================================================================

/**
 * Create collection with custom owner address
 */
export async function createCollectionWithCustomOwner() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const customOwner = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'; // Example address

  const params: CreateERC721CollectionParams = {
    name: 'Owned Collection',
    symbol: 'OWND',
    maxSupply: 100,
    mintPrice: '1.0',
    royaltyFee: 1000, // 10%
    tokenURI: 'ipfs://QmOwned...',
    owner: customOwner, // Custom owner (not the signer)
  };

  const { address, tx } = await sdk.collection.createERC721Collection(params);

  console.log('Collection created for owner:', customOwner);
  console.log('Collection address:', address);

  return { address, tx, owner: customOwner };
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all collection creation examples
 */
export async function runCollectionCreationExamples() {
  console.log('=== Basic ERC721 Collection ===');
  // Uncomment to test: await createBasicERC721Collection();

  console.log('\n=== Full Config ERC721 Collection ===');
  // Uncomment to test: await createFullConfigERC721Collection();

  console.log('\n=== Allowlist ERC721 Collection ===');
  // Uncomment to test: await createAllowlistERC721Collection();

  console.log('\n=== Free Mint ERC721 Collection ===');
  // Uncomment to test: await createFreeMintERC721Collection();

  console.log('\n=== Basic ERC1155 Collection ===');
  // Uncomment to test: await createBasicERC1155Collection();

  console.log('\n=== Custom Owner Collection ===');
  // Uncomment to test: await createCollectionWithCustomOwner();
}

// Run if executed directly
if (require.main === module) {
  runCollectionCreationExamples().catch(console.error);
}
