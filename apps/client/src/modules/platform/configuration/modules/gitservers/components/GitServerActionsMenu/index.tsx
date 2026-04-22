import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { createResourceAction, getResourceProtection, getDisabledState } from "@/core/utils/createResourceAction";
import { useGitServerPermissions } from "@/k8s/api/groups/KRCI/GitServer";
import type { GitServer } from "@my-project/shared";
import { k8sGitServerConfig, k8sOperation } from "@my-project/shared";
import { Settings, Trash } from "lucide-react";
import React from "react";

interface GitServerActionsMenuProps {
  gitServer: GitServer;
  onEdit: () => void;
  ownerReference: string | undefined;
}

export const GitServerActionsMenu = ({ gitServer, ownerReference, onEdit }: GitServerActionsMenuProps) => {
  const gitServerPermissions = useGitServerPermissions();
  const { setDialog } = useDialogContext();

  const patchProtection = getResourceProtection(gitServer, k8sOperation.update);
  const deleteProtection = getResourceProtection(gitServer, k8sOperation.delete);

  const actions = React.useMemo(() => {
    if (!gitServer) {
      return [];
    }

    // Check if resource has owner references
    const hasOwnerReference = !!ownerReference;
    const ownerReferenceReason = "You cannot perform this action because the Git Server has owner references.";

    // Compute disabled state for Edit action
    const editDisabled = hasOwnerReference
      ? { status: true, reason: ownerReferenceReason }
      : getDisabledState(patchProtection, gitServerPermissions.data.update);

    // Compute disabled state for Delete action
    const deleteDisabled = hasOwnerReference
      ? { status: true, reason: ownerReferenceReason }
      : getDisabledState(deleteProtection, gitServerPermissions.data.delete);

    return [
      createResourceAction({
        type: k8sOperation.update,
        label: "Edit",
        item: gitServer,
        Icon: <Settings size={16} />,
        disabled: editDisabled,
        callback: () => {
          onEdit();
        },
      }),
      createResourceAction({
        type: k8sOperation.delete,
        label: "Delete",
        item: gitServer,
        Icon: <Trash size={16} />,
        disabled: deleteDisabled,
        callback: (gitServer) => {
          setDialog(DeleteKubeObjectDialog, {
            objectName: gitServer.metadata.name,
            resource: gitServer,
            resourceConfig: k8sGitServerConfig,
            description: "Confirm the deletion of the Git Server.",
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
    gitServer,
    ownerReference,
    patchProtection,
    deleteProtection,
    gitServerPermissions.data.update,
    gitServerPermissions.data.delete,
    onEdit,
    setDialog,
  ]);

  return <ActionsMenuList actions={actions} />;
};
