/**
 * Optimistic Updates Examples
 *
 * This file demonstrates optimistic UI patterns for better UX
 *
 * @module examples/react/optimistic-updates
 */

'use client';

import React from 'react';
import {
  useCollection,
  useExchange,
  useAuction,
  useWallet,
  useZunoSDK,
} from 'zuno-marketplace/react';

// ============================================================================
// OPTIMISTIC LISTING
// ============================================================================

/**
 * List NFT with optimistic UI update
 */
export function OptimisticListing() {
  const { listNFT } = useExchange();
  const { address, isConnected } = useWallet();
  const [collectionAddress, setCollectionAddress] = React.useState('');
  const [tokenId, setTokenId] = React.useState('');
  const [price, setPrice] = React.useState('');

  // Optimistic state
  const [optimisticListings, setOptimisticListings] = React.useState<string[]>([]);

  const handleList = async () => {
    if (!isConnected) return alert('Connect wallet first');

    // Create a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;

    // Optimistically add to listings
    setOptimisticListings([...optimisticListings, tempId]);
    const updatedListings = [...optimisticListings, tempId];

    try {
      const result = await listNFT.mutateAsync({
        collectionAddress,
        tokenId,
        price,
        duration: 86400,
      });

      // Replace temp ID with actual listing ID
      const updated = optimisticListings.filter((id) => id !== tempId);
      setOptimisticListings([...updated, result.listingId]);

      console.log('Listed:', result.listingId);
    } catch (error) {
      // Rollback on error
      setOptimisticListings(optimisticListings.filter((id) => id !== tempId));
      console.error('Listing failed:', error);
    }
  };

  const isListing = listNFT.isPending;

  return (
    <div>
      <h2>Optimistic Listing</h2>

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

      <button
        onClick={handleList}
        disabled={!isConnected || isListing}
      >
        {isListing ? 'Listing...' : 'List NFT'}
      </button>

      {/* Display optimistic listings */}
      {optimisticListings.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Recent Listings (Optimistic)</h3>
          <ul>
            {optimisticListings.map((id, index) => (
              <li key={id} style={{ opacity: id.startsWith('temp-') ? 0.6 : 1 }}>
                {id.startsWith('temp-') ? 'Pending...' : id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// OPTIMISTIC BUYING
// ============================================================================

/**
 * Buy NFT with optimistic ownership transfer
 */
export function OptimisticBuying({ listingId, price }: { listingId: string; price: string }) {
  const { buyNFT } = useExchange();
  const { address } = useWallet();

  // Track optimistically owned NFTs
  const [optimisticOwned, setOptimisticOwned] = React.useState<string[]>([]);

  const handleBuy = async () => {
    // Optimistically add to owned tokens
    const tempId = `temp-${listingId}`;
    setOptimisticOwned([...optimisticOwned, listingId]);

    try {
      await buyNFT.mutateAsync({
        listingId,
        value: price,
      });

      // Confirm optimistic ownership
      console.log('Purchase confirmed');
    } catch (error) {
      // Rollback optimistic state
      setOptimisticOwned(optimisticOwned.filter((id) => id !== listingId));
      console.error('Purchase failed:', error);
    }
  };

  return (
    <div>
      <h2>Buy NFT</h2>
      <p>Price: {price} ETH</p>

      <button
        onClick={handleBuy}
        disabled={buyNFT.isPending}
      >
        {buyNFT.isPending ? 'Buying...' : 'Buy Now'}
      </button>

      {/* Optimistic ownership display */}
      {optimisticOwned.includes(listingId) && (
        <p style={{ color: '#27ae60' }}>✓ NFT transferred to {address?.slice(0, 6)}... (pending confirmation)</p>
      )}
    </div>
  );
}

// ============================================================================
// OPTIMISTIC MINTING
// ============================================================================

/**
 * Mint NFT with optimistic token allocation
 */
export function OptimisticMinting() {
  const { mintERC721 } = useCollection();
  const { address } = useWallet();

  const [collectionAddress, setCollectionAddress] = React.useState('');
  const [recipient, setRecipient] = React.useState('');
  const [value, setValue] = React.useState('');

  // Optimistic token tracking
  const [optimisticTokens, setOptimisticTokens] = React.useState<
    { tokenId: string; status: 'pending' | 'confirmed' }[]
  >([]);

  const handleMint = async () => {
    const tempTokenId = `temp-token-${Date.now()}`;

    // Optimistically add to tokens
    setOptimisticTokens([
      ...optimisticTokens,
      { tokenId: tempTokenId, status: 'pending' },
    ]);

    try {
      const result = await mintERC721.mutateAsync({
        collectionAddress,
        recipient: recipient || address!,
        value,
      });

      // Replace temp entry with actual token
      setOptimisticTokens(
        optimisticTokens.map((t) =>
          t.tokenId === tempTokenId
            ? { tokenId: result.tokenId, status: 'confirmed' }
            : t
        )
      );

      console.log('Mint confirmed:', result.tokenId);
    } catch (error) {
      // Rollback optimistic tokens
      setOptimisticTokens(
        optimisticTokens.filter((t) => t.status !== 'pending')
      );
      console.error('Mint failed:', error);
    }
  };

  const isMinting = mintERC721.isPending;

  return (
    <div>
      <h2>Optimistic Minting</h2>

      <input
        placeholder="Collection Address"
        value={collectionAddress}
        onChange={(e) => setCollectionAddress(e.target.value)}
      />
      <input
        placeholder="Mint Price (ETH)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <button
        onClick={handleMint}
        disabled={isMinting}
      >
        {isMinting ? 'Minting...' : 'Mint NFT'}
      </button>

      {/* Display optimistic tokens */}
      {optimisticTokens.length > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <h4>Optimistic Tokens:</h4>
          <ul>
            {optimisticTokens.map((token, i) => (
              <li key={i}>
                Token #{token.tokenId}: {token.status === 'pending' ? '⏳ Pending...' : '✓ Confirmed'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// OPTIMISTIC BIDDING
// ============================================================================

/**
 * Bid placement with optimistic highest bidder update
 */
export function OptimisticBidding({ auctionId, currentBid }: { auctionId: string; currentBid: string }) {
  const { placeBid } = useAuction();
  const { address } = useWallet();

  // Optimistic auction state
  const [optimisticAuction, setOptimisticAuction] = React.useState<{
    isHighestBidder: boolean;
    currentBid: string;
    status: 'pending' | 'confirmed';
  }>({
    isHighestBidder: false,
    currentBid: currentBid,
    status: 'confirmed',
  });

  const [bidAmount, setBidAmount] = React.useState('');

  const handleBid = async () => {
    const bid = Number(bidAmount);

    if (bid <= Number(optimisticAuction.currentBid)) {
      alert(`Bid must be higher than ${optimisticAuction.currentBid} ETH`);
      return;
    }

    // Optimistic update
    setOptimisticAuction({
      isHighestBidder: true,
      currentBid: bidAmount,
      status: 'pending',
    });

    try {
      await placeBid.mutateAsync({
        auctionId,
        amount: bidAmount,
      });

      setOptimisticAuction({
        isHighestBidder: true,
        currentBid: bidAmount,
        status: 'confirmed',
      });

      console.log('Bid confirmed');
    } catch (error) {
      // Rollback to previous state
      setOptimisticAuction({
        isHighestBidder: optimisticAuction.isHighestBidder,
        currentBid: optimisticAuction.currentBid,
        status: 'confirmed',
      });
      console.error('Bid failed:', error);
    }
  };

  const isBidding = placeBid.isPending;

  return (
    <div>
      <h2>Optimistic Bidding</h2>

      <p>Current Bid: {optimisticAuction.currentBid} ETH</p>

      {optimisticAuction.isHighestBidder && optimisticAuction.status === 'pending' ? (
        <p style={{ color: '#27ae60' }}>You are now the highest bidder! (confirming...)</p>
      ) : optimisticAuction.isHighestBidder && optimisticAuction.status === 'confirmed' ? (
        <p style={{ color: '#27ae60' }}>✓ You are the highest bidder!</p>
      ) : null}

      <input
        placeholder="Bid Amount (ETH)"
        value={bidAmount}
        onChange={(e) => setBidAmount(e.target.value)}
      />
      <button
        onClick={handleBid}
        disabled={isBidding}
      >
        {isBidding ? 'Bidding...' : 'Place Bid'}
      </button>
    </div>
  );
}

// ============================================================================
// OPTIMISTIC BATCH OPERATIONS
// ============================================================================

/**
 * Batch listing with optimistic UI updates
 */
export function OptimisticBatchListing() {
  const { batchListNFT } = useExchange();
  const [tokenIds, setTokenIds] = React.useState('1,2,3,4,5');
  const [prices, setPrices] = React.useState('0.5,0.7,1.0,1.2,1.5');

  // Optimistic listing state
  const [optimisticResults, setOptimisticResults] = React.useState<{
    status: 'pending' | 'confirmed' | 'failed';
    listingId?: string;
  }[]>([]);

  const handleBatchList = async () => {
    // Create optimistic results
    const optimisticResults = tokenIds.split(',').map((tokenId, index) => ({
      tokenId,
      status: 'pending' as const,
    }));

    setOptimisticResults(optimisticResults);

    try {
      const result = await batchListNFT.mutateAsync({
        collectionAddress: '0x...',
        tokenIds: tokenIds.split(','),
        prices: prices.split(','),
        duration: 86400,
      });

      // Update with actual listing IDs
      setOptimisticResults(
        tokenIds.split(',').map((tokenId, index) => ({
          tokenId,
          status: 'confirmed',
          listingId: result.listingIds[index],
        }))
      );

      console.log('Batch listing confirmed:', result.listingIds);
    } catch (error) {
      // Mark all as failed
      setOptimisticResults(
        optimisticResults.map((r) => ({ ...r, status: 'failed' as const }))
      );
      console.error('Batch listing failed:', error);
    }
  };

  return (
    <div>
      <h2>Optimistic Batch Listing</h2>

      <button
        onClick={handleBatchList}
        disabled={batchListNFT.isPending}
      >
        {batchListNFT.isPending ? 'Listing...' : 'Batch List'}
      </button>

      {/* Display optimistic results */}
      {optimisticResults.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Listing Results</h3>
          {optimisticResults.map((result, index) => (
            <div
              key={index}
              style={{
                marginBottom: '10px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: result.status === 'pending' ? '#fffdecc' : '#f0f0f0',
              }}
            >
              <p>Token #{result.tokenId}</p>
              {result.status === 'pending' ? (
                <p style={{ color: '#f39c12' }}>⏳ Listing...</p>
              ) : result.status === 'confirmed' ? (
                <p style={{ color: '#27ae60' }}>✓ Listed: {result.listingId}</p>
              ) : (
                <p style={{ color: '#e74c3c' }}>✗ Failed</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// OPTIMISTIC CANCELLATION
// ============================================================================

/**
 * Cancel listing with optimistic removal
 */
export function OptimisticCancel() {
  const { cancelListing } = useExchange();
  const [listingId, setListingId] = React.useState('');

  const [listing, setListing] = React.useState<{ id: string; visible: boolean }>({
    id: '',
    visible: true,
  });

  const handleCancel = async () => {
    const targetListing = listingId;

    // Optimistically hide the listing
    setListing({ ...listing, visible: false });

    try {
      await cancelListing.mutateAsync(listing.id);

      // Remove from list after successful cancellation
      setListing({ id: '', visible: false });
      console.log('Listing cancelled');
    } catch (error) {
      // Rollback - make listing visible again
      setListing({ id: listing.id, visible: true });
      console.error('Cancel failed:', error);
    }
  };

  return (
    <div>
      <h2>Optimistic Cancel</h2>

      <input
        placeholder="Listing ID"
        value={listingId}
        onChange={(e) => setListingId(e.target.value)}
      />

      {listing.visible ? (
        <button onClick={handleCancel} disabled={cancelListing.isPending}>
          {cancelListing.isPending ? 'Cancelling...' : 'Cancel Listing'}
        </button>
      ) : (
        <div style={{ color: '#27ae60' }}>✓ Listing cancelled</div>
      )}
    </div>
  );
}

// ============================================================================
// OPTIMISTIC ALLOWLIST MANAGEMENT
// ============================================================================

/**
 * Add to allowlist with optimistic UI update
 */
export function OptimisticAllowlistManagement() {
  const { addToAllowlist } = useCollection();
  const [addresses, setAddresses] = React.useState('');

  const [optimisticAddedAddresses, setOptimisticAddedAddresses] = React.useState<string[]>([]);

  const handleAddToAllowlist = async () => {
    const newAddresses = addresses.split(',').map((a) => a.trim());

    // Optimistically add to list
    const updatedList = [...optimisticAddedAddresses, ...newAddresses];
    setOptimisticAddedAddresses(updatedList);

    try {
      await addToAllowlist.mutateAsync({
        collectionAddress: '0x...',
        addresses: newAddresses,
      });

      console.log('Added to allowlist');
    } catch (error) {
      // Rollback optimistic update
      setOptimisticAddedAddresses(optimisticAddedAddresses);
      console.error('Failed to add to allowlist:', error);
    }
  };

  return (
    <div>
      <h2>Optimistic Allowlist Update</h2>

      <textarea
        placeholder="Addresses (comma separated)"
        value={addresses}
        onChange={(e) => setAddresses(e.target.value)}
        rows={3}
        style={{ width: '100%' }}
      />

      <button
        onClick={handleAddToAllowlist}
        disabled={addToAllowlist.isPending}
      >
        {addToAllowlist.isPending ? 'Adding...' : 'Add to Allowlist'}
      </button>

      {/* Optimistic display */}
      {optimisticAddedAddresses.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Allowlist (Optimistic)</h3>
          <ul>
            {optimisticAddedAddresses.map((address) => (
              <li key={address}>
                <span style={{ color: address.startsWith('0x') ? 'green' : 'orange' }}>
                  {address.startsWith('0x') ? '✓ ' : '○ '}
                </span>
                {address}
                {address.startsWith('0x') && <span style={{ color: '#27ae60' }}> (confirming...)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// OPTIMISTIC AUCTION CREATION
// ============================================================================

/**
 * Create auction with optimistic auction listing
 */
export function OptimisticAuction() {
  const { createEnglishAuction } = useAuction();
  const [collectionAddress, setCollectionAddress] = React.useState('');
  const [tokenId, setTokenId] = React.useState('');

  // Optimistic auction state
  const [optimisticAuction, setOptimisticAuction] = React.useState<{
    auctionId: string;
    status: 'pending' | 'confirmed';
  } | null>(null);

  const handleCreate = async () => {
    const tempAuctionId = `temp-auction-${Date.now()}`;

    // Optimistically show auction as created
    setOptimisticAuction({
      auctionId: tempAuctionId,
      status: 'pending',
    });

    try {
      const result = await createEnglishAuction.mutateAsync({
        collectionAddress,
        tokenId,
        startingBid: '1.0',
        duration: 86400 * 7,
      });

      // Replace temp ID with actual auction ID
      setOptimisticAuction({
        auctionId: result.auctionId,
        status: 'confirmed',
      });

      console.log('Auction created:', result.auctionId);
    } catch (error) {
      // Rollback
      setOptimisticAuction(null);
      console.error('Auction creation failed:', error);
    }
  };

  return (
    <div>
      <h2>Optimistic Auction Creation</h2>

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

      <button
        onClick={handleCreate}
        disabled={!collectionAddress || !tokenId || createEnglishAuction.isPending}
      >
        {createEnglishAuction.isPending ? 'Creating...' : 'Create Auction'}
      </button>

      {/* Optimistic display */}
      {optimisticAuction && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <h3>Auction Status</h3>
          <p>
            Auction ID: {optimisticAuction.auctionId}
          </p>
          <p>
            Status: {optimisticAuction.status === 'pending' ? 'Creating...' : '✓ Created'}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// OPTIMISTIC UI WITH ROLLBACK
// ============================================================================

/**
 * Generic optimistic update hook
 */
function useOptimisticUpdate<T>(
  mutation: any,
  tempId: string,
  rollback: () => void
) {
  const [optimisticState, setOptimisticState] = React.useState<T | null>(null);
  const [tempId] = React.useState(tempId);
  const [error, setError] = React.useState<Error | null>(null);

  const executeOptimistic = async (...args: any[]) => {
    const result = await mutation.mutateAsync(...args);

    // Update with actual data
    setOptimisticState(result);
    setTempId('');

    return result;
  };

  const executeWithOptimistic = async (optimisticValue: T) => {
    setOptimisticState(optimisticValue);
    setTempId(`temp-${Date.now()}`);

    try {
      const result = await mutation.mutateAsync(optimisticValue);
      setOptimisticState(result);
      setTempId('');
      return result;
    } catch (error) {
      rollback();
      throw error;
    }
  };

  const rollback = () => {
    setOptimisticState(null);
    setTempId('');
  };

  return { optimisticState, tempId, error, executeOptimistic, executeWithOptimistic, rollback };
}

// Example usage:
// const { optimisticState, executeOptimistic } = useOptimisticUpdate(
//   useCollection().mintERC721,
//   'temp-mint',
//   () => setOptimisticTokens(prev => prev.filter(t => t.id !== tempMint))
// );

// ============================================================================
// EXPORT EXAMPLES
// ============================================================================

export const examples = {
  OptimisticListing,
  OptimisticBuying,
  OptimisticMinting,
  OptimisticBidding,
  OptimisticBatchListing,
  OptimisticCancel,
  OptimisticAllowlistManagement,
  OptimisticAuction,
  OptimisticUIWithRollback,
};
