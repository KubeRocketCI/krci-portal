import { Box } from "@mui/material";
import React from "react";
import { routePipelineRunList, RouteSearchTab, routeSearchTabSchema } from "../route";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { router } from "@/core/router";
import { Live } from "../components/Live";
import { History } from "../components/History";

export const useTabs = (): Tab[] => {
  const params = routePipelineRunList.useParams();

  const handleTabNavigate = React.useCallback(
    (tab: RouteSearchTab) => {
      router.navigate({
        to: routePipelineRunList.to,
        params,
        search: (prev) => ({ ...prev, tab }),
      });
    },
    [params]
  );

  return React.useMemo(
    () => [
      {
        id: routeSearchTabSchema.enum.live,
        label: "Live",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.live),
        component: (
          <Box
            sx={{
              pt: (t) => t.typography.pxToRem(24),
            }}
          >
            <Live />
          </Box>
        ),
      },
      {
        id: routeSearchTabSchema.enum.history,
        label: "History",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.history),
        component: (
          <Box
            sx={{
              pt: (t) => t.typography.pxToRem(24),
            }}
          >
            <History />
          </Box>
        ),
      },
    ],
    [handleTabNavigate]
  );
};
