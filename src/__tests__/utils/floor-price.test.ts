import { computeFloorPrice } from '../../utils/floor-price';
import type { Listing } from '../../types/entities';

const ETH = '0x0000000000000000000000000000000000000000';
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

function listing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'listing-1',
    seller: '0xseller',
    collectionAddress: '0xcoll',
    tokenId: '1',
    price: '1.0',
    paymentToken: ETH,
    startTime: 0,
    endTime: 0,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Listing;
}

describe('computeFloorPrice', () => {
  it('returns null floor for empty input', () => {
    const result = computeFloorPrice([], { now: 1_000 });
    expect(result.floor).toBeNull();
    expect(result.activeCount).toBe(0);
    expect(result.byPaymentToken).toEqual({});
  });

  it('returns the cheapest active listing as floor', () => {
    const items = [
      listing({ id: 'a', price: '2.5' }),
      listing({ id: 'b', price: '0.75' }),
      listing({ id: 'c', price: '1.0' }),
    ];
    const result = computeFloorPrice(items, { now: 1_000 });
    expect(result.floor?.id).toBe('b');
    expect(result.activeCount).toBe(3);
  });

  it('compares decimal-string prices precisely (no float collapse)', () => {
    const items = [
      listing({ id: 'a', price: '0.100000000000000001' }), // 1.000...01e-1
      listing({ id: 'b', price: '0.100000000000000002' }),
      listing({ id: 'c', price: '0.100000000000000000' }),
    ];
    const result = computeFloorPrice(items, { now: 1_000 });
    expect(result.floor?.id).toBe('c');
  });

  it('skips non-active statuses', () => {
    const items = [
      listing({ id: 'a', price: '0.5', status: 'cancelled' }),
      listing({ id: 'b', price: '0.6', status: 'sold' }),
      listing({ id: 'c', price: '1.0', status: 'active' }),
    ];
    const result = computeFloorPrice(items, { now: 1_000 });
    expect(result.floor?.id).toBe('c');
    expect(result.activeCount).toBe(1);
  });

  it('skips listings not yet in window (startTime > now)', () => {
    const items = [
      listing({ id: 'a', price: '0.5', startTime: 2_000 }),
      listing({ id: 'b', price: '1.0' }),
    ];
    const result = computeFloorPrice(items, { now: 1_000 });
    expect(result.floor?.id).toBe('b');
  });

  it('skips listings past their endTime (endTime <= now)', () => {
    const items = [
      listing({ id: 'a', price: '0.5', endTime: 999 }),
      listing({ id: 'b', price: '1.0' }),
    ];
    const result = computeFloorPrice(items, { now: 1_000 });
    expect(result.floor?.id).toBe('b');
  });

  it('endTime=0 means "no expiry"', () => {
    const items = [
      listing({ id: 'a', price: '0.5', endTime: 0 }),
      listing({ id: 'b', price: '1.0', endTime: 9_999_999 }),
    ];
    const result = computeFloorPrice(items, { now: 1_000 });
    expect(result.floor?.id).toBe('a');
  });

  it('buckets per payment token in byPaymentToken', () => {
    const items = [
      listing({ id: 'eth-1', price: '1.0', paymentToken: ETH }),
      listing({ id: 'eth-2', price: '0.8', paymentToken: ETH }),
      listing({ id: 'usdc-1', price: '0.6', paymentToken: USDC }),
    ];
    const result = computeFloorPrice(items, { now: 1_000 });
    expect(result.floor?.id).toBe('usdc-1'); // absolute min across tokens
    expect(result.byPaymentToken[ETH].id).toBe('eth-2');
    expect(result.byPaymentToken[USDC.toLowerCase()].id).toBe('usdc-1');
  });

  it('filters to a single payment token when requested', () => {
    const items = [
      listing({ id: 'eth-1', price: '1.0', paymentToken: ETH }),
      listing({ id: 'eth-2', price: '0.8', paymentToken: ETH }),
      listing({ id: 'usdc-1', price: '0.6', paymentToken: USDC }),
    ];
    const result = computeFloorPrice(items, {
      now: 1_000,
      paymentToken: ETH,
    });
    expect(result.floor?.id).toBe('eth-2');
    expect(result.activeCount).toBe(2);
    expect(Object.keys(result.byPaymentToken)).toEqual([ETH]);
  });

  it('normalizes payment token addresses case-insensitively', () => {
    const items = [
      listing({ id: 'a', price: '1.0', paymentToken: ETH.toUpperCase() }),
      listing({ id: 'b', price: '0.5', paymentToken: ETH }),
    ];
    const result = computeFloorPrice(items, {
      now: 1_000,
      paymentToken: ETH.toUpperCase(),
    });
    expect(result.floor?.id).toBe('b');
    expect(result.activeCount).toBe(2);
  });

  it('skips malformed prices without throwing', () => {
    const items = [
      listing({ id: 'a', price: 'not-a-number' }),
      listing({ id: 'b', price: '-1.0' }),
      listing({ id: 'c', price: '' }),
      listing({ id: 'd', price: '1.5' }),
    ];
    const result = computeFloorPrice(items, { now: 1_000 });
    expect(result.floor?.id).toBe('d');
    expect(result.activeCount).toBe(1);
  });

  it('returns the listing reference unchanged (no copy)', () => {
    const item = listing({ id: 'a', price: '1.0' });
    const result = computeFloorPrice([item], { now: 1_000 });
    expect(result.floor).toBe(item);
    expect(result.byPaymentToken[ETH]).toBe(item);
  });
});
