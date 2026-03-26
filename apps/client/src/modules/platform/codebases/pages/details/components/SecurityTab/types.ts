export interface SecurityTabProps {
  /**
   * Codebase name (used as SonarQube projectKey)
   */
  codebaseName: string;

  /**
   * Namespace
   */
  namespace: string;

  /**
   * Cluster name
   */
  clusterName: string;
}
