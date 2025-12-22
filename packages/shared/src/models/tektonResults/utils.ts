/**
 * Tekton Results utility functions
 */

import { TIME_RANGES, TimeRange } from "./constants.js";

/** Milliseconds per day constant */
const MS_PER_DAY = 86400 * 1000;

/**
 * Calculate UTC midnight timestamp for start of today
 *
 * @returns Unix timestamp in milliseconds for UTC midnight today
 */
export function getUtcMidnightToday(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0);
}

/**
 * Get the start timestamp for a given time range (UTC-aligned)
 *
 * All time ranges are calculated from UTC midnight boundaries:
 * - TODAY: Start of current UTC day
 * - WEEK: 7 days ago from UTC midnight
 * - MONTH: 30 days ago from UTC midnight
 * - QUARTER: 90 days ago from UTC midnight
 *
 * @param timeRange - The time range to calculate start for
 * @returns Unix timestamp in seconds (for API compatibility)
 *
 * @example
 * const startTs = getTimeRangeStartTimestamp(TIME_RANGES.WEEK);
 * // Returns Unix timestamp for 7 days ago at UTC midnight
 */
export function getTimeRangeStartTimestamp(timeRange: TimeRange): number {
  const todayUtcMidnight = getUtcMidnightToday();

  switch (timeRange) {
    case TIME_RANGES.TODAY:
      return Math.floor(todayUtcMidnight / 1000);
    case TIME_RANGES.WEEK:
      return Math.floor((todayUtcMidnight - 7 * MS_PER_DAY) / 1000);
    case TIME_RANGES.MONTH:
      return Math.floor((todayUtcMidnight - 30 * MS_PER_DAY) / 1000);
    case TIME_RANGES.QUARTER:
      return Math.floor((todayUtcMidnight - 90 * MS_PER_DAY) / 1000);
    default:
      return Math.floor(todayUtcMidnight / 1000);
  }
}

/**
 * Get the start date as ISO string for a given time range (UTC-aligned)
 *
 * @param timeRange - The time range to calculate start for
 * @returns ISO 8601 date string
 *
 * @example
 * const startDate = getTimeRangeStartISO(TIME_RANGES.WEEK);
 * // Returns "2024-01-08T00:00:00.000Z" (7 days ago at UTC midnight)
 */
export function getTimeRangeStartISO(timeRange: TimeRange): string {
  const timestampSeconds = getTimeRangeStartTimestamp(timeRange);
  return new Date(timestampSeconds * 1000).toISOString();
}

/**
 * Decode base64 record data to typed object
 * @param value - Base64 encoded JSON string
 * @returns Decoded object of type T
 * @throws Error if decoding fails
 */
export function decodeTektonRecordData<T = unknown>(value: string): T {
  try {
    const decoded = atob(value);
    return JSON.parse(decoded) as T;
  } catch {
    throw new Error("Failed to decode Tekton record data");
  }
}

/**
 * Parse a record name to extract result_uid and record_uid
 * Record name format: "{namespace}/results/{result_uid}/records/{record_uid}"
 *
 * @example
 * parseRecordName("edp-delivery/results/abc-123/records/def-456")
 * // Returns { resultUid: "abc-123", recordUid: "def-456" }
 *
 * @param recordName - Full record name string
 * @returns Object with resultUid and recordUid, or null if parsing fails
 */
export function parseRecordName(recordName: string): { resultUid: string; recordUid: string } | null {
  const parts = recordName.split("/");
  // Format: namespace/results/{result_uid}/records/{record_uid}
  const resultsIndex = parts.indexOf("results");
  const recordsIndex = parts.indexOf("records");

  if (resultsIndex === -1 || recordsIndex === -1 || resultsIndex + 1 >= parts.length || recordsIndex + 1 >= parts.length) {
    return null;
  }

  return {
    resultUid: parts[resultsIndex + 1],
    recordUid: parts[recordsIndex + 1],
  };
}
