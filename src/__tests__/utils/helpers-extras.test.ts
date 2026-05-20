/**
 * Additional coverage for src/utils/helpers.ts
 *
 * The original helpers.test.ts focuses on `validateBytes32`. This suite covers
 * the remaining pure helpers: retries, transaction overrides, value parsing,
 * scheduling helpers, and the safeCall wrapper.
 */

import { ethers } from 'ethers';
import {
  withRetry,
  buildTransactionOverrides,
  validateAndFormatAddress,
  toWei,
  fromWei,
  debounce,
  throttle,
  safeCall,
  formatTransactionReceipt,
  parseTransactionError,
} from '../../utils/helpers';
import { ZunoSDKError, ErrorCodes } from '../../utils/errors';

describe('withRetry', () => {
  it('returns the value on the first successful attempt without retrying', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    await expect(withRetry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries transient failures and eventually succeeds', async () => {
    const fn = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('network glitch'))
      .mockRejectedValueOnce(new Error('network glitch'))
      .mockResolvedValueOnce('eventually');

    const result = await withRetry(fn, { initialDelay: 1, maxDelay: 2, maxRetries: 3 });
    expect(result).toBe('eventually');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('stops immediately on non-retryable errors and rethrows the original error', async () => {
    const error = new Error('insufficient funds for transfer');
    const fn = jest.fn<Promise<string>, []>().mockRejectedValue(error);

    await expect(withRetry(fn, { initialDelay: 1, maxRetries: 3 })).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('honors a custom shouldRetry predicate', async () => {
    const error = new Error('please retry');
    const fn = jest.fn<Promise<string>, []>().mockRejectedValue(error);
    const shouldRetry = jest.fn().mockReturnValue(false);

    await expect(
      withRetry(fn, { initialDelay: 1, maxRetries: 2 }, shouldRetry),
    ).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledWith(error, 0);
  });

  it('exhausts maxRetries and throws the last error', async () => {
    const error = new Error('flaky rpc');
    const fn = jest.fn<Promise<string>, []>().mockRejectedValue(error);

    await expect(
      withRetry(fn, { initialDelay: 1, maxDelay: 2, maxRetries: 2 }),
    ).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('supports linear backoff without throwing', async () => {
    const fn = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('temp'))
      .mockResolvedValueOnce('done');
    const result = await withRetry(fn, {
      initialDelay: 1,
      maxDelay: 1,
      maxRetries: 1,
      backoff: 'linear',
    });
    expect(result).toBe('done');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('buildTransactionOverrides', () => {
  it('returns an empty object when no options are provided', () => {
    expect(buildTransactionOverrides()).toEqual({});
    expect(buildTransactionOverrides({})).toEqual({});
  });

  it('converts string value to BigInt', () => {
    const overrides = buildTransactionOverrides({ value: '1000000000000000000' });
    expect(overrides.value).toBe(1000000000000000000n);
  });

  it('passes through bigint value unchanged', () => {
    const overrides = buildTransactionOverrides({ value: 42n });
    expect(overrides.value).toBe(42n);
  });

  it('copies gasLimit/gasPrice/EIP-1559 fees and nonce when provided', () => {
    const overrides = buildTransactionOverrides({
      gasLimit: '21000',
      gasPrice: '1000000000',
      maxFeePerGas: '2000000000',
      maxPriorityFeePerGas: '1500000000',
      nonce: 7,
    });
    expect(overrides).toEqual({
      gasLimit: '21000',
      gasPrice: '1000000000',
      maxFeePerGas: '2000000000',
      maxPriorityFeePerGas: '1500000000',
      nonce: 7,
    });
  });

  it('treats nonce=0 as a valid override', () => {
    const overrides = buildTransactionOverrides({ nonce: 0 });
    expect(overrides.nonce).toBe(0);
  });
});

describe('validateAndFormatAddress', () => {
  it('returns the checksummed address for a valid lowercase address', () => {
    const formatted = validateAndFormatAddress(
      '0x52908400098527886e0f7030069857d2e4169ee7',
    );
    expect(formatted).toBe('0x52908400098527886E0F7030069857D2E4169EE7');
  });

  it('throws ZunoSDKError when given a non-string value', () => {
    // @ts-expect-error - exercising the runtime guard
    expect(() => validateAndFormatAddress(undefined)).toThrow(ZunoSDKError);
    // @ts-expect-error
    expect(() => validateAndFormatAddress(123)).toThrow(/Address must be a string/);
  });

  it('throws ZunoSDKError for malformed addresses', () => {
    expect(() => validateAndFormatAddress('not-an-address')).toThrow(/Invalid Ethereum address/);
  });
});

describe('toWei / fromWei', () => {
  it('round-trips a whole ether amount', () => {
    const wei = toWei('1');
    expect(wei).toBe(10n ** 18n);
    expect(fromWei(wei)).toBe('1.0');
  });

  it('accepts numeric inputs', () => {
    expect(toWei(0.5)).toBe(5n * 10n ** 17n);
  });

  it('throws ZunoSDKError with INVALID_AMOUNT for unparseable input', () => {
    expect.assertions(2);
    try {
      toWei('not-a-number');
    } catch (err) {
      expect(err).toBeInstanceOf(ZunoSDKError);
      expect((err as ZunoSDKError).code).toBe(ErrorCodes.INVALID_AMOUNT);
    }
  });

  it('fromWei throws ZunoSDKError for invalid wei values', () => {
    expect(() => fromWei('not-wei')).toThrow(ZunoSDKError);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('only invokes the function once for back-to-back calls within the wait window', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);
    debounced('a');
    debounced('b');
    debounced('c');
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('invokes the function again after the wait window elapses', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 50);
    debounced('first');
    jest.advanceTimersByTime(50);
    debounced('second');
    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 'first');
    expect(fn).toHaveBeenNthCalledWith(2, 'second');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('invokes the function on the leading edge and suppresses subsequent calls', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);
    throttled('a');
    throttled('b');
    throttled('c');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
    jest.advanceTimersByTime(100);
    throttled('d');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('d');
  });
});

describe('safeCall', () => {
  it('returns the resolved value when the function succeeds', async () => {
    const result = await safeCall(async () => 'ok', 'fallback');
    expect(result).toBe('ok');
  });

  it('returns the fallback when the function throws', async () => {
    const result = await safeCall(async () => {
      throw new Error('boom');
    }, 'fallback');
    expect(result).toBe('fallback');
  });
});

describe('formatTransactionReceipt', () => {
  it('maps ethers receipt fields into the SDK shape', () => {
    const ethersReceipt = {
      hash: '0xhash',
      blockNumber: 12345,
      blockHash: '0xblock',
      gasUsed: 21000n,
      cumulativeGasUsed: 42000n,
      status: 1,
      logs: [{ a: 1 }, { b: 2 }],
    } as unknown as ethers.TransactionReceipt;

    const receipt = formatTransactionReceipt(ethersReceipt);

    expect(receipt.hash).toBe('0xhash');
    expect(receipt.blockNumber).toBe(12345);
    expect(receipt.blockHash).toBe('0xblock');
    expect(receipt.gasUsed).toBe('21000');
    expect(receipt.cumulativeGasUsed).toBe('42000');
    expect(receipt.status).toBe('success');
    expect(receipt.logs).toHaveLength(2);
    expect(typeof receipt.timestamp).toBe('number');
  });

  it('marks status as failed when status != 1 and tolerates missing optional fields', () => {
    const ethersReceipt = {
      hash: '0xhash',
      blockNumber: undefined,
      blockHash: undefined,
      gasUsed: undefined,
      cumulativeGasUsed: undefined,
      status: 0,
      logs: undefined,
    } as unknown as ethers.TransactionReceipt;

    const receipt = formatTransactionReceipt(ethersReceipt);
    expect(receipt.status).toBe('failed');
    expect(receipt.blockNumber).toBe(0);
    expect(receipt.blockHash).toBe('');
    expect(receipt.gasUsed).toBe('0');
    expect(receipt.cumulativeGasUsed).toBe('0');
    expect(receipt.logs).toEqual([]);
  });
});

describe('parseTransactionError', () => {
  const cases: Array<[string, string]> = [
    ['user rejected the request', ErrorCodes.USER_REJECTED],
    ['insufficient funds for gas', ErrorCodes.INSUFFICIENT_FUNDS],
    ['nonce too low for the account', ErrorCodes.NONCE_TOO_LOW],
    ['nonce too high', ErrorCodes.NONCE_TOO_LOW],
    ['execution reverted: bad state', ErrorCodes.TRANSACTION_REVERTED],
    ['intrinsic gas too low', ErrorCodes.GAS_ESTIMATION_FAILED],
  ];

  it.each(cases)('maps "%s" to the expected error code', (message, expectedCode) => {
    const err = parseTransactionError(new Error(message));
    expect(err).toBeInstanceOf(ZunoSDKError);
    expect(err.code).toBe(expectedCode);
  });

  it('falls back to TRANSACTION_FAILED for unrecognised messages', () => {
    const err = parseTransactionError(new Error('something else'));
    expect(err.code).toBe(ErrorCodes.TRANSACTION_FAILED);
  });
});
