# Zuno SDK Changelog Report

**Period:** `ce79ea9` → `a3f9fd0` (HEAD)  
**Date:** 2024-12-09  
**Total Commits:** 52  
**Files Changed:** 52 files (+5,519 lines / -1,471 lines)

---

## Summary

Major refactoring and feature additions to improve SDK performance, developer experience, and code quality.

---

## Before vs After

| Aspect | Before (ce79ea9) | After (a3f9fd0) |
|--------|------------------|-----------------|
| **Documentation** | Basic MIGRATION.md | Full docs suite (code-standards, codebase-summary, project-overview-pdr, system-architecture) |
| **Approval Caching** | No caching | Approval status caching to reduce RPC calls |
| **Batch Validation** | Duplicated across modules | Extracted to shared utility (DRY) |
| **Error Handling** | Inconsistent messages | Standardized error codes & messages |
| **Listing ID Validation** | No bytes32 validation | Strict bytes32 format validation |
| **LogStore** | Basic implementation | Debounced notifications for high-frequency logging |
| **Transaction Store** | Basic store | Enhanced with retry logic & history |
| **Batch Operations** | No progress events | Batch progress events for better UX |
| **Integration Tests** | Limited | Full batch operations end-to-end tests |
| **JSDoc** | Partial | Comprehensive JSDoc on all public methods |
| **Wagmi Integration** | Basic | WagmiSignerSync export & SSR support |
| **Cache Config** | Hardcoded values | Configurable constants using `ms` library |
| **CLAUDE.md** | 887+ lines | Streamlined (references workflows) |

---

## Key Changes by Category

### Performance Improvements
- `perf: implement approval status caching to reduce RPC calls` (65a62f2)
- `perf: improve logStore performance under high-frequency logging` (46cb9bc)

### New Features
- `feat: Add WagmiSignerSync export and SSR support` (ec069ed)
- `feat: enhance transactionStore with retry logic and history` (b83aab3)
- `feat: add batch progress events for better UX` (b0d454f)
- `feat: add warning logs for Dutch auction price clamp adjustments` (6f33ff1)
- `feat: add listingId bytes32 format validation` (b7d6a94)

### Refactoring
- `refactor: extract batch validation into shared utility (DRY)` (6344e1a)
- `refactor: standardize error messages across validation functions` (f35364e)
- `refactor: replace hardcoded cache times with configurable constants` (cf0489c)
- `refactor: update permissions structure in settings` (a3f9fd0)
- `refactor: update CLAUDE.md and .gitignore` (8c1d679)

### Documentation
- `docs: add comprehensive JSDoc to all new public methods` (78fed6b)
- `docs: fix DevTools import path in documentation` (ef61bbd)
- Added: `docs/code-standards.md` (+660 lines)
- Added: `docs/codebase-summary.md` (+598 lines)
- Added: `docs/project-overview-pdr.md` (+384 lines)
- Added: `docs/system-architecture.md` (+887 lines)
- Removed: `docs/MIGRATION.md` (-381 lines)

### Testing
- `test: add integration tests for batch operations end-to-end` (b0d454f)
- Added: `src/__tests__/integration/batch-operations.test.ts` (+323 lines)
- Added: `src/__tests__/utils/batch.test.ts` (+96 lines)
- Added: `src/__tests__/utils/batchProgress.test.ts` (+190 lines)
- Added: `src/__tests__/utils/helpers.test.ts` (+130 lines)

### Bug Fixes
- `fix: resolve type safety violations in updateProvider` (fd17366)
- `fix: replace require() with ES6 imports in testing utilities` (d3cb76c)
- `fix: remove unused imports from integration test` (d2a39f1)
- `fix: remove unused validateTokenId import` (22e24b4)
- `fix: remove unused ErrorCodes import` (1f1de5c)

---

## New Files Added

### Source Files
- `src/utils/batch.ts` - Shared batch validation utility
- `src/utils/batchProgress.ts` - Batch progress event system
- `src/react/hooks/useSignerSync.ts` - Wagmi signer sync hook
- `src/react/provider/WagmiSignerSync.tsx` - SSR-safe signer sync
- `src/react/utils/chains.ts` - Chain configuration utilities
- `src/react/utils/connectors.ts` - Connector utilities
- `src/react/utils/index.ts` - Utils barrel export

### Test Files
- `src/__tests__/integration/batch-operations.test.ts`
- `src/__tests__/utils/batch.test.ts`
- `src/__tests__/utils/batchProgress.test.ts`
- `src/__tests__/utils/helpers.test.ts`

### Documentation
- `docs/code-standards.md`
- `docs/codebase-summary.md`
- `docs/project-overview-pdr.md`
- `docs/system-architecture.md`

