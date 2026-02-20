import React from "react";
import {
  routePipelineDetails,
  PipelineRunsTab,
  pipelineRunsTabSchema,
  PATH_PIPELINE_DETAILS_FULL,
} from "../../../route";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { router } from "@/core/router";
import { PipelineRunListByPipeline } from "../../PipelineRunListByPipeline";
import { History } from "../../History";

export const useTabs = (): Tab[] => {
  const params = routePipelineDetails.useParams();
  const { tab } = routePipelineDetails.useSearch();

  const handleTabNavigate = React.useCallback(
    (pipelineRunsTab: PipelineRunsTab) => {
      router.navigate({
        to: PATH_PIPELINE_DETAILS_FULL,
        params,
        search: (prev) => ({ ...prev, tab, pipelineRunsTab }),
      });
    },
    [params, tab]
  );

  return React.useMemo(
    () => [
      {
        id: pipelineRunsTabSchema.enum.live,
        label: "Live",
        onClick: () => handleTabNavigate(pipelineRunsTabSchema.enum.live),
        component: <PipelineRunListByPipeline />,
      },
      {
        id: pipelineRunsTabSchema.enum.history,
        label: "Pipelines History",
        onClick: () => handleTabNavigate(pipelineRunsTabSchema.enum.history),
        component: <History />,
      },
    ],
    [handleTabNavigate]
  );
};
