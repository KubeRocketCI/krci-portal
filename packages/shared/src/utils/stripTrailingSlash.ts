/**
 * Strips all trailing slashes from a string if present.
 * Returns empty string for null/undefined input.
 *
 * Uses a linear scan (no regex) on purpose: an anchored quantifier like
 * `/\/+$/` exhibits super-linear (O(n^2)) backtracking on a long run of
 * trailing slashes, which static analyzers flag as a ReDoS risk. This is O(n).
 *
 * @example
 * stripTrailingSlash("https://host/")   // "https://host"
 * stripTrailingSlash("https://host///") // "https://host"
 * stripTrailingSlash("https://host")    // "https://host"
 * stripTrailingSlash("")                // ""
 */
export function stripTrailingSlash(path: string | null | undefined): string {
  if (!path) {
    return "";
  }

  let end = path.length;
  while (end > 0 && path.charCodeAt(end - 1) === 47 /* "/" */) {
    end--;
  }

  return end === path.length ? path : path.slice(0, end);
}
