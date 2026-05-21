import {
  parseTokenAmount,
  formatTokenAmount,
  formatTokenAmountCompact,
} from "../../utils/token-amount";

describe("parseTokenAmount", () => {
  it("parses simple whole amounts at common decimal counts", () => {
    expect(parseTokenAmount("1", 18)).toBe(10n ** 18n);
    expect(parseTokenAmount("1", 6)).toBe(1_000_000n);
    expect(parseTokenAmount("1", 8)).toBe(100_000_000n);
    expect(parseTokenAmount("1", 0)).toBe(1n);
  });

  it("parses fractional amounts", () => {
    expect(parseTokenAmount("1.5", 6)).toBe(1_500_000n);
    expect(parseTokenAmount("0.123456", 6)).toBe(123_456n);
    expect(parseTokenAmount("0.000001", 6)).toBe(1n);
  });

  it("parses zero in several spellings", () => {
    expect(parseTokenAmount("0", 18)).toBe(0n);
    expect(parseTokenAmount("0.0", 18)).toBe(0n);
    expect(parseTokenAmount("0.000000000000000000", 18)).toBe(0n);
  });

  it("preserves precision way beyond Number.MAX_SAFE_INTEGER", () => {
    expect(parseTokenAmount("123456789012345.678901234567890123", 18)).toBe(
      123456789012345_678901234567890123n,
    );
  });

  it("handles a leading +/- sign", () => {
    expect(parseTokenAmount("+1.5", 6)).toBe(1_500_000n);
    expect(parseTokenAmount("-1.5", 6)).toBe(-1_500_000n);
  });

  it("trims leading zeros on the whole part", () => {
    expect(parseTokenAmount("000123.45", 6)).toBe(123_450_000n);
    expect(parseTokenAmount("0000000", 18)).toBe(0n);
  });

  it("rejects more fractional digits than the token supports", () => {
    expect(() => parseTokenAmount("1.1234567", 6)).toThrow(
      /more than 6 fractional digits/,
    );
  });

  it("rejects non-numeric, empty, and malformed input", () => {
    expect(() => parseTokenAmount("", 18)).toThrow(/empty/);
    expect(() => parseTokenAmount("   ", 18)).toThrow(/empty/);
    expect(() => parseTokenAmount("abc", 18)).toThrow(/invalid number format/);
    expect(() => parseTokenAmount("1.2.3", 18)).toThrow(/invalid number format/);
    expect(() => parseTokenAmount("1e6", 18)).toThrow(/invalid number format/);
    expect(() =>
      parseTokenAmount(123 as unknown as string, 18),
    ).toThrow(/expects a string/);
  });

  it("rejects invalid decimals values", () => {
    expect(() => parseTokenAmount("1", -1)).toThrow(/Invalid token decimals/);
    expect(() => parseTokenAmount("1", 1.5)).toThrow(/Invalid token decimals/);
    expect(() => parseTokenAmount("1", 100)).toThrow(/Invalid token decimals/);
  });
});

describe("formatTokenAmount", () => {
  it("formats common ERC-20 amounts at full precision", () => {
    expect(formatTokenAmount(1_500_000n, { decimals: 6 })).toBe("1.5");
    expect(formatTokenAmount(10n ** 18n, { decimals: 18 })).toBe("1");
    expect(formatTokenAmount(1n, { decimals: 18 })).toBe("0.000000000000000001");
  });

  it("clamps display precision when displayDecimals < decimals (truncates, does not round)", () => {
    expect(
      formatTokenAmount(1_234_567_890_000_000_000n, {
        decimals: 18,
        displayDecimals: 4,
      }),
    ).toBe("1.2345");
    expect(
      formatTokenAmount(1_999_999_999_999_999_999n, {
        decimals: 18,
        displayDecimals: 0,
      }),
    ).toBe("1");
  });

  it("keeps trailing zeros when trimTrailingZeros=false", () => {
    expect(
      formatTokenAmount(1_500_000n, {
        decimals: 6,
        displayDecimals: 6,
        trimTrailingZeros: false,
      }),
    ).toBe("1.500000");
  });

  it("groups thousands when groupThousands=true", () => {
    expect(
      formatTokenAmount(1_234_567n * 10n ** 18n, {
        decimals: 18,
        displayDecimals: 0,
        groupThousands: true,
      }),
    ).toBe("1,234,567");
  });

  it("formats negative amounts and zero correctly", () => {
    expect(formatTokenAmount(-1_500_000n, { decimals: 6 })).toBe("-1.5");
    expect(formatTokenAmount(0n, { decimals: 18 })).toBe("0");
  });

  it("rejects out-of-range displayDecimals", () => {
    expect(() =>
      formatTokenAmount(1n, { decimals: 6, displayDecimals: -1 }),
    ).toThrow();
    expect(() =>
      formatTokenAmount(1n, { decimals: 6, displayDecimals: 7 }),
    ).toThrow();
  });
});

describe("formatTokenAmountCompact", () => {
  it("uses no suffix below 1000", () => {
    expect(formatTokenAmountCompact(1_500_000n, { decimals: 6 })).toBe("1.5");
    expect(formatTokenAmountCompact(0n, { decimals: 6 })).toBe("0");
  });

  it("uses k suffix for thousands", () => {
    expect(
      formatTokenAmountCompact(2_500n * 10n ** 6n, { decimals: 6 }),
    ).toBe("2.5k");
  });

  it("uses M suffix for millions", () => {
    expect(
      formatTokenAmountCompact(2_500_000n * 10n ** 6n, { decimals: 6 }),
    ).toBe("2.5M");
  });

  it("uses B suffix for billions", () => {
    expect(
      formatTokenAmountCompact(7_300_000_000n * 10n ** 6n, { decimals: 6 }),
    ).toBe("7.3B");
  });

  it("respects negative amounts", () => {
    expect(
      formatTokenAmountCompact(-2_500_000n * 10n ** 6n, { decimals: 6 }),
    ).toBe("-2.5M");
  });
});
