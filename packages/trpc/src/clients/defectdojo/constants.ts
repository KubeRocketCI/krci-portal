import { SECURITY_SEVERITIES, type SecuritySeverity } from "@my-project/shared";

export const DEFECTDOJO_SERVICE_NAME = "DefectDojo";

export const DEFECTDOJO_API_VERSION = "v2";

/** DefectDojo severity names by portal severity. `Info` is the portal's `unassigned`. */
export const DEFECTDOJO_SEVERITY_LABELS = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  unassigned: "Info",
} as const satisfies Record<SecuritySeverity, string>;

/** Portal severity by DefectDojo severity name. */
export const SECURITY_SEVERITY_BY_DEFECTDOJO_LABEL: Record<string, SecuritySeverity> = Object.fromEntries(
  SECURITY_SEVERITIES.map((severity) => [DEFECTDOJO_SEVERITY_LABELS[severity], severity])
);

/** Engagement names written by the CI pipelines. */
export const CODE_ENGAGEMENT_PREFIX = "code-security-";
export const IMAGE_ENGAGEMENT_PREFIX = "image:";

/** Name of the runtime engagement of a Stage: `runtime:<cdPipeline>-<stage>`. */
export const RUNTIME_ENGAGEMENT_PREFIX = "runtime:";

/** Test tags written for runtime scans. */
export const RUNTIME_SCOPE_TAG = "krci-scope:runtime";
export const ENVIRONMENT_TAG_PREFIX = "krci-env:";
export const TENANT_TAG_PREFIX = "krci-tenant:";
export const WORKLOAD_TAG_PREFIX = "krci-workload:";

/** Name of the product that holds the workloads of a Stage that belong to no codebase: `env:<cdPipeline>-<stage>`. */
export const ENVIRONMENT_PRODUCT_PREFIX = "env:";

/** Rows per request when a list is read completely. */
export const LIST_PAGE_SIZE = 500;

/**
 * Findings read in one request to count severities from the rows. A filter with more findings is counted per severity instead.
 * A longer listing costs more than the per-severity counts it saves.
 */
export const SEVERITY_LISTING_LIMIT = 50;

/** Pages read per list; a longer list is cut here. */
export const LIST_MAX_PAGES = 10;
