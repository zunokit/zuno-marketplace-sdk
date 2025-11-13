/**
 * API Request & Response Types
 */

import type {
  AbiEntity,
  NetworkEntity,
  ContractEntity,
  Listing,
  Collection,
  Auction,
  Offer,
  Bundle,
  PaginatedResult,
} from './entities';

/**
 * API Response wrapper
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: number;
}

/**
 * API Error response
 */
export interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: number;
}

/**
 * Get ABI Request params
 */
export interface GetABIParams {
  contractName: string;
  network: string;
}

/**
 * Get ABI Response
 */
export type GetABIResponse = APIResponse<AbiEntity>;

/**
 * Get ABI by ID Response
 */
export type GetABIByIdResponse = APIResponse<AbiEntity>;

/**
 * Get Contract Info Response
 */
export type GetContractInfoResponse = APIResponse<ContractEntity>;

/**
 * Get Networks Response
 */
export type GetNetworksResponse = APIResponse<NetworkEntity[]>;

/**
 * Get Listings Request params
 */
export interface GetListingsParams {
  collectionAddress?: string;
  seller?: string;
  status?: 'active' | 'sold' | 'cancelled' | 'expired';
  page?: number;
  pageSize?: number;
}

/**
 * Get Listings Response
 */
export type GetListingsResponse = APIResponse<PaginatedResult<Listing>>;

/**
 * Get Collections Request params
 */
export interface GetCollectionsParams {
  owner?: string;
  verified?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Get Collections Response
 */
export type GetCollectionsResponse = APIResponse<PaginatedResult<Collection>>;

/**
 * Get Auctions Request params
 */
export interface GetAuctionsParams {
  type?: 'english' | 'dutch';
  seller?: string;
  status?: 'active' | 'ended' | 'cancelled';
  page?: number;
  pageSize?: number;
}

/**
 * Get Auctions Response
 */
export type GetAuctionsResponse = APIResponse<PaginatedResult<Auction>>;

/**
 * Get Offers Request params
 */
export interface GetOffersParams {
  offerType?: 'token' | 'collection';
  offerer?: string;
  collectionAddress?: string;
  status?: 'active' | 'accepted' | 'cancelled' | 'expired';
  page?: number;
  pageSize?: number;
}

/**
 * Get Offers Response
 */
export type GetOffersResponse = APIResponse<PaginatedResult<Offer>>;

/**
 * Get Bundles Request params
 */
export interface GetBundlesParams {
  seller?: string;
  status?: 'active' | 'sold' | 'cancelled' | 'expired';
  page?: number;
  pageSize?: number;
}

/**
 * Get Bundles Response
 */
export type GetBundlesResponse = APIResponse<PaginatedResult<Bundle>>;

/**
 * Pagination params
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
