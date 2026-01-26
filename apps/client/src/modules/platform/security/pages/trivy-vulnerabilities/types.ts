/**
 * Resource where a container image is used
 */
export interface ImageResource {
  kind: string;
  name: string;
  containerName: string;
}

/**
 * Consolidated vulnerability image - groups multiple VulnerabilityReports
 * that scan the same image (identified by digest + namespace)
 */
export interface ConsolidatedVulnerabilityImage {
  /** Unique key for the image: `${digest}-${namespace}` or `${repository}:${tag}-${namespace}` */
  imageKey: string;
  /** Image repository (e.g., "crunchy-data/crunchy-pgbackrest") */
  repository: string;
  /** Image tag (e.g., "ubi8-2.41-4") */
  tag: string;
  /** Image digest if available */
  digest?: string;
  /** Namespace where the image is scanned */
  namespace: string;
  /** Critical vulnerability count */
  criticalCount: number;
  /** High vulnerability count */
  highCount: number;
  /** Medium vulnerability count */
  mediumCount: number;
  /** Low vulnerability count */
  lowCount: number;
  /** Unknown severity count */
  unknownCount: number;
  /** Total vulnerability count */
  total: number;
  /** Last scan timestamp (from most recent report) */
  lastScan: string;
  /** Resources where this image is used */
  resources: ImageResource[];
  /** Name of one report (for navigation to details) */
  reportName: string;
}
