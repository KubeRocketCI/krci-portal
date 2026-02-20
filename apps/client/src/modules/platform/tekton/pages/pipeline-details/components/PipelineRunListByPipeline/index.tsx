import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { routePipelineDetails } from "../../route";
import { pipelineRunLabels } from "@my-project/shared";
import { PipelineRunList } from "@/modules/platform/tekton/components/PipelineRunList";
import { TABLE } from "@/k8s/constants/tables";
import { FilterProvider } from "@/core/providers/Filter";
import {
  matchFunctions,
  pipelineRunFilterControlNames,
} from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";

export const PipelineRunListByPipeline = () => {
  const params = routePipelineDetails.useParams();

  const pipelineRunListWatch = usePipelineRunWatchList({
    labels: {
      [pipelineRunLabels.pipeline]: params.name,
    },
  });

  const pipelineRuns = pipelineRunListWatch.data.array;

  return (
    <FilterProvider
      matchFunctions={matchFunctions}
      syncWithUrl
      defaultValues={{
        [pipelineRunFilterControlNames.CODEBASES]: [],
        [pipelineRunFilterControlNames.CODEBASE_BRANCHES]: [],
        [pipelineRunFilterControlNames.NAMESPACES]: [],
        [pipelineRunFilterControlNames.STATUS]: "all",
        [pipelineRunFilterControlNames.PIPELINE_TYPE]: "all",
      }}
    >
      <PipelineRunList
        pipelineRuns={pipelineRuns!}
        isLoading={!pipelineRunListWatch.isReady}
        tableId={TABLE.PIPELINE_PIPELINE_RUN_LIST.id}
        tableName={TABLE.PIPELINE_PIPELINE_RUN_LIST.name}
        filterControls={[pipelineRunFilterControlNames.STATUS]}
      />
    </FilterProvider>
  );
};
