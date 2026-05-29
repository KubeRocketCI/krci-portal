/** Matches the `[[<ISO-8601 UTC timestamp>]] ` prefix the log backend emits. */
const TIMESTAMP_REGEX = /\[\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z)\]\]\s+/g;

/**
 * Normalizes the timestamp markers in raw log text.
 *
 * Accepts either a single line or a multi-line blob — every `[[...]]` marker is
 * processed (the regex is global), so this is safe for both the streaming
 * per-line path and the static whole-log path.
 *
 * - `showTimestamps=false`: strips the `[[...]]` prefix entirely.
 * - `showTimestamps=true`: replaces it with a locale-formatted `[ ... ]` marker.
 *   An unparseable timestamp falls back to the original matched text.
 *
 * Text without a timestamp marker is returned unchanged.
 */
export function formatLogText(text: string, showTimestamps: boolean): string {
  if (!showTimestamps) {
    return text.replace(TIMESTAMP_REGEX, "");
  }

  return text.replace(TIMESTAMP_REGEX, (_match, timestamp) => {
    const date = new Date(timestamp);
    // `new Date(badString)` never throws — it yields an Invalid Date whose
    // toLocaleString() returns "Invalid Date". Guard explicitly so a malformed
    // timestamp falls back to the original text instead of rendering garbage.
    if (isNaN(date.getTime())) {
      return _match;
    }
    const localeTime = date.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return `[ ${localeTime} ] `;
  });
}
