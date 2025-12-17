/**
 * Centralized Log Store for Zuno DevTools
 * Stores logs in memory and notifies subscribers
 *
 * Performance optimizations:
 * - Debounced notifications to prevent excessive updates
 * - Batch add support for high-frequency logging
 * - Efficient array management with in-place modifications
 * - Configurable throttle settings
 */

export interface LogEntry {
  id: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  module?: string;
  data?: unknown;
}

export interface LogStoreConfig {
  maxEntries: number;
  /** Notification debounce delay in ms (0 = immediate) */
  debounceMs: number;
  /** Maximum pending entries before force flush */
  batchFlushThreshold: number;
}

type LogSubscriber = (logs: LogEntry[]) => void;

const DEFAULT_CONFIG: LogStoreConfig = {
  maxEntries: 200,
  debounceMs: 50,
  batchFlushThreshold: 100,
};

class LogStore {
  private logs: LogEntry[] = [];
  private subscribers: Set<LogSubscriber> = new Set();
  private config: LogStoreConfig = { ...DEFAULT_CONFIG };
  private idCounter: number = 0;
  private pendingNotification: ReturnType<typeof setTimeout> | null = null;
  private pendingCount: number = 0;

  /**
   * Add a single log entry
   */
  add(level: LogEntry['level'], message: string, meta?: { module?: string; data?: unknown }) {
    const entry: LogEntry = {
      id: this.idCounter++,
      level,
      message,
      timestamp: new Date(),
      module: meta?.module,
      data: meta?.data,
    };

    // Add to beginning efficiently
    this.logs.unshift(entry);
    
    // Trim if over limit
    if (this.logs.length > this.config.maxEntries) {
      this.logs.length = this.config.maxEntries;
    }

    this.pendingCount++;
    this.scheduleNotify();
  }

  /**
   * Add multiple log entries at once (batch operation)
   */
  addBatch(entries: Array<{ level: LogEntry['level']; message: string; meta?: { module?: string; data?: unknown } }>) {
    const newEntries = entries.map(e => ({
      id: this.idCounter++,
      level: e.level,
      message: e.message,
      timestamp: new Date(),
      module: e.meta?.module,
      data: e.meta?.data,
    }));

    // Add all at once
    this.logs.unshift(...newEntries);
    
    // Trim if over limit
    if (this.logs.length > this.config.maxEntries) {
      this.logs.length = this.config.maxEntries;
    }

    this.pendingCount += entries.length;
    this.scheduleNotify();
  }

  /**
   * Get all logs
   */
  getAll(): LogEntry[] {
    return this.logs;
  }

  /**
   * Get logs by level
   */
  getByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by module
   */
  getByModule(module: string): LogEntry[] {
    return this.logs.filter(log => log.module === module);
  }

  /**
   * Get logs since a timestamp
   */
  getSince(since: Date): LogEntry[] {
    return this.logs.filter(log => log.timestamp >= since);
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
    this.idCounter = 0;
    this.pendingCount = 0;
    this.flushNotify();
  }

  /**
   * Subscribe to log updates
   */
  subscribe(fn: LogSubscriber): () => void {
    this.subscribers.add(fn);
    fn(this.logs);
    return () => this.subscribers.delete(fn);
  }

  /**
   * Set max entries limit
   */
  setMaxEntries(max: number) {
    this.config.maxEntries = max;
    if (this.logs.length > max) {
      this.logs.length = max;
      this.scheduleNotify();
    }
  }

  /**
   * Configure store settings
   */
  configure(config: Partial<LogStoreConfig>) {
    this.config = { ...this.config, ...config };
    if (this.logs.length > this.config.maxEntries) {
      this.logs.length = this.config.maxEntries;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): LogStoreConfig {
    return { ...this.config };
  }

  /**
   * Get store statistics
   */
  getStats(): { totalEntries: number; pendingNotifications: number; subscriberCount: number } {
    return {
      totalEntries: this.logs.length,
      pendingNotifications: this.pendingCount,
      subscriberCount: this.subscribers.size,
    };
  }

  /**
   * Schedule a debounced notification
   */
  private scheduleNotify() {
    // If debounce is disabled, notify immediately
    if (this.config.debounceMs === 0) {
      this.flushNotify();
      return;
    }

    // Force flush if pending count exceeds threshold
    if (this.pendingCount >= this.config.batchFlushThreshold) {
      this.flushNotify();
      return;
    }

    // Schedule debounced notification
    if (this.pendingNotification === null) {
      this.pendingNotification = setTimeout(() => {
        this.flushNotify();
      }, this.config.debounceMs);
    }
  }

  /**
   * Immediately flush pending notifications
   */
  private flushNotify() {
    if (this.pendingNotification !== null) {
      clearTimeout(this.pendingNotification);
      this.pendingNotification = null;
    }
    this.pendingCount = 0;
    this.subscribers.forEach(fn => {
      try {
        fn(this.logs);
      } catch {
        // Ignore subscriber errors
      }
    });
  }
}

export const logStore = new LogStore();
