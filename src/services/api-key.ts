/**
 * BYOK (bring your own key) storage.
 *
 * The OpenRouter key lives in this browser only - it is never bundled, never
 * committed (see .gitignore) and never written to the server's disk. It is
 * forwarded to our own proxy per request, so the browser never talks to
 * OpenRouter directly and stays same-origin.
 *
 * A key stored here takes precedence over OPENROUTER_API_KEY in .env.
 */

const STORAGE_KEY = 'ai-influencer-openrouter-key';

/** Fired on window whenever the key is saved or removed. */
export const API_KEY_CHANGED_EVENT = 'ai-influencer:api-key-changed';

/** Keys always start with this prefix; used for cheap client-side validation. */
const KEY_PREFIX = 'sk-or-';

function sanitize(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, '').trim();
}

export function getApiKey(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const key = sanitize(raw);
    return key || null;
  } catch {
    return null;
  }
}

export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

/**
 * Looks like an OpenRouter key. Deliberately loose: only the prefix and a
 * minimum length are checked, because the real verdict comes from the API.
 */
export function isValidKeyFormat(raw: string): boolean {
  const key = sanitize(raw);
  return key.startsWith(KEY_PREFIX) && key.length >= 20;
}

export function setApiKey(raw: string): void {
  const key = sanitize(raw);
  try {
    if (!key) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, key);
    }
  } catch {
    // Non-fatal: the app still works with a server-side .env key
  }
  notifyChanged();
}

export function clearApiKey(): void {
  setApiKey('');
}

/** `sk-or-v1-abcd...wxyz` - enough to recognise the key, not enough to use it. */
export function maskApiKey(key: string | null): string {
  if (!key) return '';
  if (key.length <= 14) return `${key.slice(0, 4)}...`;
  return `${key.slice(0, 10)}...${key.slice(-4)}`;
}

export function notifyChanged(): void {
  try {
    window.dispatchEvent(new Event(API_KEY_CHANGED_EVENT));
  } catch {
    // Server-side rendering / non-browser environment
  }
}

/** Request headers for our proxy, empty when no BYOK key is stored. */
export function apiKeyHeaders(): Record<string, string> {
  const key = getApiKey();
  return key ? { 'x-openrouter-key': key } : {};
}
