import { PipelineRunList } from "@/modules/platform/tekton/components/PipelineRunList";
import { PATH_PIPELINERUN_DETAILS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { useUnifiedPipelineRunList } from "@/modules/platform/tekton/hooks/useUnifiedPipelineRunList";
import { HistoryLoadingFooter } from "@/modules/platform/tekton/components/HistoryLoadingFooter";
import { pipelineRunLabels } from "@my-project/shared";
import { routePipelineDetails } from "../../route";
import { FilterProvider } from "@/core/providers/Filter/provider";
import {
  pipelineRunFilterControlNames,
  pipelineRunFilterProviderProps,
} from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";
import {
  useDebouncedPipelineRunSearch,
  useSelectedPipelineRunStatus,
} from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/hooks/usePipelineRunFilter";
import { TABLE } from "@/k8s/constants/tables";

/**
 * Merged "Pipelines" tab that combines live K8s PipelineRuns with
 * historical Tekton Results PipelineRuns for a specific pipeline.
 */
export function Pipelines() {
  return (
    <FilterProvider {...pipelineRunFilterProviderProps}>
      <PipelinesContent />
    </FilterProvider>
  );
}

function PipelinesContent() {
  const params = routePipelineDetails.useParams();
  const debouncedSearch = useDebouncedPipelineRunSearch();
  const status = useSelectedPipelineRunStatus();

  const { mergedPipelineRuns, isLoading, isHistoryLoading, historyQuery } = useUnifiedPipelineRunList({
    labels: {
      [pipelineRunLabels.pipeline]: params.name,
    },
    searchTerm: debouncedSearch,
    status,
  });

  return (
    <div className="flex flex-col gap-2">
      <PipelineRunList
        pipelineRuns={mergedPipelineRuns}
        isLoading={isLoading}
        filterControls={[pipelineRunFilterControlNames.SEARCH, pipelineRunFilterControlNames.STATUS]}
        tableId={TABLE.PIPELINE_PIPELINE_RUN_LIST.id}
        tableName={TABLE.PIPELINE_PIPELINE_RUN_LIST.name}
        detailRoutePath={PATH_PIPELINERUN_DETAILS_FULL}
      />
      <HistoryLoadingFooter isHistoryLoading={isHistoryLoading} historyQuery={historyQuery} />
    </div>
  );
}
