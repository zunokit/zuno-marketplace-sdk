/**
 * Auction Hooks Examples
 *
 * This file demonstrates how to use all auction-related React hooks
 *
 * @module examples/react/auction-hooks
 */

'use client';

import React from 'react';
import {
  useAuction,
  useAuctionDetails,
  useDutchAuctionPrice,
  usePendingRefund,
  useWallet,
  useBalance,
} from 'zuno-marketplace-sdk/react';

// ============================================================================
// CREATE ENGLISH AUCTION
// ============================================================================

/**
 * Create a new English auction
 */
export function CreateEnglishAuctionExample() {
  const { createEnglishAuction } = useAuction();
  const { isConnected } = useWallet();

  const [collectionAddress, setCollectionAddress] = React.useState('');
  const [tokenId, setTokenId] = React.useState('');
  const [startingBid, setStartingBid] = React.useState('1.0');
  const [duration, setDuration] = React.useState(604800); // 7 days

  const handleCreate = async () => {
    if (!isConnected) return alert('Please connect your wallet');

    try {
      const result = await createEnglishAuction.mutateAsync({
        collectionAddress,
        tokenId,
        startingBid,
        duration,
      });

      console.log('Auction created:', result.auctionId);
    } catch (error) {
      console.error('Creation failed:', error);
    }
  };

  return (
    <div>
      <h2>Create English Auction</h2>
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
        placeholder="Starting Bid (ETH)"
        value={startingBid}
        onChange={(e) => setStartingBid(e.target.value)}
      />
      <select
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
      >
        <option value={86400}>1 Day</option>
        <option value={604800}>7 Days</option>
        <option value={2592000}>30 Days</option>
      </select>

      <button
        onClick={handleCreate}
        disabled={!isConnected || createEnglishAuction.isPending}
      >
        {createEnglishAuction.isPending ? 'Creating...' : 'Create Auction'}
      </button>

      {createEnglishAuction.isSuccess && (
        <p>✅ Auction created! ID: {createEnglishAuction.data?.auctionId}</p>
      )}
    </div>
  );
}

// ============================================================================
// CREATE DUTCH AUCTION
// ============================================================================

/**
 * Create a new Dutch auction
 */
export function CreateDutchAuctionExample() {
  const { createDutchAuction } = useAuction();
  const { isConnected } = useWallet();

  const [collectionAddress, setCollectionAddress] = React.useState('');
  const [tokenId, setTokenId] = React.useState('');
  const [startPrice, setStartPrice] = React.useState('10.0');
  const [endPrice, setEndPrice] = React.useState('1.0');
  const [duration, setDuration] = React.useState(86400); // 1 day

  const handleCreate = async () => {
    if (!isConnected) return alert('Please connect your wallet');

    try {
      const result = await createDutchAuction.mutateAsync({
        collectionAddress,
        tokenId,
        startPrice,
        endPrice,
        duration,
      });

      console.log('Dutch auction created:', result.auctionId);
    } catch (error) {
      console.error('Creation failed:', error);
    }
  };

  return (
    <div>
      <h2>Create Dutch Auction</h2>
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
        placeholder="Start Price (ETH)"
        value={startPrice}
        onChange={(e) => setStartPrice(e.target.value)}
      />
      <input
        placeholder="End Price (ETH)"
        value={endPrice}
        onChange={(e) => setEndPrice(e.target.value)}
      />
      <select
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
      >
        <option value={3600}>1 Hour</option>
        <option value={86400}>1 Day</option>
        <option value={259200}>3 Days</option>
      </select>

      <button
        onClick={handleCreate}
        disabled={!isConnected || createDutchAuction.isPending}
      >
        {createDutchAuction.isPending ? 'Creating...' : 'Create Dutch Auction'}
      </button>

      {createDutchAuction.isSuccess && (
        <p>✅ Auction created! ID: {createDutchAuction.data?.auctionId}</p>
      )}
    </div>
  );
}

// ============================================================================
// BATCH CREATE ENGLISH AUCTIONS
// ============================================================================

/**
 * Create multiple English auctions at once
 */
