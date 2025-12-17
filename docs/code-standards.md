# Code Standards & Development Rules

**Version:** 2.0.1
**Last Updated:** 2025-12-07

---

## Directory Structure

```
zuno-marketplace-sdk/
├── src/
│   ├── core/                    # Core SDK infrastructure
│   │   ├── ZunoSDK.ts          # Main SDK class (singleton)
│   │   ├── ZunoAPIClient.ts     # API client for Zuno services
│   │   └── ContractRegistry.ts  # Contract/ABI management
│   │
│   ├── modules/                 # Feature modules (lazy-loaded)
│   │   ├── BaseModule.ts        # Base class for all modules
│   │   ├── ExchangeModule.ts    # NFT listing/buying operations
│   │   ├── CollectionModule.ts  # ERC721 collection operations
│   │   └── AuctionModule.ts     # Auction operations (English/Dutch)
│   │
│   ├── react/                   # React integration layer
│   │   ├── provider/
│   │   │   ├── ZunoProvider.tsx     # All-in-one provider with Wagmi
│   │   │   └── ZunoContextProvider.tsx # Context-based provider
│   │   │
│   │   ├── hooks/               # 21+ custom React hooks
│   │   │   ├── useZunoSDK.ts    # Direct SDK access
│   │   │   ├── useWallet.ts     # Wallet connection
│   │   │   ├── useExchange.ts   # Exchange operations
│   │   │   ├── useAuction.ts    # Auction operations
│   │   │   ├── useCollection.ts # Collection operations
│   │   │   ├── useApprove.ts    # Approval management
│   │   │   ├── useABIs.ts       # ABI fetching
│   │   │   └── ...
│   │   │
│   │   └── components/
│   │       └── ZunoDevTools.tsx # Visual debugging panel
│   │
│   ├── types/                   # Type definitions
│   │   ├── config.ts            # SDK configuration types
│   │   ├── entities.ts          # Data entity types
│   │   ├── api.ts               # API response types
│   │   └── contracts.ts         # Contract parameter types
│   │
│   ├── utils/                   # Utility modules
│   │   ├── logger.ts            # ZunoLogger implementation
│   │   ├── logStore.ts          # In-memory log store
│   │   ├── errors.ts            # Error classes and codes
│   │   ├── transactions.ts      # TransactionManager
│   │   ├── events.ts            # EventEmitter
│   │   └── transactionStore.ts  # Transaction tracking
│   │
│   ├── testing/                 # Testing utilities
│   │   └── index.ts             # Mock factories and helpers
│   │
│   ├── __tests__/               # Test files
│   │   ├── setup/               # Jest configuration
│   │   ├── core/                # Core SDK tests
│   │   ├── modules/             # Module tests
│   │   ├── react/               # React hooks tests
│   │   └── utils/               # Utility tests
│   │
│   └── index.ts                 # Main entry point exports
│
├── docs/                        # Documentation
│   ├── project-overview-pdr.md  # Project vision and requirements
│   ├── code-standards.md        # This file
│   ├── codebase-summary.md      # Codebase statistics and overview
│   ├── system-architecture.md   # Architecture patterns and design
│   └── ...other-docs
│
├── examples/                    # Working code examples
│   ├── basic-usage.ts           # Node.js SDK usage
│   ├── react-example.tsx        # React component patterns
│   └── edge-cases.md            # Production patterns
│
├── tests/                       # Test configuration
│   └── setup/
│       ├── jest.config.js       # Jest configuration
│       └── ...setup-files
│
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── tsup.config.js               # Build configuration
├── .eslintrc.json               # Linting rules
├── .gitignore                   # Git ignores
└── README.md                    # Quick start guide
```

---

## File Naming Conventions

### TypeScript Files
- **Format:** `kebab-case.ts` or `kebab-case.tsx`
- **Purpose:** File name describes the primary purpose/export
- **Examples:**
  - `ZunoSDK.ts` - Main SDK class
  - `transaction-manager.ts` - Transaction utility
  - `use-wallet.ts` - React hook
  - `ZunoDevTools.tsx` - React component

### Meaningful Naming
Files should be self-documenting. When LLMs scan directory listings, they should understand purpose immediately:

