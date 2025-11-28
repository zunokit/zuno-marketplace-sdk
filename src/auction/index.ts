/**
 * Tree-shakeable Auction module entry point
 * @packageDocumentation
 */

export { AuctionModule } from '../modules/AuctionModule';

// Re-export types related to Auction
export type {
  CreateEnglishAuctionParams,
  CreateDutchAuctionParams,
  PlaceBidParams,
} from '../types/contracts';

export type { Auction, Bid as AuctionBid } from '../types/entities';
