import { ActionsInlineList } from "@/core/components/ActionsInlineList";
import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useCDPipelinePermissions } from "@/k8s/api/groups/KRCI/CDPipeline";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { createResourceAction } from "@/core/utils/createResourceAction";
import { Pencil, Trash } from "lucide-react";
import { CDPipelineActionsMenuProps } from "./types";
import { ManageCDPipelineDialog } from "../../dialogs/ManageCDPipeline";
import { actionMenuType } from "@/k8s/constants/actionMenuTypes";
import { k8sCDPipelineConfig, k8sOperation } from "@my-project/shared";
import React from "react";

export const CDPipelineActionsMenu = ({
  backRoute,
  variant,
  data: { CDPipeline },
}: CDPipelineActionsMenuProps) => {
  const openManageCDPipelineDialog = useDialogOpener(ManageCDPipelineDialog);
  const openDeleteKubeObjectDialog = useDialogOpener(DeleteKubeObjectDialog);
  const cdPipelinePermissions = useCDPipelinePermissions();

  const actions = React.useMemo(() => {
    if (!CDPipeline) {
      return [];
    }

    return [
      createResourceAction({
        type: k8sOperation.patch,
        label: capitalizeFirstLetter(k8sOperation.patch),
        item: CDPipeline,
        Icon: <Pencil size={16} />,
        disabled: {
          status: !cdPipelinePermissions.data.patch.allowed,
          reason: cdPipelinePermissions.data.patch.reason,
        },
        callback: () => {
          openManageCDPipelineDialog({ CDPipeline });
        },
      }),
      createResourceAction({
        type: k8sOperation.delete,
        label: capitalizeFirstLetter(k8sOperation.delete),
        item: CDPipeline,
        Icon: <Trash size={16} />,
        disabled: {
          status: !cdPipelinePermissions.data.delete.allowed,
          reason: cdPipelinePermissions.data.delete.reason,
        },
        callback: () => {
          openDeleteKubeObjectDialog({
            objectName: CDPipeline?.metadata.name,
            resourceConfig: k8sCDPipelineConfig,
            resource: CDPipeline,
            description: `Confirm the deletion of the Deployment Flow with all its environments.`,
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
    cdPipelinePermissions.data.patch.allowed,
    cdPipelinePermissions.data.patch.reason,
    cdPipelinePermissions.data.delete.allowed,
    cdPipelinePermissions.data.delete.reason,
    variant,
    openManageCDPipelineDialog,
    openDeleteKubeObjectDialog,
    backRoute,
  ]);

  return variant === actionMenuType.inline ? (
    <ActionsInlineList actions={actions} />
  ) : variant === actionMenuType.menu ? (
    <ActionsMenuList actions={actions} />
  ) : null;
};
