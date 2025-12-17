/**
 * Helper utilities tests
 */

import { validateBytes32 } from '../../utils/helpers';
import { ZunoSDKError, ErrorCodes } from '../../utils/errors';

describe('validateBytes32', () => {
  describe('valid bytes32 strings', () => {
    it('should accept valid bytes32 with all zeros', () => {
      expect(() => validateBytes32(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        'test'
      )).not.toThrow();
    });

    it('should accept valid bytes32 with value 1', () => {
      expect(() => validateBytes32(
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        'test'
      )).not.toThrow();
    });

    it('should accept valid bytes32 with all f', () => {
      expect(() => validateBytes32(
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        'test'
      )).not.toThrow();
    });

    it('should accept valid bytes32 with mixed case hex', () => {
      expect(() => validateBytes32(
        '0xAbCdEf1234567890AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890',
        'test'
      )).not.toThrow();
    });

    it('should accept valid bytes32 with uppercase hex', () => {
      expect(() => validateBytes32(
        '0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
        'test'
      )).not.toThrow();
    });
  });

  describe('invalid bytes32 strings', () => {
    it('should reject empty string', () => {
      expect(() => validateBytes32('', 'listingId'))
        .toThrow('listingId must be a valid bytes32 hex string');
    });

    it('should reject string without 0x prefix', () => {
      expect(() => validateBytes32(
        '0000000000000000000000000000000000000000000000000000000000000001',
        'listingId'
      )).toThrow('listingId must be a valid bytes32 hex string');
    });

    it('should reject too short hex string', () => {
      expect(() => validateBytes32('0x123', 'listingId'))
        .toThrow('listingId must be a valid bytes32 hex string');
    });

    it('should reject too long hex string', () => {
      expect(() => validateBytes32(
        '0x00000000000000000000000000000000000000000000000000000000000000001',
        'listingId'
      )).toThrow('listingId must be a valid bytes32 hex string');
    });

    it('should reject plain number string', () => {
      expect(() => validateBytes32('123', 'listingId'))
        .toThrow('listingId must be a valid bytes32 hex string');
    });

    it('should reject address format (40 hex chars)', () => {
      expect(() => validateBytes32('0x1234567890123456789012345678901234567890', 'listingId'))
        .toThrow('listingId must be a valid bytes32 hex string');
    });

    it('should reject string with invalid hex characters', () => {
      expect(() => validateBytes32(
        '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
        'listingId'
      )).toThrow('listingId must be a valid bytes32 hex string');
    });

    it('should reject null-like values', () => {
      expect(() => validateBytes32('null', 'listingId'))
        .toThrow('listingId must be a valid bytes32 hex string');
    });

    it('should reject undefined-like values', () => {
      expect(() => validateBytes32('undefined', 'listingId'))
        .toThrow('listingId must be a valid bytes32 hex string');
    });
  });

  describe('error messages', () => {
    it('should include parameter name in error message', () => {
      try {
        validateBytes32('invalid', 'myCustomParam');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ZunoSDKError);
        expect((error as ZunoSDKError).message).toContain('myCustomParam');
      }
    });

    it('should include actual value in error message', () => {
      try {
        validateBytes32('badValue', 'test');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ZunoSDKError);
        expect((error as ZunoSDKError).message).toContain('badValue');
      }
    });

    it('should use INVALID_PARAMETER error code', () => {
      try {
        validateBytes32('invalid', 'test');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ZunoSDKError);
        expect((error as ZunoSDKError).code).toBe(ErrorCodes.INVALID_PARAMETER);
      }
    });
  });
});
