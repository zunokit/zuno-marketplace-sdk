/**
 * Transaction Store - Centralized storage for SDK transactions
 * Used by DevTools to display transaction history
 */

export interface TransactionEntry {
  id: string;
  hash: string;
  action: string;
  module: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  gasUsed?: string;
  error?: string;
  data?: Record<string, unknown>;
}

type TransactionListener = (transactions: TransactionEntry[]) => void;

class TransactionStore {
  private transactions: TransactionEntry[] = [];
  private listeners: Set<TransactionListener> = new Set();
  private maxEntries = 50;
  private idCounter = 0;

  /**
   * Add a new transaction entry
   */
  add(entry: Omit<TransactionEntry, 'id' | 'timestamp'>): string {
    const id = `tx-${++this.idCounter}-${Date.now()}`;
    const newEntry: TransactionEntry = {
      ...entry,
      id,
      timestamp: new Date(),
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
      this.transactions[index] = { ...this.transactions[index], ...updates };
      this.notify();
    }
  }

  /**
   * Get all transactions
   */
  getAll(): TransactionEntry[] {
    return [...this.transactions];
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

  private notify(): void {
    const snapshot = this.getAll();
    this.listeners.forEach(listener => listener(snapshot));
  }
}

// Singleton instance
export const transactionStore = new TransactionStore();
