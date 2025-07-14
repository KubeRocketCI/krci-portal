import { FilterProvider } from "@/core/providers/Filter/provider";
import CDPipelineListPageContent from "./view";
import { useClusterStore } from "@/core/store";
import { useShallow } from "zustand/react/shallow";
import { matchFunctions } from "./constants";
import { CDPipelineListFilterValueMap } from "./types";

export default function CDPipelineListPage() {
  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

  const valueMap: CDPipelineListFilterValueMap = {
    search: "",
    codebases: [],
  };

  return (
    <FilterProvider
      entityID={`CDPIPELINE_LIST::${defaultNamespace}`}
      matchFunctions={matchFunctions}
      valueMap={valueMap}
      saveToLocalStorage
    >
      <CDPipelineListPageContent />
    </FilterProvider>
  );
}
