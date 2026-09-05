/**
 * Capitalizes the first letter of a string. Non-letter first characters pass
 * through unchanged. Returns the input unchanged for empty, null, or
 * undefined values.
 *
 * @example
 * capitalizeFirstLetter("hello") // "Hello"
 * capitalizeFirstLetter("1abc")  // "1abc"
 * capitalizeFirstLetter("")      // ""
 */
export function capitalizeFirstLetter(str: string): string {
  if (str && str.length > 0) {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
  }
  if (str === null || str === undefined || str.length === 0) {
    return str;
  }
  throw new Error(`incorrect passed value: ${str}`);
}
