import { NormalizedMeasures } from "@my-project/shared";

export interface SonarQubeMetricsListProps {
  /**
   * Normalized SonarQube measures from API
   */
  measures: NormalizedMeasures | undefined;
  /**
   * SonarQube base URL for linking to metric reports
   */
  sonarBaseUrl?: string;
  /**
   * SonarQube project key for building metric URLs
   */
  projectKey?: string;
  /**
   * Whether to link metric badges to external SonarQube dashboard
   * - false (default): badges are not clickable (used in widgets)
   * - true: badges link to external SonarQube (used on internal SAST pages)
   */
  linkToExternal?: boolean;
}
