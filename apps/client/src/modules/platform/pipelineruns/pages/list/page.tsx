import { FilterProvider } from "@/core/providers/Filter/provider";
import { useClusterStore } from "@/core/store";
import { useShallow } from "zustand/react/shallow";
import PipelineRunListView from "./view";
import { matchFunctions } from "../../components/PipelineRunList/constants";

export const PipelineRunListPage = () => {
  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

  return (
    <FilterProvider
      entityID={`PIPELINE_RUN_LIST_OVERVIEW::${defaultNamespace}`}
      matchFunctions={matchFunctions}
      valueMap={{
        pipelineType: "all",
      }}
      saveToLocalStorage
    >
      <PipelineRunListView />
    </FilterProvider>
  );
};