```
Good:
├── useWallet.ts           # Wallet connection hook
├── useZunoSDK.ts          # SDK access hook
├── ZunoLogger.ts          # Logger implementation
└── transactionStore.ts    # Transaction tracking store

Bad:
├── hook.ts                # Unclear which hook
├── main.ts                # Too vague
├── utils.ts               # Could be anything
└── store.ts               # Which store?
```

### File Size Management
- **Target:** < 200 lines per file
- **Rationale:** Easier context management, faster comprehension
- **When to split:**
  - Multiple exported classes/functions (extract to separate files)
  - Complex logic exceeding 200 lines (break into smaller functions)
  - Testing becomes difficult (sign of complexity)
  - Different concerns/layers (separate into modules)

---

## TypeScript Conventions

### Strict Mode
All code must compile with TypeScript strict mode enabled:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true
  }
}
```

### Type Definitions
- Export all types that are part of public API
- Use interfaces for object contracts
- Use type aliases for union/literal types
- Document types with JSDoc comments

```typescript
/**
 * Configuration for SDK initialization
 */
export interface ZunoSDKConfig {
  /** API key for authentication */
  apiKey: string;
  /** Blockchain network identifier */
  network: NetworkType;
  // ... other properties
}

/** Supported blockchain networks */
export type NetworkType = 'mainnet' | 'sepolia' | 'polygon' | 'arbitrum' | number;
```

### Imports & Exports
- Use named exports for better tree-shaking
- Re-export from index.ts for module organization
- Group imports: third-party, internal types, internal modules
- Sort alphabetically within groups

```typescript
// Good
import { ethers } from 'ethers';
import type { QueryClient } from '@tanstack/react-query';

import { ZunoAPIClient } from './ZunoAPIClient';
import type { ZunoSDKConfig } from '../types/config';

// Bad
import { ZunoAPIClient } from './ZunoAPIClient';
import type { ZunoSDKConfig } from '../types/config';
import { ethers } from 'ethers';
```

### Generic Types
- Use meaningful type variable names
- Document generic constraints
- Avoid deeply nested generics

```typescript
// Good
export class BaseModule<TConfig extends BaseConfig = BaseConfig> {
  protected config: TConfig;
}

// Bad
export class BaseModule<T extends U> {
  // Unclear what T and U represent
}
```

---

## Error Handling

### Error Codes
All SDK errors use specific error codes organized by category:

```typescript
export const ErrorCodes = {
  // Configuration errors (1xxx)
  MISSING_API_KEY: 'MISSING_API_KEY',
  INVALID_NETWORK: 'INVALID_NETWORK',

  // API errors (2xxx)
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
  API_TIMEOUT: 'API_TIMEOUT',

  // Contract errors (3xxx)
  CONTRACT_NOT_FOUND: 'CONTRACT_NOT_FOUND',
  ABI_NOT_FOUND: 'ABI_NOT_FOUND',

  // Transaction errors (4xxx)
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',

  // Validation errors (5xxx)
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_TOKEN_ID: 'INVALID_TOKEN_ID',

  // Module errors (6xxx)
  MODULE_NOT_INITIALIZED: 'MODULE_NOT_INITIALIZED',
};
```

### Error Context
Always provide context for debugging:

```typescript
throw new ZunoSDKError('Transaction failed', ErrorCodes.TRANSACTION_FAILED, {
  originalError: error,
  context: {
    network: '1',
    method: 'listNFT',
    contract: '0x...',
    suggestion: 'Check gas price and wallet balance'
  }
});
```

### Try-Catch Patterns
```typescript
try {
  const result = await operation();
  return result;
} catch (error) {
  if (error instanceof ZunoSDKError) {
    // Handle SDK errors specifically
    logger.error('SDK error', { code: error.code, context: error.context });
  } else {
    // Wrap unexpected errors
    throw new ZunoSDKError('Operation failed', ErrorCodes.UNKNOWN_ERROR, {
      originalError: error as Error
    });
  }
}
```

---

## Class Architecture

### Base Module Pattern
All feature modules extend BaseModule:

```typescript
export abstract class BaseModule {
  protected readonly apiClient: ZunoAPIClient;
  protected readonly contractRegistry: ContractRegistry;
  protected readonly queryClient: QueryClient;
  protected readonly network: NetworkType;
  protected readonly logger: Logger;
  protected provider?: ethers.Provider;
  protected signer?: ethers.Signer;
  protected txManager?: TransactionManager;

