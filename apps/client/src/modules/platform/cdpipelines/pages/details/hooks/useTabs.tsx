import React from "react";
import { Package } from "lucide-react";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
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
        icon: <ENTITY_ICON.stage className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.environments),
        component: <Environments />,
      },
      {
        id: routeSearchTabSchema.enum.applications,
        label: "Applications",
        icon: <Package className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.applications),
        component: <PipelineApplications />,
      },
    ],
    [handleTabNavigate]
  );
};
