/**
 * Security summary API constants
 */

/** Severity buckets of a security summary. `unassigned` is DefectDojo's `Info` (Trivy `UNKNOWN`). */
export const SECURITY_SEVERITIES = ["critical", "high", "medium", "low", "unassigned"] as const;

/** Where a finding comes from: CI scans of a codebase or the workloads running in an environment. */
export const SECURITY_SCOPES = ["ci", "runtime"] as const;

/** `NONE`: DefectDojo holds no data for the requested codebase or environment. */
export const SECURITY_STATUSES = ["OK", "NONE"] as const;

/** CI engagement kinds: `code` (SAST, secrets) and `image` (image scans). */
export const SECURITY_CI_KINDS = ["code", "image"] as const;

export const SECURITY_FINDINGS_PAGE_SIZE_DEFAULT = 25;
export const SECURITY_FINDINGS_PAGE_SIZE_MAX = 100;

/** Highest `page` of the findings list; bounds the offset sent to DefectDojo. */
export const SECURITY_FINDINGS_PAGE_MAX = 1000;
