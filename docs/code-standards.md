# Zuno Marketplace SDK - Code Standards & Best Practices

## Overview

This document defines the code standards, conventions, and best practices for the Zuno Marketplace SDK project. All contributors and maintainers must follow these guidelines to ensure code quality, consistency, and maintainability.

**Last Updated:** 2026-01-13
**TypeScript Version:** 5.6+
**Node Version:** >=18.0.0

---

## TypeScript Configuration

### Compiler Options

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### Strict Type Checking Rules

| Rule | Status | Purpose |
|------|:------:|---------|
| `strict: true` | ✅ Enabled | Enable all strict type checking options |
| `noUnusedLocals` | ✅ Enabled | Error on unused local variables |
| `noUnusedParameters` | ✅ Enabled | Error on unused parameters |
| `noImplicitReturns` | ✅ Enabled | Error on functions without return |
| `noFallthroughCasesInSwitch` | ✅ Enabled | Error on switch fallthrough |

---

## Naming Conventions

### General Rules

- **PascalCase:** Classes, Types, Interfaces, Enums, Components
- **camelCase:** Variables, functions, methods, properties
- **SCREAMING_SNAKE_CASE:** Constants, environment variables
- **kebab-case:** Files, folders, CLI commands

### Examples

```typescript
// Classes - PascalCase
export class ZunoSDK {}
export class ExchangeModule {}
export class BaseModule {}

// Types/Interfaces - PascalCase
export type ZunoSDKConfig = {};
export interface Listing {
  listingId: string;
  price: BigNumber;
}

// Enums - PascalCase
export enum ErrorCodes {
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
}

// Functions/Methods - camelCase
function createListing() {}
async function buyNFT() {}
function getActiveListings() {}

// Variables - camelCase
const listingId = '0x...';
const maxSupply = 10000;
const isActive = true;

// Constants - SCREAMING_SNAKE_CASE
const DEFAULT_CACHE_TIME = 300000;
const MAX_BATCH_SIZE = 20;
const API_BASE_URL = 'https://api.zuno.com';

// Files - kebab-case
// src/core/ZunoSDK.ts
// src/modules/ExchangeModule.ts
// src/react/hooks/useExchange.ts
```

### Special Naming Patterns

| Pattern | Convention | Example |
|---------|------------|---------|
| Private properties | Underscore prefix | `this._exchange`, `this._collection` |
| Boolean variables | `is/has/can` prefix | `isActive`, `hasAllowlist`, `canMint` |
| Event handlers | `handle` prefix | `handleConnect`, `handleSubmit` |
| Getters | `get` prefix (property) | `get exchange()`, `get config()` |
| Async functions | No special prefix | `createListing()`, `buyNFT()` |
| Type parameters | `T` prefix | `TRequest`, `TResponse`, `TData` |

---

## Code Organization

### Directory Structure

```
src/
├── core/              # Core SDK (ZunoSDK, APIClient, ContractRegistry)
├── modules/           # Business logic (Exchange, Collection, Auction)
├── react/             # React integration (hooks, providers, components)
│   ├── hooks/         # React hooks
│   ├── provider/      # Context providers
│   ├── components/    # React components
│   └── utils/         # React utilities
├── types/             # Type definitions
├── utils/             # Shared utilities
├── exchange/          # Exchange module exports
├── collection/        # Collection module exports
├── auction/           # Auction module exports
├── logger/            # Logger module exports
├── testing/           # Testing utilities
└── index.ts           # Main entry point
```

### File Organization Rules

1. **One export per file** for major classes/components
2. **Barrel exports** (`index.ts`) for clean public APIs
3. **Co-locate** related files (hooks with types, utils with modules)
4. **Test files** in `__tests__/` directory mirroring source structure

### Import Order

```typescript
// 1. External dependencies
import { ethers } from 'ethers';
import { useQuery } from '@tanstack/react-query';

// 2. Internal dependencies (from other modules)
import { ZunoAPIClient } from '../core/ZunoAPIClient';
import { type Logger } from '../utils/logger';

// 3. Types from same module
import type { ZunoSDKConfig } from './types';

// 4. Relative imports (same directory)
import { helperFunction } from './helpers';
```

### Export Patterns

```typescript
// Named exports (preferred)
export { ZunoSDK };
export { getSdk };
export type { ZunoSDKConfig };

// NOT default exports (avoid)
// export default ZunoSDK; // ❌ Avoid

// Re-exports for public API
export { ExchangeModule } from './ExchangeModule';
export type * from './types';
```

---

## Code Style Guidelines

### Formatting Rules

| Rule | Standard | Tool |
|------|----------|------|
| Indentation | 2 spaces | Prettier (recommended) |
| Semicolons | Required | ESLint |
| Quotes | Single (prefer double for JSX) | ESLint |
| Trailing commas | Required (multi-line) | Prettier |
| Max line length | 100 (soft) | Prettier |
| Arrow functions | Preferred | N/A |

