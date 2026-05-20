/**
 * Tests for browser environment detection helpers (browser path).
 * The SSR path lives in a sibling file with `@jest-environment node` so
 * `typeof window === 'undefined'` is naturally true there.
 */

import { isBrowser } from '../../../react/utils/browser';

describe('isBrowser (jsdom)', () => {
  it('returns true when window is defined', () => {
    expect(typeof window).toBe('object');
    expect(isBrowser()).toBe(true);
  });
});
