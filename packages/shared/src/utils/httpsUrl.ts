import { z } from "zod";

/**
 * Returns true only when `value` parses as an absolute URL with the `https:`
 * scheme. Anything else — `http:`, `javascript:`, `data:`, a relative path, or
 * an unparseable string — returns false.
 */
export function isHttpsUrl(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Returns `value` when it is an `https:` URL, otherwise `undefined`. Use at
 * render time to decide whether a stored URL may be used as a link target.
 */
export function safeHttpsHref(value: string | null | undefined): string | undefined {
  return isHttpsUrl(value) ? value : undefined;
}

/** Zod schema for a required, user-facing link that must be an `https:` URL. */
export const httpsUrlSchema = z.string().refine(isHttpsUrl, {
  message: "Must be a valid https:// URL",
});
