# Phase 01: Allowlist Query Keys Fix

**Related Issues:** #85, #84, #83
**Status:** 🔄 Pending
**Priority:** HIGH

---

## Context Links

- Research: `E:/zuno-marketplace-contracts/plans/reports/researcher-260112-2149-allowlist-state-bug.md`
- File: `E:/zuno-marketplace-sdk/src/react/hooks/useCollection.ts`

---

## Overview

Fix React Query cache invalidation mismatch causing stale allowlist data. Contracts and SDK are correct - only React hooks need fixing.

---

## Root Cause

**Query key mismatch** in `useCollection.ts`:

```typescript
// Query hooks use these keys:
['allowlist', collectionAddress, userAddress]     // useIsInAllowlist
['allowlistOnly', collectionAddress]              // useIsAllowlistOnly

// Mutations invalidate these keys (WRONG):
['collection', collectionAddress]                 // addToAllowlist
['collection', collectionAddress]                 // removeFromAllowlist
['collection', collectionAddress]                 // setAllowlistOnly
```

---

## Implementation Steps

### Step 1: Fix `addToAllowlist` Invalidation

**File:** `src/react/hooks/useCollection.ts`
**Lines:** 76-82

```typescript
const addToAllowlist = useMutation({
  mutationFn: ({ collectionAddress, addresses }) =>
    sdk.collection.addToAllowlist(collectionAddress, addresses),
  onSuccess: (_, variables) => {
    // ✅ Fix: Invalidate allowlist queries (not collection)
    queryClient.invalidateQueries({
      queryKey: ['allowlist', variables.collectionAddress]
    });
  },
});
```

### Step 2: Fix `removeFromAllowlist` Invalidation

**File:** `src/react/hooks/useCollection.ts`
**Lines:** 84-90

```typescript
const removeFromAllowlist = useMutation({
  mutationFn: ({ collectionAddress, addresses }) =>
    sdk.collection.removeFromAllowlist(collectionAddress, addresses),
  onSuccess: (_, variables) => {
    // ✅ Fix: Invalidate allowlist queries
    queryClient.invalidateQueries({
      queryKey: ['allowlist', variables.collectionAddress]
    });
  },
});
```

### Step 3: Fix `setAllowlistOnly` Invalidation

**File:** `src/react/hooks/useCollection.ts`
**Lines:** 92-98

```typescript
const setAllowlistOnly = useMutation({
  mutationFn: ({ collectionAddress, enabled }) =>
    sdk.collection.setAllowlistOnly(collectionAddress, enabled),
  onSuccess: (_, variables) => {
    // ✅ Fix: Invalidate allowlistOnly queries
    queryClient.invalidateQueries({
      queryKey: ['allowlistOnly', variables.collectionAddress]
    });
  },
});
```

---

## Testing

```typescript
// Integration test scenarios:
1. Add user to allowlist → verify useIsInAllowlist updates to true
2. Remove user from allowlist → verify useIsInAllowlist updates to false
3. Disable allowlistOnly → verify useIsAllowlistOnly updates to false
4. Owner mint after disable → should succeed (no client-side block)
```

---

## Success Criteria

- [ ] Query key invalidation matches query hook keys
- [ ] Allowlist status updates immediately after mutations
- [ ] No stale cache issues
- [ ] All existing tests pass

---

## Risk Assessment

- **Risk:** LOW - isolated change, no contract modifications
- **Breaking Changes:** None
- **Test Impact:** None (cache layer only)

---

## Next Steps

After this phase:
1. Create PR for issues #85, #84, #83
2. Move to Phase 02: ERC1155 Single List
