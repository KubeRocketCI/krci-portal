import { humanize } from ".";
import { HUMANIZE_DURATION_OPTIONS } from "./constants";

/**
 * Default date format options for consistent timestamp display
 */
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
} as const;

/**
 * Format a timestamp string to a localized date string
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted date string or "N/A" if invalid
 */
export function formatTimestamp(timestamp?: string): string {
  if (!timestamp) {
    return "N/A";
  }

  try {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", DATE_FORMAT_OPTIONS);
  } catch {
    return "N/A";
  }
}

/**
 * Default date format options for Unix timestamp display (includes year and seconds)
 */
const UNIX_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
} as const;

/**
 * Format a Unix timestamp (milliseconds) to a localized date string
 * @param timestamp - Unix timestamp in milliseconds
 * @param options - Optional Intl.DateTimeFormatOptions to customize output
 * @returns Formatted date string or "N/A" if invalid
 */
export function formatUnixTimestamp(
  timestamp?: number,
  options: Intl.DateTimeFormatOptions = UNIX_DATE_FORMAT_OPTIONS
): string {
  if (!timestamp) {
    return "N/A";
  }

  try {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", options);
  } catch {
    return "N/A";
  }
}

/**
 * Calculate and format duration between two timestamps
 * @param startTime - Start timestamp (ISO 8601)
 * @param endTime - End timestamp (ISO 8601). If not provided, uses current time
 * @returns Formatted duration string or "N/A" if invalid
 */
export function formatDuration(startTime?: string, endTime?: string): string {
  if (!startTime) {
    return "N/A";
  }

  try {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const duration = end - start;

    return humanize(duration, HUMANIZE_DURATION_OPTIONS);
  } catch {
    return "N/A";
  }
}
