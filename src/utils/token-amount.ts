/**
 * Token amount helpers.
 *
 * The existing `toWei` / `fromWei` helpers only handle 18-decimal ETH.
 * Anything ERC-20 (USDC=6, USDT=6, WBTC=8, custom marketplace tokens)
 * needs decimal-aware conversion that doesn't lose precision. These
 * helpers are pure, dependency-free, and return `bigint` for the integer
 * side so callers never accidentally drop precision through Number.
 */

const MAX_DECIMALS = 36; // matches viem's safety upper bound

function assertDecimals(decimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > MAX_DECIMALS) {
    throw new Error(
      `Invalid token decimals: ${decimals}. Must be an integer in [0, ${MAX_DECIMALS}].`,
    );
  }
}

/**
 * Parses a human-readable token amount (e.g. "1.5", "0.000001") into the
 * integer "base unit" representation for a token with `decimals` precision.
 *
 *   parseTokenAmount("1.5", 6)   // 1_500_000n  (USDC)
 *   parseTokenAmount("1", 18)    // 10n ** 18n  (ETH/most ERC-20)
 *
 * Throws on invalid input; never silently truncates excess fractional
 * digits (excess precision is an error, not a rounding hint).
 */
export function parseTokenAmount(value: string, decimals: number): bigint {
  assertDecimals(decimals);

  if (typeof value !== "string") {
    throw new Error("parseTokenAmount expects a string value");
  }

  const trimmed = value.trim();
  if (trimmed === "") {
    throw new Error("parseTokenAmount: value is empty");
  }

  // Allow an optional leading sign.
  const sign = trimmed.startsWith("-") ? -1n : 1n;
  const unsigned = trimmed.replace(/^[+-]/, "");

  if (!/^\d+(\.\d+)?$/.test(unsigned)) {
    throw new Error(`parseTokenAmount: invalid number format: ${value}`);
  }

  const [whole, fraction = ""] = unsigned.split(".");

  if (fraction.length > decimals) {
    throw new Error(
      `parseTokenAmount: ${value} has more than ${decimals} fractional digits`,
    );
  }

  const padded = fraction.padEnd(decimals, "0");
  // strip leading zeros from the whole part so '0000000' parses to 0n cleanly
  const wholeNormalized = whole.replace(/^0+(?=\d)/, "");
  const combined = `${wholeNormalized}${padded}`;
  const result = BigInt(combined === "" ? "0" : combined);

  return sign * result;
}

export interface FormatTokenAmountOptions {
  /** Number of decimals the on-chain token uses (e.g. 18 for ETH, 6 for USDC). */
  decimals: number;
  /**
   * Maximum number of fractional digits to render. Defaults to `decimals`
   * (i.e. full precision). Excess precision is trimmed from the right.
   */
  displayDecimals?: number;
  /**
   * Strip trailing zeros after the decimal point. Default: true. With
   * `displayDecimals=6`, `1.500000` formats as `1.5`.
   */
  trimTrailingZeros?: boolean;
  /**
   * Insert `,` thousands separators on the whole-number side. Default: false.
   */
  groupThousands?: boolean;
}

/**
 * Formats a `bigint` base-unit amount into a human-readable string. Pure
 * string math — no Number, no floating-point conversion at any step.
 *
 *   formatTokenAmount(1_500_000n, { decimals: 6 })             // "1.5"
 *   formatTokenAmount(10n ** 18n, { decimals: 18, displayDecimals: 4 }) // "1"
 *   formatTokenAmount(1_234_567_890_000_000_000n, {
 *     decimals: 18,
 *     displayDecimals: 4,
 *     groupThousands: true,
 *   })  // "1.2345"  (whole part has no thousands here)
 */
export function formatTokenAmount(
  value: bigint,
  options: FormatTokenAmountOptions,
): string {
  const {
    decimals,
    displayDecimals = decimals,
    trimTrailingZeros = true,
    groupThousands = false,
  } = options;
  assertDecimals(decimals);
  if (
    !Number.isInteger(displayDecimals) ||
    displayDecimals < 0 ||
    displayDecimals > decimals
  ) {
    throw new Error(
      `formatTokenAmount: displayDecimals must be an integer in [0, ${decimals}]`,
    );
  }

  const isNegative = value < 0n;
  const abs = isNegative ? -value : value;

  const raw = abs.toString().padStart(decimals + 1, "0");
  let whole = raw.slice(0, raw.length - decimals);
  let fraction = raw.slice(raw.length - decimals);

  // Truncate fraction to displayDecimals digits (no rounding — financial
  // amounts shouldn't be rounded for display by accident).
  fraction = fraction.slice(0, displayDecimals);

  if (trimTrailingZeros) {
    fraction = fraction.replace(/0+$/, "");
  }

  if (groupThousands) {
    whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const body = fraction.length > 0 ? `${whole}.${fraction}` : whole;
  return isNegative ? `-${body}` : body;
}

/**
 * Best-effort short formatter for token amounts — useful for table /
 * marquee cells where space is limited. Uses k/M/B suffixes for the
 * whole part once it exceeds 4 digits.
 *
 *   formatTokenAmountCompact(1_500_000n,        { decimals: 6 })  // "1.5"
 *   formatTokenAmountCompact(2_500_000_000_000n,{ decimals: 6 })  // "2.5M"
 */
export function formatTokenAmountCompact(
  value: bigint,
  options: FormatTokenAmountOptions,
): string {
  const full = formatTokenAmount(value, {
    ...options,
    groupThousands: false,
    trimTrailingZeros: false,
  });
  const isNegative = full.startsWith("-");
  const unsigned = isNegative ? full.slice(1) : full;
  const [whole, fraction = ""] = unsigned.split(".");

  const wholeNum = whole.replace(/^0+(?=\d)/, "") || "0";
  const wholeBn = BigInt(wholeNum);

  const suffixes: { threshold: bigint; suffix: string }[] = [
    { threshold: 1_000_000_000n, suffix: "B" },
    { threshold: 1_000_000n, suffix: "M" },
    { threshold: 1_000n, suffix: "k" },
  ];

  for (const { threshold, suffix } of suffixes) {
    if (wholeBn >= threshold) {
      const scaled = wholeBn * 100n / threshold; // 2 decimal places, no rounding
      const scaledStr = scaled.toString().padStart(3, "0");
      const head = scaledStr.slice(0, -2);
      const tail = scaledStr.slice(-2).replace(/0+$/, "");
      const body = tail.length > 0 ? `${head}.${tail}` : head;
      return `${isNegative ? "-" : ""}${body}${suffix}`;
    }
  }

  // Below 1000 — return up to 2 fractional digits, trim trailing zeros.
  const trimmedFraction = fraction.slice(0, 2).replace(/0+$/, "");
  const body =
    trimmedFraction.length > 0 ? `${wholeNum}.${trimmedFraction}` : wholeNum;
  return `${isNegative ? "-" : ""}${body}`;
}
