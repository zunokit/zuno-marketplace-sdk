# Fix Approach for #121: WagmiProviderSync SSR

## Problem
`WagmiProviderSync` calls wagmi hooks (`useAccount`, `useWalletClient`) at component render time, which fails during SSR because wagmi context doesn't exist on server.

## Solution (NOT IMPLEMENTED - For Review)

### Option 1: Client-Side Only Render (Recommended)

Wrap wagmi hooks in client-side check:

```typescript
export function WagmiProviderSync() {
  const [isClient, setIsClient] = useState(false);
  const sdk = useZuno();
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Early return during SSR - prevents wagmi hook calls
  if (!isClient) {
    return null;
  }
  
  // Now safe to call wagmi hooks
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  // ... rest of implementation
}
```

**Pros:**
- Simple, minimal change
- Follows React SSR best practices
- No breaking API changes

**Cons:**
- Slight delay in hydration (imperceptible to users)

### Option 2: Conditional Hook Import

Use dynamic import for wagmi hooks:

```typescript
export function WagmiProviderSync() {
  const [wagmiHooks, setWagmiHooks] = useState(null);
  
  useEffect(() => {
    import('./wagmi-hooks').then(mod => {
      setWagmiHooks(mod);
    });
  }, []);
  
  if (!wagmiHooks) return null;
  // Use wagmiHooks.useAccount(), etc.
}
```

**Cons:** More complex, not worth it for this use case.

## Recommended: Option 1

See issue #121 for full details.

## Files to Modify
- `src/react/provider/WagmiProviderSync.tsx`

## Testing
- Test with Next.js `pnpm run build` (static generation)
- Verify pages don't need `export const dynamic = 'force-dynamic'`
