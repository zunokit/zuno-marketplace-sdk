/**
 * Zuno DevTools Component
 * A floating panel for debugging SDK operations during development
 */

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logStore, type LogEntry } from '../../utils/logStore';
import { transactionStore, type TransactionEntry } from '../../utils/transactionStore';
import { ZunoContext } from '../provider/ZunoContextProvider';

export interface DevToolsConfig {
  /** Show transaction history panel */
  showTransactions?: boolean;
  /** Show React Query cache panel */
  showCache?: boolean;
  /** Show network/connection status */
  showNetwork?: boolean;
  /** Show logger output */
  showLogger?: boolean;
  /** Initial position */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Maximum log entries to keep */
  maxLogEntries?: number;
  /** Maximum transactions to keep */
  maxTransactions?: number;
}

export interface ZunoDevToolsProps {
  /** DevTools configuration */
  config?: DevToolsConfig;
}

const DEFAULT_CONFIG: Required<DevToolsConfig> = {
  showTransactions: true,
  showCache: true,
  showNetwork: true,
  showLogger: true,
  position: 'bottom-right',
  defaultCollapsed: true,
  maxLogEntries: 100,
  maxTransactions: 50,
};

// Styles as objects for inline styling (no external CSS required)
const styles = {
  container: (position: string, collapsed: boolean): React.CSSProperties => ({
    position: 'fixed',
    zIndex: 99999,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '12px',
    ...(position.includes('bottom') ? { bottom: '16px' } : { top: '16px' }),
    ...(position.includes('right') ? { right: '16px' } : { left: '16px' }),
    width: collapsed ? 'auto' : '400px',
    maxHeight: collapsed ? 'auto' : '500px',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    border: '1px solid #2d2d44',
    overflow: 'hidden',
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: '#16213e',
    borderBottom: '1px solid #2d2d44',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  title: {
    color: '#00d9ff',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    padding: '4px',
    fontSize: '14px',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #2d2d44',
    backgroundColor: '#1a1a2e',
  },
  tab: (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    border: 'none',
    background: active ? '#2d2d44' : 'transparent',
    color: active ? '#00d9ff' : '#888',
    cursor: 'pointer',
    borderBottom: active ? '2px solid #00d9ff' : '2px solid transparent',
    transition: 'all 0.2s',
  }),
  content: {
    padding: '12px',
    overflowY: 'auto' as const,
    maxHeight: '400px',
    color: '#e0e0e0',
  },
  logEntry: (level: string): React.CSSProperties => ({
    padding: '6px 8px',
    marginBottom: '4px',
    borderRadius: '4px',
    backgroundColor: level === 'error' ? '#3d1f1f' : level === 'warn' ? '#3d3d1f' : '#1f1f3d',
    borderLeft: `3px solid ${
      level === 'error' ? '#ff4757' : level === 'warn' ? '#ffa502' : level === 'info' ? '#00d9ff' : '#888'
    }`,
  }),
  timestamp: {
    color: '#666',
    fontSize: '10px',
    marginRight: '8px',
  },
  txStatus: (status: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 600,
    backgroundColor: status === 'success' ? '#1f3d1f' : status === 'failed' ? '#3d1f1f' : '#3d3d1f',
    color: status === 'success' ? '#2ed573' : status === 'failed' ? '#ff4757' : '#ffa502',
  }),
  cacheEntry: {
    padding: '8px',
    marginBottom: '4px',
    backgroundColor: '#1f1f3d',
    borderRadius: '4px',
    wordBreak: 'break-all' as const,
  },
  badge: (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: 600,
    backgroundColor: color,
    color: '#fff',
    marginLeft: '8px',
  }),
  networkStatus: (connected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: connected ? '#1f3d1f' : '#3d1f1f',
    borderRadius: '4px',
    marginBottom: '8px',
  }),
  dot: (color: string): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: color,
  }),
  clearButton: {
    padding: '4px 8px',
    backgroundColor: '#2d2d44',
    border: 'none',
    borderRadius: '4px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '11px',
  },
};

/**
 * Format data for display
 */
