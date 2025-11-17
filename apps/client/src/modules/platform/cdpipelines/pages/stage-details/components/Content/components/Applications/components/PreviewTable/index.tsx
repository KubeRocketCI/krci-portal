import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { DataTable } from "@/core/components/Table";
import { useApplicationPermissions } from "@/k8s/api/groups/ArgoCD/Application";
import { TABLE } from "@/k8s/constants/tables";
import {
  StageAppCodebaseCombinedData,
  useWatchStageAppCodebasesCombinedData,
} from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useColumns } from "./hooks/useColumns";
import { useSelection } from "../../hooks/useSelection";
import { Trash } from "lucide-react";
import { useButtonsEnabledMap } from "../../hooks/useButtonsEnabled";

export const PreviewTable = () => {
  const stageAppCodebasesCombinedDataWatch = useWatchStageAppCodebasesCombinedData();

  const applicationPermissions = useApplicationPermissions();

  const columns = useColumns();

  const { selected, handleClickSelectAll, handleClickSelectRow } = useSelection();
  const buttonsEnabledMap = useButtonsEnabledMap();

  return (
    <>
      <DataTable<StageAppCodebaseCombinedData>
        id={TABLE.STAGE_APPLICATION_LIST_PREVIEW.id}
        name={TABLE.STAGE_APPLICATION_LIST_PREVIEW.name}
        isLoading={!stageAppCodebasesCombinedDataWatch.isFetched}
        data={stageAppCodebasesCombinedDataWatch.data?.stageAppCodebasesCombinedData ?? []}
        columns={columns}
        selection={{
          selected,
          isRowSelected: (row) => selected.indexOf(row.appCodebase.metadata.name) !== -1,
          handleSelectAll: handleClickSelectAll,
          handleSelectRow: handleClickSelectRow,
          renderSelectionInfo: (selectionLength) => (
            <div className="flex flex-row items-center justify-between">
              <div
                style={{
                  visibility: selectionLength ? "visible" : "hidden",
                  pointerEvents: selectionLength ? "auto" : "none",
                }}
              >
                <div className="flex flex-row items-center gap-4">
                  <div className="min-w-38">
                    <p className="text-base">{selectionLength} item(s) selected</p>
                  </div>
                  {applicationPermissions.data?.delete.allowed ? (
                    <Tooltip title="Uninstall selected applications">
                      <div className="text-secondary-foreground">
                        <ButtonWithPermission
                          ButtonProps={{
                            size: "sm",
                            variant: "outline",
                            // onClick: () => setDeleteDialogOpen(true),
                            disabled: !selectionLength || !buttonsEnabledMap.uninstall,
                          }}
                          allowed={applicationPermissions.data?.delete.allowed}
                          reason={applicationPermissions.data?.delete.reason}
                        >
                          <Trash size={16} />
                          Delete
                        </ButtonWithPermission>
                      </div>
                    </Tooltip>
                  ) : (
                    <div className="text-secondary-foreground">
                      <ButtonWithPermission
                        ButtonProps={{
                          size: "sm",
                          variant: "outline",
                          // onClick: () => setDeleteDialogOpen(true),
                          disabled: !selectionLength || !buttonsEnabledMap.uninstall,
                        }}
                        allowed={applicationPermissions.data?.delete.allowed}
                        reason={applicationPermissions.data?.delete.reason}
                      >
                        <Trash size={16} />
                        Delete
                      </ButtonWithPermission>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ),
        }}
        settings={{
          show: false,
        }}
      />
      {/* <ApplicationsMultiDeletion
        applications={allArgoApplications}
        selected={selected}
        open={deleteDialogOpen}
        handleClose={() => setDeleteDialogOpen(false)}
        onDelete={() => {
          setSelected([]);
          setDeleteDialogOpen(false);
        }}
        deleteArgoApplication={deleteArgoApplication}
      /> */}
    </>
  );
};
