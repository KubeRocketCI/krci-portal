import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { TABLE } from "@/k8s/constants/tables";
import { PipelineRunList } from "@/modules/platform/tekton/components/PipelineRunList";
import { sortKubeObjectByCreationTimestamp } from "@my-project/shared";
import React from "react";

export const Live = () => {
  const pipelineRunsWatch = usePipelineRunWatchList();

  const sortedPipelineRuns = React.useMemo(() => {
    return pipelineRunsWatch.data.array.toSorted(sortKubeObjectByCreationTimestamp);
  }, [pipelineRunsWatch.data.array]);

  const { loadSettings } = useTableSettings(TABLE.GENERAL_PIPELINE_RUN_LIST.id);

  const tableSettings = React.useMemo(() => loadSettings(), [loadSettings]);

  return (
    <PipelineRunList
      tableId={TABLE.GENERAL_PIPELINE_RUN_LIST.id}
      tableName={TABLE.GENERAL_PIPELINE_RUN_LIST.name}
      tableSettings={tableSettings}
      pipelineRuns={sortedPipelineRuns}
      isLoading={pipelineRunsWatch.isLoading}
      errors={pipelineRunsWatch.query.error ? [pipelineRunsWatch.query.error] : []}
    />
  );
};
