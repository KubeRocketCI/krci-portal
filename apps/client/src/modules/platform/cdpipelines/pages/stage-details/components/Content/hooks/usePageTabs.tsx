import React from "react";
import { Overview } from "../components/Overview";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { Applications } from "../components/Applications";
import { Variables } from "../components/Variables";
import { Monitoring } from "../components/Monitoring";
import { StagePipelineRuns } from "../components/StagePipelineRuns";

export const usePageTabs = (): Tab[] => {
  return React.useMemo(() => {
    return [
      {
        label: "Overview",
        id: "overview",
        component: <Overview />,
      },
      {
        label: "Applications",
        id: "applications",
        component: <Applications />,
      },
      {
        label: "Pipelines",
        id: "pipelines",
        component: <StagePipelineRuns />,
        // highlightNew: newPipelineRunAdded,
      },
      {
        label: "Variables",
        id: "variables",
        component: <Variables />,
      },
      {
        label: "Monitoring",
        id: "monitoring",
        component: <Monitoring />,
      },
    ];
  }, []);
};
