import { PipelineRunList } from "@/modules/platform/tekton/components/PipelineRunList";
import { PATH_PIPELINERUN_DETAILS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { useUnifiedPipelineRunList } from "@/modules/platform/tekton/hooks/useUnifiedPipelineRunList";
import { HistoryLoadingFooter } from "@/modules/platform/tekton/components/HistoryLoadingFooter";
import { pipelineRunLabels, pipelineType } from "@my-project/shared";
import { routeStageDetails } from "../../../../../../route";
import { FilterProvider } from "@/core/providers/Filter/provider";
import {
  defaultPipelineRunFilterValues,
  matchFunctions,
  pipelineRunFilterControlNames,
} from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";
import { useDebouncedPipelineRunSearch } from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/hooks/usePipelineRunFilter";

const TABLE_ID = "stage-pipelines-unified";
const TABLE_NAME = "Unified Pipeline Run List";

/**
 * Merged "Pipelines" tab that combines live K8s PipelineRuns with
 * historical Tekton Results PipelineRuns for a specific stage.
 */
export function Pipelines() {
  return (
    <FilterProvider matchFunctions={matchFunctions} syncWithUrl defaultValues={defaultPipelineRunFilterValues}>
      <PipelinesContent />
    </FilterProvider>
  );
}

function PipelinesContent() {
  const params = routeStageDetails.useParams();
  const stageLabel = `${params.cdPipeline}-${params.stage}`;

  const debouncedSearch = useDebouncedPipelineRunSearch();

  const { mergedPipelineRuns, isLoading, isHistoryLoading, historyQuery } = useUnifiedPipelineRunList({
    labels: {
      [pipelineRunLabels.stage]: stageLabel,
    },
    searchTerm: debouncedSearch,
  });

  return (
    <div className="flex flex-col gap-2">
      <PipelineRunList
        tableId={TABLE_ID}
        tableName={TABLE_NAME}
        pipelineRuns={mergedPipelineRuns}
        isLoading={isLoading}
        pipelineRunTypes={[pipelineType.deploy, pipelineType.clean]}
        filterControls={[
          pipelineRunFilterControlNames.SEARCH,
          pipelineRunFilterControlNames.PIPELINE_TYPE,
          pipelineRunFilterControlNames.STATUS,
        ]}
        detailRoutePath={PATH_PIPELINERUN_DETAILS_FULL}
      />
      <HistoryLoadingFooter isHistoryLoading={isHistoryLoading} historyQuery={historyQuery} />
    </div>
  );
}
