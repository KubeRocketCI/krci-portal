import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { TABLE } from "@/k8s/constants/tables";
import { PipelineRunList } from "@/modules/platform/tekton/components/PipelineRunList";
import { pipelineRunLabels, pipelineType } from "@my-project/shared";
import { routeStageDetails } from "../../../../../../route";
import { FilterProvider } from "@/core/providers/Filter/provider";
import {
  matchFunctions,
  pipelineRunFilterControlNames,
} from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";

export const Live = () => {
  const params = routeStageDetails.useParams();

  const pipelineRunsWatch = usePipelineRunWatchList({
    labels: {
      [pipelineRunLabels.stage]: `${params.cdPipeline}-${params.stage}`,
    },
  });

  const pipelineRuns = pipelineRunsWatch.data.array;

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
        tableId={TABLE.STAGE_PIPELINE_RUN_LIST.id}
        tableName={TABLE.STAGE_PIPELINE_RUN_LIST.name}
        pipelineRuns={pipelineRuns!}
        isLoading={!pipelineRunsWatch.isReady}
        pipelineRunTypes={[pipelineType.deploy, pipelineType.clean]}
        filterControls={[pipelineRunFilterControlNames.PIPELINE_TYPE, pipelineRunFilterControlNames.STATUS]}
      />
    </FilterProvider>
  );
};
