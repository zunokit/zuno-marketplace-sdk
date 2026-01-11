# Types & Utilities Analysis

## Types

### Config Types (src/types/config.ts)

**Core Configuration:**
- ZunoSDKConfig - Main SDK configuration
- apiKey (required) - API key
- network (required) - mainnet|sepolia|polygon|arbitrum|number
- apiUrl - Custom API URL
- rpcUrl - Custom RPC URL
- walletConnectProjectId - WalletConnect v2
- cache - CacheConfig with ttl, gcTime
- retryPolicy - RetryPolicy
- logger - LoggerConfig
- debug - Deprecated

**Cache Constants:**
- STALE_TIME: 5m, GC_TIME: 10m
- STALE_TIME_EXTENDED: 30m, GC_TIME_EXTENDED: 1h

**SDK Options:**
- provider - Ethers provider
- signer - Ethers signer
- queryClient - TanStack Query client

### Entity Types (src/types/entities.ts)

**Core Entities:**
- AbiEntity - ABI registry
- NetworkEntity - Network config
- ContractEntity - Contract deployment info

**Marketplace Entities:**
- Listing - NFT listing
- Collection - NFT collection
- Auction - english|dutch
- Bid - Bid on auction
- Offer - token|collection offer
- Bundle - NFT bundle

**Transaction Types:**
- TransactionResponse
- TransactionReceipt

**Pagination:**
- PaginatedResult<T>

**Batch Progress Events:**
- BatchProgressStart
- BatchProgressItem
- BatchProgressComplete

### Contract Types (src/types/contracts.ts)

**Supported Contracts:**
- ContractType - All marketplace contracts
- TokenStandard - ERC721|ERC1155|Unknown

**Transaction Options:**
- TransactionOptions - gasLimit, gasPrice, maxFeePerGas, nonce, value, waitForConfirmations, callbacks

**Parameters:**
- ListNFTParams, BuyNFTParams, CancelListingParams
- CollectionParams, CreateERC721CollectionParams, CreateERC1155CollectionParams
- MintERC721Params, MintERC1155Params
- CreateEnglishAuctionParams, CreateDutchAuctionParams
- BatchCreateEnglishAuctionParams, BatchCreateDutchAuctionParams
- PlaceBidParams
- MakeOfferParams
- CreateBundleParams

### API Types (src/types/api.ts)

**Response Wrappers:**
- APIResponse<T>
- APIError

**API Requests:**
- GetABIParams
- GetListingsParams
- GetCollectionsParams
- GetAuctionsParams
- GetOffersParams
- GetBundlesParams

## Utilities

### Logger (src/utils/logger.ts)

**Features:**
- Log levels: none|error|warn|info|debug
- Structured logging
- Custom logger support (Sentry, Datadog)
- Module filtering
- Action filtering
- Auto-transaction logging
- DevTools integration

**API:**
- ZunoLogger.debug/info/warn/error
- createModuleLogger
- logTransaction
- updateConfig

### Errors (src/utils/errors.ts)

**Error Codes (1xxx-6xxx):**
- Config: INVALID_CONFIG, MISSING_API_KEY
- API: API_REQUEST_FAILED, API_TIMEOUT
- Contract: CONTRACT_NOT_FOUND, ABI_NOT_FOUND
- Transaction: TRANSACTION_FAILED, INSUFFICIENT_FUNDS
- Validation: INVALID_PARAMETER, INVALID_ADDRESS
- Module: MODULE_NOT_INITIALIZED

**ZunoSDKError Class:**
- code, details, originalError, context
- is(code), toUserMessage()
- static from(error, code?)

**Validators:**
- assert, validateAddress, validateTokenId, validateAmount, validateDuration
- validateCreateERC721CollectionParams, validateListNFTParams

**Utilities:**
- wrapError

### Transactions (src/utils/transactions.ts)

**TransactionManager:**
- sendTransaction, callContract, getGasPrice, getNonce, waitForTransaction

**Features:**
- Retry with exponential backoff
- Gas estimation (20uffer)
- Transaction tracking
- Callbacks: onSent, onSuccess
- Non-retryable error detection

### Batch (src/utils/batch.ts)

**Limits:**
- AUCTIONS: 20, LISTINGS: 20, ALLOWLIST: 100

**Validation:**
- validateBatchSize

### Helpers (src/utils/helpers.ts)

**Retry Logic:**
- withRetry(fn, config?, shouldRetry?)

**Transaction Helpers:**
- formatTransactionReceipt, parseTransactionError
- waitForTransactionWithTimeout, buildTransactionOverrides

**Address & Amount:**
- validateAndFormatAddress, toWei, fromWei, validateBytes32

**Utilities:**
- debounce, throttle, safeCall

### Events (src/utils/events.ts)

**EventEmitter:**
- on, once, off, emit, removeAllListeners, listenerCount, eventNames

### Batch Progress (src/utils/batchProgress.ts)

**BatchProgressTracker:**
- start, itemProcessed, complete, getStats

**Events:**
- BATCH_EVENTS.START, ITEM, COMPLETE

**Factory:**
- createBatchProgressTracker

### Log Store (src/utils/logStore.ts)

**API:**
- add, addBatch, getAll, getByLevel, getByModule, getSince, clear, subscribe, setMaxEntries, configure, getStats

**Config:**
- maxEntries: 200, debounceMs: 50, batchFlushThreshold: 100

**Performance:**
- Debounced notifications, batch add, in-place array modifications

### Transaction Store (src/utils/transactionStore.ts)

**API:**
- add, update, recordRetry, retrySuccess, retryFailed
- getAll, getByStatus, getFailedRetryable, getById, getByModule, clear, subscribe
- setMaxEntries, setDefaultRetryConfig, calculateRetryDelay

**TransactionEntry:**
- id, hash, action, module, status
- retryCount, maxRetries, canRetry
- previousAttempts[], retryParams

## Testing Utilities (src/testing/index.ts)

**Mock Types:**
- MockFn<T>, MockExchangeModule, MockAuctionModule, MockCollectionModule, MockZunoSDK

**Mock Factories:**
- createMockFn, createMockTxReceipt, createMockListing, createMockAuction, createMockCollection
- createMockLogger, createMockExchangeModule, createMockAuctionModule, createMockCollectionModule
- createMockSDK

**React Testing:**
- createMockQueryClient, createMockZunoProvider

**Test Utilities:**
- waitFor, createDeferred, generateMockAddress, generateMockTokenId, expectZunoError

## Type Safety Features

1. Strict TypeScript - No any types
2. Runtime Validation - Assert functions
3. Error Context - Rich debugging info
4. Generic Types - PaginatedResult<T>
5. Discriminated Unions - AuctionType, AuctionStatus
6. Branded Types - ErrorCode as const
7. Builder Pattern - MockFn chainable methods
8. Event Typing - Batch progress types
9. Config Validation - Parameter validators

## Developer Ergonomics

1. Auto-completion - All types exported
2. JSDoc Comments - Full documentation
3. Default Values - Sensible defaults
4. Helper Functions - toWei, fromWei, validateAndFormatAddress
5. Mock Support - Full testing utilities
6. Event Emitters - Simple pub/sub
7. Store Subscriptions - React-friendly
8. Custom Loggers - Sentry, Datadog
9. Batch Progress - Built-in tracking
10. Retry Logic - Configurable backoff
