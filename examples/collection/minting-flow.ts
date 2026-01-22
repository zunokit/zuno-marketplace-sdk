/**
 * Minting Flow Examples
 *
 * This file demonstrates complete minting workflows for ERC721 and ERC1155 NFTs
 *
 * @module examples/collection/minting-flow
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';
import type { MintERC721Params, MintERC1155Params } from 'zuno-marketplace-sdk';

// ============================================================================
// BASIC ERC721 MINT
// ============================================================================

/**
 * Mint a single ERC721 NFT
 */
export async function mintSingleERC721() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: MintERC721Params = {
    collectionAddress: '0x...', // Your collection address
    recipient: '0x...', // Recipient address
    value: '0.1', // Mint price in ETH
  };

  const { tokenId, tx } = await sdk.collection.mintERC721(params);

  console.log('ERC721 NFT minted!');
  console.log('Token ID:', tokenId);
  console.log('Transaction:', tx.hash);

  return { tokenId, tx };
}

// ============================================================================
// BATCH ERC721 MINT
// ============================================================================

/**
 * Mint multiple ERC721 NFTs in one transaction
 */
export async function batchMintERC721() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params = {
    collectionAddress: '0x...', // Your collection address
    recipient: '0x...', // Recipient address
    amount: 5, // Number of NFTs to mint
    value: '0.5', // Total price (5 * 0.1 = 0.5 ETH)
  };

  const { tx } = await sdk.collection.batchMintERC721(params);

  console.log('Batch minted 5 ERC721 NFTs!');
  console.log('Transaction:', tx.hash);

  return { tx };
}

// ============================================================================
// BASIC ERC1155 MINT
// ============================================================================

/**
 * Mint ERC1155 tokens (multi-token standard)
 */
export async function mintERC1155() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params: MintERC1155Params = {
    collectionAddress: '0x...', // Your ERC1155 collection address
    recipient: '0x...', // Recipient address
    amount: 10, // Number of tokens to mint
    value: '0.01', // Mint price per token
  };

  const { tx } = await sdk.collection.mintERC1155(params);

  console.log('ERC1155 tokens minted!');
  console.log('Amount:', params.amount);
  console.log('Transaction:', tx.hash);

  return { tx };
}

// ============================================================================
// BATCH ERC1155 MINT
// ============================================================================

/**
 * Batch mint ERC1155 tokens
 */
export async function batchMintERC1155() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const params = {
    collectionAddress: '0x...', // Your ERC1155 collection address
    recipient: '0x...', // Recipient address
    amount: 100, // Number of tokens to mint
    value: '1.0', // Total price
  };

  const { tx } = await sdk.collection.batchMintERC1155(params);

  console.log('Batch minted 100 ERC1155 tokens!');
  console.log('Transaction:', tx.hash);

  return { tx };
}

// ============================================================================
// COMPLETE MINTING WORKFLOW
// ============================================================================

/**
 * Complete minting workflow with verification
 */
export async function completeMintingWorkflow() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const recipient = '0x...';

  // Step 1: Check collection info
  console.log('Step 1: Checking collection info...');
  const collectionInfo = await sdk.collection.getCollectionInfo(collectionAddress);

  console.log('Collection:', collectionInfo.name);
  console.log('Max supply:', collectionInfo.maxSupply);
  console.log('Total minted:', collectionInfo.totalSupply);
  console.log('Mint price:', collectionInfo.mintPrice);
  console.log('Remaining:', Number(collectionInfo.maxSupply) - Number(collectionInfo.totalSupply));

  // Step 2: Check if allowlist is enabled
  console.log('\nStep 2: Checking allowlist status...');
  const isAllowlistOnly = await sdk.collection.isAllowlistOnly(collectionAddress);

  if (isAllowlistOnly) {
    console.log('Collection is in allowlist-only mode');
    const isAllowed = await sdk.collection.isInAllowlist(collectionAddress, recipient);

    if (!isAllowed) {
      throw new Error('Address is not on the allowlist');
    }
    console.log('Address is on the allowlist');
  } else {
    console.log('Public minting is enabled');
  }

  // Step 3: Check user's minted count (if applicable)
  console.log('\nStep 3: Checking user tokens...');
  const ownedTokens = await sdk.collection.getUserOwnedTokens(collectionAddress, recipient);
  console.log('User already owns:', ownedTokens.length, 'NFTs');

  if (collectionInfo.mintLimitPerWallet > 0 && ownedTokens.length >= collectionInfo.mintLimitPerWallet) {
    throw new Error('Wallet has reached mint limit');
  }

  // Step 4: Mint the NFT
  console.log('\nStep 4: Minting NFT...');
  const mintParams: MintERC721Params = {
    collectionAddress,
    recipient,
    value: collectionInfo.mintPrice,
  };

  const { tokenId, tx } = await sdk.collection.mintERC721(mintParams);

  console.log('NFT minted successfully!');
  console.log('Token ID:', tokenId);
  console.log('Transaction:', tx.hash);

  // Step 5: Verify the mint
  console.log('\nStep 5: Verifying mint...');
  await tx.wait(); // Wait for transaction to be mined

  const newOwnedTokens = await sdk.collection.getUserOwnedTokens(collectionAddress, recipient);
  console.log('User now owns:', newOwnedTokens.length, 'NFTs');

  return { tokenId, tx, collectionInfo };
}

