/**
 * Exchange Hooks Examples
 *
 * This file demonstrates how to use all exchange-related React hooks
 *
 * @module examples/react/exchange-hooks
 */

'use client';

import React from 'react';
import {
  useExchange,
  useListings,
  useListingsBySeller,
  useListing,
  useWallet,
  useBalance,
} from 'zuno-marketplace-sdk/react';

// ============================================================================
// LIST NFT
// ============================================================================

/**
 * List a single NFT for sale
 */
export function ListNFTExample() {
  const { listNFT } = useExchange();
  const { address, isConnected } = useWallet();

  const [collectionAddress, setCollectionAddress] = React.useState('');
  const [tokenId, setTokenId] = React.useState('');
  const [price, setPrice] = React.useState('1.0');
  const [duration, setDuration] = React.useState(86400);

  const handleList = async () => {
    if (!isConnected) {
      alert('Please connect your wallet');
      return;
    }

    try {
      const result = await listNFT.mutateAsync({
        collectionAddress,
        tokenId,
        price,
        duration,
      });

      console.log('NFT listed:', result.listingId);
    } catch (error) {
      console.error('Listing failed:', error);
    }
  };

  return (
    <div>
      <h2>List NFT</h2>
      <input
        placeholder="Collection Address"
        value={collectionAddress}
        onChange={(e) => setCollectionAddress(e.target.value)}
      />
      <input
        placeholder="Token ID"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
      />
      <input
        placeholder="Price (ETH)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <select
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
      >
        <option value={3600}>1 Hour</option>
        <option value={86400}>1 Day</option>
        <option value={604800}>7 Days</option>
      </select>

      <button
        onClick={handleList}
        disabled={!isConnected || listNFT.isPending}
      >
        {listNFT.isPending ? 'Listing...' : 'List NFT'}
      </button>

      {listNFT.isSuccess && (
        <p>✅ Listed! Listing ID: {listNFT.data?.listingId}</p>
      )}
    </div>
  );
}

// ============================================================================
// BATCH LIST NFTs
// ============================================================================

/**
 * List multiple NFTs in one transaction
 */
export function BatchListExample() {
  const { batchListNFT } = useExchange();
  const { address, isConnected } = useWallet();

  const [collectionAddress, setCollectionAddress] = React.useState('');
  const [tokenIds, setTokenIds] = React.useState('1,2,3');
  const [prices, setPrices] = React.useState('0.5,0.7,1.0');

  const handleBatchList = async () => {
    if (!isConnected) return;

    try {
      const result = await batchListNFT.mutateAsync({
        collectionAddress,
        tokenIds: tokenIds.split(','),
        prices: prices.split(','),
        duration: 86400,
      });

      console.log('Batch listed:', result.listingIds);
    } catch (error) {
      console.error('Batch listing failed:', error);
    }
  };

  return (
    <div>
      <h2>Batch List</h2>
      <input
        placeholder="Collection Address"
        value={collectionAddress}
        onChange={(e) => setCollectionAddress(e.target.value)}
      />
      <input
        placeholder="Token IDs (comma separated)"
        value={tokenIds}
        onChange={(e) => setTokenIds(e.target.value)}
      />
      <input
        placeholder="Prices (comma separated)"
        value={prices}
        onChange={(e) => setPrices(e.target.value)}
      />
      <button
        onClick={handleBatchList}
        disabled={!isConnected || batchListNFT.isPending}
      >
        {batchListNFT.isPending ? 'Listing...' : 'Batch List'}
      </button>

      {batchListNFT.isSuccess && (
        <p>✅ Listed {batchListNFT.data?.listingIds.length} NFTs!</p>
      )}
    </div>
  );
}

// ============================================================================
// BUY NFT
// ============================================================================

/**
 * Buy an NFT from a listing
 */
