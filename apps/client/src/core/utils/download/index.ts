/**
 * Downloads text content as a file in the browser.
 *
 * @param content - The text content to download
 * @param filename - The filename for the downloaded file
 * @param mimeType - The MIME type (defaults to "text/plain")
 */
export function downloadTextFile(content: string, filename: string, mimeType = "text/plain"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Ensures a filename has a proper log extension.
 *
 * @param filename - The filename to check/modify
 * @returns Filename with .log extension if not already present
 */
export function ensureLogExtension(filename: string): string {
  if (filename.endsWith(".txt") || filename.endsWith(".log")) {
    return filename;
  }
  return `${filename}.log`;
}

/**
 * Generates a timestamped filename for logs.
 *
 * @param prefix - The prefix for the filename (e.g., "pod-logs", "tekton-logs")
 * @returns Filename with timestamp
 */
export function generateTimestampedLogFilename(prefix: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}-${timestamp}.log`;
}

/**
 * Sanitizes a string for use in a log filename prefix.
 * Replaces any character that is not alphanumeric, hyphen, or underscore with "_".
 */
export function sanitizeLogFilenamePart(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_]/g, "_");
}
