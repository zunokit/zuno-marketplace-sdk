/**
 * Transaction Store - Centralized storage for SDK transactions
 * Used by DevTools to display transaction history
 *
 * Enhanced with:
 * - Retry logic support
 * - Transaction history tracking
 * - Status filtering
 */

/**
 * Retry configuration for failed transactions
 */
export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

/**
 * Previous attempt record for retry history
 */
export interface PreviousAttempt {
  attemptNumber: number;
  timestamp: Date;
  error: string;
  hash?: string;
}

export interface TransactionEntry {
  id: string;
  hash: string;
  action: string;
  module: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  timestamp: Date;
  gasUsed?: string;
  error?: string;
  data?: Record<string, unknown>;
  /** Number of retry attempts made */
  retryCount: number;
  /** Maximum retries allowed */
  maxRetries: number;
  /** Whether transaction can be retried */
  canRetry: boolean;
  /** Previous retry attempts */
  previousAttempts: PreviousAttempt[];
  /** Original transaction params for retry */
  retryParams?: Record<string, unknown>;
}

type TransactionListener = (transactions: TransactionEntry[]) => void;

/** Default retry configuration */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

class TransactionStore {
  private transactions: TransactionEntry[] = [];
  private listeners: Set<TransactionListener> = new Set();
  private maxEntries = 50;
  private idCounter = 0;
  private defaultRetryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

  /**
   * Add a new transaction entry
   */
  add(
    entry: Omit<TransactionEntry, 'id' | 'timestamp' | 'retryCount' | 'maxRetries' | 'canRetry' | 'previousAttempts'>,
    retryConfig?: Partial<RetryConfig>
  ): string {
    const id = `tx-${++this.idCounter}-${Date.now()}`;
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    
    const newEntry: TransactionEntry = {
      ...entry,
      id,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: config.maxRetries,
      canRetry: entry.status === 'failed',
      previousAttempts: [],
    };

    this.transactions.unshift(newEntry);

    // Trim if over limit
    if (this.transactions.length > this.maxEntries) {
      this.transactions = this.transactions.slice(0, this.maxEntries);
    }

    this.notify();
    return id;
  }

  /**
   * Update an existing transaction
   */
  update(id: string, updates: Partial<TransactionEntry>): void {
    const index = this.transactions.findIndex(tx => tx.id === id);
    if (index !== -1) {
      const tx = this.transactions[index];
      this.transactions[index] = {
        ...tx,
        ...updates,
        // Update canRetry based on status and retry count
        canRetry: (updates.status === 'failed' || tx.status === 'failed') &&
                  (updates.retryCount ?? tx.retryCount) < tx.maxRetries,
      };
      this.notify();
    }
  }

  /**
   * Record a retry attempt for a transaction
   */
  recordRetry(id: string, error: string, newHash?: string): void {
    const index = this.transactions.findIndex(tx => tx.id === id);
    if (index !== -1) {
      const tx = this.transactions[index];
      const attempt: PreviousAttempt = {
        attemptNumber: tx.retryCount + 1,
        timestamp: new Date(),
        error,
        hash: newHash,
      };
      
      this.transactions[index] = {
        ...tx,
        retryCount: tx.retryCount + 1,
        status: 'retrying',
        previousAttempts: [...tx.previousAttempts, attempt],
        canRetry: tx.retryCount + 1 < tx.maxRetries,
        hash: newHash || tx.hash,
      };
      this.notify();
    }
  }

  /**
   * Mark a retry as successful
   */
  retrySuccess(id: string, hash: string, gasUsed?: string): void {
    this.update(id, {
      status: 'success',
      hash,
      gasUsed,
      error: undefined,
      canRetry: false,
    });
  }

  /**
   * Mark a retry as failed
   */
  retryFailed(id: string, error: string): void {
    const index = this.transactions.findIndex(tx => tx.id === id);
    if (index !== -1) {
      const tx = this.transactions[index];
      this.update(id, {
        status: 'failed',
        error,
        canRetry: tx.retryCount < tx.maxRetries,
      });
    }
  }

  /**
   * Get all transactions
   */
  getAll(): TransactionEntry[] {
    return [...this.transactions];
  }

  /**
   * Get transactions by status
   */
  getByStatus(status: TransactionEntry['status']): TransactionEntry[] {
    return this.transactions.filter(tx => tx.status === status);
  }

  /**
   * Get failed transactions that can be retried
   */
  getFailedRetryable(): TransactionEntry[] {
    return this.transactions.filter(tx => tx.status === 'failed' && tx.canRetry);
  }

  /**
   * Get transaction by ID
   */
  getById(id: string): TransactionEntry | undefined {
    return this.transactions.find(tx => tx.id === id);
  }

  /**
   * Get transactions by module
   */
  getByModule(module: string): TransactionEntry[] {
    return this.transactions.filter(tx => tx.module === module);
  }

  /**
   * Clear all transactions
   */
  clear(): void {
    this.transactions = [];
    this.notify();
  }

  /**
   * Subscribe to transaction updates
   */
  subscribe(listener: TransactionListener): () => void {
    this.listeners.add(listener);
    listener(this.getAll()); // Initial call
    return () => this.listeners.delete(listener);
  }

  /**
   * Set maximum entries
   */
  setMaxEntries(max: number): void {
    this.maxEntries = max;
    if (this.transactions.length > max) {
      this.transactions = this.transactions.slice(0, max);
      this.notify();
    }
  }

  /**
   * Set default retry configuration
   */
  setDefaultRetryConfig(config: Partial<RetryConfig>): void {
    this.defaultRetryConfig = { ...this.defaultRetryConfig, ...config };
  }

  /**
   * Get default retry configuration
   */
  getDefaultRetryConfig(): RetryConfig {
    return { ...this.defaultRetryConfig };
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(retryCount: number): number {
    const { delayMs, backoffMultiplier } = this.defaultRetryConfig;
    return delayMs * Math.pow(backoffMultiplier, retryCount);
  }

  private notify(): void {
    const snapshot = this.getAll();
    this.listeners.forEach(listener => listener(snapshot));
  }
}

// Singleton instance
export const transactionStore = new TransactionStore();
