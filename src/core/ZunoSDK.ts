/**
 * Main SDK class for Zuno Marketplace
 */

import { QueryClient } from "@tanstack/react-query";
import { ethers } from "ethers";
import { ZunoAPIClient } from "./ZunoAPIClient";
import { ContractRegistry } from "./ContractRegistry";
import { ExchangeModule } from "../modules/ExchangeModule";
import { CollectionModule } from "../modules/CollectionModule";
import { AuctionModule } from "../modules/AuctionModule";
import { EventEmitter } from "../utils/events";
import { ZunoSDKError, ErrorCodes } from "../utils/errors";
import { ZunoLogger, createNoOpLogger, type Logger } from "../utils/logger";
import { logStore } from "../utils/logStore";
import type { ZunoSDKConfig, SDKOptions } from "../types/config";

// Singleton instance (module-level private variable)
let _singletonInstance: ZunoSDK | null = null;

/**
 * Main Zuno SDK class
 */
export class ZunoSDK extends EventEmitter {
  private readonly config: ZunoSDKConfig;
  private readonly apiClient: ZunoAPIClient;
  readonly contractRegistry: ContractRegistry;
  private readonly queryClient: QueryClient;
  private provider?: ethers.Provider;
  private signer?: ethers.Signer;

  /**
   * Public logger instance - users can access for custom logging
   * @example sdk.logger.info('Custom message')
   */
  public readonly logger: Logger;

  // Feature modules (lazy loaded)
  private _exchange?: ExchangeModule;
  private _collection?: CollectionModule;
  private _auction?: AuctionModule;
  private _offers?: any; // Placeholder for OffersModule
  private _bundles?: any; // Placeholder for BundlesModule

  constructor(config: ZunoSDKConfig, options?: SDKOptions) {
    super();

    // Validate config
    this.validateConfig(config);

    this.config = config;

    // Initialize logger
    // Backward compatibility: if debug=true, set logger level to 'debug'
    const loggerConfig = config.logger || {};
    if (config.debug && !loggerConfig.level) {
      loggerConfig.level = "debug";
    }

    // Create logger or no-op logger
    if (
      loggerConfig.level === "none" ||
      (!loggerConfig.level && !config.debug)
    ) {
      this.logger = createNoOpLogger();
    } else {
      const zunoLogger = new ZunoLogger(loggerConfig);
      // Set SDK context for error logging
      zunoLogger.setContext({
        network: config.network,
        apiUrl: config.apiUrl,
        version: "1.1.5", // Will be updated dynamically
      });
      this.logger = zunoLogger;
    }

    // Log SDK initialization
    this.logger.info("Zuno SDK initialized", {
      module: "SDK",
      data: {
        network: config.network,
        hasProvider: !!options?.provider,
        hasSigner: !!options?.signer,
      },
    });

    // Initialize API client
    this.apiClient = new ZunoAPIClient(config.apiKey, config.apiUrl);

    // Initialize or use provided QueryClient
    this.queryClient = options?.queryClient || this.createDefaultQueryClient();

    // Initialize contract registry
    this.contractRegistry = new ContractRegistry(
      this.apiClient,
      this.queryClient
    );

    // Set provider and signer
    this.provider = options?.provider ?? this.createDefaultProvider(config);
    this.signer = options?.signer;

    // Auto-prefetch essential ABIs for better performance
    this.prefetchEssentialABIs().catch((error) => {
      this.logger.warn("Failed to prefetch essential ABIs", {
        module: "SDK",
        data: { error: error.message },
      });
    });
  }

  /**
   * Exchange module (marketplace trading)
   */
  get exchange(): ExchangeModule {
    if (!this._exchange) {
      // Create module-specific logger
      const moduleLogger = (this.logger as any).createModuleLogger
        ? (this.logger as any).createModuleLogger("Exchange")
        : this.logger;

      this._exchange = new ExchangeModule(
        this.apiClient,
        this.contractRegistry,
        this.queryClient,
        this.config.network,
        moduleLogger,
        this,
        this.provider,
        this.signer
      );
    }

    return this._exchange;
  }

  /**
   * Collection module (NFT collections & minting)
   */
  get collection(): CollectionModule {
    if (!this._collection) {
      // Create module-specific logger
      const moduleLogger = (this.logger as any).createModuleLogger
        ? (this.logger as any).createModuleLogger("Collection")
        : this.logger;

      this._collection = new CollectionModule(
        this.apiClient,
        this.contractRegistry,
        this.queryClient,
        this.config.network,
        moduleLogger,
        this,
        this.provider,
        this.signer
      );
    }

    return this._collection;
  }

