import React from "react";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import { k8sSecretConfig, Secret } from "@my-project/shared";
import { Trash } from "lucide-react";

interface DeleteSecretButtonProps {
  secret: Secret;
  ownerReference?: string;
}

export function DeleteSecretButton({ secret, ownerReference }: DeleteSecretButtonProps) {
  const openDeleteKubeObjectDialog = useDialogOpener(DeleteKubeObjectDialog);
  const secretPermissions = useSecretPermissions();
  const canDelete = !ownerReference && secretPermissions.data.delete.allowed;
  const deleteDisabledTooltip = ownerReference
    ? "You cannot delete this integration because the secret has owner references."
    : secretPermissions.data.delete.reason;

  const handleDelete = React.useCallback(() => {
    if (!canDelete || !secret) return;

    openDeleteKubeObjectDialog({
      objectName: secret.metadata.name,
      resourceConfig: k8sSecretConfig,
      resource: secret,
      description: `Confirm the deletion of the integration.`,
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
  }, [canDelete, openDeleteKubeObjectDialog, secret]);

  return (
    <ConditionalWrapper
      condition={!canDelete}
      wrapper={(children) => (
        <Tooltip title={deleteDisabledTooltip}>
          <div>{children}</div>
        </Tooltip>
      )}
    >
      <Button
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        disabled={!canDelete}
        aria-label="Delete"
        size="sm"
      >
        <Trash size={16} />
        Delete
      </Button>
    </ConditionalWrapper>
  );
}