export function BuyNFTExample({ listingId, price }: { listingId: string; price: string }) {
  const { buyNFT } = useExchange();
  const { isConnected } = useWallet();
  const { data: balance } = useBalance();

  const handleBuy = async () => {
    if (!isConnected) {
      alert('Please connect your wallet');
      return;
    }

    // Check balance
    if (Number(balance) < Number(price)) {
      alert(`Insufficient balance. Need ${price} ETH`);
      return;
    }

    try {
      await buyNFT.mutateAsync({
        listingId,
        value: price,
      });

      console.log('NFT purchased!');
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  return (
    <div>
      <h2>Buy NFT</h2>
      <p>Price: {price} ETH</p>
      <p>Your Balance: {balance} ETH</p>

      <button
        onClick={handleBuy}
        disabled={!isConnected || buyNFT.isPending}
      >
        {buyNFT.isPending ? 'Buying...' : 'Buy Now'}
      </button>

      {buyNFT.isSuccess && <p>✅ Purchased!</p>}
      {buyNFT.isError && <p>❌ {buyNFT.error?.message}</p>}
    </div>
  );
}

// ============================================================================
// CANCEL LISTING
// ============================================================================

/**
 * Cancel an active listing
 */
export function CancelListingExample({ listingId }: { listingId: string }) {
  const { cancelListing } = useExchange();

  const handleCancel = async () => {
    try {
      await cancelListing.mutateAsync({ listingId });
      console.log('Listing cancelled');
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={cancelListing.isPending}
    >
      {cancelListing.isPending ? 'Cancelling...' : 'Cancel Listing'}
    </button>
  );
}

// ============================================================================
// GET LISTINGS BY COLLECTION
// ============================================================================

/**
 * Display all listings for a collection
 */
export function CollectionListings({ collectionAddress }: { collectionAddress: string }) {
  const { data, isLoading, error } = useListings(collectionAddress);

  if (isLoading) return <div>Loading listings...</div>;
  if (error) return <div>Error loading listings</div>;
  if (!data || data.length === 0) return <p>No listings found</p>;

  const activeListings = data.filter(l => l.status === 'active');

  return (
    <div>
      <h2>Collection Listings ({activeListings.length} active)</h2>
      <ul>
        {activeListings.map((listing) => (
          <li key={listing.id}>
            Token #{listing.tokenId}: {listing.price} ETH
            <br />
            <small>Seller: {listing.seller.slice(0, 10)}...</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// GET LISTINGS BY SELLER
// ============================================================================

/**
 * Display all listings from a specific seller
 */
export function SellerListings({ seller }: { seller: string }) {
  const { data, isLoading } = useListingsBySeller(seller);

  if (isLoading) return <div>Loading listings...</div>;
  if (!data || data.length === 0) return <p>No listings found</p>;

  // Calculate total value
  const totalValue = data
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + Number(l.price), 0);

  return (
    <div>
      <h2>Seller Listings</h2>
      <p>Total Value: {totalValue.toFixed(2)} ETH</p>
      <ul>
        {data
          .filter(l => l.status === 'active')
          .map((listing) => (
            <li key={listing.id}>
              {listing.collectionAddress} #{listing.tokenId}
              <br />
              Price: {listing.price} ETH
            </li>
          ))}
      </ul>
    </div>
  );
}

// ============================================================================
// GET SINGLE LISTING DETAILS
// ============================================================================

/**
 * Display detailed listing information
 */
export function ListingDetails({ listingId }: { listingId: string }) {
  const { data, isLoading } = useListing(listingId);

  if (isLoading) return <div>Loading listing...</div>;
  if (!data) return <p>Listing not found</p>;

  const timeLeft = data.endTime - Math.floor(Date.now() / 1000);
  const isActive = data.status === 'active' && timeLeft > 0;

  return (
    <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Listing #{data.tokenId}</h3>
      <p><strong>Price:</strong> {data.price} ETH</p>
      <p><strong>Seller:</strong> {data.seller.slice(0, 10)}...</p>
      <p><strong>Status:</strong> {data.status}</p>
      {isActive && (
        <p><strong>Time Left:</strong> {formatTime(timeLeft)}</p>
      )}
      <p><small>Created: {new Date(data.createdAt).toLocaleString()}</small></p>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return 'Ended';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// ============================================================================
// BATCH BUY NFTs
// ============================================================================

/**
 * Buy multiple NFTs in one transaction
 */
export function BatchBuyExample({ listingIds, totalPrice }: { listingIds: string[]; totalPrice: string }) {
  const { batchBuyNFT } = useExchange();
  const { isConnected } = useWallet();
  const { data: balance } = useBalance();

  const handleBatchBuy = async () => {
    if (!isConnected) {
      alert('Please connect your wallet');
      return;
    }

    if (Number(balance) < Number(totalPrice)) {
      alert(`Insufficient balance. Need ${totalPrice} ETH`);
      return;
    }

    try {
      await batchBuyNFT.mutateAsync({
        listingIds,
        value: totalPrice,
      });

      console.log('Batch purchase complete!');
    } catch (error) {
      console.error('Batch buy failed:', error);
    }
  };

  return (
    <div>
      <h2>Buy {listingIds.length} NFTs</h2>
      <p>Total Price: {totalPrice} ETH</p>
      <p>Your Balance: {balance} ETH</p>

      <button
        onClick={handleBatchBuy}
        disabled={!isConnected || batchBuyNFT.isPending}
      >
        {batchBuyNFT.isPending ? 'Buying...' : 'Buy All'}
      </button>

      {batchBuyNFT.isSuccess && <p>✅ Purchased all NFTs!</p>}
    </div>
  );
}

// ============================================================================
// BATCH CANCEL LISTINGS
// ============================================================================

/**
 * Cancel multiple listings at once
 */
export function BatchCancelExample({ listingIds }: { listingIds: string[] }) {
  const { batchCancelListing } = useExchange();

  const handleBatchCancel = async () => {
    try {
      await batchCancelListing.mutateAsync({
        listingIds,
      });

      console.log('Cancelled all listings');
    } catch (error) {
      console.error('Batch cancel failed:', error);
    }
  };

  return (
    <div>
      <h2>Cancel {listingIds.length} Listings</h2>
      <button
        onClick={handleBatchCancel}
        disabled={batchCancelListing.isPending}
      >
        {batchCancelListing.isPending ? 'Cancelling...' : 'Cancel All'}
      </button>

      {batchCancelListing.isSuccess && (
        <p>✅ Cancelled {batchCancelListing.data?.cancelledCount} listings!</p>
      )}
    </div>
  );
}

// ============================================================================
// COMPLETE MARKETPLACE COMPONENT
// ============================================================================

/**
 * Complete NFT marketplace with listing and buying
 */
export function NFTMarketplace({ collectionAddress }: { collectionAddress: string }) {
  const { listNFT, buyNFT } = useExchange();
  const { data: listings } = useListings(collectionAddress);
  const { address, isConnected } = useWallet();
  const { data: balance } = useBalance();

  const [selectedToken, setSelectedToken] = React.useState('');
  const [listPrice, setListPrice] = React.useState('1.0');

  // Handle listing
  const handleList = async () => {
    if (!isConnected) return alert('Connect wallet first');
    if (!selectedToken) return alert('Select a token to list');

    try {
      await listNFT.mutateAsync({
        collectionAddress,
        tokenId: selectedToken,
        price: listPrice,
        duration: 86400,
      });

      console.log('Listed successfully');
      setSelectedToken('');
    } catch (error) {
      console.error('Listing failed:', error);
    }
  };

  // Handle buying
  const handleBuy = async (listingId: string, price: string) => {
    if (!isConnected) return alert('Connect wallet first');

    try {
      await buyNFT.mutateAsync({ listingId, value: price });
      console.log('Purchased successfully');
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const activeListings = listings?.filter(l => l.status === 'active') || [];

  return (
    <div>
      <h1>NFT Marketplace</h1>

      {/* Wallet Connection */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <p>
          <strong>Status:</strong> {isConnected ? 'Connected' : 'Not Connected'}
        </p>
        {isConnected && (
          <>
            <p><strong>Address:</strong> {address?.slice(0, 10)}...</p>
            <p><strong>Balance:</strong> {balance} ETH</p>
          </>
        )}
      </div>

      {/* List NFT Section */}
      <section style={{ marginBottom: '30px' }}>
        <h2>List Your NFT</h2>
        <input
          placeholder="Token ID"
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
        />
        <input
          placeholder="Price (ETH)"
          value={listPrice}
          onChange={(e) => setListPrice(e.target.value)}
        />
        <button
          onClick={handleList}
          disabled={!isConnected || listNFT.isPending}
        >
          {listNFT.isPending ? 'Listing...' : 'List for Sale'}
        </button>
      </section>

      {/* Active Listings */}
      <section>
        <h2>Active Listings ({activeListings.length})</h2>
        {activeListings.length === 0 ? (
          <p>No active listings</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {activeListings.map((listing) => (
              <div key={listing.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
                <h3>Token #{listing.tokenId}</h3>
                <p><strong>Price:</strong> {listing.price} ETH</p>
                <p><strong>Seller:</strong> {listing.seller.slice(0, 8)}...</p>
                <button
                  onClick={() => handleBuy(listing.id, listing.price)}
                  disabled={buyNFT.isPending}
                >
                  {buyNFT.isPending ? 'Buying...' : 'Buy Now'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ============================================================================
// EXPORT EXAMPLES
// ============================================================================

export const examples = {
  ListNFTExample,
  BatchListExample,
  BuyNFTExample,
  CancelListingExample,
  CollectionListings,
  SellerListings,
  ListingDetails,
  BatchBuyExample,
  BatchCancelExample,
  NFTMarketplace,
};
