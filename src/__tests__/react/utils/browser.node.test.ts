/**
 * @jest-environment node
 *
 * SSR-side coverage for `isBrowser`. Running in the node environment makes
 * `typeof window === 'undefined'` naturally true.
 */

import { isBrowser } from '../../../react/utils/browser';

describe('isBrowser (node / SSR)', () => {
  it('returns false when window is undefined', () => {
    expect(typeof window).toBe('undefined');
    expect(isBrowser()).toBe(false);
  });
});