function formatData(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * Log Entry Item Component with expandable data
 */
function LogEntryItem({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasData = log.data !== undefined && log.data !== null;

  return (
    <div style={styles.logEntry(log.level)}>
      <div 
        style={{ cursor: hasData ? 'pointer' : 'default', display: 'flex', alignItems: 'flex-start', gap: '4px' }}
        onClick={() => hasData && setExpanded(!expanded)}
      >
        {hasData && (
          <span style={{ color: '#888', fontSize: '10px', marginTop: '2px' }}>
            {expanded ? '▼' : '▶'}
          </span>
        )}
        <div style={{ flex: 1 }}>
          <span style={styles.timestamp}>{log.timestamp.toLocaleTimeString()}</span>
          <span style={{ color: log.level === 'error' ? '#ff4757' : log.level === 'warn' ? '#ffa502' : '#e0e0e0' }}>
            [{log.level.toUpperCase()}]
          </span>{' '}
          {log.module && <span style={{ color: '#00d9ff' }}>[{log.module}] </span>}
          {log.message}
        </div>
      </div>
      {expanded && hasData && (
        <pre style={{
          margin: '8px 0 0 16px',
          padding: '8px',
          backgroundColor: '#0d0d1a',
          borderRadius: '4px',
          fontSize: '11px',
          overflow: 'auto',
          maxHeight: '200px',
          color: '#a0e0a0',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          {formatData(log.data)}
        </pre>
      )}
    </div>
  );
}

/**
 * Zuno DevTools Component
 * Provides visual debugging tools for SDK operations
 *
 * @example
 * ```tsx
 * import { ZunoDevTools } from 'zuno-marketplace-sdk/devtools';
 *
 * function App() {
 *   return (
 *     <>
 *       <YourApp />
 *       {process.env.NODE_ENV === 'development' && (
 *         <ZunoDevTools
 *           config={{
 *             showTransactions: true,
 *             showCache: true,
 *             showLogger: true,
 *             position: 'bottom-right',
 *           }}
 *         />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function ZunoDevTools({ config: userConfig }: ZunoDevToolsProps) {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // Get SDK from context (safe - returns null if not in provider)
  const context = useContext(ZunoContext);
  const sdk = context?.sdk;
  const queryClient = useQueryClient();

  const [collapsed, setCollapsed] = useState(config.defaultCollapsed);
  const [activeTab, setActiveTab] = useState<'logs' | 'transactions' | 'cache' | 'network'>('logs');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);
  const [cacheEntries, setCacheEntries] = useState<{ key: string; state: string }[]>([]);

  // Subscribe to logStore
  useEffect(() => {
    logStore.setMaxEntries(config.maxLogEntries);
    return logStore.subscribe(setLogs);
  }, [config.maxLogEntries]);

  // Subscribe to transactionStore
  useEffect(() => {
    transactionStore.setMaxEntries(config.maxTransactions);
    return transactionStore.subscribe(setTransactions);
  }, [config.maxTransactions]);

  // Refresh cache entries
  const refreshCache = useCallback(() => {
    if (!queryClient) return;

    const cache = queryClient.getQueryCache().getAll();
    setCacheEntries(
      cache.map((query) => ({
        key: JSON.stringify(query.queryKey),
        state: query.state.status,
      }))
    );
  }, [queryClient]);

  useEffect(() => {
    if (activeTab === 'cache') {
      refreshCache();
      const interval = setInterval(refreshCache, 2000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [activeTab, refreshCache]);

  // Clear logs
  const clearLogs = () => logStore.clear();
  const clearTransactions = () => transactionStore.clear();

  // Get network info from SDK
  const networkInfo = sdk?.getConfig() ?? { network: 'unknown', apiKey: '' };
  const hasProvider = !!sdk?.getProvider();
  const hasSigner = !!sdk?.getSigner();

  if (collapsed) {
    return (
      <div style={styles.container(config.position, true)}>
        <div style={styles.header} onClick={() => setCollapsed(false)}>
          <span style={styles.title}>
            <span>🔧</span>
            <span>Zuno DevTools</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container(config.position, false)}>
      <div style={styles.header} onClick={() => setCollapsed(true)}>
        <span style={styles.title}>
          <span>🔧</span>
          <span>Zuno DevTools</span>
          <span style={styles.badge('#00d9ff')}>{logs.length}</span>
        </span>
        <button style={styles.toggleButton}>−</button>
      </div>

      <div style={styles.tabs}>
        {config.showLogger && (
          <button style={styles.tab(activeTab === 'logs')} onClick={() => setActiveTab('logs')}>
            Logs
          </button>
        )}
        {config.showTransactions && (
          <button style={styles.tab(activeTab === 'transactions')} onClick={() => setActiveTab('transactions')}>
            Transactions
          </button>
        )}
        {config.showCache && (
          <button style={styles.tab(activeTab === 'cache')} onClick={() => setActiveTab('cache')}>
            Cache
          </button>
        )}
        {config.showNetwork && (
          <button style={styles.tab(activeTab === 'network')} onClick={() => setActiveTab('network')}>
            Network
          </button>
        )}
      </div>

      <div style={styles.content}>
        {activeTab === 'logs' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button style={styles.clearButton} onClick={clearLogs}>
                Clear
              </button>
            </div>
            {logs.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                <div>No logs yet</div>
                <div style={{ fontSize: '10px', marginTop: '8px', color: '#555' }}>
                  Enable logging: {`{ debug: true }`} or {`{ logger: { level: 'debug' } }`}
                </div>
              </div>
            ) : (
              logs.map((log) => (
                <LogEntryItem key={log.id} log={log} />
              ))
            )}
          </>
        )}

        {activeTab === 'transactions' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button style={styles.clearButton} onClick={clearTransactions}>
                Clear
              </button>
            </div>
            {transactions.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                <div>No transactions yet</div>
                <div style={{ fontSize: '10px', marginTop: '8px', color: '#555' }}>
                  Transactions will appear when SDK methods are called
                </div>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} style={styles.cacheEntry}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#00d9ff' }}>[{tx.module}]</span>
                    <span style={styles.txStatus(tx.status)}>{tx.status}</span>
                  </div>
                  <div style={{ marginBottom: '4px' }}>{tx.action}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>
                    {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                  </div>
                  {tx.error && (
                    <div style={{ fontSize: '10px', color: '#ff4757', marginTop: '4px' }}>
                      {tx.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'cache' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button style={styles.clearButton} onClick={refreshCache}>
                Refresh
              </button>
            </div>
            {cacheEntries.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Cache is empty</div>
            ) : (
              cacheEntries.map((entry, i) => (
                <div key={i} style={styles.cacheEntry}>
                  <div style={{ marginBottom: '4px' }}>{entry.key}</div>
                  <span style={styles.txStatus(entry.state === 'success' ? 'success' : 'pending')}>{entry.state}</span>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'network' && (
          <>
            {!sdk && (
              <div style={{ color: '#ffa502', padding: '12px', backgroundColor: '#3d3d1f', borderRadius: '4px', marginBottom: '12px', fontSize: '11px' }}>
                SDK not found in context. Make sure DevTools is inside ZunoProvider.
              </div>
            )}
            <div style={styles.networkStatus(hasProvider)}>
              <span style={styles.dot(hasProvider ? '#2ed573' : '#ff4757')} />
              <span>Provider: {hasProvider ? 'Connected' : 'Not Connected'}</span>
            </div>
            <div style={styles.networkStatus(hasSigner)}>
              <span style={styles.dot(hasSigner ? '#2ed573' : '#ff4757')} />
              <span>Signer: {hasSigner ? 'Connected' : 'Not Connected'}</span>
            </div>
            <div style={styles.cacheEntry}>
              <div style={{ marginBottom: '4px', color: '#888' }}>Network</div>
              <div style={{ color: '#00d9ff' }}>{networkInfo.network || 'Unknown'}</div>
            </div>
            <div style={styles.cacheEntry}>
              <div style={{ marginBottom: '4px', color: '#888' }}>API Key</div>
              <div style={{ color: networkInfo.apiKey ? '#2ed573' : '#ff4757' }}>
                {networkInfo.apiKey ? '••••••••' + networkInfo.apiKey.slice(-4) : 'Not Set'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
