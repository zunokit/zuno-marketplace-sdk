/**
 * useClipboard Hook Tests
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useClipboard } from '../../react/hooks/useClipboard';

describe('useClipboard', () => {
  let originalClipboard: PropertyDescriptor | undefined;
  let writeTextMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    writeTextMock = jest.fn().mockResolvedValue(undefined);
    originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      delete (navigator as Navigator & { clipboard?: unknown }).clipboard;
    }
  });

  it('returns default state before any copy', () => {
    const { result } = renderHook(() => useClipboard());
    expect(result.current.value).toBeNull();
    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('copies a value and exposes the copied flag', async () => {
    const onCopy = jest.fn();
    const { result } = renderHook(() => useClipboard({ onCopy }));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.copy('0xdeadbeef');
    });

    expect(ok).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('0xdeadbeef');
    expect(result.current.value).toBe('0xdeadbeef');
    expect(result.current.copied).toBe(true);
    expect(result.current.error).toBeNull();
    expect(onCopy).toHaveBeenCalledWith('0xdeadbeef');
  });

  it('resets the copied flag after resetAfterMs', async () => {
    const { result } = renderHook(() => useClipboard({ resetAfterMs: 500 }));

    await act(async () => {
      await result.current.copy('hello');
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => expect(result.current.copied).toBe(false));
    expect(result.current.value).toBe('hello');
  });

  it('does not auto-reset when resetAfterMs is zero', async () => {
    const { result } = renderHook(() => useClipboard({ resetAfterMs: 0 }));

    await act(async () => {
      await result.current.copy('persist');
    });

    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    expect(result.current.copied).toBe(true);
  });

  it('falls back to execCommand when async API is unavailable', async () => {
    delete (navigator as Navigator & { clipboard?: unknown }).clipboard;
    const execMock = jest.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execMock,
    });

    const { result } = renderHook(() => useClipboard());

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.copy('fallback');
    });

    expect(ok).toBe(true);
    expect(execMock).toHaveBeenCalledWith('copy');
    expect(result.current.copied).toBe(true);
    expect(result.current.value).toBe('fallback');

    delete (document as Document & { execCommand?: unknown }).execCommand;
  });

  it('reports an error and calls onError when both strategies fail', async () => {
    writeTextMock.mockRejectedValueOnce(new Error('blocked'));
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: jest.fn().mockReturnValue(false),
    });
    const onError = jest.fn();

    const { result } = renderHook(() => useClipboard({ onError }));

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.copy('nope');
    });

    expect(ok).toBe(false);
    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(onError).toHaveBeenCalledTimes(1);

    delete (document as Document & { execCommand?: unknown }).execCommand;
  });

  it('reset() clears state and pending timers', async () => {
    const { result } = renderHook(() => useClipboard({ resetAfterMs: 1000 }));

    await act(async () => {
      await result.current.copy('a');
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.copied).toBe(false);
    expect(result.current.value).toBeNull();
    expect(result.current.error).toBeNull();

    // ensure the previously scheduled timer cannot resurrect copied=true
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(false);
  });
});
