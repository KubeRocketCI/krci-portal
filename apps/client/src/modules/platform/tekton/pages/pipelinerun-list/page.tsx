import { FilterProvider } from "@/core/providers/Filter";

import PipelineRunListView from "./view";
import type { PipelineRun } from "@my-project/shared";
import {
  matchFunctions,
  pipelineRunFilterControlNames,
} from "../../components/PipelineRunList/components/Filter/constants";
import type { PipelineRunListFilterValues } from "../../components/PipelineRunList/components/Filter/types";
import { TabsContextProvider } from "@/core/providers/Tabs/provider";
import { routePipelineRunList } from "./route";
import { tabNameToIndexMap } from "./constants";

export const PipelineRunListPage = () => {
  const search = routePipelineRunList.useSearch();
  const tabName = search.tab;
  const initialTabIdx = tabName ? tabNameToIndexMap[tabName] : 0;

  return (
    <FilterProvider<PipelineRun, PipelineRunListFilterValues>
      defaultValues={{
        [pipelineRunFilterControlNames.NAMESPACES]: [],
        [pipelineRunFilterControlNames.CODEBASES]: [],
        [pipelineRunFilterControlNames.CODEBASE_BRANCHES]: [],
        [pipelineRunFilterControlNames.STATUS]: "all",
        [pipelineRunFilterControlNames.PIPELINE_TYPE]: "all",
      }}
      matchFunctions={matchFunctions}
      syncWithUrl
    >
      <TabsContextProvider id="pipeline-run-list" initialTabIdx={initialTabIdx}>
        <PipelineRunListView />
      </TabsContextProvider>
    </FilterProvider>
  );
};
