import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { EmptyList } from "@/core/components/EmptyList";
import { Table } from "@/core/components/Table";
import { usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
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
      <Table
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
            <Box
              sx={{
                visibility: selectedCount ? "visible" : "hidden",
                pointerEvents: selectedCount ? "auto" : "none",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ minWidth: (t) => t.typography.pxToRem(150) }}>
                  <Typography variant={"body1"}>{selectedCount} item(s) selected</Typography>
                </Box>
                <ConditionalWrapper
                  condition={pipelineRunPermissions.data.delete.allowed}
                  wrapper={(children) => (
                    <Tooltip title={"Delete selected PipelineRuns"}>
                      <div>{children}</div>
                    </Tooltip>
                  )}
                >
                  <Box sx={{ color: (t) => t.palette.secondary.dark }}>
                    <ButtonWithPermission
                      ButtonProps={{
                        size: "small",
                        startIcon: <Trash size={16} />,
                        onClick: onDeleteClick,
                        disabled: !selectedCount,
                        variant: "outlined",
                        color: "inherit",
                      }}
                      reason={pipelineRunPermissions.data.delete.reason}
                      allowed={pipelineRunPermissions.data.delete.allowed}
                    >
                      delete
                    </ButtonWithPermission>
                  </Box>
                </ConditionalWrapper>
              </Stack>
            </Box>
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
