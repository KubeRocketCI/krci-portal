import React from "react";
import { DataTable } from "@/core/components/Table";
import { EmptyList } from "@/core/components/EmptyList";
import { usePipelineWatchList, usePipelinePermissions } from "@/k8s/api/groups/Tekton/Pipeline";
import { TABLE } from "@/k8s/constants/tables";
import { useColumns } from "./hooks/useColumns";
import { PipelineFilter } from "../PipelineFilter";
import { usePipelineFilter } from "../PipelineFilter/hooks/useFilter";

export const PipelineList = () => {
  const columns = useColumns();

  const pipelinePermissions = usePipelinePermissions();
  const pipelineListWatch = usePipelineWatchList();

  const { filterFunction } = usePipelineFilter();

  const renderEmptyList = React.useMemo(() => {
    if (!pipelinePermissions.isFetched) return null;

    return (
      <EmptyList missingItemName={"Pipelines"} description={"No Tekton pipelines found in the current namespace."} />
    );
  }, [pipelinePermissions.isFetched]);

  const tableSlots = React.useMemo(
    () => ({
      header: <PipelineFilter />,
    }),
    []
  );

  return (
    <DataTable
      id={TABLE.PIPELINE_LIST?.id || "pipeline-list"}
      name={TABLE.PIPELINE_LIST?.name || "Pipelines"}
      isLoading={!pipelineListWatch.query.isFetched || !pipelinePermissions.isFetched}
      data={pipelineListWatch.data.array}
      errors={[]}
      columns={columns}
      emptyListComponent={renderEmptyList}
      filterFunction={filterFunction}
      slots={tableSlots}
    />
  );
};
