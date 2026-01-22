/**
 * Loading States Examples
 *
 * This file demonstrates loading patterns, skeletons, and loading UX
 *
 * @module examples/react/loading-states
 */

'use client';

import React from 'react';
import { useCollection, useExchange, useAuction } from 'zuno-marketplace-sdk/react';

// ============================================================================
// BASIC LOADING SPINNER
// ============================================================================

/**
 * Simple loading spinner component
 */
export function LoadingSpinner({ size = 16 }: { size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: '3px solid #f3f3f3',
        borderTopColor: '#3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
  );
}

// Add this to your CSS or use inline styles:
// const keyframes = `
//   @keyframes spin {
//     0% { transform: rotate(0deg); }
//     100% { transform: rotate(360deg); }
//   }
// `;

// ============================================================================
// LOADING BUTTON
// ============================================================================

/**
 * Button with loading state
 */
export function LoadingButton({
  onClick,
  isLoading,
  disabled,
  children,
}: {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      style={{
        padding: '10px 20px',
        opacity: disabled || isLoading ? 0.6 : 1,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {isLoading && <LoadingSpinner />}
      {children}
    </button>
  );
}

// Usage:
// <LoadingButton
//   onClick={handleMint}
//   isLoading={mintERC721.isPending}
// >
//   Mint NFT
// </LoadingButton>

// ============================================================================
// FULL SCREEN LOADING
// ============================================================================

/**
 * Full screen loading overlay
 */
export function FullScreenLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
      bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <LoadingSpinner size={40} />
      <p style={{ marginTop: '20px', fontSize: '18px' }}>{message}</p>
    </div>
  );
}

// ============================================================================
// SKELETON LOADER FOR CARDS
// ============================================================================

/**
 * Skeleton loader for NFT card placeholder
 */
export function NFTCardSkeleton() {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '15px', width: '250px' }}>
      {/* Image placeholder */}
      <div
        style={{
          width: '100%',
          height: '200px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          marginBottom: '10px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />

      {/* Title placeholder */}
      <div
        style={{
          width: '80%',
          height: '20px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          marginBottom: '8px',
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: '0.1s',
        }}
      />

      {/* Price placeholder */}
      <div
        style={{
          width: '40%',
          height: '16px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: '0.2s',
        }}
      />
    </div>
  );
}

// CSS for pulse animation:
// const keyframes = `
//   @keyframes pulse {
//     0%, 100% { opacity: 1; }
//     50% { opacity: 0.5; }
//   }
// `;

// ============================================================================
// SKELETON LISTINGS LIST
// ============================================================================

/**
 * Multiple skeleton loaders for listings
 */
export function ListingsListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <NFTCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================================================
// TABLE SKELETON
// ============================================================================

/**
 * Skeleton loader for table rows
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #eee' }}>
              <div style={{ width: '60%', height: '16px', backgroundColor: '#f0f0f0', borderRadius: '4px' }} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                <div
                  style={{
                    width: colIndex === 0 ? '40px' : '80%',
                    height: '14px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    animation: `pulse 1.5s ease-in-out infinite`,
                    animationDelay: `${(rowIndex * columns + colIndex) * 0.05}s`,
                  }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ============================================================================
// PROGRESS BAR LOADING
// ============================================================================

/**
 * Progress bar for batch operations
 */
export function BatchProgress({ current, total, stage }: { current: number; total: number; stage: string }) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
        <span>{stage}</span>
        <span>{current}/{total}</span>
      </div>
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: '#3498db',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{percentage}%</p>
    </div>
  );
}

// ============================================================================
// TRANSACTION PROGRESS
// ============================================================================

/**
 * Multi-stage transaction progress
 */
