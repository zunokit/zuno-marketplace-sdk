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

export default defineConfig([
  // Main SDK bundle
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,
    splitting: false,
    treeshake: true,
    external: commonExternal,
    outDir: 'dist',
  },
  // React integration bundle
  {
    entry: ['src/react/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    minify: false,
    splitting: false,
    treeshake: true,
    external: commonExternal,
    outDir: 'dist/react',
    esbuildOptions(options) {
      options.banner = {
        js: '"use client";',
      };
    },
  },
  // Tree-shakeable Exchange module
  {
    entry: ['src/exchange/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    minify: false,
    splitting: false,
    treeshake: true,
    external: commonExternal,
    outDir: 'dist/exchange',
  },
  // Tree-shakeable Auction module
  {
    entry: ['src/auction/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    minify: false,
    splitting: false,
    treeshake: true,
    external: commonExternal,
    outDir: 'dist/auction',
  },
  // Tree-shakeable Collection module
  {
    entry: ['src/collection/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    minify: false,
    splitting: false,
    treeshake: true,
    external: commonExternal,
    outDir: 'dist/collection',
  },
  // Pre-configured Logger
  {
    entry: ['src/logger/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    minify: false,
    splitting: false,
    treeshake: true,
    external: commonExternal,
    outDir: 'dist/logger',
  },
  // Testing utilities
  {
    entry: ['src/testing/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    minify: false,
    splitting: false,
    treeshake: true,
    external: [...commonExternal, 'jest'],
    outDir: 'dist/testing',
  },
  // DevTools component
  {
    entry: ['src/devtools/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    minify: false,
    splitting: false,
    treeshake: true,
    external: commonExternal,
    outDir: 'dist/devtools',
    esbuildOptions(options) {
      options.banner = {
        js: '"use client";',
      };
    },
  },
]);
