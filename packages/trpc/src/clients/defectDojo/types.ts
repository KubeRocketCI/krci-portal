import type {
  DefectDojoFindingStateFilter,
  DefectDojoLevel,
  DefectDojoScanType,
  DefectDojoSeverity,
} from "./constants.js";

export interface DefectDojoClientConfig {
  /** Address the server reads DefectDojo at. Empty: DefectDojo is not configured. */
  apiBaseURL: string;
  /** Token of the portal's DefectDojo user. Empty: DefectDojo is not configured. */
  token: string;
  /** Base of the links to the DefectDojo web UI. Default: `apiBaseURL`. */
  webBaseURL?: string;
  /** Name of the Product Type the portal reads. Default: `KubeRocketCI`. */
  productType?: string;
  /** Default: `DEFECTDOJO_TIMEOUT_MS`. */
  timeoutMs?: number;
  /** Rows per request of a list of products or tests. */
  listPageSize?: number;
}

/** Every result of the client is one of these four states. */
export type DefectDojoResult<T> =
  { state: "notConfigured" } | { state: "unreachable" } | { state: "noScanData" } | { state: "data"; data: T };

export interface DefectDojoRef {
  id: number;
  /** Link to the object in the DefectDojo web UI. */
  url: string;
}

export interface DefectDojoNamedRef extends DefectDojoRef {
  name: string;
}

export interface DefectDojoProduct extends DefectDojoNamedRef {
  tags: string[];
}

export interface DefectDojoTest {
  id: number;
  title: string;
  scanType: string;
  /** `null` for a scan type of no level. */
  level: DefectDojoLevel | null;
  branchTag: string;
  commitHash: string;
  version: string;
  buildId: string;
  /** A runtime test without a build id: closed, or not yet marked by the operator (ADR 0006 of krci-security-operator). */
  closed: boolean;
  tags: string[];
  created: string;
  updated: string;
  url: string;
  engagement: DefectDojoNamedRef;
  product: DefectDojoNamedRef;
}

/** Findings of one set of products or of one test. */
export type DefectDojoScope = { productIds: number[] } | { testId: number };

export interface DefectDojoSeverityCounts {
  /** Findings of the scope, in every state counted. */
  total: number;
  /** Active findings of the scope. */
  active: number;
  /** Findings by severity, counted in the same states as `total`. */
  severity: Record<DefectDojoSeverity, number>;
}

export interface DefectDojoFinding {
  id: number;
  title: string;
  severity: DefectDojoSeverity;
  active: boolean;
  verified: boolean;
  duplicate: boolean;
  falsePositive: boolean;
  outOfScope: boolean;
  riskAccepted: boolean;
  mitigated: boolean;
  underReview: boolean;
  date: string | null;
  created: string | null;
  updated: string | null;
  mitigatedAt: string | null;
  componentName: string | null;
  componentVersion: string | null;
  vulnerabilityIds: string[];
  filePath: string | null;
  line: number | null;
  service: string | null;
  fixAvailable: boolean | null;
  fixVersion: string | null;
  url: string;
  test: DefectDojoRef;
  engagement: DefectDojoRef;
  product: DefectDojoRef;
}

export interface DefectDojoFindingsPage {
  /** Findings of the whole filter, not of this page. */
  total: number;
  findings: DefectDojoFinding[];
}

export interface DefectDojoTestsFilter {
  /** Tests that carry every one of these tags. */
  tags: readonly string[];
  /** Exact. An empty value matches no test. */
  branchTag?: string;
  /** An empty value matches no test. */
  scanType?: DefectDojoScanType;
}

export interface DefectDojoFindingsQuery {
  scope: DefectDojoScope;
  /** Default: `active`. */
  state?: DefectDojoFindingStateFilter;
  severities?: readonly DefectDojoSeverity[];
  /** Only findings of tests of these scan types. */
  scanTypes?: readonly DefectDojoScanType[];
  /** Exact, case-sensitive. Empty: no filter. */
  vulnerabilityId?: string;
  /** Contains, case-insensitive. Empty: no filter. */
  component?: string;
  /** At most `FINDINGS_MAX_PAGE_SIZE`; default: the maximum. */
  limit?: number;
  offset?: number;
}
