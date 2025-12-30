import { useMemo, ReactNode } from "react";
import { Shield, Package, Server, Network, AlertTriangle, TrendingUp, ShieldAlert, LucideIcon } from "lucide-react";
import { DependencyTrackProject, PortfolioMetrics } from "@my-project/shared";
import { ProjectOverview } from "../components/ProjectOverview";
import { ProjectComponents } from "../components/ProjectComponents";
import { ProjectServices } from "../components/ProjectServices";
import { ProjectDependencyGraph } from "../components/ProjectDependencyGraph";
import { ProjectFindings } from "../components/ProjectFindings";
import { ProjectEpss } from "../components/ProjectEpss";
import { ProjectPolicyViolations } from "../components/ProjectPolicyViolations";

/**
 * Badge configuration for tabs
 */
export interface TabBadge {
  value: number;
  variant: "secondary" | "default" | "destructive";
  className?: string;
}

/**
 * Tab definition for the project details page
 */
export interface ProjectDetailsTab {
  id: string;
  label: string;
  icon: LucideIcon;
  badges?: TabBadge[];
  content: ReactNode;
}

interface UseTabsParams {
  projectUuid: string;
  project: DependencyTrackProject | undefined;
  projectMetrics: PortfolioMetrics[] | undefined;
  isMetricsLoading: boolean;
  epssCount: number;
}

/**
 * Hook to define tabs for the SCA Project Details page
 */
export function useTabs({
  projectUuid,
  project,
  projectMetrics,
  isMetricsLoading,
  epssCount,
}: UseTabsParams): ProjectDetailsTab[] {
  const metrics = project?.metrics;

  return useMemo(
    () => [
      {
        id: "overview",
        label: "Overview",
        icon: Shield,
        content: <ProjectOverview project={project} metrics={projectMetrics} isMetricsLoading={isMetricsLoading} />,
      },
      {
        id: "components",
        label: "Components",
        icon: Package,
        badges: [{ value: metrics?.components || 0, variant: "secondary" }],
        content: <ProjectComponents projectUuid={projectUuid} />,
      },
      {
        id: "services",
        label: "Services",
        icon: Server,
        badges: [{ value: metrics?.services || 0, variant: "secondary" }],
        content: <ProjectServices projectUuid={projectUuid} />,
      },
      {
        id: "dependencies",
        label: "Dependency Graph",
        icon: Network,
        content: project ? (
          <ProjectDependencyGraph
            projectUuid={projectUuid}
            projectName={project.name}
            projectVersion={project.version || ""}
          />
        ) : null,
      },
      {
        id: "vulnerabilities",
        label: "Audit Vulnerabilities",
        icon: AlertTriangle,
        badges: [{ value: metrics?.findingsTotal || 0, variant: "secondary" }],
        content: <ProjectFindings projectUuid={projectUuid} />,
      },
      {
        id: "epss",
        label: "Exploit Predictions",
        icon: TrendingUp,
        badges: [{ value: epssCount, variant: "secondary" }],
        content: <ProjectEpss projectUuid={projectUuid} />,
      },
      {
        id: "violations",
        label: "Policy Violations",
        icon: ShieldAlert,
        badges: [
          { value: metrics?.policyViolationsTotal || 0, variant: "secondary" },
          { value: metrics?.policyViolationsInfo || 0, variant: "default" },
          {
            value: metrics?.policyViolationsWarn || 0,
            variant: "default",
            className: "bg-yellow-600 hover:bg-yellow-700",
          },
          { value: metrics?.policyViolationsFail || 0, variant: "destructive" },
        ],
        content: <ProjectPolicyViolations projectUuid={projectUuid} />,
      },
    ],
    [project, projectMetrics, isMetricsLoading, projectUuid, epssCount, metrics]
  );
}
