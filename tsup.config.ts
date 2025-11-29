import { defineConfig } from 'tsup';

// Common external dependencies
const commonExternal = [
  'react',
  'react-dom',
  'ethers',
  'axios',
  '@tanstack/react-query',
  '@tanstack/react-query-devtools',
  '@tanstack/query-core',
  'wagmi',
  'viem',
  '@wagmi/core',
  '@wagmi/connectors',
];

export default defineConfig({
  entry: {
    // Main SDK
    'index': 'src/index.ts',
    // React integration (includes DevTools)
    'react/index': 'src/react/index.ts',
    // Tree-shakeable modules
    'exchange/index': 'src/exchange/index.ts',
    'auction/index': 'src/auction/index.ts',
    'collection/index': 'src/collection/index.ts',
    // Utility modules
    'logger/index': 'src/logger/index.ts',
    'testing/index': 'src/testing/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  treeshake: true,
  external: [...commonExternal, 'jest'],
  outDir: 'dist',
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
});
