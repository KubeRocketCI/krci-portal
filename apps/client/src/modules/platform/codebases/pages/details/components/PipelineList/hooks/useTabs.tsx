import React from "react";
import { routeProjectDetails, PipelinesTab, pipelinesTabSchema, PATH_PROJECT_DETAILS_FULL } from "../../../route";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { router } from "@/core/router";
import { Live } from "../components/Live";
import { TektonResultsHistory } from "../components/TektonResultsHistory";

export const useTabs = (): Tab[] => {
  const params = routeProjectDetails.useParams();
  const { tab } = routeProjectDetails.useSearch();

  const handleTabNavigate = React.useCallback(
    (pipelinesTab: PipelinesTab) => {
      router.navigate({
        to: PATH_PROJECT_DETAILS_FULL,
        params,
        search: (prev) => ({ ...prev, tab, pipelinesTab }),
      });
    },
    [params, tab]
  );

  return React.useMemo(
    () => [
      {
        id: pipelinesTabSchema.enum.live,
        label: "Live",
        onClick: () => handleTabNavigate(pipelinesTabSchema.enum.live),
        component: <Live />,
      },
      {
        id: pipelinesTabSchema.enum["tekton-results"],
        label: "Pipelines History",
        onClick: () => handleTabNavigate(pipelinesTabSchema.enum["tekton-results"]),
        component: <TektonResultsHistory />,
      },
    ],
    [handleTabNavigate]
  );
};
