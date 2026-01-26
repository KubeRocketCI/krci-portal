/**
 * Types for Trivy Overview Dashboard
 */

/**
 * Base interface for severity counts
 * Used as a building block for other interfaces via composition
 */
export interface SeverityCount {
  critical: number;
  high: number;
  medium: number;
  low: number;
  unknown: number;
  total: number;
}

/**
 * Vulnerability data per namespace
 */
export interface NamespaceVulnerabilityData extends SeverityCount {
  namespace: string;
}

/**
 * Vulnerability data per container image
 */
export interface VulnerableImageData extends SeverityCount {
  name: string;
  namespace: string;
  reportName: string;
}

/**
 * Aggregated overview data for Trivy dashboard
 */
export interface TrivyOverviewData {
  /** Total critical vulnerabilities */
  critical: number;
  /** Total high vulnerabilities */
  high: number;
  /** Total medium vulnerabilities */
  medium: number;
  /** Total low vulnerabilities */
  low: number;
  /** Total unknown severity vulnerabilities */
  unknown: number;
  /** Total vulnerabilities across all severities */
  totalVulnerabilities: number;
  /** Count of vulnerabilities that have a fixed version available */
  fixable: number;
  /** Number of unique images scanned */
  imagesScanned: number;
  /** Vulnerabilities grouped by namespace */
  byNamespace: NamespaceVulnerabilityData[];
  /** Top 10 most vulnerable images sorted by total count */
  topImages: VulnerableImageData[];
}

/**
 * Return type for useTrivyOverview hook
 */
export interface TrivyOverviewHookResult {
  data: TrivyOverviewData | null;
  isLoading: boolean;
  error: Error | null;
}
