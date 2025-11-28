/**
 * Basic Usage Example - Zuno Marketplace SDK
 *
 * This example shows how to use the core SDK functions
 */

import { ZunoSDK } from '../dist/index.js';

// Initialize SDK
const sdk = new ZunoSDK({
  apiKey: 'your-api-key',
  network: 'sepolia',
  apiUrl: 'https://api.zuno.com/v1', // Unified API endpoint
});

async function basicUsage() {
  try {
    // 1. List an NFT for sale
    console.log('📝 Listing NFT...');
    const { listingId, tx: listTx } = await sdk.exchange.listNFT({
      collectionAddress: '0x1234...',
      tokenId: '1',
      price: '1.5', // 1.5 ETH
      duration: 86400, // 1 day in seconds
    });
    console.log('✅ NFT Listed:', listTx.hash, 'ListingID:', listingId);

    // 2. Buy an NFT
    console.log('\n💰 Buying NFT...');
    const { tx: buyTx } = await sdk.exchange.buyNFT({
      listingId: listingId, // listing ID from list result
      value: '1.5', // 1.5 ETH
    });
    console.log('✅ NFT Purchased:', buyTx.hash);

    // 3. Mint an ERC721 NFT
    console.log('\n🎨 Minting NFT...');
    const mintResult = await sdk.collection.mintERC721({
      collectionAddress: '0x5678...',
      recipient: '0x9abc...',
      value: '0.1', // 0.1 ETH mint fee
    });
    console.log('✅ NFT Minted:', mintResult.tx.hash, 'TokenID:', mintResult.tokenId);

    // 4. Create English Auction
    console.log('\n🔨 Creating Auction...');
    const auctionResult = await sdk.auction.createEnglishAuction({
      collectionAddress: '0xdef0...',
      tokenId: '42',
      startingBid: '2.0', // 2 ETH starting bid
      duration: 604800, // 7 days
      reservePrice: '1.5', // Minimum sale price
    });
    console.log('✅ Auction Created:', auctionResult.tx.hash, 'AuctionID:', auctionResult.auctionId);

    // 5. Batch operations
    console.log('\n📦 Batch Operations...');
    const batchListResults = await sdk.exchange.batchListNFT([
      {
        collectionAddress: '0x1111...',
        tokenId: '1',
        price: '0.5',
        duration: 86400,
      },
      {
        collectionAddress: '0x1111...',
        tokenId: '2',
        price: '0.7',
        duration: 86400,
      },
      {
        collectionAddress: '0x1111...',
        tokenId: '3',
        price: '1.0',
        duration: 86400,
      },
    ]);
    console.log('✅ Batch Listed:', batchListResults.length, 'NFTs');

    const { tx: batchBuyTx } = await sdk.exchange.batchBuyNFT({
      listingIds: ['0xaaa...', '0xbbb...'], // listing IDs to buy
      value: '1.2', // total value
    });
    console.log('✅ Batch Bought:', batchBuyTx.hash);

    console.log('\n🎉 All operations completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
if (require.main === module) {
  basicUsage();
}

export { basicUsage };