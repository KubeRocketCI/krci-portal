import React from "react";
import { Radio, History } from "lucide-react";
import { routePipelineRunList, RouteSearchTab, routeSearchTabSchema, PATH_PIPELINERUNS_FULL } from "../route";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { router } from "@/core/router";
import { Live } from "../components/Live";
import { TektonResultsHistory } from "../components/TektonResultsHistory";
import { Card } from "@/core/components/ui/card";

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
        icon: <Radio className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.live),
        component: (
          <Card className="p-6">
            <Live />
          </Card>
        ),
      },
      {
        id: routeSearchTabSchema.enum["tekton-results"],
        label: "Pipelines History",
        icon: <History className="size-4" />,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum["tekton-results"]),
        component: (
          <Card className="p-6">
            <TektonResultsHistory />
          </Card>
        ),
      },
    ],
    [handleTabNavigate]
  );
};
