import type { VulnerabilitiesTabData } from "./hooks/useVulnerabilitiesTabData";

export interface VulnerabilitiesTabProps {
  /**
   * Codebase name (used as DependencyTrack projectName)
   */
  codebaseName: string;

  /**
   * Default branch from codebase spec (e.g., "main", "develop")
   */
  defaultBranch: string;

  /**
   * Namespace
   */
  namespace: string;

  /**
   * Cluster name
   */
  clusterName: string;
}

export type VulnerabilitiesTabContentProps = Pick<VulnerabilitiesTabProps, "namespace" | "clusterName"> &
  VulnerabilitiesTabData;
