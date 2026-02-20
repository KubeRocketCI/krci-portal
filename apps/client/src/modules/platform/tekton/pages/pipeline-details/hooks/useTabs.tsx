import React from "react";
import { Overview } from "../components/Overview";
import { ViewPipeline } from "../components/ViewPipeline";
import { Diagram } from "../components/Diagram";
import { routePipelineDetails, RouteSearchTab, routeSearchTabSchema, PATH_PIPELINE_DETAILS_FULL } from "../route";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { router } from "@/core/router";
import { PipelineRuns } from "../components/PipelineRuns";
import { Card } from "@/core/components/ui/card";

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
          <Card className="p-6">
            <ViewPipeline />
          </Card>
        ),
      },
      {
        id: routeSearchTabSchema.enum.pipelineRuns,
        label: "Pipelines",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.pipelineRuns),
        component: (
          <Card className="p-6">
            <PipelineRuns />
          </Card>
        ),
      },
      {
        id: routeSearchTabSchema.enum.diagram,
        label: "Diagram",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.diagram),
        component: (
          <Card className="h-full p-6">
            <Diagram />
          </Card>
        ),
      },
    ],
    [handleTabNavigate]
  );
};
