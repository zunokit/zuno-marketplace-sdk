# Phase 05: Testing & Validation

**Status:** 🔄 Pending
**Priority:** HIGH

---

## Overview

Run all tests across repositories to verify all fixes work correctly and no regressions introduced.

---

## Test Execution Plan

### SDK Tests (zuno-marketplace-sdk)

```bash
cd E:/zuno-marketplace-sdk

# Unit tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

### Contract Tests (zuno-marketplace-contracts)

```bash
cd E:/zuno-marketplace-contracts

# All tests
forge test -vv

# Specific auction tests
forge test --match-test "Cancel" -vvv

# Coverage
forge coverage
```

---

## Test Coverage Matrix

| Fix Area | Test File | Test Cases |
|----------|-----------|------------|
| Allowlist query keys | `useCollection.test.ts` | Cache invalidation |
| ERC1155 single list | `ExchangeModule.test.ts` | List with amount |
| ERC1155 batch list | `ExchangeModule.test.ts` | Batch with amounts |
| Bid refund events | `AuctionCancellation.t.sol` | Event emissions |

---

## Success Criteria

- [ ] All SDK tests pass
- [ ] All contract tests pass
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] Test coverage maintained

---

## PR Creation Checklist

For each fix, create separate PR:

1. **Branch Naming:** `fix/issue-{number}-{description}`
   - `fix/issue-85-allowlist-query-keys`
   - `fix/issue-80-erc1155-single-list`
   - `fix/issue-81-erc1155-batch-list`
   - `fix/issue-82-bid-refund-events`

2. **PR Description Template:**
   ```markdown
   ## Fixes
   - Fixes #{issue_number}

   ## Changes
   - Summary of changes

   ## Testing
   - Test scenarios covered

   ## Checklist
   - [ ] Tests pass
   - [ ] Type check passes
   - [ ] No breaking changes
   ```

3. **Link Issues:** Add `Fixes #{issue_number}` to PR body

---

## Rollback Plan

If any fix causes issues:

1. Revert specific commit
2. Fix underlying issue
3. Re-apply fix
4. Re-test

---

## Next Steps

After all phases complete:
1. Merge PRs to `develop-claude`
2. Create release PR to `develop`
3. Update CHANGELOG.md
