/**
 * Try to parse a string as a JSON array of strings.
 * Returns the parsed array or undefined if parsing fails
 * or the input is not a JSON array.
 *
 * @example
 * tryParseJsonArray('["a","b","c"]') // ["a", "b", "c"]
 * tryParseJsonArray("not-json")      // undefined
 * tryParseJsonArray('{"key":"val"}') // undefined
 */
export function tryParseJsonArray(value: string): string[] | undefined {
  if (!value.startsWith("[")) return undefined;

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : undefined;
  } catch {
    return undefined;
  }
}
