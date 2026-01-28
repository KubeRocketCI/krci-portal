import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { useDataContext } from "../../providers/Data/hooks";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import { k8sSecretConfig } from "@my-project/shared";
import { FORM_MODES } from "@/core/types/forms";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { Trash } from "lucide-react";
import { useManageJiraServerForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";

export const Actions = () => {
  const form = useManageJiraServerForm();
  const { secret, ownerReference, handleClosePanel } = useDataContext();

  const openDeleteKubeObjectDialog = useDialogOpener(DeleteKubeObjectDialog);
  const secretPermissions = useSecretPermissions();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const canDelete = !ownerReference && secretPermissions.data.delete.allowed;

  const deleteDisabledTooltip = ownerReference
    ? "You cannot delete this integration because the secret has owner references."
    : secretPermissions.data.delete.reason;

  const handleDelete = React.useCallback(() => {
    if (!canDelete || !secret) {
      return;
    }

    openDeleteKubeObjectDialog({
      objectName: secret?.metadata.name,
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

  const mode = secret ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <div className="flex items-center justify-between gap-2">
      {mode === FORM_MODES.EDIT ? (
        <ConditionalWrapper
          condition={!canDelete}
          wrapper={(children) => (
            <Tooltip title={deleteDisabledTooltip}>
              <div>{children}</div>
            </Tooltip>
          )}
        >
          <Button variant="ghost" size="icon" onClick={handleDelete} disabled={!canDelete} aria-label="Delete">
            <Trash size={20} />
          </Button>
        </ConditionalWrapper>
      ) : (
        <Button onClick={handleClosePanel} variant="ghost" size="sm">
          Cancel
        </Button>
      )}

      <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty} className="ml-auto">
        Undo Changes
      </Button>
      <Button onClick={handleSubmit} size="sm" variant="default" disabled={!isDirty || isSubmitting}>
        Save
      </Button>
    </div>
  );
};
