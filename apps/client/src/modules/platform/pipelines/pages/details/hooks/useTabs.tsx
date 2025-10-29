import React from "react";
import { Overview } from "../components/Overview";
import { ViewPipeline } from "../components/ViewPipeline";
import { History } from "../components/History";
import { Diagram } from "../components/Diagram";
import { routePipelineDetails, RouteSearchTab, routeSearchTabSchema, PATH_PIPELINE_DETAILS_FULL } from "../route";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { router } from "@/core/router";
import { PipelineRunListByPipeline } from "../components/PipelineRunListByPipeline";

export const useTabs = (): Tab[] => {
  const params = routePipelineDetails.useParams();

  const handleTabNavigate = React.useCallback(
    (tab: RouteSearchTab) => {
      router.navigate({
        to: PATH_PIPELINE_DETAILS_FULL,
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
        id: routeSearchTabSchema.enum.yaml,
        label: "View YAML",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.yaml),
        component: (
          <div className="pt-6">
            <ViewPipeline />
          </div>
        ),
      },
      {
        id: routeSearchTabSchema.enum.pipelineRunList,
        label: "PipelineRuns",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.pipelineRunList),
        component: (
          <div className="pt-6">
            <PipelineRunListByPipeline />
          </div>
        ),
      },
      {
        id: routeSearchTabSchema.enum.history,
        label: "History",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.history),
        component: (
          <div className="pt-6">
            <History />
          </div>
        ),
      },
      {
        id: routeSearchTabSchema.enum.diagram,
        label: "Diagram",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.diagram),
        component: <Diagram />,
      },
    ],
    [handleTabNavigate]
  );
};
