import { FilterProvider } from "@/core/providers/Filter";
import { ViewModeContextProvider } from "@/core/providers/ViewMode/provider";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import { Stage } from "@my-project/shared";
import { matchFunctions, stageFilterDefaultValues } from "./components/StageListFilter/constants";
import { StageFilterValues } from "./components/StageListFilter/types";
import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import { routeCDPipelineDetails } from "./route";
import { tabNameToIndexMap } from "./constants";
import CDPipelineDetailsPageContent from "./view";

export default function CDPipelineDetailsPage() {
  const search = routeCDPipelineDetails.useSearch();
  const tabName = search.tab;
  const initialTabIdx = tabName ? tabNameToIndexMap[tabName] : 0;

  return (
    <FilterProvider<Stage, StageFilterValues>
      defaultValues={stageFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <ViewModeContextProvider entityID={"cdpipeline"} defaultViewMode={VIEW_MODES.COMPACT}>
        <TabsContextProvider id="cdpipeline-details-page" initialTabIdx={initialTabIdx}>
          <CDPipelineDetailsPageContent />
        </TabsContextProvider>
      </ViewModeContextProvider>
    </FilterProvider>
  );
}
