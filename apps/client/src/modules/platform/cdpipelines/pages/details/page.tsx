import { FilterProvider } from "@/core/providers/Filter/provider";
import { ViewModeContextProvider } from "@/core/providers/ViewMode/provider";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { CDPipelineDetailsFilterValueMap, matchFunctions } from "./constants";
import CDPipelineDetailsPageContent from "./view";

export default function CDPipelineDetailsPage() {
  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

  const valueMap: CDPipelineDetailsFilterValueMap = {
    stages: [],
    applications: [],
    health: "",
  };

  return (
    <FilterProvider
      entityID={`CDPIPELINE_DETAILS::${defaultNamespace}`}
      matchFunctions={matchFunctions}
      valueMap={valueMap}
      saveToLocalStorage
    >
      <ViewModeContextProvider entityID={"cdpipeline"} defaultViewMode={VIEW_MODES.COMPACT}>
        <CDPipelineDetailsPageContent />
      </ViewModeContextProvider>
    </FilterProvider>
  );
}
