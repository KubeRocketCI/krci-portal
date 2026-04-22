import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { createResourceAction, getResourceProtection, getDisabledState } from "@/core/utils/createResourceAction";
import { useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import type { Secret } from "@my-project/shared";
import { k8sSecretConfig, k8sOperation } from "@my-project/shared";
import { Settings, Trash } from "lucide-react";
import React from "react";

interface NexusActionsMenuProps {
  secret: Secret;
  onEdit: () => void;
  ownerReference: string | undefined;
}

export const NexusActionsMenu = ({ secret, ownerReference, onEdit }: NexusActionsMenuProps) => {
  const secretPermissions = useSecretPermissions();
  const { setDialog } = useDialogContext();

  const patchProtection = getResourceProtection(secret, k8sOperation.update);
  const deleteProtection = getResourceProtection(secret, k8sOperation.delete);

  const actions = React.useMemo(() => {
    if (!secret) {
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
        item: secret,
        Icon: <Settings size={16} />,
        disabled: editDisabled,
        callback: () => {
          onEdit();
        },
      }),
      createResourceAction({
        type: k8sOperation.delete,
        label: "Delete",
        item: secret,
        Icon: <Trash size={16} />,
        disabled: deleteDisabled,
        callback: (secret) => {
          setDialog(DeleteKubeObjectDialog, {
            objectName: secret.metadata.name,
            resource: secret,
            resourceConfig: k8sSecretConfig,
            description: "Confirm the deletion of the integration.",
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
    secret,
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
