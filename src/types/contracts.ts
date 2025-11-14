/**
 * Smart Contract Types
 */

/**
 * Supported contract types
 */
export type ContractType =
  | 'ERC721NFTExchange'
  | 'ERC1155NFTExchange'
  | 'ERC721CollectionFactory'
  | 'ERC1155CollectionFactory'
  | 'EnglishAuction'
  | 'DutchAuction'
  | 'OfferManager'
  | 'BundleMarketplace';

/**
 * Token standard types
 */
export type TokenStandard = 'ERC721' | 'ERC1155' | 'Unknown';

/**
 * Transaction options
 */
export interface TransactionOptions {
  /**
   * Gas limit for the transaction
   */
  gasLimit?: number;

  /**
   * Gas price in wei (legacy)
   */
  gasPrice?: string;

  /**
   * Max fee per gas (EIP-1559)
   */
  maxFeePerGas?: string;

  /**
   * Max priority fee per gas (EIP-1559)
   */
  maxPriorityFeePerGas?: string;

  /**
   * Transaction nonce
   */
  nonce?: number;

  /**
   * Transaction value in wei
   */
  value?: string;

  /**
   * Number of confirmations to wait for
   * @default 1
   */
  waitForConfirmations?: number;

  /**
   * Callback when transaction is sent
   */
  onSent?: (txHash: string) => void;

  /**
   * Callback when transaction is confirmed
   */
  onConfirmed?: (receipt: unknown) => void;

  /**
   * Callback on error
   */
  onError?: (error: Error) => void;
}

/**
 * List NFT parameters
 */
export interface ListNFTParams {
  collectionAddress: string;
  tokenId: string;
  price: string;
  duration: number;
  options?: TransactionOptions;
}

/**
 * Batch List NFT parameters
 */
export interface BatchListNFTParams {
  collectionAddress: string;
  tokenIds: string[];
  prices: string[];
  duration: number;
  options?: TransactionOptions;
}

/**
 * Buy NFT parameters
 */
export interface BuyNFTParams {
  listingId: string;
  value?: string;
  options?: TransactionOptions;
}

/**
 * Batch Buy NFT parameters
 */
export interface BatchBuyNFTParams {
  listingIds: string[];
  value?: string;
  options?: TransactionOptions;
}

/**
 * Cancel Listing parameters
 */
export interface CancelListingParams {
  listingId: string;
  options?: TransactionOptions;
}

/**
 * Batch Cancel Listing parameters
 */
export interface BatchCancelListingParams {
  listingIds: string[];
  options?: TransactionOptions;
}

/**
 * Create ERC721 Collection parameters
 */
export interface CreateERC721CollectionParams {
  name: string;
  symbol: string;
  baseUri: string;
  maxSupply: number;
  options?: TransactionOptions;
}

/**
 * Create ERC1155 Collection parameters
 */
export interface CreateERC1155CollectionParams {
  uri: string;
  options?: TransactionOptions;
}

/**
 * Mint ERC721 parameters (single mint)
 */
export interface MintERC721Params {
  collectionAddress: string;
  recipient: string;
  value?: string;
  options?: TransactionOptions;
}

/**
 * Batch Mint ERC721 parameters
 */
export interface BatchMintERC721Params {
  collectionAddress: string;
  recipient: string;
  amount: number;
  value?: string;
  options?: TransactionOptions;
}

/**
 * Mint ERC1155 parameters
 */
export interface MintERC1155Params {
  collectionAddress: string;
  recipient: string;
  tokenId: string;
  amount: number;
  data?: string;
  options?: TransactionOptions;
}

/**
 * Create English Auction parameters
 */
export interface CreateEnglishAuctionParams {
  /**
   * NFT collection contract address
   */
  collectionAddress: string;
  tokenId: string;
  amount?: number; // For ERC1155, default 1 for ERC721
  startingBid: string;
  reservePrice?: string;
  duration: number;
  seller?: string; // Optional, defaults to msg.sender
  options?: TransactionOptions;
}

/**
 * Create Dutch Auction parameters
 */
export interface CreateDutchAuctionParams {
  /**
   * NFT collection contract address
   */
  collectionAddress: string;
  tokenId: string;
  amount?: number; // For ERC1155, default 1 for ERC721
  startPrice: string;
  endPrice: string; // Note: contract uses reservePrice instead
  duration: number;
  seller?: string; // Optional, defaults to msg.sender
  options?: TransactionOptions;
}

/**
 * Place Bid parameters
 */
export interface PlaceBidParams {
  auctionId: string;
  amount: string;
  options?: TransactionOptions;
}

/**
 * Make Offer parameters
 */
export interface MakeOfferParams {
  /**
   * NFT collection contract address
   */
  collectionAddress: string;
  tokenId: string;
  price: string;
  duration: number;
  options?: TransactionOptions;
}

/**
 * Make Collection Offer parameters
 */
export interface MakeCollectionOfferParams {
  collectionAddress: string;
  price: string;
  duration: number;
  options?: TransactionOptions;
}

/**
 * Create Bundle parameters
 */
export interface CreateBundleParams {
  nfts: Array<{
    address: string;
    tokenId: string;
  }>;
  price: string;
  duration: number;
  options?: TransactionOptions;
}

/**
 * Contract method result
 */
export interface ContractMethodResult<T = unknown> {
  data: T;
  transactionHash?: string;
}
