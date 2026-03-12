import React from "react";
import { Info, FileCode, Network } from "lucide-react";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
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
        icon: <Info className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.overview),
        component: <Overview />,
      },
      {
        id: routeSearchTabSchema.enum.yaml,
        label: "View YAML",
        icon: <FileCode className="size-4" />,
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
        icon: <ENTITY_ICON.pipelineRun className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.pipelineRuns),
        component: (
          <Card className="px-6">
            <PipelineRuns />
          </Card>
        ),
      },
      {
        id: routeSearchTabSchema.enum.diagram,
        label: "Diagram",
        icon: <Network className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.diagram),
        component: (
          <Card className="flex h-full w-full grow flex-col">
            <Diagram />
          </Card>
        ),
      },
    ],
    [handleTabNavigate]
  );
};
