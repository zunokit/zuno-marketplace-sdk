/**
 * Error Handling Examples
 *
 * This file demonstrates error handling patterns with React hooks
 *
 * @module examples/react/error-handling
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { useCollection, useExchange, useAuction, ZunoSDKError } from 'zuno-marketplace-sdk/react';

// ============================================================================
// BASIC ERROR HANDLING WITH MUTATIONS
// ============================================================================

/**
 * Basic error handling with mutation hooks
 */
export function BasicErrorHandling() {
  const { mintERC721 } = useCollection();

  const handleMint = async () => {
    try {
      await mintERC721.mutateAsync({
        collectionAddress: '0x...',
        recipient: '0x...',
        value: '0.1',
      });
      console.log('Mint successful');
    } catch (error) {
      if (error instanceof ZunoSDKError) {
        // Handle SDK-specific errors
        switch (error.code) {
          case 'INVALID_ADDRESS':
            alert('Invalid address provided');
            break;
          case 'INSUFFICIENT_FUNDS':
            alert('Insufficient funds for mint');
            break;
          case 'TRANSACTION_FAILED':
            alert('Transaction failed. Please try again.');
            break;
          default:
            alert(`Error: ${error.message}`);
        }
      } else {
        alert(`Unknown error: ${error}`);
      }
    }
  };

  return (
    <button onClick={handleMint}>Mint NFT</button>
  );
}

// ============================================================================
// ERROR STATE DISPLAY COMPONENT
// ============================================================================

/**
 * Display error messages from mutations
 */
export function ErrorDisplay({ error }: { error: unknown }) {
  if (!error) return null;

  let message = 'An error occurred';
  let details = '';

  if (error instanceof ZunoSDKError) {
    switch (error.code) {
      case 'INVALID_ADDRESS':
        message = 'Invalid Address';
        details = 'Please enter a valid wallet address';
        break;
      case 'INVALID_AMOUNT':
        message = 'Invalid Amount';
        details = 'Please enter a valid amount';
        break;
      case 'INSUFFICIENT_FUNDS':
        message = 'Insufficient Funds';
        details = 'You don\'t have enough ETH for this transaction';
        break;
      case 'TRANSACTION_FAILED':
        message = 'Transaction Failed';
        details = 'The transaction could not be completed. Please try again.';
        break;
      case 'NOT_OWNER':
        message = 'Not Authorized';
        details = 'You are not the owner of this asset';
        break;
      default:
        message = 'Error';
        details = error.message;
    }
  } else if (error instanceof Error) {
    details = error.message;
  }

  return (
    <div style={{ padding: '15px', backgroundColor: '#fee', border: '1px solid red', borderRadius: '8px', marginBottom: '15px' }}>
      <strong style={{ color: '#c00' }}>{message}</strong>
      {details && <p style={{ marginTop: '8px', marginBottom: '0' }}>{details}</p>}
    </div>
  );
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Error boundary for catching React errors
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ZunoErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid red', borderRadius: '8px' }}>
            <h2>Something went wrong</h2>
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error?.stack}</pre>
            </details>
            <button onClick={() => this.setState({ hasError: false, error: null })}>
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Usage:
// <ZunoErrorBoundary>
//   <YourApp />
// </ZunoErrorBoundary>

// ============================================================================
// ERROR HANDLING HOOK
// ============================================================================

/**
 * Custom hook for error handling
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<unknown | null>(null);

  const handleError = (error: unknown) => {
    setError(error);

    // Auto-dismiss after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
}

/**
 * Component using error handler hook
 */
