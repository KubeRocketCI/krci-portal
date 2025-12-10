import React from "react";
import { Overview } from "../components/Overview";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { Applications } from "../components/Applications";
import { Variables } from "../components/Variables";
import { Monitoring } from "../components/Monitoring";
import { StagePipelineRuns } from "../components/StagePipelineRuns";
import { router } from "@/core/router";
import {
  routeStageDetails,
  RouteSearchTab,
  routeSearchTabSchema,
  PATH_CDPIPELINE_STAGE_DETAILS_FULL,
} from "../../../route";

export const usePageTabs = (): Tab[] => {
  const params = routeStageDetails.useParams();

  const handleTabNavigate = React.useCallback(
    (tab: RouteSearchTab) => {
      router.navigate({
        to: PATH_CDPIPELINE_STAGE_DETAILS_FULL,
        params,
        search: { tab },
      });
    },
    [params]
  );

  return React.useMemo(
    () => [
      {
        label: "Overview",
        id: routeSearchTabSchema.enum.overview,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.overview),
        component: <Overview />,
      },
      {
        label: "Applications",
        id: routeSearchTabSchema.enum.applications,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.applications),
        component: <Applications />,
      },
      {
        label: "Pipelines",
        id: routeSearchTabSchema.enum.pipelines,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.pipelines),
        component: <StagePipelineRuns />,
      },
      {
        label: "Variables",
        id: routeSearchTabSchema.enum.variables,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.variables),
        component: <Variables />,
      },
      {
        label: "Monitoring",
        id: routeSearchTabSchema.enum.monitoring,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.monitoring),
        component: <Monitoring />,
      },
    ],
    [handleTabNavigate]
  );
};
