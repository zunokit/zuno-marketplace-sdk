/**
 * Error Utilities Tests
 */

import {
  ZunoSDKError,
  ErrorCodes,
  assert,
  validateAddress,
  validateTokenId,
  validateAmount,
  validateDuration,
} from '../../utils/errors';

describe('ZunoSDKError', () => {
  it('should create error with code and message', () => {
    const error = new ZunoSDKError(
      ErrorCodes.INVALID_CONFIG,
      'Invalid configuration'
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ZunoSDKError);
    expect(error.code).toBe(ErrorCodes.INVALID_CONFIG);
    expect(error.message).toBe('Invalid configuration');
    expect(error.name).toBe('ZunoSDKError');
  });

  it('should include details and original error', () => {
    const originalError = new Error('Original');
    const details = { foo: 'bar' };

    const error = new ZunoSDKError(
      ErrorCodes.API_REQUEST_FAILED,
      'Request failed',
      details,
      originalError
    );

    expect(error.details).toBe(details);
    expect(error.originalError).toBe(originalError);
  });

  it('should check error code with is()', () => {
    const error = new ZunoSDKError(
      ErrorCodes.INSUFFICIENT_FUNDS,
      'Not enough funds'
    );

    expect(error.is(ErrorCodes.INSUFFICIENT_FUNDS)).toBe(true);
    expect(error.is(ErrorCodes.INVALID_CONFIG)).toBe(false);
  });

  it('should convert to JSON', () => {
    const error = new ZunoSDKError(
      ErrorCodes.CONTRACT_CALL_FAILED,
      'Contract call failed',
      { contract: '0x...' }
    );

    const json = error.toJSON();

    expect(json).toMatchObject({
      name: 'ZunoSDKError',
      code: ErrorCodes.CONTRACT_CALL_FAILED,
      message: 'Contract call failed',
      details: { contract: '0x...' },
    });
  });

  describe('from()', () => {
    it('should return same error if already ZunoSDKError', () => {
      const error = new ZunoSDKError(
        ErrorCodes.INVALID_PARAMETER,
        'Invalid param'
      );

      const result = ZunoSDKError.from(error);

      expect(result).toBe(error);
    });

    it('should wrap Error objects', () => {
      const error = new Error('Something went wrong');
      const result = ZunoSDKError.from(error);

      expect(result).toBeInstanceOf(ZunoSDKError);
      expect(result.message).toBe('Something went wrong');
      expect(result.originalError).toBe(error);
    });

    it('should handle non-Error values', () => {
      const result = ZunoSDKError.from('string error');

      expect(result).toBeInstanceOf(ZunoSDKError);
      expect(result.message).toBe('string error');
    });
  });
});

describe('Validation functions', () => {
  describe('assert()', () => {
    it('should not throw if condition is true', () => {
      expect(() => {
        assert(true, ErrorCodes.INVALID_PARAMETER, 'Should not throw');
      }).not.toThrow();
    });

    it('should throw if condition is false', () => {
      expect(() => {
        assert(false, ErrorCodes.INVALID_PARAMETER, 'Should throw');
      }).toThrow(ZunoSDKError);

      expect(() => {
        assert(false, ErrorCodes.INVALID_PARAMETER, 'Should throw');
      }).toThrow('Should throw');
    });
  });

  describe('validateAddress()', () => {
    it('should accept valid Ethereum addresses', () => {
      expect(() => {
        validateAddress('0x1234567890123456789012345678901234567890');
      }).not.toThrow();
    });

    it('should reject invalid addresses', () => {
      expect(() => validateAddress('')).toThrow();
      expect(() => validateAddress('0x123')).toThrow();
      expect(() => validateAddress('invalid')).toThrow();
      expect(() => validateAddress('0xZZZZ')).toThrow();
    });

    it('should use custom parameter name in error', () => {
      expect(() => {
        validateAddress('invalid', 'contractAddress');
      }).toThrow('contractAddress');
    });
  });

  describe('validateTokenId()', () => {
    it('should accept valid token IDs', () => {
      expect(() => validateTokenId('1')).not.toThrow();
      expect(() => validateTokenId('123')).not.toThrow();
    });

    it('should reject empty token IDs', () => {
      expect(() => validateTokenId('')).toThrow();
    });
  });

  describe('validateAmount()', () => {
    it('should accept valid amounts', () => {
      expect(() => validateAmount('1.5')).not.toThrow();
      expect(() => validateAmount(100)).not.toThrow();
    });

    it('should reject invalid amounts', () => {
      expect(() => validateAmount('0')).toThrow();
      expect(() => validateAmount(-1)).toThrow();
      expect(() => validateAmount('invalid')).toThrow();
    });
  });

  describe('validateDuration()', () => {
    it('should accept valid durations', () => {
      expect(() => validateDuration(86400)).not.toThrow();
      expect(() => validateDuration(1)).not.toThrow();
    });

    it('should reject invalid durations', () => {
      expect(() => validateDuration(0)).toThrow();
      expect(() => validateDuration(-1)).toThrow();
    });
  });
});
