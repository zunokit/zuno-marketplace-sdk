/**
 * React Example - Zuno Marketplace SDK
 *
 * This example shows how to use the SDK with React
 */

import React from 'react';
import { ZunoProvider, useExchange, useCollection, useAuction } from '../dist/react/index.js';

// App Setup
export default function App() {
  return (
    <ZunoProvider
      config={{
        apiKey: 'your-api-key',
        network: 'sepolia',
      }}
    >
      <NFTMarketplace />
    </ZunoProvider>
  );
}

// Main Component
function NFTMarketplace() {
  const { listNFT, buyNFT, cancelListing } = useExchange();
  const { mintERC721, batchMintERC721 } = useCollection();
  const { createEnglishAuction, placeBid } = useAuction();

  const handleListNFT = async () => {
    try {
      await listNFT.mutateAsync({
        collectionAddress: '0x1234...',
        tokenId: '1',
        price: '1.0',
        duration: 86400,
      });
      console.log('✅ NFT Listed successfully');
    } catch (error) {
      console.error('❌ List failed:', error.message);
    }
  };

  const handleMintNFT = async () => {
    try {
      await mintERC721.mutateAsync({
        collectionAddress: '0x5678...',
        recipient: '0x9abc...',
        value: '0.1',
      });
      console.log('✅ NFT Minted successfully');
    } catch (error) {
      console.error('❌ Mint failed:', error.message);
    }
  };

  const handleCreateAuction = async () => {
    try {
      await createEnglishAuction.mutateAsync({
        collectionAddress: '0xdef0...',
        tokenId: '42',
        startingBid: '2.0',
        duration: 604800,
      });
      console.log('✅ Auction created successfully');
    } catch (error) {
      console.error('❌ Auction failed:', error.message);
    }
  };

  return (
    <div className="marketplace">
      <h1>Zuno NFT Marketplace</h1>

      <div className="actions">
        <button
          onClick={handleMintNFT}
          disabled={mintERC721.isPending}
        >
          {mintERC721.isPending ? 'Minting...' : '🎨 Mint NFT'}
        </button>

        <button
          onClick={handleListNFT}
          disabled={listNFT.isPending}
        >
          {listNFT.isPending ? 'Listing...' : '📝 List NFT'}
        </button>

        <button
          onClick={handleCreateAuction}
          disabled={createEnglishAuction.isPending}
        >
          {createEnglishAuction.isPending ? 'Creating...' : '🔨 Create Auction'}
        </button>
      </div>

      <div className="status">
        {listNFT.isError && <p className="error">List error: {listNFT.error.message}</p>}
        {mintERC721.isError && <p className="error">Mint error: {mintERC721.error.message}</p>}
        {createEnglishAuction.isError && <p className="error">Auction error: {createEnglishAuction.error.message}</p>}

        {listNFT.isSuccess && <p className="success">✅ NFT Listed!</p>}
        {mintERC721.isSuccess && <p className="success">✅ NFT Minted! Token: {mintERC721.data.tokenId}</p>}
        {createEnglishAuction.isSuccess && <p className="success">✅ Auction Created! ID: {createEnglishAuction.data.auctionId}</p>}
      </div>
    </div>
  );
}

// Advanced Component with Batch Operations
function AdvancedMarketplace() {
  const { batchListNFT, batchBuyNFT } = useExchange();
  const { batchMintERC721 } = useCollection();

  const handleBatchMint = async () => {
    try {
      await batchMintERC721.mutateAsync({
        collectionAddress: '0x1111...',
        recipient: '0x9abc...',
        amount: 5,
        value: '0.5',
      });
      console.log('✅ Batch Minted 5 NFTs');
    } catch (error) {
      console.error('❌ Batch Mint failed:', error.message);
    }
  };

  const handleBatchList = async () => {
    try {
      await batchListNFT.mutateAsync({
        collectionAddress: '0x1111...',
        tokenIds: ['1', '2', '3'],
        prices: ['0.5', '0.7', '1.0'],
        duration: 86400,
      });
      console.log('✅ Batch Listed 3 NFTs');
    } catch (error) {
      console.error('❌ Batch List failed:', error.message);
    }
  };

  return (
    <div className="advanced-marketplace">
      <h2>Batch Operations</h2>

      <button
        onClick={handleBatchMint}
        disabled={batchMintERC721.isPending}
      >
        {batchMintERC721.isPending ? 'Minting...' : '🎨 Batch Mint (5)'}
      </button>

      <button
        onClick={handleBatchList}
        disabled={batchListNFT.isPending}
      >
        {batchListNFT.isPending ? 'Listing...' : '📝 Batch List (3)'}
      </button>
    </div>
  );
}

export { NFTMarketplace, AdvancedMarketplace };