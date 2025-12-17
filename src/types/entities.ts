/**
 * Entity Types
 */

/**
 * ABI Entity from registry
 */
export interface AbiEntity {
  id: string;
  contractName: string;
  abi: unknown[];
  version: string;
  networkId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Network Entity
 */
export interface NetworkEntity {
  id: string;
  name: string;
  slug: string;
  chainId: number;
  type: string;
  rpcUrl?: string;
  blockExplorer?: string;
  isTestnet?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Contract Entity
 */
export interface ContractEntity {
  address: string;
  contractName: string;
  networkId: string;
  abiId: string;
  deployedAt: string;
  verified: boolean;
}

/**
 * NFT Listing
 */
export interface Listing {
  id: string;
  seller: string;
  collectionAddress: string;
  tokenId: string;
  price: string;
  paymentToken: string;
  startTime: number;
  endTime: number;
  status: 'pending' | 'active' | 'sold' | 'cancelled' | 'expired';
  createdAt: string;
}

/**
 * NFT Collection
 */
export interface Collection {
  address: string;
  name: string;
  symbol: string;
  tokenType: 'ERC721' | 'ERC1155';
  totalSupply: string;
  owner: string;
  verified: boolean;
  createdAt: string;
}

/**
 * Auction types
 */
export type AuctionType = 'english' | 'dutch';

/**
 * Auction status
 */
export type AuctionStatus = 'active' | 'ended' | 'cancelled';

/**
 * Auction Entity
 */
export interface Auction {
  id: string;
  type: AuctionType;
  seller: string;
  collectionAddress: string;
  tokenId: string;
  startingBid?: string; // For English auction
  startPrice?: string; // For Dutch auction
  endPrice?: string; // For Dutch auction
  reservePrice?: string;
  currentBid?: string;
  highestBidder?: string;
  startTime: number;
  endTime: number;
  status: AuctionStatus;
  createdAt: string;
}

/**
 * Bid Entity
 */
export interface Bid {
  id: string;
  auctionId: string;
  bidder: string;
  amount: string;
  timestamp: number;
}

/**
 * Offer Entity
 */
export interface Offer {
  id: string;
  offerType: 'token' | 'collection';
  offerer: string;
  collectionAddress: string;
  tokenId?: string; // Only for token offers
  price: string;
  paymentToken: string;
  startTime: number;
  endTime: number;
  status: 'active' | 'accepted' | 'cancelled' | 'expired';
  createdAt: string;
}

/**
 * Bundle Entity
 */
export interface Bundle {
  id: string;
  seller: string;
  nfts: Array<{
    address: string;
    tokenId: string;
  }>;
  price: string;
  paymentToken: string;
  startTime: number;
  endTime: number;
  status: 'pending' | 'active' | 'sold' | 'cancelled' | 'expired';
  createdAt: string;
}

/**
 * Transaction Response
 */
export interface TransactionResponse {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasLimit: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce: number;
  chainId: number;
}

/**
 * Transaction Receipt
 */
export interface TransactionReceipt {
  hash: string;
  blockNumber: number;
  blockHash: string;
  status: 'success' | 'failed';
  gasUsed: string;
  cumulativeGasUsed: string;
  logs: readonly unknown[];
  timestamp: number;
}

/**
 * Paginated Result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Batch progress event - start
 */
export interface BatchProgressStart {
  operation: string;
  module: string;
  totalItems: number;
  timestamp: number;
}

/**
 * Batch progress event - item processed
 */
export interface BatchProgressItem {
  operation: string;
  module: string;
  index: number;
  totalItems: number;
  success: boolean;
  itemId?: string;
  error?: string;
  timestamp: number;
}

/**
 * Batch progress event - complete
 */
export interface BatchProgressComplete {
  operation: string;
  module: string;
  totalItems: number;
  successCount: number;
  failCount: number;
  duration: number;
  timestamp: number;
}
