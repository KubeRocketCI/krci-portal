/**
 * Tekton Results utility functions
 */

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
