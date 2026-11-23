import type { CodebaseScanRef } from "./types.js";

/** Identity of a scan as one string: equal for the same scan, different for any other. Not a lookup key sent to DefectDojo. */
export function scanRefKey(scan: CodebaseScanRef): string {
  return JSON.stringify([scan.level, scan.branch, scan.scanner, scan.image]);
}
