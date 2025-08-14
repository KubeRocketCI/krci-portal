import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { routePipelineDetails } from "../../route";
import { pipelineRunLabels } from "@my-project/shared";
import { PipelineRunList } from "@/modules/platform/pipelineruns/components/PipelineRunList";
import { TABLE } from "@/k8s/constants/tables";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { FilterProvider } from "@/core/providers/Filter/provider";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

export const PipelineRunListByPipeline = () => {
  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

  const params = routePipelineDetails.useParams();

  const pipelineRunListWatch = usePipelineRunWatchList({
    labels: {
      [pipelineRunLabels.pipeline]: params.name,
    },
  });

  const pipelineRuns = pipelineRunListWatch.dataArray;

  const { loadSettings } = useTableSettings(TABLE.PIPELINE_PIPELINE_RUN_LIST.id);

  const tableSettings = loadSettings();

  return (
    <FilterProvider
      entityID={`PIPELINE_RUN_LIST_BY_PIPELINE::${defaultNamespace}`}
      matchFunctions={{}}
      saveToLocalStorage
    >
      <PipelineRunList
        pipelineRuns={pipelineRuns!}
        isLoading={!pipelineRunListWatch.isReady}
        tableId={TABLE.PIPELINE_PIPELINE_RUN_LIST.id}
        tableName={TABLE.PIPELINE_PIPELINE_RUN_LIST.name}
        tableSettings={tableSettings}
        filterControls={[]}
      />
    </FilterProvider>
  );
};
