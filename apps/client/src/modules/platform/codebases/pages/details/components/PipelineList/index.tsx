import React from "react";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import { routeProjectDetails } from "../../route";
import { useTabs } from "./hooks/useTabs";
import { Card } from "@/core/components/ui/card";
import { useTours } from "@/modules/tours";

export const PipelineList = () => {
  const { pipelinesTab } = routeProjectDetails.useSearch();
  const { isTourNavigating, currentTourTab } = useTours();

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

  // Highlight inner pipeline tabs when the tour is focused on the pipelines area
  const tourHighlight =
    currentTourTab === "pipelines" ? { isNavigating: isTourNavigating, focusedTabId: pipelinesTab ?? null } : undefined;

  return (
    <Card className="p-6" data-tour="pipelines-table">
      <h3 className="text-foreground mb-4 text-xl font-semibold">Pipeline Runs</h3>
      <div data-tour="pipeline-history">
        <Tabs tabs={tabs} activeTabIdx={activeTabIdx} handleChangeTab={handleChangeTab} tourHighlight={tourHighlight} />
      </div>
    </Card>
  );
};
