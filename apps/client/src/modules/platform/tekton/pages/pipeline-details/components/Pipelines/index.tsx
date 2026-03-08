import { PipelineRunList } from "@/modules/platform/tekton/components/PipelineRunList";
import { PATH_PIPELINERUN_DETAILS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { useUnifiedPipelineRunList } from "@/modules/platform/tekton/hooks/useUnifiedPipelineRunList";
import { HistoryLoadingFooter } from "@/modules/platform/tekton/components/HistoryLoadingFooter";
import { pipelineRunLabels } from "@my-project/shared";
import { routePipelineDetails } from "../../route";
import { FilterProvider } from "@/core/providers/Filter/provider";
import {
  defaultPipelineRunFilterValues,
  matchFunctions,
  pipelineRunFilterControlNames,
} from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";
import { TABLE } from "@/k8s/constants/tables";

/**
 * Merged "Pipelines" tab that combines live K8s PipelineRuns with
 * historical Tekton Results PipelineRuns for a specific pipeline.
 */
export function Pipelines() {
  const params = routePipelineDetails.useParams();

  const { mergedPipelineRuns, isLoading, isHistoryLoading, historyQuery } = useUnifiedPipelineRunList({
    labels: {
      [pipelineRunLabels.pipeline]: params.name,
    },
  });

  return (
    <FilterProvider matchFunctions={matchFunctions} syncWithUrl defaultValues={defaultPipelineRunFilterValues}>
      <div className="flex flex-col gap-2">
        <PipelineRunList
          pipelineRuns={mergedPipelineRuns}
          isLoading={isLoading}
          filterControls={[pipelineRunFilterControlNames.STATUS]}
          tableId={TABLE.PIPELINE_PIPELINE_RUN_LIST.id}
          tableName={TABLE.PIPELINE_PIPELINE_RUN_LIST.name}
          detailRoutePath={PATH_PIPELINERUN_DETAILS_FULL}
        />
        <HistoryLoadingFooter isHistoryLoading={isHistoryLoading} historyQuery={historyQuery} />
      </div>
    </FilterProvider>
  );
}
