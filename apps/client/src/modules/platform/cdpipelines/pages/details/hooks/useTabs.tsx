import React from "react";
import { routeCDPipelineDetails, RouteSearchTab, routeSearchTabSchema, PATH_CDPIPELINE_DETAILS_FULL } from "../route";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { router } from "@/core/router";
import { PipelineApplications } from "../components/PipelineApplications";
import { Environments } from "../components/Environments";

export const useTabs = (): Tab[] => {
  const params = routeCDPipelineDetails.useParams();

  const handleTabNavigate = React.useCallback(
    (tab: RouteSearchTab) => {
      router.navigate({
        to: PATH_CDPIPELINE_DETAILS_FULL,
        params,
        search: (prev) => ({ ...prev, tab }),
      });
    },
    [params]
  );

  return React.useMemo(
    () => [
      {
        id: routeSearchTabSchema.enum.environments,
        label: "Environments",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.environments),
        component: (
          <div className="pt-6">
            <Environments />
          </div>
        ),
      },
      {
        id: routeSearchTabSchema.enum.applications,
        label: "Applications",
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.applications),
        component: (
          <div className="pt-6">
            <PipelineApplications />
          </div>
        ),
      },
    ],
    [handleTabNavigate]
  );
};