  /**
   * Auction module (English & Dutch auctions)
   */
  get auction(): AuctionModule {
    if (!this._auction) {
      // Create module-specific logger
      const moduleLogger = (this.logger as any).createModuleLogger
        ? (this.logger as any).createModuleLogger("Auction")
        : this.logger;

      this._auction = new AuctionModule(
        this.apiClient,
        this.contractRegistry,
        this.queryClient,
        this.config.network,
        moduleLogger,
        this,
        this.provider,
        this.signer
      );
    }

    return this._auction;
  }

  /**
   * Offers module (placeholder for MVP)
   */
  get offers(): any {
    if (!this._offers) {
      // Placeholder module for MVP
      this._offers = {
        makeOffer: async () => {
          throw new Error("Offers module not implemented yet");
        },
        acceptOffer: async () => {
          throw new Error("Offers module not implemented yet");
        },
        cancelOffer: async () => {
          throw new Error("Offers module not implemented yet");
        },
      };
    }

    return this._offers;
  }

  /**
   * Bundles module (placeholder for MVP)
   */
  get bundles(): any {
    if (!this._bundles) {
      // Placeholder module for MVP
      this._bundles = {
        createBundle: async () => {
          throw new Error("Bundles module not implemented yet");
        },
        buyBundle: async () => {
          throw new Error("Bundles module not implemented yet");
        },
        cancelBundle: async () => {
          throw new Error("Bundles module not implemented yet");
        },
      };
    }

    return this._bundles;
  }

  /**
   * Update provider and signer
   */
  updateProvider(provider: ethers.Provider, signer?: ethers.Signer): void {
    this.provider = provider;
    this.signer = signer;

    // Update all initialized modules
    if (this._exchange) {
      this._exchange.updateProvider(provider, signer);
    }

    if (this._collection) {
      this._collection.updateProvider(provider, signer);
    }

    if (this._auction) {
      this._auction.updateProvider(provider, signer);
    }

    this.emit("providerUpdated", { provider, signer });

    this.logger.debug("Provider updated", { module: "ZunoSDK" });
  }

  /**
   * Get current provider
   */
  getProvider(): ethers.Provider | undefined {
    return this.provider;
  }

  /**
   * Get current signer
   */
  getSigner(): ethers.Signer | undefined {
    return this.signer;
  }

  /**
   * Get SDK configuration
   */
  getConfig(): Readonly<ZunoSDKConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Get QueryClient instance
   */
  getQueryClient(): QueryClient {
    return this.queryClient;
  }

  /**
   * Get API Client instance (for advanced usage)
   */
  getAPIClient(): ZunoAPIClient {
    return this.apiClient;
  }

  /**
   * Prefetch essential ABIs for MVP operations
   */
  async prefetchEssentialABIs(): Promise<void> {
    const essentialContracts = [
      "ERC721NFTExchange",
      "ERC721CollectionFactory",
      "ERC1155CollectionFactory",
    ] as const;

    const networkId =
      typeof this.config.network === "number"
        ? this.config.network.toString()
        : this.config.network;

    await this.contractRegistry.prefetchABIs(
      [...essentialContracts],
      networkId
    );

    this.logger.debug("Essential ABIs prefetched", { module: "ZunoSDK" });
  }

  /**
   * Prefetch ABIs for all contract types
   */
  async prefetchABIs(): Promise<void> {
    const contractTypes = [
      "ERC721NFTExchange",
      "ERC1155NFTExchange",
      "ERC721CollectionFactory",
      "ERC1155CollectionFactory",
      "EnglishAuctionImplementation",
      "DutchAuctionImplementation",
      "OfferManager",
      "BundleMarketplace",
    ] as const;

    const networkId =
      typeof this.config.network === "number"
        ? this.config.network.toString()
        : this.config.network;

    await this.contractRegistry.prefetchABIs([...contractTypes], networkId);

    this.logger.debug("ABIs prefetched", { module: "ZunoSDK" });
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    await this.contractRegistry.clearCache();
    this.queryClient.clear();

    this.logger.debug("Cache cleared", { module: "ZunoSDK" });
  }

  /**
   * Create default provider from config
   */
  private createDefaultProvider(
    config: ZunoSDKConfig
  ): ethers.Provider | undefined {
    return config.rpcUrl ? new ethers.JsonRpcProvider(config.rpcUrl) : undefined;
  }

