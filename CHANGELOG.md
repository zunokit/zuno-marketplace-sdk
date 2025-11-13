# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-13

### Added

#### Phase 1: Core SDK
- ZunoSDK main class with lazy module loading
- ZunoAPIClient with TanStack Query integration for ABI fetching
- ContractRegistry with smart caching
- ExchangeModule for NFT marketplace trading (list, buy, cancel)
- CollectionModule for NFT creation and minting (ERC721/ERC1155)
- BaseModule class for module inheritance
- Comprehensive TypeScript types system (config, entities, api, contracts)
- Error handling with ZunoSDKError and ErrorCodes
- Transaction management utilities with robust error handling

#### Phase 2: Advanced Features
- AuctionModule supporting English & Dutch auctions
- OfferModule for NFT and collection offers
- BundleModule for multi-NFT bundle trading
- EventEmitter system for contract events
- Advanced caching strategies with TanStack Query
- Transaction retry logic with exponential backoff

#### Phase 3: React Integration
- ZunoProvider - all-in-one provider with Wagmi & React Query built-in
- 21+ React hooks covering all SDK functionality:
  - Exchange: useExchange, useListings, useListing
  - Collection: useCollection, useCollectionInfo
  - Auction: useAuction, useAuctionDetails, useDutchAuctionPrice
  - Offers: useOffers, useOffer
  - Bundles: useBundles, useBundle
  - ABI: useABI, usePrefetchABIs, useABIsCached, useInitializeABIs
  - Wallet: useWallet (with Wagmi integration)
  - Utils: useBalance, useApprove
- Performance optimizations with useCallback and useMemo
- Automatic wallet provider synchronization

### Changed
- All React hooks now use proper TypeScript types instead of `as never` casts
- Improved type safety across all modules
- Enhanced error messages with contextual information

### Infrastructure
- Jest configuration for testing
- ESLint configuration with TypeScript support
- tsup configuration for dual CJS/ESM builds
- Comprehensive package.json with proper exports
- Complete .gitignore for development
- Professional README with examples

### Developer Experience
- Full TypeScript support with strict typing
- Modular architecture for tree-shaking
- Built-in ABI caching for optimal performance
- Comprehensive error handling
- Production-ready code quality

[0.1.0]: https://github.com/ZunoKit/zuno-marketplace-sdk/releases/tag/v0.1.0
