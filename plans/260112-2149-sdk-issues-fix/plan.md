# SDK Issues Fix Implementation Plan

**Date:** 2026-01-12
**Plan ID:** 260112-2149-sdk-issues-fix
**Branch:** `develop-claude` → feature branches
**Status:** 🔄 In Progress

---

## Overview

Fix 7 open issues in zuno-marketplace-sdk repository spanning React hooks cache invalidation, ERC1155 listing parameters, and auction bid refunds.

**Issues:** #85, #84, #83, #82, #81, #80, #79

---

## Phase Status

| Phase | Status | Progress |
|-------|--------|----------|
| [Phase 01: Allowlist Query Keys](./phase-01-allowlist-query-keys.md) | 🔄 Pending | 0% |
| [Phase 02: ERC1155 Single List](./phase-02-erc1155-single-list.md) | 🔄 Pending | 0% |
| [Phase 03: ERC1155 Batch List](./phase-03-erc1155-batch-list.md) | 🔄 Pending | 0% |
| [Phase 04: Bid Refund Events](./phase-04-bid-refund-events.md) | 🔄 Pending | 0% |
| [Phase 05: Testing & Validation](./phase-05-testing-validation.md) | 🔄 Pending | 0% |

---

## Issue Summary

| Issue | Title | Severity | Repository | Fix Location |
|-------|-------|----------|------------|--------------|
| #85 | Allowlist state inconsistency | HIGH | SDK | `useCollection.ts` |
| #84 | Allowlist toggle minting error | HIGH | SDK | `useCollection.ts` |
| #83 | Owner mint after allowlist | HIGH | SDK | `useCollection.ts` |
| #82 | ETH bid cancellation refund | MEDIUM | Contracts | `EnglishAuction.sol` |
| #81 | Batch list ERC1155 error | HIGH | SDK | `ExchangeModule.ts` |
| #80 | Single list ERC1155 error | HIGH | SDK | `ExchangeModule.ts` |
| #79 | Query key improvement | LOW | SDK | New files |

**Note:** Issues #85, #84, #83 share same root cause (React Query cache invalidation).

---

## Key Insights

1. **Contracts are correct** - All bugs are in SDK/React layer
2. **Cache invalidation mismatch** - Primary cause of allowlist issues
3. **ERC1155 parameter mismatch** - Missing `amount`/`amounts` parameters
4. **Bid refunds work** - Only missing event emissions for UX

---

## Architecture

```
zuno-marketplace-sdk/
├── src/
│   ├── react/hooks/
│   │   ├── useCollection.ts    ← Query key fixes (#85, #84, #83)
│   │   ├── useExchange.ts      ← ERC1155 fixes (#80, #81)
│   │   └── query-keys/         ← New: Query options (#79)
│   └── modules/
│       └── ExchangeModule.ts   ← ERC1155 fixes

zuno-marketplace-contracts/
└── src/core/auction/
    └── EnglishAuction.sol      ← Bid refund events (#82)
```

---

## Implementation Steps

### Phase 1: Allowlist Query Keys (Issues #85, #84, #83)
- Fix query key invalidation in `useCollection.ts`
- Update 3 mutation hooks with correct invalidation keys

### Phase 2: ERC1155 Single List (Issue #80)
- Add `amount?: number` to `ListNFTParams`
- Update `listNFT()` to pass amount for ERC1155

### Phase 3: ERC1155 Batch List (Issue #81)
- Add `amounts?: number[]` to `BatchListNFTParams`
- Update `batchListNFT()` to pass amounts for ERC1155

### Phase 4: Bid Refund Events (Issue #82)
- Add `BidRefunded` event emissions for all pending refunds
- Update auction cancellation tests

### Phase 5: Testing & Validation
- Run all tests
- Create PRs per issue

---

## Success Criteria

- [ ] All allowlist operations refresh cache correctly
- [ ] ERC1155 single/batch listing works
- [ ] Bid refunds emit events for all bidders
- [ ] All tests pass
- [ ] PRs created and linked to issues

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes | LOW | Add optional parameters only |
| Cache invalidation too broad | LOW | Use precise key matching |
| Test failures | MEDIUM | Update tests to match new behavior |

---

## Next Steps

1. **Create feature branches** from `develop-claude`
2. **Implement Phase 1** (allowlist query keys)
3. **Test and create PR** for issues #85, #84, #83
4. **Repeat** for remaining phases