### Code Formatting Example

```typescript
// Good ✅
export class ExchangeModule extends BaseModule {
  constructor(
    apiClient: ZunoAPIClient,
    contractRegistry: ContractRegistry,
    queryClient: QueryClient,
    // ... other deps
  ) {
    super(apiClient, contractRegistry, queryClient, /* ... */);
  }

  async listNFT(params: ListNFTParams): Promise<ListNFTResult> {
    const { collectionAddress, tokenId, price, duration } = params;

    const contract = await this.getContract(collectionAddress);
    const tx = await contract.list(tokenId, price, duration);

    return { listingId: tx.hash, tx };
  }
}

// Bad ❌
export class exchangeModule{ // Wrong casing
  constructor(a, b, c){} // Undescriptive parameters
  async list(params){ // No types
    const tx=await contract.list() // Missing spacing
    return tx
  }
}
```

### Comment Style

```typescript
/**
 * JSDoc comment for functions/classes (preferred)
 * @param params - The listing parameters
 * @returns The listing result with transaction hash
 */
async function listNFT(params: ListNFTParams): Promise<ListNFTResult> {
  // Single-line inline comment for clarification
  const contract = await this.getContract(params.collectionAddress);

  /* Multi-line comment
   * for complex logic
   * that needs explanation
   */
  const tx = await contract.list(
    params.tokenId,
    params.price,
    params.duration
  );

  return { listingId: tx.hash, tx };
}
```

---

## Best Practices

### 1. Type Safety

**Rule:** Never use `any` in public APIs

```typescript
// Good ✅
export type Listing = {
  listingId: string;
  price: BigNumber;
  seller: string;
};

function getListing(listingId: string): Promise<Listing | null> {
  // ...
}

// Bad ❌
function getListing(listingId: any): Promise<any> {
  // ...
}
```

**Exception:** Internal stub code (explicitly marked)

```typescript
// Allowed for stub/placeholder
private _offers?: any; // TODO: Implement OffersModule
```

### 2. Error Handling

**Rule:** Always wrap async operations in try-catch

```typescript
// Good ✅
async function listNFT(params: ListNFTParams): Promise<ListNFTResult> {
  try {
    const contract = await this.getContract(params.collectionAddress);
    const tx = await contract.list(params.tokenId, params.price, params.duration);

    this.logger.info('NFT listed successfully', {
      listingId: tx.hash,
      tokenId: params.tokenId,
    });

    return { listingId: tx.hash, tx };
  } catch (error) {
    this.logger.error('Failed to list NFT', { error, params });
    throw new ZunoSDKError(
      ErrorCodes.CONTRACT_ERROR,
      'Failed to list NFT',
      error
    );
  }
}

// Bad ❌
async function listNFT(params: ListNFTParams) {
  const tx = await contract.list(...); // No error handling
  return tx;
}
```

### 3. Null/Undefined Checks

**Rule:** Always validate inputs and handle null/undefined

```typescript
// Good ✅
function getListing(listingId: string): Listing | null {
  if (!listingId || listingId.length === 0) {
    throw new ZunoSDKError(
      ErrorCodes.VALIDATION_ERROR,
      'Listing ID is required'
    );
  }

  const listing = this.listings.get(listingId);
  return listing ?? null;
}

// Bad ❌
function getListing(listingId: string) {
  return this.listings.get(listingId); // Could be undefined
}
```

### 4. Async/Await

**Rule:** Use async/await, never Promise chains

```typescript
// Good ✅
async function listAndBuy() {
  const { listingId } = await listNFT(params);
  const { tx } = await buyNFT({ listingId });
  return tx;
}

// Bad ❌
function listAndBuy() {
  return listNFT(params)
    .then(({ listingId }) => buyNFT({ listingId }))
    .then(({ tx }) => tx);
}
```

### 5. Constants

**Rule:** Extract magic numbers and strings to constants

```typescript
// Good ✅
const MAX_BATCH_SIZE = 20;
const DEFAULT_CACHE_TIME = 300000; // 5 minutes
const DEFAULT_GAS_LIMIT = 300_000;

function batchCreate(items: Listing[]) {
  if (items.length > MAX_BATCH_SIZE) {
    throw new Error(`Max batch size is ${MAX_BATCH_SIZE}`);
  }
  // ...
}

// Bad ❌
function batchCreate(items: Listing[]) {
  if (items.length > 20) { // Magic number
    throw new Error('Max batch size is 20'); // Duplicated string
  }
}
```

### 6. Dependency Injection

**Rule:** Inject dependencies via constructor, never import directly

