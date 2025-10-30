import React from "react";
import { routePipelineRunList, RouteSearchTab, routeSearchTabSchema, PATH_PIPELINERUNS_FULL } from "../route";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { router } from "@/core/router";
import { Live } from "../components/Live";
import { History } from "../components/History";

export const useTabs = (): Tab[] => {
  const params = routePipelineRunList.useParams();

  const handleTabNavigate = React.useCallback(
    (tab: RouteSearchTab) => {
      router.navigate({
        to: PATH_PIPELINERUNS_FULL,
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
          <div className="pt-6">
            <Live />
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
    ],
    [handleTabNavigate]
  );
};
