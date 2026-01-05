import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import { usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import { Tooltip } from "@/core/components/ui/tooltip";
import { pipelineType } from "@my-project/shared";
import { Trash } from "lucide-react";
import React from "react";
import { DeletionDialog } from "./components/DeleteDialog";
import { PipelineRunFilter } from "./components/Filter";
import { usePipelineRunFilter } from "./components/Filter/hooks/usePipelineRunFilter";
import { useColumns } from "./hooks/useColumns";
import { useSelection } from "./hooks/useSelection";
import { PipelineRunListProps } from "./types";
import { pipelineRunFilterControlNames } from "./components/Filter/constants";

export const PipelineRunList = ({
  tableId,
  tableName,
  pipelineRuns,
  isLoading,
  blockerError,
  errors,
  pipelineRunTypes = [
    pipelineType.review,
    pipelineType.build,
    pipelineType.deploy,
    pipelineType.clean,
    pipelineType.security,
    pipelineType.release,
    pipelineType.tests,
  ],
  filterControls = [
    pipelineRunFilterControlNames.CODEBASES,
    pipelineRunFilterControlNames.STATUS,
    pipelineRunFilterControlNames.PIPELINE_TYPE,
    pipelineRunFilterControlNames.NAMESPACES,
  ],
  tableSettings,
}: PipelineRunListProps) => {
  const { selected, setSelected, handleSelectRowClick, handleSelectAllClick } = useSelection();
  const pipelineRunPermissions = usePipelineRunPermissions();

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const onDelete = React.useCallback(() => {
    setSelected([]);
  }, [setSelected]);

  const columns = useColumns({
    tableSettings,
  });

  const onDeleteClick = React.useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const { filterFunction } = usePipelineRunFilter();

  const tableSlots = React.useMemo(() => {
    return {
      header: (
        <PipelineRunFilter
          pipelineRuns={pipelineRuns}
          pipelineRunTypes={pipelineRunTypes}
          filterControls={filterControls}
        />
      ),
    };
  }, [pipelineRuns, pipelineRunTypes, filterControls]);

  return (
    <>
      <DataTable
        id={tableId}
        name={tableName}
        blockerError={blockerError}
        errors={errors}
        columns={columns}
        data={pipelineRuns}
        isLoading={isLoading}
        emptyListComponent={<EmptyList missingItemName={"pipeline runs"} />}
        filterFunction={filterFunction}
        selection={{
          selected,
          handleSelectAll: handleSelectAllClick,
          handleSelectRow: handleSelectRowClick,
          isRowSelected: (row) => selected.indexOf(row.metadata.name) !== -1,
          renderSelectionInfo: (selectedCount: number) => (
            <div className={selectedCount ? "visible" : "pointer-events-none invisible"}>
              <div className="flex flex-row items-center gap-4">
                <div className="min-w-[150px]">
                  <p className="text-base">{selectedCount} item(s) selected</p>
                </div>
                <ConditionalWrapper
                  condition={pipelineRunPermissions.data.delete.allowed}
                  wrapper={(children) => (
                    <Tooltip title={"Delete selected PipelineRuns"}>
                      <div>{children}</div>
                    </Tooltip>
                  )}
                >
                  <div className="text-secondary-700">
                    <ButtonWithPermission
                      ButtonProps={{
                        size: "sm",
                        variant: "outline",
                        onClick: onDeleteClick,
                        disabled: !selectedCount,
                      }}
                      reason={pipelineRunPermissions.data.delete.reason}
                      allowed={pipelineRunPermissions.data.delete.allowed}
                    >
                      <Trash size={16} />
                      Delete
                    </ButtonWithPermission>
                  </div>
                </ConditionalWrapper>
              </div>
            </div>
          ),
        }}
        slots={tableSlots}
      />
      {deleteDialogOpen && (
        <DeletionDialog
          items={pipelineRuns}
          selected={selected}
          open={deleteDialogOpen}
          handleClose={() => setDeleteDialogOpen(false)}
          onDelete={onDelete}
        />
      )}
    </>
  );
};