```typescript
// Good ✅
export class ExchangeModule extends BaseModule {
  constructor(
    apiClient: ZunoAPIClient,
    contractRegistry: ContractRegistry,
    queryClient: QueryClient,
    // ... other deps
  ) {
    super(apiClient, contractRegistry, queryClient, /* ... */);
  }
}

// Bad ❌
import { apiClient } from './api-client'; // Hard dependency

export class ExchangeModule {
  private apiClient = apiClient; // Not injectable
}
```

### 7. Logging

**Rule:** Log all important operations and errors

```typescript
// Good ✅
async function listNFT(params: ListNFTParams) {
  this.logger.info('Listing NFT', {
    module: 'Exchange',
    data: { tokenId: params.tokenId, price: params.price },
  });

  try {
    const result = await this.contract.list(...);
    this.logger.info('NFT listed successfully', {
      listingId: result.listingId,
    });
    return result;
  } catch (error) {
    this.logger.error('Failed to list NFT', {
      error: error.message,
      params,
    });
    throw error;
  }
}

// Bad ❌
async function listNFT(params: ListNFTParams) {
  return this.contract.list(...); // No logging
}
```

---

## React-Specific Standards

### Hook Naming

**Rule:** All hooks must start with `use`

```typescript
// Good ✅
export function useExchange() {
  const sdk = useZunoSDK();
  const listNFT = useMutation({
    mutationFn: (params: ListNFTParams) => sdk.exchange.listNFT(params),
  });
  return { listNFT };
}

// Bad ❌
export function exchange() { } // Missing 'use' prefix
export function getExchange() { } // Wrong naming
```

### Hook Optimization

**Rule:** Use useMemo for stable object references

```typescript
// Good ✅
export function useExchange() {
  const sdk = useZunoSDK();

  // TanStack Query v5 handles mutationFn stability internally
  const listNFT = useMutation({
    mutationFn: (params: ListNFTParams) => sdk.exchange.listNFT(params),
  });

  const buyNFT = useMutation({
    mutationFn: (params: BuyNFTParams) => sdk.exchange.buyNFT(params),
  });

  // Return stable object reference to prevent unnecessary re-renders
  return useMemo(
    () => ({ listNFT, buyNFT }),
    [listNFT, buyNFT]
  );
}

// Bad ❌
export function useExchange() {
  const sdk = useZunoSDK();

  const listNFT = useMutation({
    mutationFn: (params) => sdk.exchange.listNFT(params),
  });

  return { listNFT }; // No useMemo - unstable object reference
}
```

**Note:** TanStack Query v5 handles `mutationFn` stability internally. useCallback is unnecessary for mutationFn but can be used for other callbacks.

### Component Structure

```typescript
// Good ✅
export function ZunoDevTools({ config }: ZunoDevToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'transactions'>('logs');

  const handleToggle = useCallback(() => setIsOpen(prev => !prev), []);
  const handleTabChange = useCallback((tab: TabType) => setActiveTab(tab), []);

  if (!isOpen) {
    return <ToggleButton onClick={handleToggle} />;
  }

  return (
    <Panel position={config.position}>
      <Tabs activeTab={activeTab} onChange={handleTabChange}>
        <Tab id="logs">Logs</Tab>
        <Tab id="transactions">Transactions</Tab>
      </Tabs>
      <TabContent activeTab={activeTab} />
    </Panel>
  );
}
```

---

## Testing Standards

### Test File Naming

**Rule:** Test files must end with `.test.ts` or `.test.tsx`

```
src/
├── core/
│   ├── ZunoSDK.ts
│   └── __tests__/
│       └── ZunoSDK.test.ts
├── react/
│   ├── hooks/
│   │   ├── useExchange.ts
│   │   └── __tests__/
│   │       └── useExchange.test.tsx
```

### Test Structure

```typescript
// Good ✅
describe('ExchangeModule', () => {
  describe('listNFT', () => {
    it('should list NFT successfully', async () => {
      // Arrange
      const params = { collectionAddress: '0x...', tokenId: '1', price: '1.0' };

      // Act
      const result = await exchangeModule.listNFT(params);

      // Assert
      expect(result.listingId).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.tx).toBeDefined();
    });

    it('should throw error if listing fails', async () => {
      await expect(
        exchangeModule.listNFT(invalidParams)
      ).rejects.toThrow(ZunoSDKError);
    });
  });
});
```

### Test Coverage

**Target:** 80% minimum coverage

| Category | Target | Priority |
|----------|--------|----------|
| Core SDK | 90% | P0 |
| Modules | 85% | P0 |
| Utils | 90% | P0 |
| React Hooks | 80% | P1 |
| Edge Cases | 70% | P1 |

---

## Linting & Formatting

### ESLint Rules