export function TransactionProgress({
  stages,
  currentStage,
}: {
  stages: string[];
  currentStage: number;
}) {
  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Transaction Progress</h3>
      {stages.map((stage, index) => {
        const isComplete = index < currentStage;
        const isCurrent = index === currentStage;
        const isPending = index > currentStage;

        return (
          <div
            key={stage}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px',
              opacity: isPending ? 0.5 : 1,
            }}
          >
            {isComplete ? (
              <span style={{ color: '#27ae60', fontSize: '18px' }}>✓</span>
            ) : isCurrent ? (
              <LoadingSpinner size={16} />
            ) : (
              <span style={{ color: '#bdc3c7' }}>○</span>
            )}
            <span>{stage}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// COMBINED LOADING STATE COMPONENT
// ============================================================================

/**
 * Complete loading state with skeleton and error handling
 */
export function LoadingStateWrapper<T extends {
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  isSuccess: boolean;
  data?: T;
  isEmpty?: boolean;
}>({
  state,
  skeleton,
  emptyMessage = 'No data found',
  children,
}: {
  state: T;
  skeleton?: React.ReactNode;
  emptyMessage?: string;
  children: (data: T['data']) => React.ReactNode;
}) {
  if (state.isPending) {
    return skeleton || <div>Loading...</div>;
  }

  if (state.isError) {
    return (
      <div style={{ padding: '15px', backgroundColor: '#fee', border: '1px solid red', borderRadius: '8px' }}>
        <strong>Error:</strong> {(state.error as Error)?.message || 'An error occurred'}
      </div>
    );
  }

  if (state.isEmpty || !state.data) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return <>{children(state.data)}</>;
}

// ============================================================================
// CARD LOADING WITH OVERLAY
// ============================================================================

/**
 * Card with loading overlay during operations
 */
export function CardWithLoadingOverlay({
  isLoading,
  children,
}: {
  isLoading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative', minHeight: '100px' }}>
      {children}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
          }}
        >
          <LoadingSpinner size={32} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// INFINITE SCROLL LOADING
// ============================================================================

/**
 * Infinite scroll with loading indicator
 */
export function InfiniteScrollList({
  items,
  isLoadingMore,
  onLoadMore,
  renderItem,
}: {
  items: any[];
  isLoadingMore: boolean;
  onLoadMore: () => void;
  renderItem: (item: any, index: number) => React.ReactNode;
}) {
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && items.length > 0) {
          onLoadMore();
        }
      },
      { rootMargin: '100px'
    );

    if (listRef.current) {
      observer.observe(listRef.current);
    }

    return () => observer.disconnect();
  }, [items, isLoadingMore, onLoadMore]);

  return (
    <div ref={listRef}>
      {items.map((item, index) => renderItem(item, index))}

      {isLoadingMore && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <LoadingSpinner />
          <p style={{ marginTop: '10px', color: '#666' }}>Loading more...</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FORM SUBMISSION LOADING
// ============================================================================

/**
 * Form with loading state during submission
 */
export function LoadingForm() {
  const { mintERC721 } = useCollection();
  const [collectionAddress, setCollectionAddress] = React.useState('');
  const [recipient, setRecipient] = React.useState('');
  const [value, setValue] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await mintERC721.mutateAsync({
        collectionAddress,
        recipient,
        value,
      });

      // Clear form on success
      setCollectionAddress('');
      setRecipient('');
      setValue('');
    } catch (error) {
      console.error('Mint failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
      <h2>Mint NFT</h2>

      <div style={{ marginBottom: '15px' }}>
        <label>Collection Address:</label>
        <input
          value={collectionAddress}
          onChange={(e) => setCollectionAddress(e.target.value)}
          disabled={mintERC721.isPending}
          style={{ width: '100%', padding: '8px' }}
          required
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Recipient:</label>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          disabled={mintERC721.isPending}
          style={{ width: '100%', padding: '8px' }}
          required
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>Price (ETH):</label>
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={mintERC721.isPending}
          style={{ width: '100%', padding: '8px' }}
          required
        />
      </div>

      <LoadingButton
        onClick={handleSubmit}
        isLoading={mintERC721.isPending}
        disabled={mintERC721.isPending}
      >
        {mintERC721.isPending ? 'Minting...' : 'Mint NFT'}
      </LoadingButton>

      {mintERC721.isSuccess && (
        <p style={{ color: 'green', marginTop: '10px' }}>
          ✓ NFT minted successfully!
        </p>
      )}
    </form>
  );
}

// ============================================================================
// BATCH OPERATION LOADING
// ============================================================================

/**
 * Batch operations with detailed progress
 */
export function BatchOperationLoading() {
  const { batchListNFT } = useExchange();
  const [tokenIds, setTokenIds] = React.useState('1,2,3,4,5');
  const [prices, setPrices] = React.useState('0.5,0.7,1.0,1.2,1.5');

  const handleBatchList = async () => {
    try {
      const result = await batchListNFT.mutateAsync({
        collectionAddress: '0x...',
        tokenIds: tokenIds.split(','),
        prices: prices.split(','),
        duration: 86400,
      });

      console.log('Batch listed:', result.listingIds);
    } catch (error) {
      console.error('Batch list failed:', error);
    }
  };

  // Simulated progress (real progress would come from events)
  const [progress, setProgress] = React.useState({ listed: 0, total: 5 });

  React.useEffect(() => {
    if (batchListNFT.isSuccess && batchListNFT.data?.listingIds) {
      // Simulate progress for demo
      batchListNFT.data.listingIds.forEach((_, i) => {
        setTimeout(() => {
          setProgress((prev) => ({ ...prev, listed: i + 1 }));
        }, i * 500);
      });
    }
  }, [batchListNFT.isSuccess, batchListNFT.data]);

  return (
    <div>
      <h2>Batch List NFTs</h2>

      {batchListNFT.isPending && (
        <>
          <BatchProgress current={progress.listed} total={progress.total} stage="Listing NFTs..." />
          <p style={{ marginTop: '10px' }}>Please wait for transaction confirmation...</p>
        </>
      )}

      {batchListNFT.isSuccess && (
        <p>✅ Listed {batchListNFT.data?.listingIds.length} NFTs!</p>
      )}

      <LoadingButton onClick={handleBatchList} disabled={batchListNFT.isPending}>
        {batchListNFT.isPending ? 'Listing...' : 'Batch List (5 NFTs)'}
      </LoadingButton>
    </div>
  );
}

// ============================================================================
// EXPORT EXAMPLES
// ============================================================================

export const examples = {
  LoadingSpinner,
  LoadingButton,
  FullScreenLoading,
  NFTCardSkeleton,
  ListingsListSkeleton,
  TableSkeleton,
  BatchProgress,
  TransactionProgress,
  LoadingStateWrapper,
  CardWithLoadingOverlay,
  InfiniteScrollList,
  LoadingForm,
  BatchOperationLoading,
};
