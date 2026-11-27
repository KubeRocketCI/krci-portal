/** Severity names of DefectDojo, most severe first. */
export const DEFECTDOJO_SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"] as const;

export type DefectDojoSeverity = (typeof DEFECTDOJO_SEVERITIES)[number];

export type SeverityCounts = Record<DefectDojoSeverity, number>;

export const NO_FINDING_COUNTS: Readonly<SeverityCounts> = {
  Critical: 0,
  High: 0,
  Medium: 0,
  Low: 0,
  Info: 0,
};

/**
 * Where a finding was found: in a running workload container, in an image a CI scan built, in the code. In the order
 * the vulnerability list offers them.
 */
export const DEFECTDOJO_LEVELS = ["runtime", "image", "code"] as const;

export type DefectDojoLevel = (typeof DEFECTDOJO_LEVELS)[number];

/** Scan types of the findings the portal reads, by level. A test of another scan type has no level. */
export const DEFECTDOJO_LEVEL_SCAN_TYPES = {
  code: ["Semgrep JSON Report", "Gitleaks Scan"],
  image: ["Trivy Scan", "Anchore Grype"],
  runtime: ["Trivy Operator Scan"],
} as const satisfies Record<DefectDojoLevel, readonly string[]>;

export type DefectDojoScanType = (typeof DEFECTDOJO_LEVEL_SCAN_TYPES)[DefectDojoLevel][number];

/** Scan types whose findings are exposed secrets: the Code level of the Exposed Secrets list. */
export const SECRET_SCAN_TYPES: readonly DefectDojoScanType[] = ["Gitleaks Scan"];

/** Finding states a list can be asked for. Duplicates are never listed. */
export const DEFECTDOJO_FINDING_STATES = [
  "active",
  "mitigated",
  "falsePositive",
  "outOfScope",
  "riskAccepted",
] as const;

export type DefectDojoFindingState = (typeof DEFECTDOJO_FINDING_STATES)[number];

/**
 * The states of the Runtime level of the platform lists. A close mitigates every finding of its test, and DefectDojo
 * cannot filter findings by the build id of their test, so mitigated runtime findings would include closed tests.
 */
export const RUNTIME_FINDING_STATES = [
  "active",
  "falsePositive",
  "outOfScope",
  "riskAccepted",
] as const satisfies readonly DefectDojoFindingState[];

/** Levels of the codebase "Security Findings" tab that the CI security scan fills. */
export const CODEBASE_SCAN_LEVELS = ["code", "image"] as const;

export type CodebaseScanLevel = (typeof CODEBASE_SCAN_LEVELS)[number];

/** Report kinds the tab reads from runtime tests: the value of the test tag `report-kind`. */
export const RUNTIME_REPORT_KINDS = ["vulnerabilityreport", "exposedsecretreport"] as const;

export type RuntimeReportKind = (typeof RUNTIME_REPORT_KINDS)[number];

/**
 * The state of the runtime findings of containers. `noScanData`: no container; `notRunning`: containers exist and none
 * runs; `clean`: running containers, none with an active finding or secret.
 */
export const RUNTIME_STATES = ["noScanData", "notRunning", "clean", "data"] as const;

export type RuntimeState = (typeof RUNTIME_STATES)[number];

/** DefectDojo sets no maximum page size: a findings page has at most this many rows, and the tab asks for no more. */
export const DEFECTDOJO_MAX_PAGE_SIZE = 100;

export const SCAN_FINDINGS_DEFAULT_PAGE_SIZE = 10;

/** Last page index of a scan the tab can ask for: with the largest page size, an offset of 100 000. */
export const SCAN_FINDINGS_MAX_PAGE = 1000;

export const PLATFORM_LIST_DEFAULT_PAGE_SIZE = 25;

/**
 * Most findings a triaged Runtime list reads: its rows of closed tests are dropped on the server, which pages the
 * rest itself.
 */
export const TRIAGED_RUNTIME_SCAN_LIMIT = 500;
