/**
 * Browser environment detection utilities
 * Separated from connectors to avoid pulling in wagmi ESM dependencies in tests
 */

/**
 * Check if we're in a browser environment (for SSR safety)
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}
