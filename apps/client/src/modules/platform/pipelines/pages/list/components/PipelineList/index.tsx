import React from "react";
import { Table } from "@/core/components/Table";
import { EmptyList } from "@/core/components/EmptyList";
import { usePipelineWatchList, usePipelinePermissions } from "@/k8s/api/groups/Tekton/Pipeline";
import { TABLE } from "@/k8s/constants/tables";
import { useColumns } from "./hooks/useColumns";

export const PipelineList = () => {
  const columns = useColumns();

  const pipelinePermissions = usePipelinePermissions();
  const pipelineListWatch = usePipelineWatchList();

  const renderEmptyList = React.useMemo(() => {
    if (!pipelinePermissions.isFetched) return null;

    return (
      <EmptyList missingItemName={"Pipelines"} description={"No Tekton pipelines found in the current namespace."} />
    );
  }, [pipelinePermissions.isFetched]);

  return (
    <Table
      id={TABLE.PIPELINE_LIST?.id || "pipeline-list"}
      name={TABLE.PIPELINE_LIST?.name || "Pipelines"}
      isLoading={!pipelineListWatch.query.isFetched || !pipelinePermissions.isFetched}
      data={pipelineListWatch.dataArray}
      errors={[]}
      columns={columns}
      emptyListComponent={renderEmptyList}
    />
  );
};
