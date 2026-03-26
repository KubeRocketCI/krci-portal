import React, { useMemo } from "react";
import { LayoutDashboard, AlertCircle } from "lucide-react";
import { ProjectWithMetrics } from "@my-project/shared";
import { router } from "@/core/router";
import { MetricsGrid } from "../components/MetricsGrid";
import { QualityGateDetails } from "../components/QualityGateDetails";
import { IssuesSection } from "../components/IssuesSection";
import {
  routeSASTProjectDetails,
  RouteSearchTab,
  routeSearchTabSchema,
  PATH_SAST_PROJECT_DETAILS_FULL,
} from "../route";
import type { Tab } from "@/core/providers/Tabs/components/Tabs/types";

interface UseTabsParams {
  projectKey: string;
  project: ProjectWithMetrics | null | undefined;
  isLoading: boolean;
}

/**
 * Hook to define tabs for the SAST Project Details page (PageContentWrapper format)
 */
export function useTabs({ projectKey, project, isLoading }: UseTabsParams): Tab[] {
  const params = routeSASTProjectDetails.useParams();

  const handleTabNavigate = React.useCallback(
    (tab: RouteSearchTab) => {
      router.navigate({
        to: PATH_SAST_PROJECT_DETAILS_FULL,
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
        icon: <LayoutDashboard className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.overview),
        component: (
          <div className="space-y-6">
            <MetricsGrid project={project} isLoading={isLoading} />
            {project && <QualityGateDetails projectKey={project.key} />}
          </div>
        ),
      },
      {
        id: routeSearchTabSchema.enum.issues,
        label: "Issues",
        icon: <AlertCircle className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.issues),
        component: project ? <IssuesSection projectKey={projectKey} /> : null,
      },
    ],
    [handleTabNavigate, project, projectKey, isLoading]
  );
}
