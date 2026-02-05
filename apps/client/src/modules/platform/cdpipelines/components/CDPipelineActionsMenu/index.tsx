import { ActionsInlineList } from "@/core/components/ActionsInlineList";
import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useCDPipelinePermissions } from "@/k8s/api/groups/KRCI/CDPipeline";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { createResourceAction, getResourceProtection, getDisabledState } from "@/core/utils/createResourceAction";
import { Pencil, Trash } from "lucide-react";
import { CDPipelineActionsMenuProps } from "./types";
import { actionMenuType } from "@/k8s/constants/actionMenuTypes";
import { k8sCDPipelineConfig, k8sOperation } from "@my-project/shared";
import React from "react";
import { EditCDPipelineDialog } from "../EditCDPipelineDialog";

export const CDPipelineActionsMenu = ({ backRoute, variant, data: { CDPipeline } }: CDPipelineActionsMenuProps) => {
  const openEditCDPipelineDialog = useDialogOpener(EditCDPipelineDialog);
  const openDeleteKubeObjectDialog = useDialogOpener(DeleteKubeObjectDialog);
  const cdPipelinePermissions = useCDPipelinePermissions();

  const patchProtection = getResourceProtection(CDPipeline, k8sOperation.patch);
  const deleteProtection = getResourceProtection(CDPipeline, k8sOperation.delete);

  const actions = React.useMemo(() => {
    if (!CDPipeline) {
      return [];
    }

    return [
      createResourceAction({
        type: k8sOperation.patch,
        label: "Edit",
        item: CDPipeline,
        Icon: <Pencil size={16} />,
        disabled: getDisabledState(patchProtection, cdPipelinePermissions.data.patch),
        callback: () => {
          openEditCDPipelineDialog({ CDPipeline });
        },
      }),
      createResourceAction({
        type: k8sOperation.delete,
        label: capitalizeFirstLetter(k8sOperation.delete),
        item: CDPipeline,
        Icon: <Trash size={16} />,
        disabled: getDisabledState(deleteProtection, cdPipelinePermissions.data.delete),
        callback: () => {
          openDeleteKubeObjectDialog({
            objectName: CDPipeline?.metadata.name,
            resourceConfig: k8sCDPipelineConfig,
            resource: CDPipeline,
            description: `Confirm the deletion of the Deployment with all its environments.`,
            backRoute,
            createCustomMessages: (item) => ({
              loading: {
                message: `${item.metadata.name} has been marked for deletion`,
              },
              error: {
                message: `Failed to initiate ${item.metadata.name}'s deletion`,
              },
              success: {
                message: "The deletion process has been started",
              },
            }),
          });
        },
      }),
    ];
  }, [
    CDPipeline,
    cdPipelinePermissions.data.patch,
    cdPipelinePermissions.data.delete,
    deleteProtection,
    openEditCDPipelineDialog,
    openDeleteKubeObjectDialog,
    patchProtection,
    backRoute,
  ]);

  return variant === actionMenuType.inline ? (
    <ActionsInlineList actions={actions} />
  ) : variant === actionMenuType.menu ? (
    <ActionsMenuList actions={actions} />
  ) : null;
};
