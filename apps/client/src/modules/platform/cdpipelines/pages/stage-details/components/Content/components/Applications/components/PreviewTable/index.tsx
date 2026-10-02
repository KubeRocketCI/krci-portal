import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { ConfirmDialog } from "@/core/components/Confirm";
import { DataTable } from "@/core/components/Table";
import { useRowSelection } from "@/core/components/Table/hooks/useRowSelection";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useApplicationPermissions, useApplicationCRUD } from "@/k8s/api/groups/ArgoCD/Application";
import { TABLE } from "@/k8s/constants/tables";
import {
  StageAppCodebaseCombinedData,
  useStageAppCodebasesCombinedData,
} from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useColumns } from "./hooks/useColumns";
import { Trash } from "lucide-react";
import React from "react";
import { useButtonsEnabledMap } from "../../hooks/useButtonsEnabled";

const getAppCodebaseName = (row: StageAppCodebaseCombinedData) => row.appCodebase.metadata.name;

export const PreviewTable = () => {
  const stageAppCodebasesCombinedData = useStageAppCodebasesCombinedData();

  const applicationPermissions = useApplicationPermissions();
  const { triggerDeleteApplication } = useApplicationCRUD();

  const columns = useColumns();

  const { selection, selectedRows, clearSelection } = useRowSelection(
    stageAppCodebasesCombinedData.stageAppCodebasesCombinedData,
    getAppCodebaseName
  );
  const buttonsEnabledMap = useButtonsEnabledMap();
  const openConfirmDialog = useDialogOpener(ConfirmDialog);

  const handleClickDelete = React.useCallback(() => {
    const toDelete = selectedRows;
    openConfirmDialog({
      text:
        toDelete.length === 1
          ? "Are you sure you want to uninstall the selected application?"
          : `Are you sure you want to uninstall ${toDelete.length} selected applications?`,
      actionCallback: async () => {
        toDelete.forEach(({ application }) => {
          if (application) {
            triggerDeleteApplication({ data: { application } });
          }
        });
        clearSelection();
      },
    });
  }, [openConfirmDialog, selectedRows, clearSelection, triggerDeleteApplication]);

  return (
    <>
      <DataTable<StageAppCodebaseCombinedData>
        id={TABLE.STAGE_APPLICATION_LIST_PREVIEW.id}
        name={TABLE.STAGE_APPLICATION_LIST_PREVIEW.name}
        isLoading={stageAppCodebasesCombinedData.isLoading}
        data={stageAppCodebasesCombinedData.stageAppCodebasesCombinedData}
        columns={columns}
        selection={{
          ...selection,
          renderSelectionActions: () => (
            <ConditionalWrapper
              condition={!!applicationPermissions.data?.delete.allowed}
              wrapper={(children) => <Tooltip title="Uninstall selected applications">{children}</Tooltip>}
            >
              <div className="text-secondary-foreground">
                <ButtonWithPermission
                  ButtonProps={{
                    size: "sm",
                    variant: "outline",
                    onClick: handleClickDelete,
                    disabled: !buttonsEnabledMap.uninstall,
                  }}
                  allowed={applicationPermissions.data?.delete.allowed}
                  reason={applicationPermissions.data?.delete.reason}
                >
                  <Trash size={16} />
                  Delete
                </ButtonWithPermission>
              </div>
            </ConditionalWrapper>
          ),
        }}
        settings={{
          show: false,
        }}
        outlined={false}
      />
    </>
  );
};
