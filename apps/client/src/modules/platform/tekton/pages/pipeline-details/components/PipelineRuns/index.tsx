import React from "react";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { routePipelineDetails } from "../../route";
import { useTabs } from "./hooks/useTabs";

export const PipelineRuns = () => {
  const { pipelineRunsTab } = routePipelineDetails.useSearch();

  const tabs = useTabs();

  const activeTabIdx = React.useMemo(() => {
    const idx = tabs.findIndex((t) => t.id === pipelineRunsTab);
    return idx >= 0 ? idx : 0;
  }, [tabs, pipelineRunsTab]);

  const handleChangeTab = React.useCallback(
    (_event: React.ChangeEvent<object> | null, newActiveTabIdx: number) => {
      const newTab = tabs[newActiveTabIdx];
      if (newTab?.onClick) {
        newTab.onClick();
      }
    },
    [tabs]
  );

  return <Tabs tabs={tabs} activeTabIdx={activeTabIdx} handleChangeTab={handleChangeTab} />;
};
