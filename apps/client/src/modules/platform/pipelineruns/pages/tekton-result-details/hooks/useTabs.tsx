import React from "react";
import { Overview } from "../components/Overview";
import { Details } from "../components/Details";
import { ViewPipelineRun } from "../components/ViewPipelineRun";
import { routeTektonResultPipelineRunDetails, RouteSearchTab, routeSearchTabSchema, PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL } from "../route";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { router } from "@/core/router";

export const useTabs = (): Tab[] => {
  const params = routeTektonResultPipelineRunDetails.useParams();

  const handleTabNavigate = React.useCallback(
    (tab: RouteSearchTab) => {
      router.navigate({
        to: PATH_TEKTON_RESULT_PIPELINERUN_DETAILS_FULL,
        params,
        search: (prev) => ({ ...prev, tab }),
      });
    },
    [params]
  );

  return React.useMemo(
    () => [
      {
        id: routeSearchTabSchema.enum.overview,
        label: "Overview",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.overview),
        component: (
          <div className="pt-6">
            <Overview />
          </div>
        ),
      },
      {
        id: routeSearchTabSchema.enum.details,
        label: "Details",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.details),
        component: (
          <div className="pt-6">
            <Details />
          </div>
        ),
      },
      {
        id: routeSearchTabSchema.enum.yaml,
        label: "View YAML",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.yaml),
        component: (
          <div className="pt-6">
            <ViewPipelineRun />
          </div>
        ),
      },
    ],
    [handleTabNavigate]
  );
};
