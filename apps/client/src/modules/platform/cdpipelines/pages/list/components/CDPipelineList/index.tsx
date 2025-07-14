import { useColumns } from "./hooks/useColumns";
import { useFilter } from "./hooks/useFilter";
import { CDPipelineListProps } from "./types";
import { useCDPipelinePermissions, useCDPipelineWatchList } from "@/core/k8s/api/groups/KRCI/CDPipeline";
import { TABLE } from "@/core/k8s/constants/tables";
import { Table } from "@/core/components/Table";
import { EmptyList } from "@/core/components/EmptyList";
import { Filter } from "@/core/providers/Filter/components/Filter";
import React from "react";
import { ManageCDPipelineDialog } from "@/modules/platform/cdpipelines/dialogs/ManageCDPipeline";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";

export const CDPipelineList = ({ blockerComponent }: CDPipelineListProps) => {
  const columns = useColumns();

  const openManageCDPipelineDialog = useDialogOpener(ManageCDPipelineDialog);

  const cdPipelinePermissions = useCDPipelinePermissions();
  const cdPipelineListWatch = useCDPipelineWatchList();

  const { controls, filterFunction } = useFilter({
    cdPipelines: cdPipelineListWatch.dataArray,
  });

  const renderEmptyList = React.useMemo(() => {
    if (!cdPipelinePermissions.isFetched) return null;

    if (cdPipelinePermissions.data.create.allowed) {
      return (
        <EmptyList
          missingItemName={"Deployment Flows"}
          handleClick={() => {
            openManageCDPipelineDialog({
              CDPipeline: undefined,
            });
          }}
          description={"Take the first step towards managing your Deployment Flow by adding a new environment here."}
        />
      );
    } else {
      return <EmptyList customText={cdPipelinePermissions.data.create.reason} />;
    }
  }, [
    cdPipelinePermissions.isFetched,
    cdPipelinePermissions.data.create.allowed,
    cdPipelinePermissions.data.create.reason,
    openManageCDPipelineDialog,
  ]);

  return (
    <Table
      id={TABLE.CDPIPELINE_LIST.id}
      name={TABLE.CDPIPELINE_LIST.name}
      isLoading={cdPipelineListWatch.query.isLoading || cdPipelinePermissions.isLoading}
      data={cdPipelineListWatch.dataArray}
      errors={[]}
      columns={columns}
      filterFunction={filterFunction}
      blockerComponent={blockerComponent}
      emptyListComponent={renderEmptyList}
      slots={{
        header: <Filter controls={controls} />,
      }}
    />
  );
};
