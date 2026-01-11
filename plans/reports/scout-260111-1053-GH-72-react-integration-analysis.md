# React Integration Analysis

Generated: 2026-01-11
Module: src/react/
Purpose: Developer-focused technical summary

## Hooks Overview

### Core SDK Access Hooks

useZunoSDK() - Direct SDK instance access
useZunoLogger() - Logger instance for logging

### Exchange Hooks

useExchange() - Mutation operations
useListings(collectionAddress?) - Query listings by collection
useListingsBySeller(seller?) - Query listings by seller
useListing(listingId?) - Query single listing

Mutations: listNFT, batchListNFT, buyNFT, batchBuyNFT, cancelListing, batchCancelListing

### Collection Hooks

useCollection() - Mutation operations
useCollectionInfo(address?) - Query collection metadata
useCreatedCollections(options?) - Query created collections
useUserOwnedTokens(collection, user) - Query owned tokens
useIsInAllowlist(collection, user) - Check allowlist status
useIsAllowlistOnly(collection) - Check allowlist-only mode

Mutations: createERC721, createERC1155, mintERC721, batchMintERC721, mintERC1155, batchMintERC1155, verifyCollection, addToAllowlist, removeFromAllowlist, setAllowlistOnly

### Auction Hooks

useAuction() - Mutation operations
useAuctionDetails(auctionId?) - Query auction details
useDutchAuctionPrice(auctionId?) - Query current Dutch price (10s refetch)
usePendingRefund(auctionId?, bidder?) - Query pending refund

Mutations: createEnglishAuction, createDutchAuction, batchCreateEnglishAuction, batchCreateDutchAuction, placeBid, settleAuction, buyNow, withdrawBid, cancelAuction, batchCancelAuction

### Wallet & Connection Hooks

useWallet() - Wagmi wallet operations
useBalance(address?, token?) - ETH/token balance
useApprove() - ERC721/ERC1155 approvals
useSignerSync(options?) - Sync wagmi signer to SDK

### ABI Management Hooks

useABI(type, network) - Fetch single ABI
useContractInfo(address?, networkId?) - Fetch contract info
usePrefetchABIs() - Prefetch multiple ABIs
useABIsCached(types, network) - Check cache status
useInitializeABIs(network?) - Prefetch common ABIs

## Providers

ZunoProvider - All-in-one provider (Wagmi + QueryClient + ZunoContext + SignerSync)
ZunoContextProvider - Core SDK context provider
WagmiSignerSync - Syncs wagmi wallet with SDK signer

## Components

ZunoDevTools - Floating dev panel with Logs, Transactions, Cache, Network tabs

## Integration Patterns

Wagmi: getChainFromNetwork(), createDefaultConnectors()
React Query: Query keys for listings, collections, auctions, contracts

## Public API Surface

Providers: ZunoProvider, ZunoContextProvider, ZunoContext, useZuno, WagmiSignerSync
SDK Access: useZunoSDK, useZunoLogger
Exchange: useExchange, useListings, useListingsBySeller, useListing
Collection: useCollection, useCollectionInfo, useCreatedCollections, useUserOwnedTokens, useIsInAllowlist, useIsAllowlistOnly
Auction: useAuction, useAuctionDetails, useDutchAuctionPrice, usePendingRefund
ABI: useABI, useContractInfo, usePrefetchABIs, useABIsCached, useInitializeABIs
Utility: useWallet, useBalance, useApprove, useSignerSync
DevTools: ZunoDevTools

## Unresolved Questions

None. React module structure is well-documented with clear patterns.
