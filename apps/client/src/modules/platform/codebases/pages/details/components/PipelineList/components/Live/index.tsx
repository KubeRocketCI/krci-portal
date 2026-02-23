import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { FilterProvider } from "@/core/providers/Filter/provider";
import { TABLE } from "@/k8s/constants/tables";
import { PipelineRunList } from "@/modules/platform/tekton/components/PipelineRunList";
import {
  matchFunctions,
  pipelineRunFilterControlNames,
} from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";
import { PipelineRunListFilterValues } from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/types";
import { PipelineRun, pipelineType, sortKubeObjectByCreationTimestamp } from "@my-project/shared";
import { useCodebasePipelineRunListWatch } from "../../../../hooks/data";

export const Live = () => {
  const pipelineRunListWatch = useCodebasePipelineRunListWatch();
  const { loadSettings } = useTableSettings(TABLE.CODEBASE_PIPELINE_RUN_LIST.id);
  const tableSettings = loadSettings();

  const pipelineRuns = pipelineRunListWatch.data.array.slice().sort(sortKubeObjectByCreationTimestamp);

  return (
    <FilterProvider<PipelineRun, PipelineRunListFilterValues>
      matchFunctions={matchFunctions}
      syncWithUrl
      defaultValues={{
        [pipelineRunFilterControlNames.NAMESPACES]: [],
        [pipelineRunFilterControlNames.CODEBASES]: [],
        [pipelineRunFilterControlNames.CODEBASE_BRANCHES]: [],
        [pipelineRunFilterControlNames.STATUS]: "all",
        [pipelineRunFilterControlNames.PIPELINE_TYPE]: "all",
      }}
    >
      <PipelineRunList
        pipelineRuns={pipelineRuns}
        isLoading={!pipelineRunListWatch.query.isFetched}
        pipelineRunTypes={[pipelineType.review, pipelineType.build]}
        filterControls={[
          pipelineRunFilterControlNames.CODEBASE_BRANCHES,
          pipelineRunFilterControlNames.PIPELINE_TYPE,
          pipelineRunFilterControlNames.STATUS,
        ]}
        tableId={TABLE.CODEBASE_PIPELINE_RUN_LIST.id}
        tableName={TABLE.CODEBASE_PIPELINE_RUN_LIST.name}
        tableSettings={tableSettings}
      />
    </FilterProvider>
  );
};
