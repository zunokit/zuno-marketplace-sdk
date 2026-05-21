/**
 * Clipboard hook for copying text values (addresses, IDs, tx hashes, ...).
 *
 * The hook prefers the asynchronous `navigator.clipboard` API and falls back
 * to an off-screen `<textarea>` + `document.execCommand('copy')` when running
 * in environments where the async API is unavailable (older browsers, insecure
 * contexts, some embedded webviews).
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseClipboardOptions {
  /**
   * Milliseconds the `copied` flag stays `true` after a successful copy.
   * @default 2000
   */
  resetAfterMs?: number;
  /**
   * Called whenever a copy succeeds. Receives the copied text.
   */
  onCopy?: (value: string) => void;
  /**
   * Called whenever a copy fails. Receives the underlying error.
   */
  onError?: (error: Error) => void;
}

export interface UseClipboardReturn {
  /** Last value that was copied, or `null` if nothing has been copied yet. */
  value: string | null;
  /** `true` while inside the `resetAfterMs` window after a successful copy. */
  copied: boolean;
  /** Most recent error from a failed copy, or `null`. */
  error: Error | null;
  /** Copy a value to the clipboard. Resolves to `true` on success. */
  copy: (value: string) => Promise<boolean>;
  /** Clear `copied`, `value`, and `error` immediately. */
  reset: () => void;
}

const DEFAULT_RESET_MS = 2000;

const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof document !== 'undefined';

async function writeViaAsyncApi(value: string): Promise<boolean> {
  if (!isBrowser()) return false;
  const clipboard = (
    navigator as Navigator & { clipboard?: { writeText?: (s: string) => Promise<void> } }
  ).clipboard;
  if (!clipboard?.writeText) return false;
  await clipboard.writeText(value);
  return true;
}

function writeViaExecCommand(value: string): boolean {
  if (!isBrowser()) return false;
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-1000px';
  textarea.style.left = '-1000px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, value.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(textarea);
  }
  return ok;
}

/**
 * Copy short strings (addresses, hashes, ids) to the user's clipboard.
 *
 * @example
 * ```tsx
 * const { copy, copied } = useClipboard();
 * <button onClick={() => copy(address)}>
 *   {copied ? 'Copied!' : 'Copy address'}
 * </button>
 * ```
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { resetAfterMs = DEFAULT_RESET_MS, onCopy, onError } = options;
  const [value, setValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setValue(null);
    setCopied(false);
    setError(null);
  }, [clearTimer]);

  const copy = useCallback(
    async (next: string): Promise<boolean> => {
      clearTimer();
      try {
        let ok = await writeViaAsyncApi(next);
        if (!ok) ok = writeViaExecCommand(next);
        if (!ok) throw new Error('Clipboard API unavailable');
        setValue(next);
        setCopied(true);
        setError(null);
        onCopy?.(next);
        if (resetAfterMs > 0) {
          timeoutRef.current = setTimeout(() => {
            setCopied(false);
            timeoutRef.current = null;
          }, resetAfterMs);
        }
        return true;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        setCopied(false);
        onError?.(err);
        return false;
      }
    },
    [clearTimer, onCopy, onError, resetAfterMs],
  );

  return { value, copied, error, copy, reset };
}