  // Helper methods
  protected ensureProvider(): ethers.Provider { ... }
  protected ensureSigner(): ethers.Signer { ... }
  protected ensureTxManager(): TransactionManager { ... }
}
```

### Singleton Pattern
SDK uses module-level singleton:

```typescript
let _singletonInstance: ZunoSDK | null = null;

export class ZunoSDK {
  static getInstance(config?: ZunoSDKConfig, options?: SDKOptions): ZunoSDK {
    if (!_singletonInstance && !config) {
      throw new Error('SDK not initialized');
    }
    if (config && !_singletonInstance) {
      _singletonInstance = new ZunoSDK(config, options);
    }
    return _singletonInstance;
  }
}

// Usage
const sdk = ZunoSDK.getInstance(config);
const sdk2 = ZunoSDK.getInstance(); // Returns same instance
```

### Lazy Module Loading
Modules loaded on first access:

```typescript
private _exchange?: ExchangeModule;

get exchange(): ExchangeModule {
  if (!this._exchange) {
    this._exchange = new ExchangeModule(
      this.apiClient,
      this.contractRegistry,
      this.queryClient,
      this.config.network,
      this.logger
    );
  }
  return this._exchange;
}
```

---

## React Patterns

### Custom Hooks
All hooks follow React patterns:

```typescript
/**
 * Access the Zuno SDK instance
 * @returns {ZunoSDK} The singleton SDK instance
 * @throws {Error} If SDK not initialized
 *
 * @example
 * const sdk = useZunoSDK();
 * const config = sdk.getConfig();
 */
export function useZunoSDK(): ZunoSDK {
  const context = useContext(ZunoContext);
  if (!context) {
    throw new Error('useZunoSDK must be called within <ZunoProvider>');
  }
  return context.sdk;
}
```

### Hook with TanStack Query
```typescript
export function useExchange() {
  const sdk = useZunoSDK();

  const listNFT = useMutation({
    mutationFn: (params: ListNFTParams) =>
      sdk.exchange.listNFT(params),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    }
  });

  return { listNFT };
}
```

### Context Provider
```typescript
const ZunoContext = createContext<ZunoContextValue | null>(null);

export function ZunoProvider({ config, children }: Props) {
  const [sdk] = useState(() => ZunoSDK.getInstance(config));

  return (
    <ZunoContext.Provider value={{ sdk }}>
      {children}
    </ZunoContext.Provider>
  );
}
```

---

## Testing Standards

### Test Structure
```typescript
describe('ExchangeModule', () => {
  let module: ExchangeModule;
  let mockApiClient: jest.Mocked<ZunoAPIClient>;

  beforeEach(() => {
    mockApiClient = createMockApiClient();
    module = new ExchangeModule(
      mockApiClient,
      // ... other mocks
    );
  });

  describe('listNFT', () => {
    it('should list NFT with valid parameters', async () => {
      // Arrange
      const params = createMockListNFTParams();

      // Act
      const result = await module.listNFT(params);

      // Assert
      expect(result.listingId).toBeDefined();
      expect(mockApiClient.call).toHaveBeenCalled();
    });

    it('should throw on invalid address', async () => {
      // Arrange
      const params = { ...mockParams, collectionAddress: 'invalid' };

      // Act & Assert
      await expect(module.listNFT(params)).rejects.toThrow(ZunoSDKError);
    });
  });
});
```

### Coverage Requirements
- **Target:** 70% across branches, functions, lines, statements
- **Critical paths:** 100% for error handling
- **Integration:** Test module interactions
- **Edge cases:** Test boundary conditions

### Mock Strategy
```typescript
// Mock axios globally
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock ethers provider
const mockProvider = {
  getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  call: jest.fn(),
  estimateGas: jest.fn(),
} as jest.Mocked<ethers.Provider>;

// Factory functions for test entities
export function createMockNFT(overrides?: Partial<NFT>): NFT {
  return {
    collectionAddress: '0x1234...',
    tokenId: '1',
    owner: '0x5678...',
    ...overrides
  };
}
```

---

## Commit Message Format

Follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring (no feature/fix)
- `test:` Test additions/modifications
- `chore:` Build, CI, dependencies
- `perf:` Performance improvements

### Examples
```
feat(exchange): add batch listing support for up to 20 NFTs

