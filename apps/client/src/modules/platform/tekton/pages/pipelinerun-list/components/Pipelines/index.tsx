import { PipelineRunList } from "@/modules/platform/tekton/components/PipelineRunList";
import { PATH_PIPELINERUN_DETAILS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { useUnifiedPipelineRunList } from "@/modules/platform/tekton/hooks/useUnifiedPipelineRunList";
import { HistoryLoadingFooter } from "@/modules/platform/tekton/components/HistoryLoadingFooter";
import { FilterProvider } from "@/core/providers/Filter/provider";
import {
  defaultPipelineRunFilterValues,
  matchFunctions,
  pipelineRunFilterControlNames,
} from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";

const TABLE_ID = "pipelineruns-unified";
const TABLE_NAME = "Unified Pipeline Run List";

/**
 * Merged "Pipelines" tab that combines live K8s PipelineRuns with
 * historical Tekton Results PipelineRuns for all namespaces.
 *
 * No label filter on K8s watch and no CEL filter on history -- shows all pipeline runs.
 */
export function Pipelines() {
  const { mergedPipelineRuns, isLoading, isHistoryLoading, historyQuery } = useUnifiedPipelineRunList();

  return (
    <FilterProvider matchFunctions={matchFunctions} syncWithUrl defaultValues={defaultPipelineRunFilterValues}>
      <div className="flex flex-col gap-2">
        <PipelineRunList
          tableId={TABLE_ID}
          tableName={TABLE_NAME}
          pipelineRuns={mergedPipelineRuns}
          isLoading={isLoading}
          filterControls={[
            pipelineRunFilterControlNames.CODEBASES,
            pipelineRunFilterControlNames.STATUS,
            pipelineRunFilterControlNames.PIPELINE_TYPE,
            pipelineRunFilterControlNames.NAMESPACES,
          ]}
          detailRoutePath={PATH_PIPELINERUN_DETAILS_FULL}
        />
        <HistoryLoadingFooter isHistoryLoading={isHistoryLoading} historyQuery={historyQuery} />
      </div>
    </FilterProvider>
  );
}
