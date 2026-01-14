/**
 * SDK Initialization Examples
 *
 * This file demonstrates various initialization patterns for the Zuno Marketplace SDK
 *
 * @module examples/basics/initialization
 */

import { ZunoSDK } from 'zuno-marketplace-sdk';
import type { ZunoSDKConfig } from 'zuno-marketplace-sdk';

// ============================================================================
// BASIC INITIALIZATION
// ============================================================================

/**
 * Basic SDK initialization with minimal config
 */
export function basicInitialization() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  console.log('SDK initialized:', sdk.getConfig().network);
  return sdk;
}

// ============================================================================
// PRODUCTION INITIALIZATION
// ============================================================================

/**
 * Production-ready initialization with all config options
 */
export function productionInitialization() {
  const config: ZunoSDKConfig = {
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'mainnet',
    // Optional: Custom API endpoint
    apiUrl: 'https://api.zuno.com/v1',
    // Optional: Custom ABIs URL
    abisUrl: 'https://abis.zuno.com/api',
    // Optional: Logger configuration
    logger: {
      level: 'error', // Only log errors in production
      timestamp: true,
      modulePrefix: true,
      logTransactions: false, // Disable transaction logging in production
    },
  };

  const sdk = new ZunoSDK(config);
  console.log('Production SDK initialized');
  return sdk;
}

// ============================================================================
// DEVELOPMENT INITIALIZATION
// ============================================================================

/**
 * Development initialization with verbose logging
 */
export function developmentInitialization() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
    logger: {
      level: 'debug', // Log everything for debugging
      timestamp: true,
      modulePrefix: true,
      logTransactions: true,
      customLogger: {
        info: (msg, meta) => console.log(`[INFO] ${msg}`, meta),
        warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta),
        error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta),
        debug: (msg, meta) => console.debug(`[DEBUG] ${msg}`, meta),
      },
    },
  });

  console.log('Development SDK initialized with debug logging');
  return sdk;
}

// ============================================================================
// SIGNER INITIALIZATION (With Wallet)
// ============================================================================

/**
 * Initialize SDK with a signer for write operations
 * Requires ethers.js v6
 */
export async function initializationWithSigner() {
  const { ethers } = await import('ethers');

  // Create a provider (e.g., from window.ethereum for browser)
  const provider = new ethers.BrowserProvider(window.ethereum!);

  // Get signer from provider
  const signer = await provider.getSigner();

  // Initialize SDK with signer
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
    provider,
    signer,
  });

  console.log('SDK initialized with signer:', await signer.getAddress());
  return sdk;
}

// ============================================================================
// CUSTOM PROVIDER INITIALIZATION
// ============================================================================

/**
 * Initialize SDK with a custom RPC provider
 */
export function initializationWithCustomProvider() {
  const { ethers } = require('ethers');

  // Custom RPC endpoint
  const customRpcUrl = 'https://custom-rpc.example.com';

  // Create provider
  const provider = new ethers.JsonRpcProvider(customRpcUrl);

  // Initialize SDK
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
    provider,
  });

  console.log('SDK initialized with custom provider');
  return sdk;
}

// ============================================================================
// SINGLETON PATTERN (Recommended for Apps)
// ============================================================================

/**
 * Singleton pattern for SDK instance
 * Use this to ensure only one SDK instance exists in your application
 */
class SDKManager {
  private static instance: ZunoSDK | null = null;

  static getInstance(config?: ZunoSDKConfig): ZunoSDK {
    if (!this.instance) {
      if (!config) {
        throw new Error('SDK config required for first initialization');
      }
      this.instance = new ZunoSDK(config);
    }
    return this.instance;
  }

  static reset() {
    this.instance = null;
  }
}

// Usage
export function singletonExample() {
  const sdk = SDKManager.getInstance({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  console.log('Singleton SDK initialized');
  return sdk;
}

// ============================================================================
// MULTI-NETWORK INITIALIZATION
// ============================================================================

/**
 * Initialize SDK instances for multiple networks
 */
export function multiNetworkInitialization() {
  const mainnetSDK = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'mainnet',
  });

  const sepoliaSDK = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  console.log('Multi-network SDK initialized');
  return { mainnetSDK, sepoliaSDK };
}

// ============================================================================
// CONFIG VALIDATION
// ============================================================================

/**
 * Initialize SDK with config validation
 */
export function validatedInitialization() {
  const config: ZunoSDKConfig = {
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia' as const,
  };

  // Validate required fields
  if (!config.apiKey) {
    throw new Error('API key is required');
  }

  if (!['mainnet', 'sepolia', 'localhost'].includes(config.network)) {
    throw new Error('Invalid network. Use: mainnet, sepolia, or localhost');
  }

  const sdk = new ZunoSDK(config);
  console.log('SDK initialized with validated config');
  return sdk;
}

// ============================================================================
// RUN EXAMPLE
// ============================================================================

/**
 * Run all initialization examples
 */
export async function runInitializationExamples() {
  console.log('=== Basic Initialization ===');
  basicInitialization();

  console.log('\n=== Production Initialization ===');
  productionInitialization();

  console.log('\n=== Development Initialization ===');
  developmentInitialization();

  console.log('\n=== Singleton Pattern ===');
  singletonExample();

  console.log('\n=== Multi-Network Initialization ===');
  multiNetworkInitialization();

  console.log('\n=== Validated Initialization ===');
  validatedInitialization();
}

// Run if executed directly
if (require.main === module) {
  runInitializationExamples().catch(console.error);
}
