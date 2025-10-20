import { EmptyList } from "@/core/components/EmptyList";
import { Table } from "@/core/components/Table";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useCDPipelinePermissions, useCDPipelineWatchList } from "@/k8s/api/groups/KRCI/CDPipeline";
import { TABLE } from "@/k8s/constants/tables";
import { ManageCDPipelineDialog } from "@/modules/platform/cdpipelines/dialogs/ManageCDPipeline";
import React from "react";
import { CDPipelineFilter } from "../CDPipelineFilter";
import { useCDPipelineFilter } from "../CDPipelineFilter/hooks/useCDPipelineFilter";
import { useColumns } from "./hooks/useColumns";
import { CDPipelineListProps } from "./types";

export const CDPipelineList = ({ blockerComponent }: CDPipelineListProps) => {
  const columns = useColumns();

  const openManageCDPipelineDialog = useDialogOpener(ManageCDPipelineDialog);

  const cdPipelinePermissions = useCDPipelinePermissions();
  const cdPipelineListWatch = useCDPipelineWatchList();

  const { filterFunction } = useCDPipelineFilter();

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

  const tableSlots = React.useMemo(
    () => ({
      header: <CDPipelineFilter />,
    }),
    []
  );

  return (
    <Table
      id={TABLE.CDPIPELINE_LIST.id}
      name={TABLE.CDPIPELINE_LIST.name}
      isLoading={!cdPipelineListWatch.query.isFetched || !cdPipelinePermissions.isFetched}
      data={cdPipelineListWatch.dataArray}
      errors={[]}
      columns={columns}
      filterFunction={filterFunction}
      blockerComponent={blockerComponent}
      emptyListComponent={renderEmptyList}
      slots={tableSlots}
    />
  );
};