### Templates
- `plans/templates/bug-fix-template.md`
- `plans/templates/feature-implementation-template.md`
- `plans/templates/refactor-template.md`
- `plans/templates/template-usage-guide.md`

### Config
- `.claude/.env.example`
- `.claude/settings.json`
- `.repomixignore`

---

## Files Removed
- `docs/MIGRATION.md` (-381 lines)

---

## Commit History (52 commits)

```
a3f9fd0 refactor: update permissions structure in settings and remove outdated migration guide
22cb704 Merge branch 'fix/issue-29-transaction-store-retry' into develop-claude-review
80a9f5c Merge branch 'fix/issue-28-batch-progress-events' into develop-claude-review
fb56266 Merge branch 'fix/issue-27-integration-tests' into develop-claude-review
a0d5fd9 Merge branch 'fix/issue-26-jsdoc-documentation' into develop-claude-review
d2a39f1 fix: remove unused imports from integration test
73c8e62 Merge branch 'develop-claude-review' into fix/issue-29-transaction-store-retry
c9f2dcc Merge branch 'develop-claude-review' into fix/issue-28-batch-progress-events
85433d6 Merge branch 'develop-claude-review' into fix/issue-27-integration-tests
803792b Merge branch 'develop-claude-review' into fix/issue-26-jsdoc-documentation
c10f9c2 Merge PR: Extract batch validation into shared utility (DRY)
1f1de5c fix: remove unused ErrorCodes import after batch validation refactor
2950f64 Merge branch 'develop-claude-review' into fix/issue-25-batch-validation-utility
c8edbc2 Merge PR: Add warning logs for Dutch auction price clamp adjustments
9eaa72a Merge branch 'develop-claude-review' into fix/issue-24-dutch-auction-warning
4bc1826 Merge PR: Fix DevTools import path documentation
a914e0e Merge branch 'develop-claude-review' into fix/issue-22-devtools-exports
81e019a Merge PR: Standardize error handling with consistent error codes
1bfe52d test: update CollectionModule tests to match new error messages
f0b6ea7 Merge branch 'develop-claude-review' into fix/issue-21-standardize-errors
c33ebf2 Merge PR: Add strict bytes32 validation for listing IDs
22e24b4 fix: remove unused validateTokenId import
93cb411 Merge branch 'develop-claude-review' into fix/issue-20-bytes32-validation
705e9f4 Merge PR: Implement approval status caching to reduce RPC calls
f729669 Merge branch 'develop-claude-review' into fix/issue-19-approval-caching
2690384 Merge PR: Add MIGRATION.md for v1.x to v2.0.0 upgrade guide
9510590 Merge branch 'develop-claude-review' into fix/issue-18-migration-guide
2d99cf7 Merge PR #43: Improve logStore performance under high-frequency logging
b3a822d test: update logStore tests for debounced notifications
9db1b57 Merge branch 'develop-claude-review' into fix/issue-30-logstore-performance
3450484 Merge PR #46: Add WagmiSignerSync export and SSR support
fd17366 fix: resolve type safety violations in updateProvider
d3cb76c fix: replace require() with ES6 imports in testing utilities
7864290 Merge branch 'develop-claude' into feature/wagmi-signer-sync-improvements
7e4b25e chore(release): 2.0.1-beta-claude.2 [skip ci]
7d8f14e Merge pull request #51 from ZunoKit/feature/50-adding-ck-into-project
8c1d679 refactor: update CLAUDE.md and .gitignore for improved documentation and file management
f933c42 Merge branch 'develop-claude' into feature/wagmi-signer-sync-improvements
7e49421 chore(release): 2.0.1-beta-claude.1 [skip ci]
e0daee4 Merge pull request #48 from ZunoKit/fix/issue-47-cache-time-config
cf0489c refactor: replace hardcoded cache times with configurable constants using ms library
ec069ed feat: Add WagmiSignerSync export and SSR support (Issues #44, #45)
46cb9bc perf: improve logStore performance under high-frequency logging
b83aab3 feat: enhance transactionStore with retry logic and history
b0d454f feat: add batch progress events for better UX
78fed6b docs: add comprehensive JSDoc to all new public methods
6344e1a refactor: extract batch validation into shared utility (DRY)
6f33ff1 feat: add warning logs for Dutch auction price clamp adjustments
ef61bbd docs: fix DevTools import path in documentation
f35364e refactor: standardize error messages across validation functions
b7d6a94 feat: add listingId bytes32 format validation
65a62f2 perf: implement approval status caching to reduce RPC calls
```

---

## Version Changes
- `2.0.1-beta-claude.1` → `2.0.1-beta-claude.2`