**File:** `eslint.config.js` (Flat Config)

```javascript
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow for stubs
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];
```

**Key Rules:**
- `no-explicit-any`: Off for internal stub code (marked with `TODO`)
- `no-unused-vars`: Warn with `_` prefix pattern ignore
- Flat config format (ESLint 9+)

### Running Linters

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix

# Type check (no emit)
npm run type-check
```

---

## Git Commit Standards

### Commit Message Format

**Convention:** Conventional Commits

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Purpose | Example |
|------|---------|---------|
| `feat` | New feature | `feat(exchange): add batch list functionality` |
| `fix` | Bug fix | `fix(auction): handle zero bid edge case` |
| `docs` | Documentation | `docs: update API reference` |
| `refactor` | Code refactoring | `refactor(core): extract logger to separate module` |
| `test` | Test changes | `test(exchange): add batch operation tests` |
| `chore` | Build/config | `chore: update dependencies` |

### Examples

```bash
# Feature
git commit -m "feat(collection): add allowlist-only mode"

# Bug fix
git commit -m "fix(exchange): handle gas estimation failures"

# Documentation
git commit -m "docs: add code standards guide"

# Refactoring
git commit -m "refactor(modules): extract common logic to BaseModule"
```

---

## Documentation Standards

### Code Comments

**Rule:** Document all public APIs with JSDoc

```typescript
/**
 * Lists an NFT for sale on the marketplace
 *
 * @param params - The listing parameters
 * @param params.collectionAddress - The NFT collection contract address
 * @param params.tokenId - The token ID to list
 * @param params.price - The listing price in ETH (as string)
 * @param params.duration - The listing duration in seconds
 *
 * @returns The listing result with transaction hash
 *
 * @throws {ZunoSDKError} If listing fails (contract error, validation error)
 *
 * @example
 * ```typescript
 * const { listingId, tx } = await sdk.exchange.listNFT({
 *   collectionAddress: '0x...',
 *   tokenId: '1',
 *   price: '1.5',
 *   duration: 86400,
 * });
 * ```
 */
async function listNFT(params: ListNFTParams): Promise<ListNFTResult> {
  // ...
}
```

### README Standards

**Rule:** All modules must have clear documentation in README

```markdown
# Module Name

Brief description (1-2 sentences).

## Installation

```bash
npm install module-name
```

## Usage

```typescript
import { Module } from 'module-name';

const module = new Module();
module.doSomething();
```

## API Reference

### method(param1, param2)

Description of what the method does.

**Parameters:**
- `param1` (Type): Description
- `param2` (Type): Description

**Returns:** Type - Description

**Example:**
```typescript
module.method('value', 123);
```
```

---

## Performance Guidelines

### React Optimization

1. **Use `useCallback`** for event handlers passed to children
2. **Use `useMemo`** for expensive computations
3. **Avoid inline objects/arrays** in JSX (they break memoization)
4. **Use `React.memo`** for components that re-render unnecessarily

### General Optimization

1. **Lazy load modules** (already implemented in SDK)
2. **Cache expensive operations** (TanStack Query handles this)
3. **Debounce/throttle** user inputs
4. **Avoid unnecessary re-renders** in React components

---

## Security Standards

### API Keys

**Rule:** Never hardcode API keys

```typescript
// Good ✅
const apiKey = process.env.ZUNO_API_KEY;

// Bad ❌
const apiKey = 'sk_live_1234567890abcdef';
```

### Input Validation

**Rule:** Always validate user input

```typescript
// Good ✅
function listNFT(params: ListNFTParams) {
  if (!params.collectionAddress || !ethers.isAddress(params.collectionAddress)) {
    throw new ZunoSDKError(
      ErrorCodes.VALIDATION_ERROR,
      'Invalid collection address'
    );
  }

  if (params.price.startsWith('-')) {
    throw new ZunoSDKError(
      ErrorCodes.VALIDATION_ERROR,
      'Price must be positive'
    );
  }

  // ...
}
```

### Private Keys

**Rule:** Never handle private keys in the SDK

- SDK should only receive signers from external sources (Wagmi, ethers)
- Never log or expose private keys
- Always use providers/signers from trusted sources

---

## Code Review Checklist

Before submitting a PR, verify:

- [ ] All tests pass (`npm test`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] New code has tests (80% coverage target)
- [ ] Public APIs have JSDoc comments
- [ ] Commit messages follow conventional commits
- [ ] No console.log statements (use logger instead)
- [ ] No hardcoded values (use constants)
- [ ] No `any` types in public APIs
- [ ] Error handling for all async operations
- [ ] Log important operations and errors

---

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Docs](https://react.dev/)
- [Wagmi Docs](https://wagmi.sh/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [JSDoc Documentation](https://jsdoc.app/)