export functionWithErrorHandling() {
  const { mintERC721 } = useCollection();
  const { error, handleError, clearError } = useErrorHandler();

  const handleMint = async () => {
    try {
      await mintERC721.mutateAsync({
        collectionAddress: '0x...',
        recipient: '0x...',
        value: '0.1',
      });
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div>
      <button onClick={handleMint}>Mint NFT</button>

      {error && (
        <>
          <ErrorDisplay error={error} />
          <button onClick={clearError}>Dismiss</button>
        </>
      )}
    </div>
  );
}

// ============================================================================
// VALIDATION BEFORE EXECUTION
// ============================================================================

/**
 * Pre-flight checks before mutations
 */
export function ValidatedMutation() {
  const { listNFT } = useExchange();
  const { address, isConnected } = useWallet();
  const { handleError } = useErrorHandler();

  const [collectionAddress, setCollectionAddress] = React.useState('');
  const [tokenId, setTokenId] = React.useState('');
  const [price, setPrice] = React.useState('');

  const handleList = async () => {
    // Validation
    if (!isConnected) {
      handleError('Please connect your wallet first');
      return;
    }

    if (!collectionAddress || !collectionAddress.startsWith('0x') || collectionAddress.length !== 42) {
      handleError('Invalid collection address');
      return;
    }

    if (!tokenId || isNaN(Number(tokenId))) {
      handleError('Invalid token ID');
      return;
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      handleError('Invalid price');
      return;
    }

    try {
      await listNFT.mutateAsync({
        collectionAddress,
        tokenId,
        price,
        duration: 86400,
      });
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div>
      <h2>List NFT (Validated)</h2>
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
      <button onClick={handleList}>List NFT</button>

      <ErrorDisplay error={error} />
    </div>
  );
}

// ============================================================================
// RETRY LOGIC WITH ERRORS
// ============================================================================

/**
 * Retry logic for failed transactions
 */
export function RetryableMutation() {
  const { buyNFT } = useExchange();
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastError, setLastError] = React.useState<unknown | null>(null);

  const handleBuyWithRetry = async (listingId: string, value: string) => {
    const maxRetries = 3;

    const attempt = async () => {
      try {
        await buyNFT.mutateAsync({ listingId, value });
        setRetryCount(0);
        setLastError(null);
        return true;
      } catch (error: any) {
        // Don't retry on validation errors
        if (error?.code === 'INVALID_ADDRESS' || error?.code === 'INVALID_AMOUNT') {
          setLastError(error);
          return false;
        }

        // Retry on network/transaction errors
        if (retryCount < maxRetries) {
          setRetryCount(retryCount + 1);
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          return attempt();
        }

        setLastError(error);
        return false;
      }
    };

    await attempt();
  };

  return (
    <div>
      {lastError && <ErrorDisplay error={lastError} />}
      {retryCount > 0 && <p>Retrying... Attempt {retryCount}/3</p>}
    </div>
  );
}

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

/**
 * Convert SDK errors to user-friendly messages
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof ZunoSDKError) {
    switch (error.code) {
      case 'INVALID_ADDRESS':
        return 'Please enter a valid wallet address';
      case 'INVALID_AMOUNT':
        return 'Please enter a valid amount';
      case 'INSUFFICIENT_FUNDS':
        return 'You don\'t have enough funds for this transaction';
      case 'TRANSACTION_FAILED':
        return 'Transaction failed. Please try again.';
      case 'NOT_OWNER':
        return 'You don\'t own this asset';
      case 'CONTRACT_CALL_FAILED':
        return 'Contract error. Please contact support';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection';
      case 'WALLET_NOT_CONNECTED':
        return 'Please connect your wallet first';
      default:
        return error.message || 'An error occurred';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

/**
 * Component with user-friendly error messages
 */
export function UserFriendlyErrors() {
  const { mintERC721 } = useCollection();
  const [errorMessage, setErrorMessage] = React.useState('');
  const [showError, setShowError] = React.useState(false);

  const handleMint = async () => {
    setErrorMessage('');
    setShowError(false);

    try {
      await mintERC721.mutateAsync({
        collectionAddress: '0x...',
        recipient: '0x...',
        value: '0.1',
      });
    } catch (error) {
      setErrorMessage(getUserFriendlyMessage(error));
      setShowError(true);
    }
  };

  return (
    <div>
      <button onClick={handleMint}>Mint NFT</button>

      {showError && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fee', borderRadius: '4px' }}>
          <p style={{ color: '#c00', fontWeight: 'bold', marginBottom: '5px' }}>Error:</p>
          <p>{errorMessage}</p>
          <button onClick={() => setShowError(false)}>Dismiss</button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LOADING AND ERROR STATES COMBINED
// ============================================================================

/**
 * Combined loading and error state component
 */
export function LoadingAndErrorState<T extends {
  isPending: boolean;
  isError: boolean;
  error?: unknown;
  isSuccess: boolean;
  data?: T;
}>({
  state,
  successMessage,
  errorComponent,
}: {
  state: T;
  successMessage?: string;
  errorComponent?: React.ReactNode;
}) {
  if (state.isPending) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #333', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <span>Processing...</span>
      </div>
    );
  }

  if (state.isError) {
    return errorComponent || <ErrorDisplay error={state.error} />;
  }

  if (state.isSuccess && successMessage) {
    return (
      <div style={{ padding: '10px', backgroundColor: '#efe', borderRadius: '4px' }}>
        ✓ {successMessage}
      </div>
    );
  }

  return null;
}

// Usage example:
// <LoadingAndErrorState
//   state={mintERC721}
//   successMessage="NFT minted successfully!"
// />

// ============================================================================
// GLOBAL ERROR HANDLING
// ============================================================================

/**
 * Global error context for app-wide error handling
 */
interface ErrorContextValue {
  error: unknown | null;
  setError: (error: unknown) => void;
  clearError: () => void;
}

const ErrorContext = React.createContext<ErrorContextValue | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = React.useState<unknown | null>(null);

  const clearError = () => setError(null);

  return (
    <ErrorContext.Provider value={{ error, setError, clearError }}>
      {children}
      {error && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
          <div style={{ padding: '15px', backgroundColor: '#fee', border: '1px solid red', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <strong>Error:</strong> {getUserFriendlyMessage(error)}
            <button onClick={clearError} style={{ marginLeft: '10px' }}>×</button>
          </div>
        </div>
      )}
    </ErrorContext.Provider>
  );
}

export function useErrorHandlerContext() {
  const context = React.useContext(ErrorContext);
  if (!context) throw new Error('useErrorHandlerContext must be used within ErrorProvider');
  return context;
}

// ============================================================================
// EXPORT EXAMPLES
// ============================================================================

export const examples = {
  BasicErrorHandling,
  ErrorDisplay,
  ZunoErrorBoundary,
  WithErrorHandling,
  ValidatedMutation,
  RetryableMutation,
  UserFriendlyErrors,
  LoadingAndErrorState,
  ErrorProvider,
};
