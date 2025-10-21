import { Box } from "@mui/material";
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
          <Box
            sx={{
              pt: (t) => t.typography.pxToRem(24),
            }}
          >
            <Overview />
          </Box>
        ),
      },
      {
        id: routeSearchTabSchema.enum.details,
        label: "Details",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.details),
        component: (
          <Box
            sx={{
              pt: (t) => t.typography.pxToRem(24),
            }}
          >
            <Details />
          </Box>
        ),
      },
      {
        id: routeSearchTabSchema.enum.yaml,
        label: "View YAML",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.yaml),
        component: (
          <Box
            sx={{
              pt: (t) => t.typography.pxToRem(24),
            }}
          >
            <ViewPipelineRun />
          </Box>
        ),
      },
      {
        id: routeSearchTabSchema.enum.results,
        label: "Results",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.results),
        component: (
          <Box
            sx={{
              pt: (t) => t.typography.pxToRem(24),
            }}
          >
            <Results />
          </Box>
        ),
      },
      {
        id: routeSearchTabSchema.enum.diagram,
        label: "Diagram",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.diagram),
        component: (
          <Box
            sx={{
              pt: (t) => t.typography.pxToRem(24),
              height: "100%",
            }}
          >
            <Diagram />
          </Box>
        ),
      },
    ],
    [handleTabNavigate]
  );
};
