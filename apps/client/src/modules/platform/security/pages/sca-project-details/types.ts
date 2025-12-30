import { DependencyTrackProject, PortfolioMetrics } from "@my-project/shared";

/**
 * Common props for components that receive project data
 */
export interface ProjectDataProps {
  project: DependencyTrackProject | undefined;
  isLoading?: boolean;
}

/**
 * Common props for components that display project metrics
 */
export interface ProjectMetricsProps {
  metrics: PortfolioMetrics[] | undefined;
  isMetricsLoading?: boolean;
}

/**
 * Props for components that only need the project UUID
 */
export interface ProjectUuidProps {
  projectUuid: string;
}

/**
 * Severity level for vulnerability display
 */
export type SeverityLevel = "critical" | "high" | "medium" | "low" | "unassigned" | "riskScore";

/**
 * Analysis state for findings and violations
 */
export type AnalysisState =
  | "NOT_SET"
  | "APPROVED"
  | "REJECTED"
  | "EXPLOITABLE"
  | "IN_TRIAGE"
  | "FALSE_POSITIVE"
  | "NOT_AFFECTED"
  | "RESOLVED";
