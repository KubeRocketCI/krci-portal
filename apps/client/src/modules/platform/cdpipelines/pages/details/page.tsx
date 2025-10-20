import { FilterProvider } from "@/core/providers/Filter";
import { ViewModeContextProvider } from "@/core/providers/ViewMode/provider";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import type { StageWithApplication } from "@/k8s/api/groups/KRCI/Stage/utils/combineStageWithApplications";
import { matchFunctions, stageFilterDefaultValues } from "./components/StageListFilter/constants";
import { StageFilterValues } from "./components/StageListFilter/types";
import CDPipelineDetailsPageContent from "./view";

export default function CDPipelineDetailsPage() {
  return (
    <FilterProvider<StageWithApplication, StageFilterValues>
      defaultValues={stageFilterDefaultValues}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <ViewModeContextProvider entityID={"cdpipeline"} defaultViewMode={VIEW_MODES.COMPACT}>
        <CDPipelineDetailsPageContent />
      </ViewModeContextProvider>
    </FilterProvider>
  );
}
