import { ActionsInlineList } from "@/core/components/ActionsInlineList";
import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useStagePermissions } from "@/k8s/api/groups/KRCI/Stage";
import { actionMenuType } from "@/k8s/constants/actionMenuTypes";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { ManageStageDialog } from "@/modules/platform/cdpipelines/dialogs/ManageStage";
import { ListItemAction } from "@/core/types/global";
import { createResourceAction } from "@/core/utils/createResourceAction";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { DefaultPermissionListCheckResult, k8sOperation, k8sStageConfig, Stage } from "@my-project/shared";
import { krciCommonLabels } from "@my-project/shared/models/k8s/groups/KRCI/common/labels";
import { Pencil, Trash } from "lucide-react";
import React from "react";
import { StageActionsMenuProps } from "./types";

const getStageOrder = (stage: Stage): number => stage.spec.order;

// eslint-disable-next-line react-refresh/only-export-components
export const createDeleteAction = ({
  allStages,
  currentStage,
  action,
  permissions,
}: {
  allStages: Stage[];
  currentStage: Stage;
  action: (stage: Stage) => void;
  permissions: DefaultPermissionListCheckResult;
}): ListItemAction | undefined => {
  if (!currentStage) {
    return;
  }

  const isProtected = currentStage?.metadata?.labels?.[krciCommonLabels.editProtection] === "true";

  // CD pipeline could publish artifacts without any stage
  // so, in case it doesn't have any stage
  // probably this is something wrong and somebody messed-up CR

  // we don't let user remove last stage
  if (allStages.length === 0 || allStages.length === 1) {
    return createResourceAction({
      type: k8sOperation.delete,
      label: capitalizeFirstLetter(k8sOperation.delete),
      item: currentStage,
      Icon: <Trash size={16} />,
      disabled: {
        status: true,
        reason: "Deployment Flow should have at least one Environment",
      },
    });
  }

  const currentStageOrder = getStageOrder(currentStage);
  const otherStages = allStages.filter((el) => el.metadata.name !== currentStage.metadata.name);
  const highestOtherStagesOrder = Math.max(...otherStages.map(getStageOrder));

  const deleteActionDisabled = isProtected
    ? {
        status: true,
        reason: "This resource is protected from deletion.",
      }
    : {
        status: !permissions.delete.allowed,
        reason: permissions.delete.reason,
      };

  if (currentStageOrder > highestOtherStagesOrder) {
    return createResourceAction({
      type: k8sOperation.delete,
      label: capitalizeFirstLetter(k8sOperation.delete),
      item: currentStage,
      Icon: <Trash size={16} />,
      disabled: deleteActionDisabled,
      callback: (stage) => action(stage),
    });
  }

  return createResourceAction({
    type: k8sOperation.delete,
    label: capitalizeFirstLetter(k8sOperation.delete),
    item: currentStage,
    Icon: <Trash size={16} />,
    disabled: {
      status: true,
      reason: "You are able to delete only the last Environment",
    },
  });
};

export const StageActionsMenu = ({
  data: { stage, stages, cdPipeline },
  backRoute,
  handleCloseResourceActionListMenu,
  anchorEl,
  variant,
}: StageActionsMenuProps) => {
  const openManageStageDialog = useDialogOpener(ManageStageDialog);
  const openDeleteKubeObjectDialog = useDialogOpener(DeleteKubeObjectDialog);
  const stagePermissions = useStagePermissions();

  const actions = React.useMemo(() => {
    return [
      createResourceAction({
        item: stage,
        type: k8sOperation.patch,
        label: capitalizeFirstLetter(k8sOperation.patch),
        Icon: <Pencil size={16} />,
        disabled: {
          status: !stagePermissions.data.patch.allowed,
          reason: stagePermissions.data.patch.reason,
        },
        callback: (stage) => {
          if (variant === actionMenuType.menu && handleCloseResourceActionListMenu) {
            handleCloseResourceActionListMenu();
          }

          openManageStageDialog({
            stage,
            otherStages: stages,
            cdPipeline,
          });
        },
      }),
      createDeleteAction({
        allStages: stages,
        currentStage: stage,
        permissions: stagePermissions.data,
        action: (stage) => {
          if (variant === actionMenuType.menu && handleCloseResourceActionListMenu) {
            handleCloseResourceActionListMenu();
          }

          openDeleteKubeObjectDialog({
            objectName: stage?.spec?.name,
            resourceConfig: k8sStageConfig,
            resource: stage,
            description: `Confirm the deletion of the CD stage with all its components`,
            backRoute,
          });
        },
      }),
    ].filter((action): action is ListItemAction => action !== undefined);
  }, [
    stage,
    stagePermissions.data,
    stages,
    variant,
    handleCloseResourceActionListMenu,
    openManageStageDialog,
    cdPipeline,
    openDeleteKubeObjectDialog,
    backRoute,
  ]);

  return variant === actionMenuType.inline ? (
    <ActionsInlineList actions={actions} />
  ) : variant === actionMenuType.menu ? (
    <ActionsMenuList actions={actions} anchorEl={anchorEl} handleCloseActionsMenu={handleCloseResourceActionListMenu} />
  ) : null;
};
