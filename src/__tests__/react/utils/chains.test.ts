/**
 * Tests for chain utilities (wagmi chain configuration)
 *
 * `wagmi/chains` ships only as ESM and re-exports from `viem/chains`, so we
 * mock it with simple chain-like sentinels and assert on identity / shape.
 */

jest.mock('wagmi/chains', () => ({
  mainnet: { id: 1, name: 'Ethereum' },
  sepolia: { id: 11155111, name: 'Sepolia' },
  polygon: { id: 137, name: 'Polygon' },
  arbitrum: { id: 42161, name: 'Arbitrum One' },
}));

import { mainnet, sepolia, polygon, arbitrum } from 'wagmi/chains';
import {
  getChainFromNetwork,
  getChainsFromNetworks,
} from '../../../react/utils/chains';

describe('getChainFromNetwork', () => {
  describe('named networks', () => {
    it('returns mainnet for "mainnet"', () => {
      expect(getChainFromNetwork('mainnet')).toBe(mainnet);
    });

    it('returns sepolia for "sepolia"', () => {
      expect(getChainFromNetwork('sepolia')).toBe(sepolia);
    });

    it('returns polygon for "polygon"', () => {
      expect(getChainFromNetwork('polygon')).toBe(polygon);
    });

    it('returns arbitrum for "arbitrum"', () => {
      expect(getChainFromNetwork('arbitrum')).toBe(arbitrum);
    });
  });

  describe('numeric chain IDs', () => {
    it('builds a custom chain with sensible defaults for unknown ID', () => {
      const chain = getChainFromNetwork(31337);
      expect(chain.id).toBe(31337);
      expect(chain.name).toBe('Anvil');
      expect(chain.testnet).toBe(true);
      expect(chain.nativeCurrency).toEqual({
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      });
      expect(chain.rpcUrls.default.http).toEqual(['http://127.0.0.1:8545']);
      expect(chain.blockExplorers).toBeUndefined();
    });

    it('honors custom name, rpcUrl and testnet flag', () => {
      const chain = getChainFromNetwork(1337, {
        name: 'My Local',
        rpcUrl: 'http://localhost:9999',
        testnet: false,
      });
      expect(chain.id).toBe(1337);
      expect(chain.name).toBe('My Local');
      expect(chain.testnet).toBe(false);
      expect(chain.rpcUrls.default.http).toEqual(['http://localhost:9999']);
    });

    it('exposes block explorer config when provided', () => {
      const chain = getChainFromNetwork(31337, {
        blockExplorer: { name: 'Local Explorer', url: 'http://localhost:4000' },
      });
      expect(chain.blockExplorers?.default).toEqual({
        name: 'Local Explorer',
        url: 'http://localhost:4000',
      });
    });
  });

  describe('fallback behaviour', () => {
    it('falls back to sepolia for an unknown network identifier', () => {
      // @ts-expect-error - intentionally pass an unsupported value to exercise fallback
      const chain = getChainFromNetwork('unknown-network');
      expect(chain).toBe(sepolia);
    });
  });
});

describe('getChainsFromNetworks', () => {
  it('maps an array of named networks to wagmi chains', () => {
    const chains = getChainsFromNetworks(['mainnet', 'sepolia']);
    expect(chains).toEqual([mainnet, sepolia]);
  });

  it('applies per-chain custom config to numeric IDs only', () => {
    const chains = getChainsFromNetworks(
      [31337, 'sepolia', 1337],
      {
        31337: { name: 'Anvil-1', rpcUrl: 'http://localhost:8545' },
        1337: { name: 'Anvil-2', rpcUrl: 'http://localhost:8546' },
      },
    );

    expect(chains).toHaveLength(3);
    expect(chains[0].id).toBe(31337);
    expect(chains[0].name).toBe('Anvil-1');
    expect(chains[0].rpcUrls.default.http).toEqual(['http://localhost:8545']);

    expect(chains[1]).toBe(sepolia);

    expect(chains[2].id).toBe(1337);
    expect(chains[2].name).toBe('Anvil-2');
    expect(chains[2].rpcUrls.default.http).toEqual(['http://localhost:8546']);
  });

  it('returns an empty array for an empty input', () => {
    expect(getChainsFromNetworks([])).toEqual([]);
  });
});