// ============================================================================
// MINT WITH PROGRESS TRACKING
// ============================================================================

/**
 * Mint with progress tracking and user feedback
 */
export async function mintWithProgress(
  onProgress?: (step: string, message: string) => void
) {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const recipient = '0x...';

  try {
    onProgress?.('validation', 'Validating collection...');
    const collectionInfo = await sdk.collection.getCollectionInfo(collectionAddress);

    onProgress?.('validation', 'Checking mint eligibility...');
    const isAllowlistOnly = await sdk.collection.isAllowlistOnly(collectionAddress);

    if (isAllowlistOnly) {
      const isAllowed = await sdk.collection.isInAllowlist(collectionAddress, recipient);
      if (!isAllowed) {
        throw new Error('Address is not on the allowlist');
      }
    }

    onProgress?.('minting', 'Initiating mint transaction...');
    const { tokenId, tx } = await sdk.collection.mintERC721({
      collectionAddress,
      recipient,
      value: collectionInfo.mintPrice,
    });

    onProgress?.('confirming', 'Waiting for confirmation...');
    await tx.wait();

    onProgress?.('success', `Successfully minted token #${tokenId}`);
    return { tokenId, tx };

  } catch (error: any) {
    onProgress?.('error', error.message);
    throw error;
  }
}

// ============================================================================
// MINT WITH ERROR HANDLING
// ============================================================================

/**
 * Mint with comprehensive error handling
 */
export async function mintWithErrorHandling() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  try {
    const { tokenId, tx } = await sdk.collection.mintERC721({
      collectionAddress: '0x...',
      recipient: '0x...',
      value: '0.1',
    });

    console.log('Mint successful:', tokenId);
    return { tokenId, tx };

  } catch (error: any) {
    // Handle specific errors
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error('Error: Insufficient funds for mint');
    } else if (error.code === 'INVALID_AMOUNT') {
      console.error('Error: Invalid mint amount');
    } else if (error.message.includes('allowlist')) {
      console.error('Error: Address not on allowlist');
    } else if (error.message.includes('exceeds limit')) {
      console.error('Error: Mint limit reached for wallet');
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// ============================================================================
// ESTIMATE MINT COST
// ============================================================================

/**
 * Calculate total cost including gas for minting
 */
export async function estimateMintCost() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const recipient = '0x...';

  // Get collection info
  const collectionInfo = await sdk.collection.getCollectionInfo(collectionAddress);

  // Mint price
  const mintPrice = Number(collectionInfo.mintPrice);

  // Note: Gas estimation would require additional provider calls
  // This is a simplified example
  const estimatedGasPrice = 0.0001; // Example gas price in ETH
  const estimatedGasUnits = 200000; // Example gas units for mint

  const gasCost = estimatedGasPrice * estimatedGasUnits;
  const totalCost = mintPrice + gasCost;

  console.log('Mint Cost Breakdown:');
  console.log('- Mint price:', mintPrice, 'ETH');
  console.log('- Estimated gas cost:', gasCost.toFixed(4), 'ETH');
  console.log('- Total estimated cost:', totalCost.toFixed(4), 'ETH');

  return { mintPrice, gasCost, totalCost };
}

// ============================================================================
// MINT TO MULTIPLE RECIPIENTS
// ============================================================================

/**
 * Mint NFTs to multiple recipients
 */
export async function mintToMultipleRecipients() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  const collectionAddress = '0x...';
  const collectionInfo = await sdk.collection.getCollectionInfo(collectionAddress);

  const recipients = [
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    '0x1234567890abcdef1234567890abcdef12345678',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  ];

  const results = [];

  for (const recipient of recipients) {
    try {
      const { tokenId, tx } = await sdk.collection.mintERC721({
        collectionAddress,
        recipient,
        value: collectionInfo.mintPrice,
      });

      results.push({ recipient, tokenId, tx, success: true });
      console.log(`Minted to ${recipient}: token #${tokenId}`);

      // Wait between transactions
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: any) {
      results.push({ recipient, error: error.message, success: false });
      console.error(`Failed to mint to ${recipient}:`, error.message);
    }
  }

  return results;
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all minting flow examples
 */
export async function runMintingFlowExamples() {
  console.log('=== Single ERC721 Mint ===');
  // Uncomment to test: await mintSingleERC721();

  console.log('\n=== Batch ERC721 Mint ===');
  // Uncomment to test: await batchMintERC721();

  console.log('\n=== ERC1155 Mint ===');
  // Uncomment to test: await mintERC1155();

  console.log('\n=== Estimate Mint Cost ===');
  // Uncomment to test: await estimateMintCost();

  console.log('\n=== Mint with Error Handling ===');
  // Uncomment to test: await mintWithErrorHandling();
}

// Run if executed directly
if (require.main === module) {
  runMintingFlowExamples().catch(console.error);
}
