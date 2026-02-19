import React from "react";
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
        search: (prev) => ({ ...prev, tab }),
      });
    },
    [params]
  );

  return React.useMemo(() => {
    return [
      {
        label: "Overview",
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
