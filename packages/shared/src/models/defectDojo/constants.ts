/** Severity names of DefectDojo, most severe first. */
export const DEFECTDOJO_SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"] as const;

export type DefectDojoSeverity = (typeof DEFECTDOJO_SEVERITIES)[number];

export const NO_FINDING_COUNTS: Readonly<Record<DefectDojoSeverity, number>> = {
  Critical: 0,
  High: 0,
  Medium: 0,
  Low: 0,
  Info: 0,
};

/** Levels of the codebase "Security Findings" tab that the CI security scan fills. */
export const CODEBASE_SCAN_LEVELS = ["code", "image"] as const;

export type CodebaseScanLevel = (typeof CODEBASE_SCAN_LEVELS)[number];

/** Report kinds the tab reads from runtime tests: the value of the test tag `report-kind`. */
export const RUNTIME_REPORT_KINDS = ["vulnerabilityreport", "exposedsecretreport"] as const;

export type RuntimeReportKind = (typeof RUNTIME_REPORT_KINDS)[number];

/** DefectDojo sets no maximum page size: a findings page has at most this many rows, and the tab asks for no more. */
export const DEFECTDOJO_MAX_PAGE_SIZE = 100;

export const SCAN_FINDINGS_DEFAULT_PAGE_SIZE = 10;

/** Last page index of a scan the tab can ask for: with the largest page size, an offset of 100 000. */
export const SCAN_FINDINGS_MAX_PAGE = 1000;
