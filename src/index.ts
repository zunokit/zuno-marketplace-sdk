/**
 * Zuno Marketplace SDK
 * All-in-One NFT Marketplace SDK with Wagmi & React Query built-in
 *
 * @packageDocumentation
 */

// Core SDK
export { ZunoSDK } from './core/ZunoSDK';
export { ZunoAPIClient } from './core/ZunoAPIClient';
export { ContractRegistry } from './core/ContractRegistry';

// Modules
export { ExchangeModule } from './modules/ExchangeModule';
export { CollectionModule } from './modules/CollectionModule';
export { AuctionModule } from './modules/AuctionModule';
export { BaseModule } from './modules/BaseModule';

// Types
export type * from './types/config';
export type * from './types/entities';
export type * from './types/api';
export type * from './types/contracts';

// Utils
export { ZunoSDKError, ErrorCodes } from './utils/errors';
export { EventEmitter } from './utils/events';
export { TransactionManager } from './utils/transactions';
export { ZunoLogger, createNoOpLogger } from './utils/logger';
export type { Logger, LoggerConfig, LogLevel, LogMetadata } from './utils/logger';

// Query factories (for advanced usage)
export {
  abiQueryKeys,
  createABIQueryOptions,
  createABIByIdQueryOptions,
  createContractInfoQueryOptions,
  createNetworksQueryOptions,
} from './core/ZunoAPIClient';
