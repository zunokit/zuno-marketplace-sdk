# CLAUDE.md - AI Assistant Guide for Zuno Marketplace SDK

> **Last Updated:** 2025-11-15
> **SDK Version:** 1.0.2
> **Purpose:** Guide for AI assistants working on the Zuno Marketplace SDK codebase

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Structure](#architecture--structure)
3. [Key Concepts](#key-concepts)
4. [Development Workflow](#development-workflow)
5. [Code Conventions](#code-conventions)
6. [Testing Guidelines](#testing-guidelines)
7. [Common Tasks](#common-tasks)
8. [Important Notes](#important-notes)

---

## Project Overview

### What is This Project?

**Zuno Marketplace SDK** is an all-in-one TypeScript SDK for building NFT marketplace applications on Ethereum and EVM-compatible chains. It provides a type-safe, React-friendly interface for marketplace operations including:

- NFT Exchange (fixed-price listings)
- English & Dutch Auctions
- Collection Creation & Minting (ERC721, ERC1155)
- Offers & Bundles (placeholder/MVP stage)

### Key Technologies

- **Language:** TypeScript 5.6+ (strict mode)
- **Build Tool:** tsup (dual CJS/ESM bundles)
- **React Integration:** React 18+, TanStack Query v5, Wagmi v2
- **Blockchain:** ethers.js v6, viem v2
- **Testing:** Jest with jsdom environment
- **Linting:** ESLint v9 with TypeScript plugin

### Package Structure

```
zuno-marketplace-sdk/
├── dist/              # Compiled output (git-ignored)
│   ├── index.js       # Main bundle (CJS)
│   ├── index.mjs      # Main bundle (ESM)
│   ├── index.d.ts     # Type definitions
│   └── react/         # React integration bundle
├── src/
│   ├── core/          # Core SDK infrastructure
│   ├── modules/       # Feature modules (Exchange, Auction, Collection)
│   ├── react/         # React hooks & provider
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utilities (errors, events, transactions)
│   └── __tests__/     # Test files
├── docs/              # Documentation
├── examples/          # Usage examples
└── [config files]     # TypeScript, tsup, Jest, ESLint configs
```

### Entry Points

- **Main SDK:** `src/index.ts` → `dist/index.js|mjs`
- **React Integration:** `src/react/index.ts` → `dist/react/index.js|mjs`

---

## Architecture & Structure

### Core Architecture

The SDK follows a **modular architecture** with lazy-loaded feature modules:

```
ZunoSDK (main class)
├── Core Infrastructure
│   ├── ZunoAPIClient       # API communication
│   ├── ContractRegistry    # ABI caching & contract instances
│   └── EventEmitter        # Event system
└── Feature Modules (lazy-loaded)
    ├── ExchangeModule      # Fixed-price listings
    ├── AuctionModule       # English & Dutch auctions
    ├── CollectionModule    # NFT collection creation & minting
    ├── OffersModule        # Placeholder (MVP)
    └── BundlesModule       # Placeholder (MVP)
```

### Module Hierarchy

All feature modules extend `BaseModule`:

```typescript
BaseModule (abstract)
├── Provides: provider, signer, apiClient, contractRegistry, queryClient
├── Utilities: ensureProvider(), ensureSigner(), batchExecute()
└── Error handling: error() helper

ExchangeModule extends BaseModule
AuctionModule extends BaseModule
CollectionModule extends BaseModule
```

### Directory Structure Explained

#### `src/core/`
**Core SDK infrastructure:**

- `ZunoSDK.ts` - Main SDK class, module initialization
- `ZunoAPIClient.ts` - HTTP client for Zuno API, TanStack Query factories
- `ContractRegistry.ts` - ABI fetching, caching, contract instance creation

#### `src/modules/`
**Feature modules for marketplace operations:**

- `BaseModule.ts` - Abstract base class for all modules
- `ExchangeModule.ts` - NFT listing, buying, canceling
- `AuctionModule.ts` - English & Dutch auction creation, bidding
- `CollectionModule.ts` - ERC721/ERC1155 creation & minting

#### `src/react/`
**React integration layer:**

- `provider/ZunoProvider.tsx` - React Context provider with Wagmi & React Query
- `hooks/` - React hooks for each module:
  - `useExchange.ts` - Exchange operations
  - `useAuction.ts` - Auction operations
  - `useCollection.ts` - Collection operations
  - `useWallet.ts` - Wallet connection (Wagmi wrapper)
  - `useABIs.ts` - ABI management hooks
  - `useApprove.ts` - NFT approval operations
  - `useBalance.ts` - Balance queries

#### `src/types/`
**TypeScript type definitions:**

- `config.ts` - SDK configuration types
- `entities.ts` - Domain entities (Auction, Listing, etc.)
- `api.ts` - API request/response types
- `contracts.ts` - Contract-related types
- `index.ts` - Re-exports all types

#### `src/utils/`
**Utility modules:**

- `errors.ts` - Custom error class (`ZunoSDKError`) & error codes
- `events.ts` - Event emitter for SDK events
- `transactions.ts` - Transaction management utilities
- `helpers.ts` - General helper functions

---

## Key Concepts

### 1. Naming Conventions (CRITICAL)

**As of v1.0.2, all modules use consistent naming:**

- **Always use `collectionAddress`** (never `nftAddress`)
- This applies to: Exchange, Auction, Offers, Collection modules
- Migration from v1.0.1: Replace all `nftAddress` → `collectionAddress`

**Example:**
```typescript
// ✅ Correct
await sdk.auction.createEnglishAuction({
  collectionAddress: "0x123...",
  tokenId: "1",
  // ...
});

// ❌ WRONG (old v1.0.0 style)
await sdk.auction.createEnglishAuction({
  nftAddress: "0x123...",  // This will cause TypeScript errors
  // ...
});
```

### 2. Price Handling

The SDK **automatically handles ETH conversion**:

- **Input:** Accept prices as strings in ETH (e.g., `"1.5"`)
- **Output:** Return formatted ETH strings (not BigInt)
- **Never** require users to call `ethers.parseEther()` or `ethers.formatEther()`

**Example:**
```typescript
// ✅ SDK handles conversion internally
await sdk.exchange.listNFT({
  price: "1.5",  // String in ETH
  // ...
});

// ❌ Don't make users do this
const price = ethers.parseEther("1.5");
await someMethod({ price });
```

### 3. Lazy Module Loading

Feature modules are **lazy-loaded** via getters in `ZunoSDK`:

```typescript
// Module is created on first access
get exchange(): ExchangeModule {
  if (!this._exchange) {
    this._exchange = new ExchangeModule(/* ... */);
  }
  return this._exchange;
}
```

**Why:** Reduces initial bundle size, only loads what users need.

### 4. ABI Caching with React Query

- ABIs are fetched from API and cached using TanStack Query
- Cache keys: `['abis', contractType, networkId]`
- Prefetching: Essential ABIs are prefetched on SDK initialization
- TTL: Default 5 minutes (configurable via `config.cache.ttl`)

### 5. React Integration Pattern

React hooks use **TanStack Query mutations** for write operations:

```typescript
// Hook pattern
export function useExchange() {
  const { sdk } = useZuno();

  const listNFT = useMutation({
    mutationFn: (params: ListNFTParams) => sdk.exchange.listNFT(params),
    onSuccess: (data) => { /* ... */ },
  });

  return { listNFT, /* ... */ };
}

// Usage
const { listNFT } = useExchange();
await listNFT.mutateAsync({ /* params */ });
```

### 6. Error Handling

All SDK errors use the custom `ZunoSDKError` class:

```typescript
import { ZunoSDKError, ErrorCodes } from './utils/errors';

throw new ZunoSDKError(
  ErrorCodes.INVALID_ADDRESS,
  'Invalid collection address provided'
);
```

**Standard Error Codes:**
- `INVALID_ADDRESS` - Invalid Ethereum address
- `INVALID_TOKEN_ID` - Invalid token ID
- `INVALID_AMOUNT` - Invalid amount (must be > 0)
- `TRANSACTION_FAILED` - Transaction failed
- `USER_REJECTED` - User rejected transaction
- `NOT_APPROVED` - NFT not approved for marketplace
- `MISSING_PROVIDER` - Provider/signer not set

---

## Development Workflow

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
npm install
```

### Available Scripts

```bash
npm run dev           # Watch mode (rebuild on changes)
npm run build         # Build for production
npm run type-check    # TypeScript type checking
npm run lint          # Lint code
npm run lint:fix      # Lint and auto-fix
npm run test          # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run clean         # Remove dist directory
```

### Build Process

**Tool:** tsup (configured in `tsup.config.ts`)

**Output:**
- Two separate bundles:
  1. Main SDK: `dist/index.{js,mjs,d.ts}`
  2. React integration: `dist/react/index.{js,mjs,d.ts}`
- Formats: CommonJS (`.js`) and ESM (`.mjs`)
- Source maps: Enabled
- Tree shaking: Enabled
- Minification: Disabled (for debugging)

**React bundle special note:**
- Adds `"use client";` banner for Next.js App Router compatibility

### Git Workflow

**Branch Strategy:**
- `main` - Stable releases
- `develop-claude` or similar - Active development
- Feature branches: `claude/feature-name-*`

**Commit Messages:**
Follow conventional commits format:
```
feat: add Dutch auction getCurrentPrice method
fix: correct parameter validation in ExchangeModule
docs: update API.md with new examples
chore: update dependencies
```

### Publishing

**Pre-publish checklist:**
1. Update version in `package.json`
2. Update `CHANGELOG.md` with changes
3. Run `npm run build` (automatic via `prepublishOnly`)
4. Run `npm run test` to ensure all tests pass
5. Run `npm run type-check` to verify types
6. Publish: `npm publish`

---

## Code Conventions

### TypeScript Standards

**Strict Mode:** Enabled in `tsconfig.json`

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

**Type Conventions:**

1. **Use `type` for type aliases, `interface` for object shapes:**
   ```typescript
   // ✅ Good
   type NetworkType = 'mainnet' | 'sepolia' | number;
   interface ZunoSDKConfig { /* ... */ }
   ```

2. **Export types separately:**
   ```typescript
   // In types/index.ts
   export type * from './config';
   export type * from './entities';
   ```

3. **Avoid `any`:** Use `unknown` or proper types
   ```typescript
   // ⚠️ Warning - only use for placeholders
   private _offers?: any; // Placeholder for MVP
   ```

### Naming Conventions

**Files:**
- PascalCase for classes: `ZunoSDK.ts`, `BaseModule.ts`
- camelCase for utilities: `errors.ts`, `transactions.ts`
- React components: `ZunoProvider.tsx`

**Variables & Functions:**
- camelCase: `apiClient`, `ensureProvider()`
- Constants: UPPER_SNAKE_CASE: `ERROR_CODES`

**Classes & Types:**
- PascalCase: `ZunoSDK`, `ExchangeModule`, `ZunoSDKError`

**Parameter Consistency (CRITICAL):**
- Always: `collectionAddress` (not `nftAddress`, `contractAddress`, etc.)
- Always: `tokenId` (string)
- Always: ETH values as strings: `price: string`, `amount: string`

### Code Organization

**Module Structure Pattern:**
```typescript
/**
 * Module description
 */

// Imports
import { ... } from '...';

// Types (if module-specific)
interface ModuleSpecificType { ... }

// Class definition
export class ModuleName extends BaseModule {
  // Public methods
  async publicMethod(params: Params): Promise<Result> {
    // Validate
    // Execute
    // Return
  }

  // Protected/private methods
  private helperMethod(): void {
    // ...
  }
}
```

**Hook Structure Pattern:**
```typescript
/**
 * Hook description
 */
import { useMutation } from '@tanstack/react-query';
import { useZuno } from '../provider/ZunoProvider';

export function useModuleName() {
  const { sdk } = useZuno();

  const operation = useMutation({
    mutationFn: (params) => sdk.module.operation(params),
  });

  return { operation };
}
```

### JSDoc Comments

**All public methods MUST have JSDoc:**

```typescript
/**
 * Create an English auction for an NFT
 *
 * @param params - Auction creation parameters
 * @param params.collectionAddress - NFT collection contract address
 * @param params.tokenId - Token ID of the NFT
 * @param params.startingBid - Minimum bid in ETH (e.g., "1.0")
 * @param params.duration - Auction duration in seconds
 *
 * @returns Promise resolving to auction ID and transaction receipt
 *
 * @throws {ZunoSDKError} INVALID_ADDRESS - Invalid collection address
 * @throws {ZunoSDKError} TRANSACTION_FAILED - Transaction failed
 *
 * @example
 * ```typescript
 * const { auctionId, tx } = await sdk.auction.createEnglishAuction({
 *   collectionAddress: "0x123...",
 *   tokenId: "1",
 *   startingBid: "1.0",
 *   duration: 86400
 * });
 * ```
 */
async createEnglishAuction(params: CreateEnglishAuctionParams) {
  // ...
}
```

### ESLint Rules

Key rules from `eslint.config.mjs`:

```javascript
{
  '@typescript-eslint/no-unused-vars': 'warn',  // Prefix with _ to ignore
  '@typescript-eslint/no-explicit-any': 'warn', // Avoid any when possible
  'no-console': ['warn', { allow: ['warn', 'error'] }], // Only warn/error logs
  'prefer-const': 'error',
  'no-var': 'error'
}
```

---

## Testing Guidelines

### Test Setup

**Framework:** Jest with ts-jest and jsdom
**Location:** `src/__tests__/`
**Structure:**
```
__tests__/
├── core/          # Core SDK tests
├── react/         # React hooks tests
└── utils/         # Utility tests
```

### Test Patterns

**Unit Test Example:**
```typescript
import { ZunoSDK } from '../core/ZunoSDK';

describe('ZunoSDK', () => {
  it('should initialize with valid config', () => {
    const sdk = new ZunoSDK({
      apiKey: 'test-key',
      network: 'sepolia',
    });

    expect(sdk).toBeDefined();
    expect(sdk.getConfig().network).toBe('sepolia');
  });
});
```

**React Hook Test Example:**
```typescript
import { renderHook } from '@testing-library/react';
import { useExchange } from '../react/hooks/useExchange';

describe('useExchange', () => {
  it('should provide exchange operations', () => {
    const { result } = renderHook(() => useExchange(), {
      wrapper: TestWrapper,
    });

    expect(result.current.listNFT).toBeDefined();
  });
});
```

### Coverage Requirements

Configured in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

**Run coverage:**
```bash
npm run test:coverage
```

---

## Common Tasks

### Adding a New Module Method

**Example: Adding `getListingDetails` to ExchangeModule**

1. **Add types** (`src/types/api.ts`):
   ```typescript
   export interface GetListingDetailsParams {
     listingId: string;
   }
   ```

2. **Implement in module** (`src/modules/ExchangeModule.ts`):
   ```typescript
   /**
    * Get listing details
    * @param listingId - The listing ID
    * @returns Listing details
    */
   async getListingDetails(listingId: string): Promise<Listing> {
     // Implementation
   }
   ```

3. **Add React hook** (`src/react/hooks/useExchange.ts`):
   ```typescript
   const listingDetails = useQuery({
     queryKey: ['listing', listingId],
     queryFn: () => sdk.exchange.getListingDetails(listingId),
     enabled: !!listingId,
   });
   ```

4. **Update exports** (`src/index.ts`, `src/react/index.ts`)

5. **Add tests**

6. **Update documentation** (`docs/API.md`)

### Adding a New Module

**Example: Creating OffersModule**

1. **Create module file** (`src/modules/OffersModule.ts`):
   ```typescript
   import { BaseModule } from './BaseModule';

   export class OffersModule extends BaseModule {
     async makeOffer(params: MakeOfferParams) {
       // Implementation
     }
   }
   ```

2. **Add to ZunoSDK** (`src/core/ZunoSDK.ts`):
   ```typescript
   private _offers?: OffersModule;

   get offers(): OffersModule {
     if (!this._offers) {
       this._offers = new OffersModule(/* ... */);
     }
     return this._offers;
   }
   ```

3. **Create React hooks** (`src/react/hooks/useOffers.ts`)

4. **Export from main index files**

5. **Add documentation**

### Updating Dependencies

**Check for updates:**
```bash
npm outdated
```

**Update specific package:**
```bash
npm update package-name
```

**Major version updates:**
```bash
npm install package-name@latest
```

**Important:** Test thoroughly after updating:
- `wagmi`, `viem`, `@tanstack/react-query` - Breaking changes common
- `ethers` - Currently on v6, v7 may have breaking changes
- TypeScript - May require type adjustments

### Adding Examples

Examples live in `examples/` directory.

**Pattern:**
```typescript
// examples/new-feature.ts
import { ZunoSDK } from '../src';

async function example() {
  const sdk = new ZunoSDK({
    apiKey: process.env.ZUNO_API_KEY!,
    network: 'sepolia',
  });

  // Example usage
}
```

Update `examples/README.md` with new example.

---

## Important Notes

### For AI Assistants Working on This Codebase

#### Critical Rules

1. **NEVER use `nftAddress`** - Always use `collectionAddress`
   - This is a recent change (v1.0.2) and is now consistent across all modules

2. **Price parameters are ALWAYS strings in ETH**
   - Input: `"1.5"` (not BigInt, not wei)
   - SDK handles `ethers.parseEther()` internally

3. **Maintain dual export structure**
   - Main SDK: `src/index.ts` → `dist/index.{js,mjs}`
   - React: `src/react/index.ts` → `dist/react/index.{js,mjs}`
   - Never mix React dependencies in main SDK

4. **External dependencies are externalized**
   - Check `tsup.config.ts` external array
   - Never bundle: React, ethers, wagmi, viem, @tanstack/react-query

5. **Type safety is paramount**
   - No `any` types except for placeholders (with comment explaining why)
   - All public APIs must have TypeScript types
   - Use strict TypeScript mode

#### Common Pitfalls to Avoid

1. **Don't break the module lazy-loading pattern**
   - Modules are initialized on first access via getters
   - Don't initialize modules in constructor

2. **Don't forget to update both bundles**
   - If adding a method to a module, add React hook too
   - Update both `src/index.ts` AND `src/react/index.ts` exports

3. **Don't skip JSDoc for public methods**
   - All public methods need comprehensive JSDoc
   - Include @param, @returns, @throws, @example

4. **Don't use console.log for debugging in production**
   - Use `config.debug` flag checks
   - Only console.warn and console.error are allowed (ESLint rule)

5. **Don't make breaking changes without major version bump**
   - Follow semantic versioning strictly
   - Document breaking changes in CHANGELOG.md

#### When Making Changes

**Before committing:**
```bash
npm run type-check    # Ensure no type errors
npm run lint          # Check linting
npm run test          # Run all tests
npm run build         # Ensure it builds
```

**Update these files when adding features:**
- Source code (`src/`)
- Type exports (`src/index.ts`, `src/react/index.ts`)
- Tests (`src/__tests__/`)
- API documentation (`docs/API.md`)
- Changelog (`CHANGELOG.md`)
- Examples if relevant (`examples/`)

#### Architecture Decisions to Respect

1. **Why BaseModule exists:**
   - Avoids code duplication across modules
   - Provides consistent provider/signer handling
   - Centralizes error handling patterns

2. **Why lazy-loading modules:**
   - Reduces initial bundle size
   - Users only load features they use
   - Better tree-shaking

3. **Why TanStack Query for React:**
   - Built-in caching, refetching, loading states
   - Industry standard for async state
   - Works perfectly with Wagmi

4. **Why separate bundles for React:**
   - Core SDK can be used in Node.js without React deps
   - Cleaner dependency tree
   - Better for non-React users

#### Code Review Checklist

When reviewing or generating code:

- [ ] Uses `collectionAddress` (not `nftAddress`)
- [ ] Prices are strings in ETH (not BigInt/wei)
- [ ] Public methods have JSDoc comments
- [ ] Types are exported in `src/types/index.ts`
- [ ] React hooks use TanStack Query patterns
- [ ] Error handling uses `ZunoSDKError`
- [ ] Tests are added/updated
- [ ] Documentation is updated
- [ ] No breaking changes without discussion
- [ ] Follows existing code patterns

### Debugging Tips

**Enable debug mode:**
```typescript
const sdk = new ZunoSDK({
  apiKey: 'xxx',
  network: 'sepolia',
  debug: true,  // Enables console logging
});
```

**Check React Query cache:**
```typescript
import { useZuno } from 'zuno-marketplace-sdk/react';

function Component() {
  const { queryClient } = useZuno();
  console.log(queryClient.getQueryCache().getAll());
}
```

**Inspect contract calls:**
- Look in browser console for debug logs
- Check transaction hashes on Etherscan
- Use Wagmi devtools in React apps

### Resources

**Internal Documentation:**
- [API Reference](./docs/API.md) - Complete API documentation
- [Migration Guide](./docs/MIGRATION.md) - Upgrading from older versions
- [Examples](./examples/) - Working code examples
- [Changelog](./CHANGELOG.md) - Version history

**External Resources:**
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Wagmi Docs](https://wagmi.sh/)
- [ethers.js Docs](https://docs.ethers.org/v6/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Project Statistics

- **Total Source Files:** ~27 TypeScript files
- **Total Lines of Code:** ~4,061 lines
- **Test Coverage Target:** 70% across all metrics
- **Supported Node Version:** >= 18.0.0
- **TypeScript Version:** 5.6+
- **License:** MIT

---

## Quick Reference

### Most Frequently Modified Files

1. **Adding features:** `src/modules/[Module].ts`
2. **Adding React hooks:** `src/react/hooks/use[Module].ts`
3. **Adding types:** `src/types/[category].ts`
4. **Updating API:** `docs/API.md`
5. **Version changes:** `package.json`, `CHANGELOG.md`

### Key Configuration Files

- `tsconfig.json` - TypeScript compiler options
- `tsup.config.ts` - Build configuration
- `jest.config.js` - Test configuration
- `eslint.config.mjs` - Linting rules
- `package.json` - Dependencies & scripts

### Environment Variables (for examples)

```bash
ZUNO_API_KEY=your-api-key
NEXT_PUBLIC_ZUNO_API_KEY=your-api-key  # For Next.js
```

---

**End of CLAUDE.md**

*This guide is maintained for AI assistants working on the Zuno Marketplace SDK. When the codebase evolves, update this file to reflect architectural changes, new patterns, or important conventions.*
