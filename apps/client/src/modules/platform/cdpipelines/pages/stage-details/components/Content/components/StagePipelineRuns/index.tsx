import React from "react";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { routeStageDetails } from "../../../../route";
import { useTabs } from "./hooks/useTabs";
import { Card } from "@/core/components/ui/card";

export const StagePipelineRuns = () => {
  const { pipelinesTab } = routeStageDetails.useSearch();

  const tabs = useTabs();

  const activeTabIdx = React.useMemo(() => {
    const idx = tabs.findIndex((t) => t.id === pipelinesTab);
    return idx >= 0 ? idx : 0;
  }, [tabs, pipelinesTab]);

  const handleChangeTab = React.useCallback(
    (_event: React.ChangeEvent<object> | null, newActiveTabIdx: number) => {
      const newTab = tabs[newActiveTabIdx];
      if (newTab?.onClick) {
        newTab.onClick();
      }
    },
    [tabs]
  );

  return (
    <Card className="p-6">
      <h3 className="text-foreground mb-4 text-xl font-semibold">Pipeline Runs</h3>
      <Tabs tabs={tabs} activeTabIdx={activeTabIdx} handleChangeTab={handleChangeTab} />
    </Card>
  );
};
