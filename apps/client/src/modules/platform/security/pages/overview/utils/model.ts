import {
  CODEBASE_SCAN_LEVELS,
  SECRET_SCAN_TYPES,
  compareNamespaceFindings,
  compareOverviewNamespaces,
  hasActiveFindings,
  mostSevereFindingFirst,
  mostSevereScan,
  type CodebaseScanLevel,
  type DefectDojoLevel,
  type DefectDojoSeverity,
  type OverviewCodebase,
  type OverviewNamespace,
  type OverviewScan,
  type SeverityCounts,
  type StageRef,
} from "@my-project/shared";

/** Rows of each list of "Where to start". */
export const TOP_ROWS = 5;

export interface ViewFilters {
  /** The clusters in view: picked, or the default clusters of the installation. */
  clusters: readonly string[];
  namespace?: string;
  environment?: StageRef;
  codebase?: string;
  level?: DefectDojoLevel;
  severity?: DefectDojoSeverity;
}

function hasSeverity(values: SeverityCounts, severity: DefectDojoSeverity): boolean {
  return values[severity] > 0;
}

/** The levels a level filter keeps in view: the scan levels, Code before Image, and Runtime. */
export function levelsInView(level: DefectDojoLevel | undefined): {
  scanLevels: CodebaseScanLevel[];
  runtime: boolean;
} {
  return {
    scanLevels: CODEBASE_SCAN_LEVELS.filter((scanLevel) => level === undefined || scanLevel === level),
    runtime: level === undefined || level === "runtime",
  };
}

/**
 * The namespaces of the clusters in view that the filters keep, in the order of the Namespaces tab: the order of the
 * server, re-ranked under a severity.
 */
export function namespacesInView(
  rows: readonly OverviewNamespace[],
  {
    clusters,
    namespace,
    environment,
    severity,
  }: Pick<ViewFilters, "clusters" | "namespace" | "environment" | "severity">
): OverviewNamespace[] {
  const kept = rows.filter(
    (row) =>
      clusters.includes(row.cluster) &&
      (namespace === undefined || row.namespace === namespace) &&
      (environment === undefined ||
        (row.environment?.cdPipeline === environment.cdPipeline && row.environment.stage === environment.stage)) &&
      (severity === undefined ||
        (row.product !== null &&
          (hasSeverity(row.product.vulnerabilities, severity) || hasSeverity(row.product.secrets, severity))))
  );
  return severity === undefined ? kept : kept.sort(compareOverviewNamespaces(severity));
}

/** The codebases the filters keep, each with its scans of the level and severity in view; none without such a scan. */
export function codebasesInView(
  codebases: readonly OverviewCodebase[],
  { codebase, level, severity }: Pick<ViewFilters, "codebase" | "level" | "severity">
): OverviewCodebase[] {
  return codebases.flatMap((entry) => {
    if (codebase !== undefined && entry.codebase !== codebase) {
      return [];
    }
    const scans = entry.scans.filter(
      (scan) =>
        (level === undefined || scan.ref.level === level) &&
        (severity === undefined || hasSeverity(scan.counts, severity))
    );
    return scans.length === 0 ? [] : [{ ...entry, scans }];
  });
}

/** The Codebases without scan data that the filters keep. A severity keeps none: they have no counts. */
export function unscannedInView(
  unscanned: readonly string[],
  { codebase, severity }: Pick<ViewFilters, "codebase" | "severity">
): string[] {
  return severity === undefined ? unscanned.filter((name) => codebase === undefined || name === codebase) : [];
}

/** The namespaces with findings, most severe first by their vulnerabilities, then by their exposed secrets. */
export function topNamespaces(rows: readonly OverviewNamespace[], severity?: DefectDojoSeverity): OverviewNamespace[] {
  return rows
    .filter(
      (row) =>
        row.product !== null &&
        (hasActiveFindings(row.product.vulnerabilities) || hasActiveFindings(row.product.secrets))
    )
    .sort(compareNamespaceFindings(severity))
    .slice(0, TOP_ROWS);
}

/** The codebases with findings, each ranked by its most severe scan, which it shows: scans are not added. */
export function topCodebases(
  codebases: readonly OverviewCodebase[],
  severity?: DefectDojoSeverity
): { codebase: OverviewCodebase; scan: OverviewScan }[] {
  const mostSevere = mostSevereFindingFirst(severity);

  return codebases
    .flatMap((codebase) => {
      const scan = mostSevereScan(codebase.scans, severity);
      return scan && hasActiveFindings(scan.counts) ? [{ codebase, scan }] : [];
    })
    .sort((a, b) => mostSevere(a.scan.counts, b.scan.counts) || a.codebase.codebase.localeCompare(b.codebase.codebase))
    .slice(0, TOP_ROWS);
}

export function isSecretScanType(scanType: string): boolean {
  return (SECRET_SCAN_TYPES as readonly string[]).includes(scanType);
}

/** What a scan scanned: the branch, and the image with its tag. */
export function scanTarget({ ref, version }: OverviewScan): string {
  const image = ref.image === null ? null : version ? `${ref.image}:${version}` : ref.image;
  return [`Branch ${ref.branch}`, image].filter(Boolean).join(", ");
}
