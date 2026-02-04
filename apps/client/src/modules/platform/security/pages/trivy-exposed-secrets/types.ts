import { ImageResource } from "../trivy-vulnerabilities/types";

/**
 * Consolidated exposed secret image - groups multiple ExposedSecretReports
 * that scan the same image (identified by digest + namespace)
 */
export interface ConsolidatedSecretImage {
  /** Unique key for the image: `${digest}-${namespace}` or `${repository}:${tag}-${namespace}` */
  imageKey: string;
  /** Image repository (e.g., "alpine/git") */
  repository: string;
  /** Image tag (e.g., "v2.49.1") */
  tag: string;
  /** Image digest if available */
  digest?: string;
  /** Namespace where the image is scanned */
  namespace: string;
  /** Critical secret count */
  criticalCount: number;
  /** High secret count */
  highCount: number;
  /** Medium secret count */
  mediumCount: number;
  /** Low secret count */
  lowCount: number;
  /** Total number of exposed secrets */
  totalSecrets: number;
  /** Last scan timestamp (from most recent report) */
  lastScan: string;
  /** Resources where this image is used */
  resources: ImageResource[];
  /** Name of one report (for navigation to details) */
  reportName: string;
}
