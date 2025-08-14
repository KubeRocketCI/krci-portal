import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { TABLE } from "@/k8s/constants/tables";
import { useClusterStore } from "@/k8s/store";
import { PipelineRunList } from "@/modules/platform/pipelineruns/components/PipelineRunList";
import { pipelineRunFilterControlNames } from "@/modules/platform/pipelineruns/components/PipelineRunList/constants";
import { pipelineRunLabels, pipelineType } from "@my-project/shared";
import { useShallow } from "zustand/react/shallow";
import { routeStageDetails } from "../../../../route";
import { FilterProvider } from "@/core/providers/Filter/provider";

export const StagePipelineRuns = () => {
  const params = routeStageDetails.useParams();

  const { namespace: defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
    }))
  );
  const pipelineRunsWatch = usePipelineRunWatchList({
    labels: {
      [pipelineRunLabels.stage]: `${params.cdPipeline}-${params.stage}`,
    },
  });

  const pipelineRuns = pipelineRunsWatch.dataArray;

  return (
    <FilterProvider
      entityID={`PIPELINE_RUN_LIST_STAGE_DETAILS::${defaultNamespace}`}
      matchFunctions={{}}
      saveToLocalStorage
    >
      <PipelineRunList
        tableId={TABLE.STAGE_PIPELINE_RUN_LIST.id}
        tableName={TABLE.STAGE_PIPELINE_RUN_LIST.name}
        pipelineRuns={pipelineRuns!}
        isLoading={!pipelineRunsWatch.isReady}
        pipelineRunTypes={["all", pipelineType.deploy, pipelineType.clean]}
        filterControls={[pipelineRunFilterControlNames.PIPELINE_TYPE, pipelineRunFilterControlNames.STATUS]}
      />
    </FilterProvider>
  );
};
