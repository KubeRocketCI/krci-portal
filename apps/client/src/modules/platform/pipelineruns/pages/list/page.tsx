import { FilterProvider } from "@/core/providers/Filter/provider";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import PipelineRunListView from "./view";
import { matchFunctions } from "../../components/PipelineRunList/constants";
import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import { routePipelineRunList } from "./route";
import { tabNameToIndexMap } from "./constants";

export const PipelineRunListPage = () => {
  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

  const search = routePipelineRunList.useSearch();
  const tabName = search.tab;
  const initialTabIdx = tabName ? tabNameToIndexMap[tabName] : 0;

  return (
    <FilterProvider
      entityID={`PIPELINE_RUN_LIST_OVERVIEW::${defaultNamespace}`}
      matchFunctions={matchFunctions}
      valueMap={{
        pipelineType: "all",
      }}
      saveToLocalStorage
    >
      <TabsContextProvider id="pipeline-run-list" initialTabIdx={initialTabIdx}>
        <PipelineRunListView />
      </TabsContextProvider>
    </FilterProvider>
  );
};
