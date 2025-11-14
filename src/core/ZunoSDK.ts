/**
 * Main SDK class for Zuno Marketplace
 */

import { QueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { ZunoAPIClient } from './ZunoAPIClient';
import { ContractRegistry } from './ContractRegistry';
import { ExchangeModule } from '../modules/ExchangeModule';
import { CollectionModule } from '../modules/CollectionModule';
import { AuctionModule } from '../modules/AuctionModule';
import { EventEmitter } from '../utils/events';
import { ZunoSDKError, ErrorCodes } from '../utils/errors';
import type { ZunoSDKConfig, SDKOptions } from '../types/config';

/**
 * Main Zuno SDK class
 */
export class ZunoSDK extends EventEmitter {
  private readonly config: ZunoSDKConfig;
  private readonly apiClient: ZunoAPIClient;
  private readonly contractRegistry: ContractRegistry;
  private readonly queryClient: QueryClient;
  private provider?: ethers.Provider;
  private signer?: ethers.Signer;

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

    // Initialize API client
    this.apiClient = new ZunoAPIClient(
      config.apiKey,
      config.apiUrl,
      config.abisUrl
    );

    // Initialize or use provided QueryClient
    this.queryClient = options?.queryClient || this.createDefaultQueryClient();

    // Initialize contract registry
    this.contractRegistry = new ContractRegistry(
      this.apiClient,
      this.queryClient
    );

    // Set provider and signer if provided
    if (options?.provider) {
      this.provider = options.provider;
    }

    if (options?.signer) {
      this.signer = options.signer;
    }

    // Auto-prefetch essential ABIs for better performance
    this.prefetchEssentialABIs().catch((error) => {
      if (config.debug) {
        console.warn('[ZunoSDK] Failed to prefetch essential ABIs:', error);
      }
    });

    // Log initialization in debug mode
    if (config.debug) {
      console.log('[ZunoSDK] Initialized with config:', {
        network: config.network,
        apiUrl: config.apiUrl,
        hasProvider: !!this.provider,
        hasSigner: !!this.signer,
      });
    }
  }

  /**
   * Exchange module (marketplace trading)
   */
  get exchange(): ExchangeModule {
    if (!this._exchange) {
      this._exchange = new ExchangeModule(
        this.apiClient,
        this.contractRegistry,
        this.queryClient,
        this.config.network,
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
      this._collection = new CollectionModule(
        this.apiClient,
        this.contractRegistry,
        this.queryClient,
        this.config.network,
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
      this._auction = new AuctionModule(
        this.apiClient,
        this.contractRegistry,
        this.queryClient,
        this.config.network,
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
        makeOffer: async () => { throw new Error('Offers module not implemented yet'); },
        acceptOffer: async () => { throw new Error('Offers module not implemented yet'); },
        cancelOffer: async () => { throw new Error('Offers module not implemented yet'); },
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
        createBundle: async () => { throw new Error('Bundles module not implemented yet'); },
        buyBundle: async () => { throw new Error('Bundles module not implemented yet'); },
        cancelBundle: async () => { throw new Error('Bundles module not implemented yet'); },
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

    this.emit('providerUpdated', { provider, signer });

    if (this.config.debug) {
      console.log('[ZunoSDK] Provider updated');
    }
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
      'ERC721NFTExchange',
      'ERC721CollectionFactory',
      'ERC1155CollectionFactory',
    ] as const;

    const networkId =
      typeof this.config.network === 'number'
        ? this.config.network.toString()
        : this.config.network;

    await this.contractRegistry.prefetchABIs([...essentialContracts], networkId);

    if (this.config.debug) {
      console.log('[ZunoSDK] Essential ABIs prefetched');
    }
  }

  /**
   * Prefetch ABIs for all contract types
   */
  async prefetchABIs(): Promise<void> {
    const contractTypes = [
      'ERC721NFTExchange',
      'ERC1155NFTExchange',
      'ERC721CollectionFactory',
      'ERC1155CollectionFactory',
      'EnglishAuction',
      'DutchAuction',
      'OfferManager',
      'BundleMarketplace',
    ] as const;

    const networkId =
      typeof this.config.network === 'number'
        ? this.config.network.toString()
        : this.config.network;

    await this.contractRegistry.prefetchABIs([...contractTypes], networkId);

    if (this.config.debug) {
      console.log('[ZunoSDK] ABIs prefetched');
    }
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    await this.contractRegistry.clearCache();
    this.queryClient.clear();

    if (this.config.debug) {
      console.log('[ZunoSDK] Cache cleared');
    }
  }

  /**
   * Validate SDK configuration
   */
  private validateConfig(config: ZunoSDKConfig): void {
    if (!config.apiKey) {
      throw new ZunoSDKError(
        ErrorCodes.MISSING_API_KEY,
        'API key is required'
      );
    }

    if (!config.network) {
      throw new ZunoSDKError(
        ErrorCodes.INVALID_NETWORK,
        'Network is required'
      );
    }

    // Validate network type
    const validNetworks = ['mainnet', 'sepolia', 'polygon', 'arbitrum'];
    if (
      typeof config.network === 'string' &&
      !validNetworks.includes(config.network)
    ) {
      if (config.debug) {
        console.warn(
          `[ZunoSDK] Unknown network: ${config.network}. Using custom chain ID.`
        );
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
            return this.config.retryPolicy?.backoff === 'exponential'
              ? Math.min(delay * 2 ** attemptIndex, 30000)
              : delay * (attemptIndex + 1);
          },
        },
      },
    });
  }
}
