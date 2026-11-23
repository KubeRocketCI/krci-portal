export const DEFECTDOJO_SERVICE_NAME = "DefectDojo";

/** Product Type read when `DEFECTDOJO_PRODUCT_TYPE` is not set. */
export const DEFAULT_PRODUCT_TYPE = "KubeRocketCI";

/** Timeout of one request to DefectDojo. */
export const DEFECTDOJO_TIMEOUT_MS = 30_000;

/** DefectDojo sets no maximum page size; a findings page is capped here. */
export const FINDINGS_MAX_PAGE_SIZE = 100;

/** Rows per request when a list of products or tests is read completely. */
export const LIST_PAGE_SIZE = 500;

/** How long a scan type keeps its test type id. */
export const TEST_TYPE_CACHE_TTL_MS = 10 * 60 * 1000;

export const TEST_TYPE_CACHE_MAX_ENTRIES = 100;

/** Severity names of DefectDojo, most severe first. */
export const DEFECTDOJO_SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"] as const;

export type DefectDojoSeverity = (typeof DEFECTDOJO_SEVERITIES)[number];

/** Scan types of the findings the portal reads, by level. A test of another scan type has no level. */
export const DEFECTDOJO_LEVEL_SCAN_TYPES = {
  code: ["Semgrep JSON Report", "Gitleaks Scan"],
  image: ["Trivy Scan", "Anchore Grype"],
  runtime: ["Trivy Operator Scan"],
} as const;

export type DefectDojoLevel = keyof typeof DEFECTDOJO_LEVEL_SCAN_TYPES;

export type DefectDojoScanType = (typeof DEFECTDOJO_LEVEL_SCAN_TYPES)[DefectDojoLevel][number];

/** Level of a scan type, or `null` for a scan type of no level. */
export function levelOfScanType(scanType: string): DefectDojoLevel | null {
  for (const [level, scanTypes] of Object.entries(DEFECTDOJO_LEVEL_SCAN_TYPES)) {
    if ((scanTypes as readonly string[]).includes(scanType)) {
      return level as DefectDojoLevel;
    }
  }
  return null;
}

/** Finding states a list can be asked for. Duplicates are never listed. */
export const DEFECTDOJO_FINDING_STATES = [
  "active",
  "mitigated",
  "falsePositive",
  "outOfScope",
  "riskAccepted",
] as const;

export type DefectDojoFindingState = (typeof DEFECTDOJO_FINDING_STATES)[number];

/** Query parameter that selects each finding state. */
export const FINDING_STATE_PARAMS = {
  active: "active",
  mitigated: "is_mitigated",
  falsePositive: "false_p",
  outOfScope: "out_of_scope",
  riskAccepted: "risk_accepted",
} as const satisfies Record<DefectDojoFindingState, string>;
