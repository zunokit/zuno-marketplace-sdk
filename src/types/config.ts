/**
 * SDK Configuration Types
 */

import ms from 'ms';
import type { QueryClient } from '@tanstack/react-query';
import type { ethers } from 'ethers';
import type { LoggerConfig } from '../utils/logger';

/**
 * Default cache time constants (in milliseconds)
 * These can be overridden via CacheConfig
 */
export const DEFAULT_CACHE_TIMES = {
  /** Default stale time for queries (5 minutes) */
  STALE_TIME: ms('5m'),
  /** Default garbage collection time (10 minutes) */
  GC_TIME: ms('10m'),
  /** Extended stale time for rarely changing data like networks (30 minutes) */
  STALE_TIME_EXTENDED: ms('30m'),
  /** Extended garbage collection time (1 hour) */
  GC_TIME_EXTENDED: ms('1h'),
} as const;

/**
 * Supported blockchain networks
 */
export type NetworkType = 'mainnet' | 'sepolia' | 'polygon' | 'arbitrum' | number;

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Backoff strategy for retries
   * @default 'exponential'
   */
  backoff?: 'linear' | 'exponential';

  /**
   * Initial delay in milliseconds
   * @default 1000
   */
  initialDelay?: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /**
   * Time-to-live for cached items in milliseconds
   * @default 300000 (5 minutes)
   */
  ttl?: number;

  /**
   * Garbage collection time in milliseconds
   * @default 600000 (10 minutes)
   */
  gcTime?: number;
}

/**
 * Main SDK configuration
 */
export interface ZunoSDKConfig {
  /**
   * API key for Zuno services
   * @required
   */
  apiKey: string;

  /**
   * Network to connect to
   * @required
   */
  network: NetworkType;

  /**
   * Custom API URL for all Zuno services (ABIs, contracts, networks)
   * @optional
   * @default 'https://api.zuno.com/v1'
   */
  apiUrl?: string;

  /**
   * Custom RPC URL for blockchain connection
   * @optional
   */
  rpcUrl?: string;

  /**
   * WalletConnect project ID (required for WalletConnect v2)
   * @optional
   */
  walletConnectProjectId?: string;

  /**
   * Cache configuration
   * @optional
   */
  cache?: CacheConfig;

  /**
   * Retry policy for failed requests
   * @optional
   */
  retryPolicy?: RetryPolicy;

  /**
   * Logger configuration
   * @optional
   */
  logger?: LoggerConfig;

  /**
   * Enable debug logging (deprecated - use logger.level instead)
   * @default false
   * @deprecated Use logger.level = 'debug' instead
   */
  debug?: boolean;
}

/**
 * SDK initialization options
 */
export interface SDKOptions {
  /**
   * Ethers provider instance
   * @optional
   */
  provider?: ethers.Provider;

  /**
   * Ethers signer instance
   * @optional
   */
  signer?: ethers.Signer;

  /**
   * TanStack Query client instance
   * @optional
   */
  queryClient?: QueryClient;
}
