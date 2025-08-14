import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { TABLE } from "@/k8s/constants/tables";
import { PipelineRunList } from "@/modules/platform/pipelineruns/components/PipelineRunList";
import React from "react";

export const Live = () => {
  const pipelineRunsWatch = usePipelineRunWatchList();

  const { loadSettings } = useTableSettings(TABLE.GENERAL_PIPELINE_RUN_LIST.id);

  const tableSettings = React.useMemo(() => loadSettings(), [loadSettings]);

  return (
    <PipelineRunList
      tableId={TABLE.GENERAL_PIPELINE_RUN_LIST.id}
      tableName={TABLE.GENERAL_PIPELINE_RUN_LIST.name}
      tableSettings={tableSettings}
      pipelineRuns={pipelineRunsWatch.dataArray}
      isLoading={pipelineRunsWatch.isInitialLoading}
      errors={pipelineRunsWatch.query.error ? [pipelineRunsWatch.query.error] : []}
    />
  );
};
