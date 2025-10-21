import { Box } from "@mui/material";
import React from "react";
import { Overview } from "../components/Overview";
import { ViewTask } from "../components/ViewTask";
import { routeTaskDetails, RouteSearchTab, routeSearchTabSchema, PATH_TASK_DETAILS_FULL } from "../route";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { router } from "@/core/router";

export const useTabs = (): Tab[] => {
  const params = routeTaskDetails.useParams();

  const handleTabNavigate = React.useCallback(
    (tab: RouteSearchTab) => {
      router.navigate({
        to: PATH_TASK_DETAILS_FULL,
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
        id: routeSearchTabSchema.enum.yaml,
        label: "View YAML",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.yaml),
        component: (
          <Box
            sx={{
              pt: (t) => t.typography.pxToRem(24),
              height: "100%",
              overflow: "hidden",
            }}
          >
            <ViewTask />
          </Box>
        ),
      },
    ],
    [handleTabNavigate]
  );
};
