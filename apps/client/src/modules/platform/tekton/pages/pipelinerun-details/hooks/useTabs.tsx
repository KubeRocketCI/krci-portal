import React from "react";
import { Details } from "../components/Details";
import { Overview } from "../components/Overview";
import { ViewPipelineRun } from "../components/ViewPipelineRun";
import { routePipelineRunDetails, RouteSearchTab, routeSearchTabSchema, PATH_PIPELINERUN_DETAILS_FULL } from "../route";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { router } from "@/core/router";
import { Diagram } from "../components/Diagram";
import { Results } from "../components/Results";

export const useTabs = (): Tab[] => {
  const params = routePipelineRunDetails.useParams();

  const handleTabNavigate = React.useCallback(
    (tab: RouteSearchTab) => {
      router.navigate({
        to: PATH_PIPELINERUN_DETAILS_FULL,
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
          <div className="pt-6 h-full overflow-hidden">
            <ViewPipelineRun />
          </div>
        ),
      },
      {
        id: routeSearchTabSchema.enum.results,
        label: "Results",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.results),
        component: (
          <div className="pt-6">
            <Results />
          </div>
        ),
      },
      {
        id: routeSearchTabSchema.enum.diagram,
        label: "Diagram",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.diagram),
        component: (
          <div className="h-full pt-6">
            <Diagram />
          </div>
        ),
      },
    ],
    [handleTabNavigate]
  );
};
