# Zuno SDK React Integration

## Hook Return Types

All mutation hooks return:

```typescript
{
  mutate: (variables) => void;
  mutateAsync: (variables) => Promise<Result>;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
  data: Result | undefined;
}
```

## Query Hook Patterns

### useABIs Hook

```tsx
import { useABIs } from "zuno-marketplace-sdk/react";

function ContractInfo({ address }: { address: string }) {
  const { data: abi, isLoading } = useABIs({
    address,
    network: "sepolia",
  });

  if (isLoading) return <div>Loading ABI...</div>;
  return <pre>{JSON.stringify(abi, null, 2)}</pre>;
}
```

### Custom Hook Composition

```tsx
function useMarketplaceListing(listingId: string) {
  const sdk = useZunoSDK();
  const { data, isLoading } = useQuery({
    ...listingQueryOptions(sdk, listingId),
  });

  const { buyNFT } = useExchange();

  return {
    listing: data,
    isLoading,
    buy: buyNFT.mutateAsync,
    isBuying: buyNFT.isPending,
  };
}
```

## SSR Considerations

### Dynamic Import for Client Components

```tsx
// components/Marketplace.tsx
"use client";
import { useExchange } from "zuno-marketplace-sdk/react";

// Must be client component
export default function Marketplace() {
  const { listNFT } = useExchange();
  // ...
}
```

```tsx
// app/page.tsx
import dynamic from "next/dynamic";

const Marketplace = dynamic(
  () => import("@/components/Marketplace"),
  { ssr: false }
);

export default function Page() {
  return <Marketplace />;
}
```

## Logger Configuration

```typescript
const sdk = new ZunoSDK({
  apiKey: "xxx",
  network: "sepolia",
  logger: {
    level: "debug",
    timestamp: true,
    modulePrefix: true,
    logTransactions: true,
    customLogger: {
      info: (msg, meta) => console.log(`[INFO] ${msg}`, meta),
      error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta),
      warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta),
      debug: (msg, meta) => console.debug(`[DEBUG] ${msg}`, meta),
    },
  },
});
```
