import { PipelineRunList } from "@/modules/platform/tekton/components/PipelineRunList";
import { PATH_PIPELINERUN_DETAILS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { useUnifiedPipelineRunList } from "@/modules/platform/tekton/hooks/useUnifiedPipelineRunList";
import { HistoryLoadingFooter } from "@/modules/platform/tekton/components/HistoryLoadingFooter";
import { PipelineRun, pipelineRunLabels, pipelineType } from "@my-project/shared";
import { FilterProvider } from "@/core/providers/Filter/provider";
import {
  defaultPipelineRunFilterValues,
  matchFunctions,
  pipelineRunFilterControlNames,
} from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";
import { PipelineRunListFilterValues } from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/types";
import { routeProjectDetails } from "../../../../route";
import { TABLE } from "@/k8s/constants/tables";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";

/**
 * Merged "Pipelines" tab that combines live K8s PipelineRuns with
 * historical Tekton Results PipelineRuns for a specific codebase.
 */
export function Pipelines() {
  const params = routeProjectDetails.useParams();

  const codebaseName = params.name;

  const { loadSettings } = useTableSettings(TABLE.CODEBASE_PIPELINE_RUN_LIST.id);
  const tableSettings = loadSettings();

  const { mergedPipelineRuns, isLoading, isHistoryLoading, historyQuery } = useUnifiedPipelineRunList({
    labels: {
      [pipelineRunLabels.codebase]: codebaseName,
    },
    enabled: !!codebaseName,
  });

  return (
    <FilterProvider<PipelineRun, PipelineRunListFilterValues>
      matchFunctions={matchFunctions}
      syncWithUrl
      defaultValues={defaultPipelineRunFilterValues}
    >
      <div className="flex flex-col gap-2">
        <PipelineRunList
          pipelineRuns={mergedPipelineRuns}
          isLoading={isLoading}
          pipelineRunTypes={[pipelineType.review, pipelineType.build]}
          filterControls={[
            pipelineRunFilterControlNames.CODEBASE_BRANCHES,
            pipelineRunFilterControlNames.PIPELINE_TYPE,
            pipelineRunFilterControlNames.STATUS,
          ]}
          tableId={TABLE.CODEBASE_PIPELINE_RUN_LIST.id}
          tableName={TABLE.CODEBASE_PIPELINE_RUN_LIST.name}
          tableSettings={tableSettings}
          detailRoutePath={PATH_PIPELINERUN_DETAILS_FULL}
        />
        <HistoryLoadingFooter isHistoryLoading={isHistoryLoading} historyQuery={historyQuery} />
      </div>
    </FilterProvider>
  );
}