  /**
   * Validate SDK configuration
   */
  private validateConfig(config: ZunoSDKConfig): void {
    if (!config.apiKey) {
      throw new ZunoSDKError(ErrorCodes.MISSING_API_KEY, "API key is required");
    }

    if (!config.network) {
      throw new ZunoSDKError(ErrorCodes.INVALID_NETWORK, "Network is required");
    }

    // Validate network type
    const validNetworks = ["mainnet", "sepolia", "polygon", "arbitrum"];
    if (
      typeof config.network === "string" &&
      !validNetworks.includes(config.network)
    ) {
      // Note: Logger not yet initialized, use logStore directly
      if (config.debug) {
        logStore.add('warn', `Unknown network: ${config.network}. Using custom chain ID.`, { module: 'ZunoSDK' });
      }
    }
  }

  /**
   * Create default QueryClient with recommended settings
   */
  private createDefaultQueryClient(): QueryClient {
    const cacheConfig = this.config.cache || {};

    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: cacheConfig.ttl || 5 * 60 * 1000, // 5 minutes
          gcTime: cacheConfig.gcTime || 10 * 60 * 1000, // 10 minutes
          retry: this.config.retryPolicy?.maxRetries || 3,
          retryDelay: (attemptIndex) => {
            const delay = this.config.retryPolicy?.initialDelay || 1000;
            return this.config.retryPolicy?.backoff === "exponential"
              ? Math.min(delay * 2 ** attemptIndex, 30000)
              : delay * (attemptIndex + 1);
          },
        },
      },
    });
  }

  // ============================================
  // STATIC SINGLETON METHODS
  // ============================================

  /**
   * Initialize and retrieve singleton SDK instance
   *
   * Use this for non-React contexts like API routes, utilities,
   * server components, and background tasks.
   *
   * @param config - SDK configuration (required on first call)
   * @returns Singleton SDK instance
   *
   * @throws {ZunoSDKError} If config not provided on first call
   *
   * @example
   * ```typescript
   * // Initialize once in app entry point
   * ZunoSDK.getInstance({
   *   apiKey: process.env.ZUNO_API_KEY,
   *   network: 'sepolia'
   * });
   *
   * // Use anywhere in non-React code
   * const sdk = ZunoSDK.getInstance();
   * sdk.logger.info('Processing NFT data');
   * await sdk.exchange.listNFT(params);
   * ```
   */
  static getInstance(config?: ZunoSDKConfig): ZunoSDK {
    if (!_singletonInstance) {
      if (!config) {
        throw new ZunoSDKError(
          ErrorCodes.INVALID_CONFIG,
          "Config required for first getInstance call. Initialize with ZunoSDK.getInstance(config) first."
        );
      }
      _singletonInstance = new ZunoSDK(config);
    }
    return _singletonInstance;
  }

  /**
   * Reset singleton instance (useful for testing)
   *
   * @example
   * ```typescript
   * afterEach(() => {
   *   ZunoSDK.resetInstance();
   * });
   * ```
   */
  static resetInstance(): void {
    _singletonInstance = null;
  }

  /**
   * Check if singleton instance is initialized
   *
   * @returns true if singleton has been initialized
   */
  static hasInstance(): boolean {
    return _singletonInstance !== null;
  }

  /**
   * Get logger from singleton instance
   * Static convenience method for accessing logger anywhere
   *
   * @returns Logger instance
   * @throws {ZunoSDKError} If getInstance not called with config first
   *
   * @example
   * ```typescript
   * import { ZunoSDK } from 'zuno-marketplace-sdk';
   *
   * const logger = ZunoSDK.getLogger();
   * logger.info('Processing data');
   * ```
   */
  static getLogger(): Logger {
    return ZunoSDK.getInstance().logger;
  }
}

/**
 * Get SDK singleton instance
 * Convenience function for cleaner imports
 *
 * @returns SDK singleton instance
 * @throws {ZunoSDKError} If getInstance not called with config first
 *
 * @example
 * ```typescript
 * import { getSdk } from 'zuno-marketplace-sdk';
 *
 * const sdk = getSdk();
 * await sdk.exchange.listNFT(params);
 * ```
 */
export function getSdk(): ZunoSDK {
  return ZunoSDK.getInstance();
}

/**
 * Get SDK logger from singleton instance
 * Convenience function for cleaner imports
 *
 * @returns Logger instance from SDK singleton
 * @throws {ZunoSDKError} If getInstance not called with config first
 *
 * @example
 * ```typescript
 * import { getLogger } from 'zuno-marketplace-sdk';
 *
 * const logger = getLogger();
 * logger.info('Message');
 * ```
 */
export function getLogger(): Logger {
  return ZunoSDK.getLogger();
}
