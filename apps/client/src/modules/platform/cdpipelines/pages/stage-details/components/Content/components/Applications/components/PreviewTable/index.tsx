import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { ConfirmDialog } from "@/core/components/Confirm";
import { DataTable } from "@/core/components/Table";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useApplicationPermissions, useApplicationCRUD } from "@/k8s/api/groups/ArgoCD/Application";
import { TABLE } from "@/k8s/constants/tables";
import {
  StageAppCodebaseCombinedData,
  useStageAppCodebasesCombinedData,
} from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useColumns } from "./hooks/useColumns";
import { useSelection } from "../../hooks/useSelection";
import { Trash } from "lucide-react";
import React from "react";
import { useButtonsEnabledMap } from "../../hooks/useButtonsEnabled";

export const PreviewTable = () => {
  const stageAppCodebasesCombinedData = useStageAppCodebasesCombinedData();

  const applicationPermissions = useApplicationPermissions();
  const { triggerDeleteApplication } = useApplicationCRUD();

  const columns = useColumns();

  const { selected, setSelected, handleClickSelectAll, handleClickSelectRow } = useSelection();
  const buttonsEnabledMap = useButtonsEnabledMap();
  const openConfirmDialog = useDialogOpener(ConfirmDialog);

  const handleClickDelete = React.useCallback(() => {
    const toDelete = selected;
    openConfirmDialog({
      text:
        toDelete.length === 1
          ? "Are you sure you want to uninstall the selected application?"
          : `Are you sure you want to uninstall ${toDelete.length} selected applications?`,
      actionCallback: async () => {
        const { stageAppCodebasesCombinedDataByApplicationName } = stageAppCodebasesCombinedData;
        toDelete.forEach((appCodebaseName) => {
          const row = stageAppCodebasesCombinedDataByApplicationName.get(appCodebaseName);
          if (row?.application) {
            triggerDeleteApplication({ data: { application: row.application } });
          }
        });
        setSelected([]);
      },
    });
  }, [openConfirmDialog, selected, stageAppCodebasesCombinedData, setSelected, triggerDeleteApplication]);

  return (
    <>
      <DataTable<StageAppCodebaseCombinedData>
        id={TABLE.STAGE_APPLICATION_LIST_PREVIEW.id}
        name={TABLE.STAGE_APPLICATION_LIST_PREVIEW.name}
        isLoading={stageAppCodebasesCombinedData.isLoading}
        data={stageAppCodebasesCombinedData.stageAppCodebasesCombinedData}
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
                            onClick: handleClickDelete,
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
                          onClick: handleClickDelete,
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
    </>
  );
};