Implement batchListNFT method supporting creation of multiple listings
in a single transaction. Includes validation, gas estimation, and event
tracking for each listing.

Closes #42
```

```
fix(collection): correct mint limit default to maxSupply

Previously mintLimitPerWallet defaulted to 0, preventing minting.
Now correctly defaults to maxSupply when not specified.

Fixes #39
```

```
refactor(core): extract provider initialization to separate method

Move provider creation logic from constructor to createDefaultProvider
for better testability and code organization.
```

---

## Logging Standards

### Log Levels
- **`error`:** Critical failures, exceptions
- **`warn`:** Recoverable issues, deprecations
- **`info`:** Important events, state changes
- **`debug`:** Detailed info for troubleshooting

### Log Format
```typescript
// With module prefix and timestamp
logger.info('Operation completed', {
  module: 'ExchangeModule',
  data: {
    listingId: '0x123...',
    price: '1.5',
    duration: 86400
  }
});

// Output
[2025-12-07T10:30:45.123Z] [info] [ExchangeModule] Operation completed
{listingId: "0x123...", price: "1.5", duration: 86400}
```

### Logger Integration
```typescript
// Custom Sentry integration
logger: {
  level: 'debug',
  customLogger: {
    error: (msg, meta) => Sentry.captureException(new Error(msg), { extra: meta }),
    warn: (msg, meta) => Sentry.captureMessage(msg, 'warning'),
    info: (msg, meta) => logger.info(msg, meta),
    debug: (msg, meta) => logger.debug(msg, meta),
  }
}
```

---

## Code Style & Formatting

### Spacing & Indentation
- Use 2 spaces for indentation
- 1 blank line between class methods
- 2 blank lines between top-level definitions
- No trailing whitespace

### Naming Conventions
- **Classes/Interfaces:** `PascalCase` (e.g., `ZunoSDK`, `ExchangeModule`)
- **Functions/Methods:** `camelCase` (e.g., `listNFT`, `getActiveListings`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `DEFAULT_CACHE_TIMES`)
- **Private:** Prefix with `_` or use `#` (e.g., `_singletonInstance`)
- **File names:** `kebab-case` (e.g., `transaction-manager.ts`)

### Comments & Documentation

```typescript
/**
 * List an NFT for sale on the marketplace
 *
 * @param params - Listing parameters
 * @returns Promise resolving to listing ID and transaction receipt
 * @throws {ZunoSDKError} If validation fails or transaction reverts
 *
 * @example
 * const { listingId, tx } = await sdk.exchange.listNFT({
 *   collectionAddress: '0x...',
 *   tokenId: '1',
 *   price: '1.5',
 *   duration: 86400
 * });
 */
async listNFT(params: ListNFTParams): Promise<{ listingId: string; tx: TransactionReceipt }> {
  // Validate before execution
  validateListNFTParams(params);

  // Implementation...
}
```

---

## Development Principles

### YANGI (You Aren't Gonna Need It)
Don't add features that aren't required. Avoid:
- Over-engineering solutions
- Unnecessary abstraction layers
- Premature optimization
- Speculative functionality

### KISS (Keep It Simple, Stupid)
Prefer simplicity:
- Clear, straightforward code over clever tricks
- Explicit over implicit
- Flat structures over deep nesting
- Smaller functions over large ones

### DRY (Don't Repeat Yourself)
Eliminate duplication:
- Extract common logic into utilities
- Use base classes for shared functionality
- Reuse type definitions
- Compose rather than duplicate

---

## Code Review Checklist

Before submitting pull requests, verify:

- [ ] Code compiles with zero TypeScript errors
- [ ] All tests pass with >= 70% coverage
- [ ] ESLint passes without warnings (with auto-fix applied)
- [ ] No sensitive data (API keys, credentials, secrets)
- [ ] Commit messages follow conventional format
- [ ] Files stay under 200 lines (split if necessary)
- [ ] Types are comprehensive (no `any` in public API)
- [ ] Error handling with proper context
- [ ] JSDoc for public methods/classes
- [ ] Examples provided for complex features
- [ ] Tests cover edge cases and error paths

---

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [Wagmi Documentation](https://wagmi.sh/docs/getting-started)
