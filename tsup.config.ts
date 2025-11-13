import { defineConfig } from 'tsup';

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
    external: [
      'react',
      'react-dom',
      'ethers',
      'axios',
      '@tanstack/react-query',
      '@tanstack/query-core',
      'wagmi',
      'viem',
      '@wagmi/core',
      '@wagmi/connectors',
    ],
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
    external: [
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
    ],
    outDir: 'dist/react',
    esbuildOptions(options) {
      options.banner = {
        js: '"use client";',
      };
    },
  },
]);
