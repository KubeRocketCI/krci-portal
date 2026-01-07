import { NormalizedMeasures } from "@my-project/shared";

export interface SonarQubeMetricsListProps {
  /**
   * Normalized SonarQube measures from API
   */
  measures: NormalizedMeasures | undefined;
}
