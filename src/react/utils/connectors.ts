/**
 * Connector utilities for wagmi configuration
 */

import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import type { CreateConnectorFn } from 'wagmi';

/**
 * Options for creating default connectors
 */
export interface CreateDefaultConnectorsOptions {
  /**
   * App name shown in wallet connection dialogs
   * @default "Zuno Marketplace"
   */
  appName?: string;
  
  /**
   * WalletConnect project ID (required for WalletConnect support)
   */
  walletConnectProjectId?: string;
  
  /**
   * Whether to include injected connector (MetaMask, etc.)
   * @default true
   */
  includeInjected?: boolean;
  
  /**
   * Whether to include Coinbase Wallet connector
   * @default true
   */
  includeCoinbaseWallet?: boolean;
  
  /**
   * Whether to include WalletConnect connector (requires projectId)
   * @default true if walletConnectProjectId is provided
   */
  includeWalletConnect?: boolean;
}

/**
 * Create default wallet connectors for wagmi.
 * 
 * @param options - Connector configuration options
 * @returns Array of wagmi connectors
 * 
 * @example
 * ```ts
 * // Basic usage (MetaMask + Coinbase)
 * const connectors = createDefaultConnectors();
 * 
 * // With WalletConnect
 * const connectors = createDefaultConnectors({
 *   walletConnectProjectId: 'your-project-id',
 * });
 * 
 * // Custom configuration
 * const connectors = createDefaultConnectors({
 *   appName: 'My App',
 *   walletConnectProjectId: 'your-project-id',
 *   includeCoinbaseWallet: false,
 * });
 * ```
 */
export function createDefaultConnectors(
  options: CreateDefaultConnectorsOptions = {}
): CreateConnectorFn[] {
  const {
    appName = 'Zuno Marketplace',
    walletConnectProjectId,
    includeInjected = true,
    includeCoinbaseWallet = true,
    includeWalletConnect = !!walletConnectProjectId,
  } = options;

  const connectors: CreateConnectorFn[] = [];

  // Injected connector (MetaMask, etc.)
  if (includeInjected) {
    connectors.push(injected());
  }

  // Coinbase Wallet
  if (includeCoinbaseWallet) {
    connectors.push(coinbaseWallet({ appName }));
  }

  // WalletConnect (requires project ID)
  if (includeWalletConnect && walletConnectProjectId) {
    connectors.push(
      walletConnect({
        projectId: walletConnectProjectId,
        showQrModal: true,
      })
    );
  }

  return connectors;
}

/**
 * Check if we're in a browser environment (for SSR safety)
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Create connectors only in browser environment (SSR-safe)
 * 
 * @param options - Connector configuration options
 * @returns Array of wagmi connectors (empty array on server)
 * 
 * @example
 * ```ts
 * // SSR-safe connector creation
 * const connectors = createSSRSafeConnectors({
 *   walletConnectProjectId: 'your-project-id',
 * });
 * ```
 */
export function createSSRSafeConnectors(
  options: CreateDefaultConnectorsOptions = {}
): CreateConnectorFn[] {
  if (!isBrowser()) {
    return [];
  }
  return createDefaultConnectors(options);
}

export default createDefaultConnectors;
