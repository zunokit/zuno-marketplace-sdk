/**
 * ZunoProvider Setup Examples
 *
 * This file demonstrates how to set up and configure ZunoProvider
 *
 * @module examples/react/setup-and-provider
 */

import React from 'react';
import { ZunoProvider, WagmiProviderSync } from 'zuno-marketplace-sdk/react';

// ============================================================================
// BASIC PROVIDER SETUP
// ============================================================================

/**
 * Basic ZunoProvider setup for Next.js App Router
 */
export function BasicProviderSetup({ children }: { children: React.ReactNode }) {
  return (
    <ZunoProvider
      config={{
        apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
        network: 'sepolia',
      }}
    >
      {children}
    </ZunoProvider>
  );
}

// ============================================================================
// PROVIDER WITH ALL CONFIG OPTIONS
// ============================================================================

/**
 * Full provider configuration with all options
 */
export function FullProviderSetup({ children }: { children: React.ReactNode }) {
  return (
    <ZunoProvider
      config={{
        apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
        network: 'mainnet',
        apiUrl: 'https://api.zuno.com/v1',
        abisUrl: 'https://abis.zuno.com/api',
        logger: {
          level: 'debug',
          timestamp: true,
          modulePrefix: true,
          logTransactions: true,
        },
      }}
    >
      {children}
    </ZunoProvider>
  );
}

// ============================================================================
// PROVIDER WITH CUSTOM CONFIG
// ============================================================================

/**
 * Provider with custom configuration based on environment
 */
export function ConfigurableProvider({ children }: { children: React.ReactNode }) {
  const network = process.env.NEXT_PUBLIC_ZUNO_NETWORK || 'sepolia';
  const apiKey = process.env.NEXT_PUBLIC_ZUNO_API_KEY;

  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_ZUNO_API_KEY is required');
  }

  return (
    <ZunoProvider
      config={{
        apiKey,
        network: network as 'mainnet' | 'sepolia' | 'localhost',
      }}
    >
      {children}
    </ZunoProvider>
  );
}

// ============================================================================
// SSR-SAFE PROVIDER SETUP (Next.js)
// ============================================================================

/**
 * SSR-safe provider setup using WagmiProviderSync
 * This prevents hydration errors when using SSR
 */
export function SSRSafeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ZunoProvider
      config={{
        apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
        network: 'sepolia',
      }}
    >
      <WagmiProviderSync>
        {children}
      </WagmiProviderSync>
    </ZunoProvider>
  );
}

// ============================================================================
// MULTI-NETWORK PROVIDER
// ============================================================================

/**
 * Provider that supports network switching
 */
export function MultiNetworkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ZunoProvider
      config={{
        apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
        network: 'sepolia', // Default network
      }}
    >
      {children}
    </ZunoProvider>
  );
}

// ============================================================================
// PROVIDER WITH DEVTOOLS
// ============================================================================

/**
 * Provider with DevTools for development
 */
export function ProviderWithDevTools({ children }: { children: React.ReactNode }) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <ZunoProvider
      config={{
        apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
        network: 'sepolia',
        logger: {
          level: isDevelopment ? 'debug' : 'error',
          timestamp: true,
          modulePrefix: true,
          logTransactions: true,
        },
      }}
    >
      {children}
      {isDevelopment && (
        <ZunoDevTools
          config={{
            showLogger: true,
            showTransactions: true,
            showCache: true,
            showNetwork: true,
            position: 'bottom-right',
          }}
        />
      )}
    </ZunoProvider>
  );
}

// ============================================================================
// PROVIDER WRAPPER HOC
// ============================================================================

/**
 * Higher-Order Component wrapper for ZunoProvider
 */
export function withZunoProvider<P extends {}>(
  Component: React.ComponentType<P>,
  providerConfig?: Parameters<typeof ZunoProvider>[0]['config']
) {
  return function WithZunoProvider(props: P) {
    return (
      <ZunoProvider config={providerConfig || { apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!, network: 'sepolia' }}>
        <Component {...props} />
      </ZunoProvider>
    );
  };
}

// Usage example:
// export default withZunoProvider(MyApp, { apiKey: 'xxx', network: 'mainnet' });

// ============================================================================
// COMPLETE NEXT.JS APP ROUTER SETUP
// ============================================================================

/**
 * Complete Next.js 13+ App Router layout example
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ZunoProvider
          config={{
            apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
            network: 'sepolia',
          }}
        >
          <WagmiProviderSync>
            {children}
          </WagmiProviderSync>
        </ZunoProvider>
        {process.env.NODE_ENV === 'development' && (
          <ZunoDevTools
            config={{
              showLogger: true,
              showTransactions: true,
              showCache: true,
              showNetwork: true,
              position: 'bottom-right',
            }}
          />
        )}
      </body>
    </html>
  );
}

// ============================================================================
// PROVIDER WITH ERROR BOUNDARY
// ============================================================================

/**
 * Provider wrapped in error boundary
 */
class ZunoProviderErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ZunoProvider error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee', border: '1px solid red' }}>
          <h2>Something went wrong initializing Zuno SDK</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      );
    }

    return (
      <ZunoProvider
        config={{
          apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
          network: 'sepolia',
        }}
      >
        {this.props.children}
      </ZunoProvider>
    );
  }
}

export function SafeProviderSetup({ children }: { children: React.ReactNode }) {
  return (
    <ZunoProviderErrorBoundary>
      {children}
    </ZunoProviderErrorBoundary>
  );
}

// ============================================================================
// DYNAMIC CONFIGURATION
// ============================================================================

/**
 * Provider with dynamically loaded configuration
 */
export function DynamicProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState({
    apiKey: '',
    network: 'sepolia' as 'mainnet' | 'sepolia' | 'localhost',
  });

  React.useEffect(() => {
    // Load configuration from API or environment
    setConfig({
      apiKey: process.env.NEXT_PUBLIC_ZUNO_API_KEY!,
      network: (process.env.NEXT_PUBLIC_ZUNO_NETWORK || 'sepolia') as any,
    });
  }, []);

  if (!config.apiKey) {
    return <div>Loading...</div>;
  }

  return (
    <ZunoProvider config={config}>
      {children}
    </ZunoProvider>
  );
}

// ============================================================================
// EXPORT EXAMPLES
// ============================================================================

export const examples = {
  BasicProviderSetup,
  FullProviderSetup,
  ConfigurableProvider,
  SSRSafeProvider,
  MultiNetworkProvider,
  ProviderWithDevTools,
  RootLayout,
  SafeProviderSetup,
  DynamicProvider,
};
