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
}
