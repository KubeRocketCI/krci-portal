import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { createResourceAction, getResourceProtection, getDisabledState } from "@/core/utils/createResourceAction";
import { useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import type { Secret } from "@my-project/shared";
import { k8sSecretConfig, k8sOperation } from "@my-project/shared";
import { Settings, Trash } from "lucide-react";
import React from "react";

interface ClusterActionsMenuProps {
  clusterSecret: Secret;
  ownerReference: string | undefined;
  onEdit: () => void;
}

export const ClusterActionsMenu = ({ clusterSecret, ownerReference, onEdit }: ClusterActionsMenuProps) => {
  const secretPermissions = useSecretPermissions();
  const { setDialog } = useDialogContext();

  const patchProtection = getResourceProtection(clusterSecret, k8sOperation.update);
  const deleteProtection = getResourceProtection(clusterSecret, k8sOperation.delete);

  const actions = React.useMemo(() => {
    if (!clusterSecret) {
      return [];
    }

    // Check if resource has owner references
    const hasOwnerReference = !!ownerReference;
    const ownerReferenceReason = "You cannot perform this action because the secret has owner references.";

    // Compute disabled state for Edit action
    const editDisabled = hasOwnerReference
      ? { status: true, reason: ownerReferenceReason }
      : getDisabledState(patchProtection, secretPermissions.data.update);

    // Compute disabled state for Delete action
    const deleteDisabled = hasOwnerReference
      ? { status: true, reason: ownerReferenceReason }
      : getDisabledState(deleteProtection, secretPermissions.data.delete);

    return [
      createResourceAction({
        type: k8sOperation.update,
        label: "Edit",
        item: clusterSecret,
        Icon: <Settings size={16} />,
        disabled: editDisabled,
        callback: () => {
          onEdit();
        },
      }),
      createResourceAction({
        type: k8sOperation.delete,
        label: "Delete",
        item: clusterSecret,
        Icon: <Trash size={16} />,
        disabled: deleteDisabled,
        callback: (clusterSecret) => {
          setDialog(DeleteKubeObjectDialog, {
            objectName: clusterSecret.metadata.name,
            resource: clusterSecret,
            resourceConfig: k8sSecretConfig,
            description: "Confirm the deletion of the cluster secret.",
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
    clusterSecret,
    ownerReference,
    patchProtection,
    deleteProtection,
    secretPermissions.data.update,
    secretPermissions.data.delete,
    onEdit,
    setDialog,
  ]);

  return <ActionsMenuList actions={actions} />;
};
