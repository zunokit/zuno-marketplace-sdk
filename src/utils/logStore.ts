/**
 * Centralized Log Store for Zuno DevTools
 * Stores logs in memory and notifies subscribers
 */

export interface LogEntry {
  id: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  module?: string;
  data?: unknown;
}

type LogSubscriber = (logs: LogEntry[]) => void;

class LogStore {
  private logs: LogEntry[] = [];
  private subscribers: Set<LogSubscriber> = new Set();
  private maxEntries: number = 200;
  private idCounter: number = 0;

  add(level: LogEntry['level'], message: string, meta?: { module?: string; data?: unknown }) {
    const entry: LogEntry = {
      id: this.idCounter++,
      level,
      message,
      timestamp: new Date(),
      module: meta?.module,
      data: meta?.data,
    };

    this.logs = [entry, ...this.logs].slice(0, this.maxEntries);
    this.notify();
  }

  getAll(): LogEntry[] {
    return this.logs;
  }

  clear() {
    this.logs = [];
    this.idCounter = 0;
    this.notify();
  }

  subscribe(fn: LogSubscriber): () => void {
    this.subscribers.add(fn);
    fn(this.logs);
    return () => this.subscribers.delete(fn);
  }

  setMaxEntries(max: number) {
    this.maxEntries = max;
    this.logs = this.logs.slice(0, max);
  }

  private notify() {
    this.subscribers.forEach(fn => fn(this.logs));
  }
}

export const logStore = new LogStore();