export function BatchCreateAuctionsExample() {
  const { batchCreateEnglishAuction } = useAuction();
  const { isConnected } = useWallet();

  const [collectionAddress, setCollectionAddress] = React.useState('');
  const [tokenIds, setTokenIds] = React.useState('1,2,3');

  const handleBatchCreate = async () => {
    if (!isConnected) return alert('Please connect your wallet');

    try {
      const result = await batchCreateEnglishAuction.mutateAsync({
        collectionAddress,
        tokenIds: tokenIds.split(','),
        startingBid: '1.0',
        duration: 604800,
      });

      console.log('Batch created:', result.auctionIds);
    } catch (error) {
      console.error('Batch creation failed:', error);
    }
  };

  return (
    <div>
      <h2>Batch Create Auctions</h2>
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
      <button
        onClick={handleBatchCreate}
        disabled={!isConnected || batchCreateEnglishAuction.isPending}
      >
        {batchCreateEnglishAuction.isPending ? 'Creating...' : 'Batch Create'}
      </button>

      {batchCreateEnglishAuction.isSuccess && (
        <p>✅ Created {batchCreateEnglishAuction.data?.auctionIds.length} auctions!</p>
      )}
    </div>
  );
}

// ============================================================================
// PLACE BID ON ENGLISH AUCTION
// ============================================================================

/**
 * Place a bid on an English auction
 */
export function PlaceBidExample({ auctionId, currentBid }: { auctionId: string; currentBid: string }) {
  const { placeBid } = useAuction();
  const { isConnected } = useWallet();
  const { data: balance } = useBalance();

  const [bidAmount, setBidAmount] = React.useState('');

  const handleBid = async () => {
    if (!isConnected) return alert('Please connect your wallet');

    const minBid = (Number(currentBid) * 1.05).toFixed(4);
    if (Number(bidAmount) <= Number(currentBid)) {
      alert(`Bid must be higher than current bid. Minimum: ${minBid} ETH`);
      return;
    }

    if (Number(balance) < Number(bidAmount)) {
      alert(`Insufficient balance. Need ${bidAmount} ETH`);
      return;
    }

    try {
      await placeBid.mutateAsync({
        auctionId,
        amount: bidAmount,
      });

      console.log('Bid placed!');
    } catch (error) {
      console.error('Bid failed:', error);
    }
  };

  return (
    <div>
      <h2>Place Bid</h2>
      <p>Current Bid: {currentBid} ETH</p>
      <p>Your Balance: {balance} ETH</p>

      <input
        placeholder="Bid Amount (ETH)"
        value={bidAmount}
        onChange={(e) => setBidAmount(e.target.value)}
      />
      <button
        onClick={handleBid}
        disabled={!isConnected || placeBid.isPending}
      >
        {placeBid.isPending ? 'Bidding...' : 'Place Bid'}
      </button>

      {placeBid.isSuccess && <p>✅ Bid placed successfully!</p>}
      {placeBid.isError && <p>❌ {placeBid.error?.message}</p>}
    </div>
  );
}

// ============================================================================
// BUY NOW IN DUTCH AUCTION
// ============================================================================

/**
 * Buy NFT at current Dutch auction price
 */
