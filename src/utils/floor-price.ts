/**
 * Floor price computation from a list of NFT listings.
 *
 * The floor price of a collection is the lowest "active" listing
 * price denominated in the collection's payment token. Several
 * decisions matter here:
 *
 *   - Only `active` listings count. `pending`, `sold`, `cancelled`,
 *     `expired` listings are excluded.
 *   - Listings with `startTime > now` or `endTime <= now` are
 *     considered out-of-window and excluded.
 *   - Floor is computed per payment token. A collection that has
 *     ETH listings and USDC listings has two floors; the helper
 *     returns the lowest by sortable string magnitude per token.
 *   - The `price` field on Listing is a decimal string in ETH/units
 *     (not wei). The helper compares using bigint scaled by 10^18
 *     so we never lose precision to floating point.
 *
 * The helper is pure: input -> output, no fetch, no Date.now
 * besides the explicit `now` parameter. That keeps it trivially
 * testable.
 */

import type { Listing } from '../types/entities';

const SCALE = 10n ** 18n;

export interface FloorPriceOptions {
  /**
   * Override the "now" timestamp (Unix seconds) used to drop
   * out-of-window listings. Defaults to `Math.floor(Date.now()/1000)`.
   */
  now?: number;
  /**
   * Only consider listings paid in this payment token (address or
   * `null` for the native asset). When omitted, all payment tokens
   * are bucketed and `byPaymentToken` contains the per-token floors.
   */
  paymentToken?: string | null;
}

export interface FloorPriceResult {
  /**
   * Lowest active listing across all considered payment tokens.
   * Null when there are no valid listings.
   */
  floor: Listing | null;
  /**
   * Number of active in-window listings considered.
   */
  activeCount: number;
  /**
   * Per-payment-token floor listing.
   */
  byPaymentToken: Record<string, Listing>;
}

function normalizePayment(token: string): string {
  return token.toLowerCase();
}

/**
 * Parse a decimal-string price (e.g. "1.25") into a scaled bigint
 * (1.25e18). Returns null on malformed input so the helper never
 * throws on a single bad row.
 */
function priceToScaled(price: string): bigint | null {
  if (typeof price !== 'string' || price.length === 0) return null;
  const trimmed = price.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  if (trimmed.startsWith('-')) return null;

  const [whole, frac = ''] = trimmed.split('.');
  if (frac.length > 18) return null; // we don't preserve sub-wei precision
  const padded = frac.padEnd(18, '0');
  try {
    return BigInt(whole) * SCALE + BigInt(padded);
  } catch {
    return null;
  }
}

function isActiveInWindow(listing: Listing, now: number): boolean {
  if (listing.status !== 'active') return false;
  if (listing.startTime > now) return false;
  if (listing.endTime > 0 && listing.endTime <= now) return false;
  return true;
}

/**
 * Computes the floor price of a collection given a list of listings.
 *
 * - When `paymentToken` is provided, only listings paid in that
 *   token are considered and `floor` is the global minimum.
 * - When `paymentToken` is omitted, listings are bucketed per
 *   payment token in `byPaymentToken`; `floor` is the absolute
 *   minimum across all buckets (still a useful single answer for
 *   ETH-dominant collections, but consumers should also surface
 *   `byPaymentToken` when multiple buckets exist).
 */
export function computeFloorPrice(
  listings: readonly Listing[],
  options: FloorPriceOptions = {},
): FloorPriceResult {
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const requested = options.paymentToken
    ? normalizePayment(options.paymentToken)
    : null;

  let globalMin: { listing: Listing; scaled: bigint } | null = null;
  const perToken = new Map<string, { listing: Listing; scaled: bigint }>();
  let activeCount = 0;

  for (const listing of listings) {
    if (!isActiveInWindow(listing, now)) continue;
    const token = normalizePayment(listing.paymentToken);
    if (requested !== null && token !== requested) continue;

    const scaled = priceToScaled(listing.price);
    if (scaled === null) continue;

    activeCount += 1;

    if (globalMin === null || scaled < globalMin.scaled) {
      globalMin = { listing, scaled };
    }
    const bucket = perToken.get(token);
    if (!bucket || scaled < bucket.scaled) {
      perToken.set(token, { listing, scaled });
    }
  }

  const byPaymentToken: Record<string, Listing> = {};
  for (const [token, entry] of perToken.entries()) {
    byPaymentToken[token] = entry.listing;
  }

  return {
    floor: globalMin ? globalMin.listing : null,
    activeCount,
    byPaymentToken,
  };
}
