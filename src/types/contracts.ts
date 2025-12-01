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
  | 'EnglishAuctionImplementation'
  | 'DutchAuctionImplementation'
  | 'AuctionFactory'
  | 'OfferManager'
  | 'BundleMarketplace';

// TODO: Add when seeded to zuno-abis API:
// | 'ERC721CollectionImplementation'
// | 'ERC1155CollectionImplementation'

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
 * Collection parameters matching the contract's CollectionParams struct
 */
export interface CollectionParams {
  name: string;
  symbol: string;
  owner?: string; // Optional, defaults to signer address
  description?: string;
  mintPrice?: string; // In ETH
  royaltyFee?: number; // Basis points (e.g., 250 = 2.5%)
  maxSupply: number;
  mintLimitPerWallet?: number;
  mintStartTime?: number; // Unix timestamp
  allowlistMintPrice?: string; // In ETH
  publicMintPrice?: string; // In ETH
  allowlistStageDuration?: number; // Duration in seconds
  tokenURI?: string; // Base token URI
}

/**
 * Create ERC721 Collection parameters
 */
export interface CreateERC721CollectionParams extends CollectionParams {
  options?: TransactionOptions;
}

/**
 * Create ERC1155 Collection parameters
 */
export interface CreateERC1155CollectionParams extends CollectionParams {
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
  amount: number;
  value?: string;
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
 * Batch Create English Auction parameters
 */
export interface BatchCreateEnglishAuctionParams {
  /**
   * NFT collection contract address (same for all)
   */
  collectionAddress: string;
  /**
   * Array of token IDs to auction
   */
  tokenIds: string[];
  /**
   * Array of amounts (1 for ERC721, variable for ERC1155)
   */
  amounts?: number[];
  /**
   * Starting bid for all auctions (in ETH)
   */
  startingBid: string;
  /**
   * Reserve price for all auctions (in ETH)
   */
  reservePrice?: string;
  /**
   * Duration in seconds for all auctions
   */
  duration: number;
  options?: TransactionOptions;
}

/**
 * Batch Create Dutch Auction parameters
 */
export interface BatchCreateDutchAuctionParams {
  /**
   * NFT collection contract address (same for all)
   */
  collectionAddress: string;
  /**
   * Array of token IDs to auction
   */
  tokenIds: string[];
  /**
   * Array of amounts (1 for ERC721, variable for ERC1155)
   */
  amounts?: number[];
  /**
   * Starting price for all auctions (in ETH)
   */
  startPrice: string;
  /**
   * End price for all auctions (in ETH)
   */
  endPrice: string;
  /**
   * Duration in seconds for all auctions
   */
  duration: number;
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
