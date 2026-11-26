import {
  DEFECTDOJO_LEVEL_SCAN_TYPES,
  type CodebaseScanLevel,
  type DefectDojoScanType,
  type SeverityCounts,
} from "./constants.js";
import type { OverviewCodebase, OverviewNamespace } from "./types.js";
import { sumCounts } from "./utils.js";

/**
 * The totals of the Runtime level over `rows`: the vulnerabilities and, never added to them, the exposed secrets of the
 * namespaces with a namespace product, and how many those are. `null` when none has one.
 */
export function runtimeLines(
  rows: readonly OverviewNamespace[]
): { size: number; vulnerabilities: SeverityCounts; secrets: SeverityCounts } | null {
  const products = rows.flatMap((row) => (row.product ? [row.product] : []));
  if (products.length === 0) {
    return null;
  }
  return {
    size: products.length,
    vulnerabilities: sumCounts(products.map((product) => product.vulnerabilities)),
    secrets: sumCounts(products.map((product) => product.secrets)),
  };
}

/**
 * The totals of a Code or Image level over `codebases`: a line per scan type with a scan, in the order of the level's
 * scan types, adding the scans of that scan type, which are different targets. Two scan types, such as two scanners of
 * one image, are never added.
 */
export function scanTypeLines(
  codebases: readonly OverviewCodebase[],
  level: CodebaseScanLevel
): { scanType: DefectDojoScanType; counts: SeverityCounts; size: number }[] {
  const scans = codebases.flatMap((codebase) => codebase.scans).filter((scan) => scan.ref.level === level);

  return DEFECTDOJO_LEVEL_SCAN_TYPES[level].flatMap((scanType) => {
    const ofType = scans.filter((scan) => scan.ref.scanner === scanType);
    return ofType.length === 0
      ? []
      : [{ scanType, counts: sumCounts(ofType.map((scan) => scan.counts)), size: ofType.length }];
  });
}
