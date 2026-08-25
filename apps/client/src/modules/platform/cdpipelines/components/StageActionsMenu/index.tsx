import { ActionsInlineList } from "@/core/components/ActionsInlineList";
import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useStagePermissions } from "@/k8s/api/groups/KRCI/Stage";
import { actionMenuType } from "@/k8s/constants/actionMenuTypes";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { EditStageDialog } from "../EditStageDialog";
import { createResourceAction, getResourceProtection, getDisabledState } from "@/core/utils/createResourceAction";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { k8sOperation, k8sStageConfig } from "@my-project/shared";
import { Pencil, Trash } from "lucide-react";
import React from "react";
import { StageActionsMenuProps } from "./types";
import { getStageDeleteDisabledState } from "./utils/getStageDeleteDisabledState";

export const StageActionsMenu = ({ data: { stage, stages }, backRoute, variant }: StageActionsMenuProps) => {
  const openEditStageDialog = useDialogOpener(EditStageDialog);
  const openDeleteKubeObjectDialog = useDialogOpener(DeleteKubeObjectDialog);
  const stagePermissions = useStagePermissions();

  const patchProtection = getResourceProtection(stage, k8sOperation.update);
  const deleteProtection = getResourceProtection(stage, k8sOperation.delete);

  const actions = React.useMemo(() => {
    const deleteDisabled = getStageDeleteDisabledState({
      allStages: stages,
      currentStage: stage,
      deleteProtection,
      deletePermission: stagePermissions.data.delete,
    });

    return [
      createResourceAction({
        item: stage,
        type: k8sOperation.update,
        label: "Edit",
        Icon: <Pencil size={16} />,
        disabled: getDisabledState(patchProtection, stagePermissions.data.update),
        callback: (stage) => {
          openEditStageDialog({ stage });
        },
      }),
      createResourceAction({
        item: stage,
        type: k8sOperation.delete,
        label: capitalizeFirstLetter(k8sOperation.delete),
        Icon: <Trash size={16} />,
        disabled: deleteDisabled,
        callback: (stage) => {
          openDeleteKubeObjectDialog({
            objectName: stage?.spec?.name,
            resourceConfig: k8sStageConfig,
            resource: stage,
            description: `Confirm the deletion of the CD stage with all its components`,
            backRoute,
          });
        },
      }),
    ];
  }, [
    stage,
    stagePermissions.data,
    stages,
    openEditStageDialog,
    openDeleteKubeObjectDialog,
    backRoute,
    patchProtection,
    deleteProtection,
  ]);

  return variant === actionMenuType.inline ? (
    <ActionsInlineList actions={actions} />
  ) : variant === actionMenuType.menu ? (
    <ActionsMenuList actions={actions} />
  ) : null;
};
