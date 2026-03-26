import React, { useMemo } from "react";
import { Shield, Package, Server, Network, AlertTriangle, TrendingUp, ShieldAlert } from "lucide-react";
import { DependencyTrackProject, PortfolioMetrics } from "@my-project/shared";
import { router } from "@/core/router";
import { ProjectOverview } from "../components/ProjectOverview";
import { ProjectComponents } from "../components/ProjectComponents";
import { ProjectServices } from "../components/ProjectServices";
import { ProjectDependencyGraph } from "../components/ProjectDependencyGraph";
import { ProjectFindings } from "../components/ProjectFindings";
import { ProjectEpss } from "../components/ProjectEpss";
import { ProjectPolicyViolations } from "../components/ProjectPolicyViolations";
import { routeSCAProjectDetails, RouteSearchTab, routeSearchTabSchema, PATH_SCA_PROJECT_DETAILS_FULL } from "../route";

interface UseTabsParams {
  projectUuid: string;
  project: DependencyTrackProject | undefined;
  projectMetrics: PortfolioMetrics[] | undefined;
  isMetricsLoading: boolean;
}

/**
 * Hook to define tabs for the SCA Project Details page
 */
export function useTabs({ projectUuid, project, projectMetrics, isMetricsLoading }: UseTabsParams) {
  const params = routeSCAProjectDetails.useParams();

  const handleTabNavigate = React.useCallback(
    (tab: RouteSearchTab) => {
      router.navigate({
        to: PATH_SCA_PROJECT_DETAILS_FULL,
        params,
        search: (prev) => ({ ...prev, tab }),
      });
    },
    [params]
  );

  return useMemo(
    () => [
      {
        id: routeSearchTabSchema.enum.overview,
        label: "Overview",
        icon: <Shield className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.overview),
        component: <ProjectOverview project={project} metrics={projectMetrics} isMetricsLoading={isMetricsLoading} />,
      },
      {
        id: routeSearchTabSchema.enum.components,
        label: "Components",
        icon: <Package className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.components),
        component: <ProjectComponents projectUuid={projectUuid} />,
      },
      {
        id: routeSearchTabSchema.enum.services,
        label: "Services",
        icon: <Server className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.services),
        component: <ProjectServices projectUuid={projectUuid} />,
      },
      {
        id: routeSearchTabSchema.enum.dependencies,
        label: "Dependency Graph",
        icon: <Network className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.dependencies),
        component: project ? (
          <ProjectDependencyGraph
            projectUuid={projectUuid}
            projectName={project.name}
            projectVersion={project.version || ""}
          />
        ) : null,
      },
      {
        id: routeSearchTabSchema.enum.vulnerabilities,
        label: "Audit Vulnerabilities",
        icon: <AlertTriangle className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.vulnerabilities),
        component: <ProjectFindings projectUuid={projectUuid} />,
      },
      {
        id: routeSearchTabSchema.enum.epss,
        label: "Exploit Predictions",
        icon: <TrendingUp className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.epss),
        component: <ProjectEpss projectUuid={projectUuid} />,
      },
      {
        id: routeSearchTabSchema.enum.violations,
        label: "Policy Violations",
        icon: <ShieldAlert className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.violations),
        component: <ProjectPolicyViolations projectUuid={projectUuid} />,
      },
    ],
    [handleTabNavigate, project, projectMetrics, isMetricsLoading, projectUuid]
  );
}
