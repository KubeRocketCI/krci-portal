import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import { useRowSelection } from "@/core/components/Table/hooks/useRowSelection";
import { usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import { getKubeObjectUid } from "@/k8s/utils/getKubeObjectUid";
import { useStopPipelineRuns } from "@/modules/platform/tekton/hooks/useStopPipelineRuns";
import { Tooltip } from "@/core/components/ui/tooltip";
import { isHistoryPipelineRun, isPipelineRunStoppable, pipelineType, type PipelineRun } from "@my-project/shared";
import { OctagonX, Trash } from "lucide-react";
import React from "react";
import { DeletionDialog } from "./components/DeleteDialog";
import { StopPipelineRunsDialog } from "./components/StopPipelineRunsDialog";
import { PipelineRunFilter } from "./components/Filter";
import { usePipelineRunFilter } from "./components/Filter/hooks/usePipelineRunFilter";
import { useColumns } from "./hooks/useColumns";
import { PipelineRunListProps } from "./types";
import { pipelineRunFilterControlNames } from "./components/Filter/constants";
import { columnNames } from "./constants";
import { VisibleRunCount } from "./components/VisibleRunCount";

/** Newest first: a run the user just triggered lands at the top, queued or already started. */
const DEFAULT_SORT = { sortBy: columnNames.STARTED_AT, order: "desc" } as const;

export const PipelineRunList = ({
  tableId,
  tableName,
  pipelineRuns,
  isLoading,
  blockerError,
  errors,
  pagination,
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
    pipelineRunFilterControlNames.SEARCH,
    pipelineRunFilterControlNames.CODEBASES,
    pipelineRunFilterControlNames.STATUS,
    pipelineRunFilterControlNames.PIPELINE_TYPE,
    pipelineRunFilterControlNames.NAMESPACES,
  ],
}: PipelineRunListProps) => {
  const { selection, selectedRows, clearSelection, deselectRows } = useRowSelection(pipelineRuns, getKubeObjectUid);
  const pipelineRunPermissions = usePipelineRunPermissions();
  const { stop, isPending: isStopPending, permission: stopPermission } = useStopPipelineRuns();

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [stopTarget, setStopTarget] = React.useState<PipelineRun[]>();

  const stoppableCount = React.useMemo(() => selectedRows.filter(isPipelineRunStoppable).length, [selectedRows]);

  const columns = useColumns();

  const onDeleteClick = React.useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const { filterFunction } = usePipelineRunFilter();

  // Same predicate DataTable applies. With the pager hidden the table renders every filtered row, so the
  // count equals the rows on screen; with the pager shown its "of N" label already carries the total.
  const showCount = pagination?.show === false && !isLoading;
  const visibleCount = React.useMemo(() => pipelineRuns.filter(filterFunction).length, [pipelineRuns, filterFunction]);

  const tableSlots = React.useMemo(() => {
    return {
      header: {
        component: (
          <PipelineRunFilter
            pipelineRuns={pipelineRuns}
            pipelineRunTypes={pipelineRunTypes}
            filterControls={filterControls}
          />
        ),
        summary: showCount ? <VisibleRunCount count={visibleCount} /> : undefined,
      },
    };
  }, [pipelineRuns, pipelineRunTypes, filterControls, showCount, visibleCount]);

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
        sort={DEFAULT_SORT}
        pagination={pagination}
        selection={{
          ...selection,
          isRowSelectable: (row) => !isHistoryPipelineRun(row),
          renderSelectionActions: () => (
            <>
              <ButtonWithPermission
                ButtonProps={{
                  size: "sm",
                  variant: "outline",
                  onClick: () => setStopTarget(selectedRows),
                  disabled: !stoppableCount || isStopPending,
                }}
                reason={stopPermission.reason}
                allowed={stopPermission.allowed}
              >
                <OctagonX size={16} />
                Stop {stoppableCount}
              </ButtonWithPermission>
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
                    }}
                    reason={pipelineRunPermissions.data.delete.reason}
                    allowed={pipelineRunPermissions.data.delete.allowed}
                  >
                    <Trash size={16} />
                    Delete
                  </ButtonWithPermission>
                </div>
              </ConditionalWrapper>
            </>
          ),
        }}
        slots={tableSlots}
        outlined={false}
      />
      {deleteDialogOpen && (
        <DeletionDialog
          pipelineRuns={selectedRows}
          open={deleteDialogOpen}
          handleClose={() => setDeleteDialogOpen(false)}
          onDelete={clearSelection}
        />
      )}
      {stopTarget && (
        <StopPipelineRunsDialog
          pipelineRuns={stopTarget}
          stop={stop}
          open
          onOpenChange={(open) => !open && setStopTarget(undefined)}
          onStopped={deselectRows}
        />
      )}
    </>
  );
};
