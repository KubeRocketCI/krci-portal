import React from "react";
import { Info, GitBranch, GitPullRequest } from "lucide-react";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import { router } from "@/core/router";
import { BranchList } from "../components/BranchList";
import { PullRequestList } from "../components/PullRequestList";
import { Overview } from "../components/Overview";
import { PipelineList } from "../components/PipelineList";
import { DeploymentStatusWidget } from "../components/DeploymentStatusWidget";
import { routeProjectDetails, RouteSearchTab, routeSearchTabSchema, PATH_PROJECT_DETAILS_FULL } from "../route";

export const usePageTabs = () => {
  const params = routeProjectDetails.useParams();

  const handleTabNavigate = React.useCallback(
    (tab: RouteSearchTab) => {
      router.navigate({
        to: PATH_PROJECT_DETAILS_FULL,
        params,
        search: (prev) => {
          // Only preserve pipelinesTab if we're navigating to the pipelines tab
          if (tab === routeSearchTabSchema.enum.pipelines) {
            return { ...prev, tab };
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { pipelinesTab, ...rest } = prev;
          return { ...rest, tab };
        },
      });
    },
    [params]
  );

  return React.useMemo(() => {
    return [
      {
        label: "Overview",
        icon: <Info className="size-4" />,
        id: routeSearchTabSchema.enum.overview,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.overview),
        component: (
          <div className="mt-6">
            <Overview />
          </div>
        ),
      },
      {
        label: "Branches",
        icon: <GitBranch className="size-4" />,
        id: routeSearchTabSchema.enum.branches,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.branches),
        component: (
          <div className="mt-6">
            <BranchList />
          </div>
        ),
      },
      {
        label: "Pipelines",
        icon: <ENTITY_ICON.pipeline className="size-4" />,
        id: routeSearchTabSchema.enum.pipelines,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.pipelines),
        component: (
          <div className="mt-6">
            <PipelineList />
          </div>
        ),
      },
      {
        label: "Pull Requests",
        icon: <GitPullRequest className="size-4" />,
        id: routeSearchTabSchema.enum.code,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.code),
        component: (
          <div className="mt-6">
            <PullRequestList />
          </div>
        ),
      },
      {
        label: "Deployments",
        icon: <ENTITY_ICON.deployment className="size-4" />,
        id: routeSearchTabSchema.enum.deployments,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.deployments),
        component: (
          <div className="mt-6">
            <DeploymentStatusWidget />
          </div>
        ),
      },
    ];
  }, [handleTabNavigate]);
};
