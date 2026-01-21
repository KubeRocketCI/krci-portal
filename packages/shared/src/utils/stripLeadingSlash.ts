/**
 * Strips the leading slash from a path if present.
 * Returns empty string for null/undefined input.
 *
 * @example
 * stripLeadingSlash("/my/path") // "my/path"
 * stripLeadingSlash("my/path")  // "my/path"
 * stripLeadingSlash("")         // ""
 */
export function stripLeadingSlash(path: string | null | undefined): string {
  if (!path) {
    return "";
  }
  return path.startsWith("/") ? path.slice(1) : path;
}