export function BuyNowDutchExample({ auctionId }: { auctionId: string }) {
  const { buyNow } = useAuction();
  const { isConnected } = useWallet();
  const { data: currentPrice } = useDutchAuctionPrice(auctionId);
  const { data: balance } = useBalance();

  const handleBuyNow = async () => {
    if (!isConnected) return alert('Please connect your wallet');

    if (Number(balance) < Number(currentPrice)) {
      alert(`Insufficient balance. Need ${currentPrice} ETH`);
      return;
    }

    try {
      await buyNow.mutateAsync({ auctionId });
      console.log('Purchased!');
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  return (
    <div>
      <h2>Buy Now (Dutch Auction)</h2>
      <p>Current Price: {currentPrice} ETH</p>
      <p>Your Balance: {balance} ETH</p>

      <button
        onClick={handleBuyNow}
        disabled={!isConnected || buyNow.isPending}
      >
        {buyNow.isPending ? 'Buying...' : `Buy Now (${currentPrice} ETH)`}
      </button>

      {buyNow.isSuccess && <p>✅ Purchased!</p>}
    </div>
  );
}

// ============================================================================
// WITHDRAW REFUND
// ============================================================================

/**
 * Withdraw refund after being outbid
 */
export function WithdrawRefundExample({ auctionId }: { auctionId: string }) {
  const { withdrawBid } = useAuction();
  const { isConnected } = useWallet();
  const { data: refund } = usePendingRefund(auctionId, isConnected ? '' : undefined);

  const handleWithdraw = async () => {
    if (!isConnected) return alert('Please connect your wallet');

    try {
      await withdrawBid.mutateAsync({ auctionId });
      console.log('Refund withdrawn!');
    } catch (error) {
      console.error('Withdraw failed:', error);
    }
  };

  if (!refund || Number(refund) === 0) {
    return <p>No pending refund</p>;
  }

  return (
    <div>
      <h2>Withdraw Refund</h2>
      <p>Pending Refund: {refund} ETH</p>

      <button
        onClick={handleWithdraw}
        disabled={withdrawBid.isPending}
      >
        {withdrawBid.isPending ? 'Withdrawing...' : 'Withdraw Refund'}
      </button>

      {withdrawBid.isSuccess && <p>✅ Refund withdrawn!</p>}
    </div>
  );
}

// ============================================================================
// CANCEL AUCTION
// ============================================================================

/**
 * Cancel an active auction
 */
export function CancelAuctionExample({ auctionId }: { auctionId: string }) {
  const { cancelAuction } = useAuction();

  const handleCancel = async () => {
    try {
      await cancelAuction.mutateAsync({ auctionId });
      console.log('Auction cancelled');
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={cancelAuction.isPending}
    >
      {cancelAuction.isPending ? 'Cancelling...' : 'Cancel Auction'}
    </button>
  );
}

// ============================================================================
// GET AUCTION DETAILS
// ============================================================================

/**
 * Display auction information
 */
export function AuctionDetails({ auctionId }: { auctionId: string }) {
  const { data: auction, isLoading } = useAuctionDetails(auctionId);
  const { data: dutchPrice } = useDutchAuctionPrice(auctionId);

  if (isLoading) return <div>Loading auction...</div>;
  if (!auction) return <p>Auction not found</p>;

  const now = Math.floor(Date.now() / 1000);
  const timeLeft = auction.endTime - now;
  const isActive = auction.status === 'active' && timeLeft > 0;

  return (
    <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Auction #{auction.tokenId}</h3>
      <p><strong>Type:</strong> {auction.type}</p>
      <p><strong>Status:</strong> {auction.status}</p>

      {isActive && (
        <p><strong>Time Left:</strong> {formatTime(timeLeft)}</p>
      )}

      {auction.type === 'english' ? (
        <>
          <p><strong>Starting Bid:</strong> {auction.startingBid} ETH</p>
          <p><strong>Current Bid:</strong> {auction.currentBid} ETH</p>
          <p><strong>Highest Bidder:</strong> {auction.highestBidder || 'None'}</p>
        </>
      ) : (
        <>
          <p><strong>Start Price:</strong> {auction.startPrice} ETH</p>
          <p><strong>End Price:</strong> {auction.endPrice} ETH</p>
          <p><strong>Current Price:</strong> {dutchPrice || 'Loading...'} ETH</p>
        </>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return 'Ended';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ============================================================================
// COMPLETE AUCTION COMPONENT
// ============================================================================

/**
 * Complete auction interface with bidding
 */
export function AuctionInterface({ auctionId, type }: { auctionId: string; type: 'english' | 'dutch' }) {
  const { data: auction, isLoading } = useAuctionDetails(auctionId);
  const { placeBid, buyNow, withdrawBid } = useAuction();
  const { data: refund } = usePendingRefund(auctionId);
  const { address, isConnected } = useWallet();
  const { data: balance } = useBalance();

  const [bidAmount, setBidAmount] = React.useState('');

  if (isLoading) return <div>Loading auction...</div>;
  if (!auction) return <p>Auction not found</p>;

  const now = Math.floor(Date.now() / 1000);
  const timeLeft = auction.endTime - now;
  const isActive = auction.status === 'active' && timeLeft > 0;

  const isOwner = auction.seller.toLowerCase() === address?.toLowerCase();

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>{type === 'english' ? 'English' : 'Dutch'} Auction</h1>

      {/* Auction Info */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <p><strong>NFT:</strong> {auction.collectionAddress} #{auction.tokenId}</p>
        <p><strong>Status:</strong> {auction.status}</p>
        {isActive && <p><strong>Ends in:</strong> {formatTime(timeLeft)}</p>}

        {type === 'english' ? (
          <>
            <p><strong>Starting Bid:</strong> {auction.startingBid} ETH</p>
            <p><strong>Current Bid:</strong> {auction.currentBid} ETH</p>
            <p><strong>Highest Bidder:</strong> {auction.highestBidder || 'None'}</p>
          </>
        ) : (
          <p><strong>Current Price:</strong> Calculating...</p>
        )}
      </div>

      {/* User's Status */}
      {isConnected && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
          <p><strong>Your Address:</strong> {address?.slice(0, 10)}...</p>
          <p><strong>Balance:</strong> {balance} ETH</p>

          {type === 'english' && auction.highestBidder?.toLowerCase() === address?.toLowerCase() ? (
            <p style={{ color: 'green', fontWeight: 'bold' }}>✓ You are the highest bidder!</p>
          ) : type === 'english' && refund && Number(refund) > 0 ? (
            <p style={{ color: 'orange' }}>⚠ You have a pending refund: {refund} ETH</p>
          ) : null}
        </div>
      )}

      {/* Actions */}
      {isActive && !isOwner && (
        <div>
          {type === 'english' ? (
            <div>
              <input
                placeholder="Bid Amount (ETH)"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
              <button
                onClick={async () => {
                  if (!isConnected) return alert('Connect wallet first');
                  await placeBid.mutateAsync({ auctionId, amount: bidAmount });
                }}
                disabled={!isConnected || placeBid.isPending}
              >
                {placeBid.isPending ? 'Bidding...' : 'Place Bid'}
              </button>

              {refund && Number(refund) > 0 && (
                <button
                  onClick={async () => {
                    await withdrawBid.mutateAsync({ auctionId });
                  }}
                  disabled={withdrawBid.isPending}
                  style={{ marginLeft: '10px' }}
                >
                  {withdrawBid.isPending ? 'Withdrawing...' : `Withdraw ${refund} ETH`}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={async () => {
                if (!isConnected) return alert('Connect wallet first');
                await buyNow.mutateAsync({ auctionId });
              }}
              disabled={!isConnected || buyNow.isPending}
            >
              {buyNow.isPending ? 'Buying...' : 'Buy Now'}
            </button>
          )}
        </div>
      )}

      {isOwner && (
        <button
          onClick={async () => {
            if (confirm('Are you sure you want to cancel this auction?')) {
              const { cancelAuction } = useAuction();
              await cancelAuction.mutateAsync({ auctionId });
            }
          }}
        >
          Cancel Auction
        </button>
      )}
    </div>
  );
}

// ============================================================================
// BATCH CANCEL AUCTIONS
// ============================================================================

/**
 * Cancel multiple auctions at once
 */
export function BatchCancelAuctionsExample({ auctionIds }: { auctionIds: string[] }) {
  const { batchCancelAuction } = useAuction();

  const handleBatchCancel = async () => {
    try {
      const result = await batchCancelAuction.mutateAsync(auctionIds);
      console.log('Cancelled:', result.cancelledCount, 'auctions');
    } catch (error) {
      console.error('Batch cancel failed:', error);
    }
  };

  return (
    <div>
      <h2>Cancel {auctionIds.length} Auctions</h2>
      <button
        onClick={handleBatchCancel}
        disabled={batchCancelAuction.isPending}
      >
        {batchCancelAuction.isPending ? 'Cancelling...' : 'Cancel All'}
      </button>

      {batchCancelAuction.isSuccess && (
        <p>✅ Cancelled {batchCancelAuction.data?.cancelledCount} auctions!</p>
      )}
    </div>
  );
}

// ============================================================================
// EXPORT EXAMPLES
// ============================================================================

export const examples = {
  CreateEnglishAuctionExample,
  CreateDutchAuctionExample,
  BatchCreateAuctionsExample,
  PlaceBidExample,
  BuyNowDutchExample,
  WithdrawRefundExample,
  CancelAuctionExample,
  AuctionDetails,
  AuctionInterface,
  BatchCancelAuctionsExample,
};
