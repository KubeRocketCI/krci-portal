import { Button, IconButton, Stack, Tooltip } from "@mui/material";
import React from "react";
import { useFormsContext } from "../../hooks/useFormsContext";
import { useDataContext } from "../../providers/Data/hooks";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { k8sSecretConfig } from "@my-project/shared";
import { FORM_MODES } from "@/core/types/forms";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { Trash } from "lucide-react";
import { useSecretPermissions } from "@/k8s/api/groups/Core/Secret";

export const Actions = () => {
  const { forms, resetAll, submitAll, isAnyFormDirty, isAnyFormSubmitting, isAnyFormForbiddenToSubmit } =
    useFormsContext();

  const { secret, ownerReference, handleClosePanel } = useDataContext();

  const openDeleteKubeObjectDialog = useDialogOpener(DeleteKubeObjectDialog);

  const secretPermissions = useSecretPermissions();

  const canDelete = !ownerReference && secretPermissions.data.delete.allowed;

  const deleteDisabledTooltip = ownerReference
    ? "You cannot delete this integration because the secret has owner references."
    : secretPermissions.data.delete.reason;

  const submitDisabledTooltip = isAnyFormForbiddenToSubmit
    ? Object.values(forms).find((form) => !form.allowedToSubmit.isAllowed)?.allowedToSubmit.reason
    : "";

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
        onMutate: {
          message: `${item.metadata.name} has been marked for deletion`,
        },
        onError: {
          message: `Failed to initiate ${item.metadata.name}'s deletion`,
        },
        onSuccess: {
          message: "The deletion process has been started",
        },
      }),
    });
  }, [canDelete, openDeleteKubeObjectDialog, secret]);

  const mode = secret ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ justifyContent: "space-between" }}>
      {mode === FORM_MODES.EDIT ? (
        <ConditionalWrapper
          condition={!canDelete}
          wrapper={(children) => (
            <Tooltip title={deleteDisabledTooltip}>
              <div>{children}</div>
            </Tooltip>
          )}
        >
          <IconButton onClick={handleDelete} disabled={!canDelete} size="large">
            <Trash size={20} />
          </IconButton>
        </ConditionalWrapper>
      ) : (
        <Button onClick={handleClosePanel} size="small" color="inherit">
          cancel
        </Button>
      )}

      <Button
        onClick={resetAll}
        size="small"
        component={"button"}
        disabled={!isAnyFormDirty}
        sx={{ ml: "auto !important" }}
      >
        undo changes
      </Button>
      <ConditionalWrapper
        condition={isAnyFormForbiddenToSubmit}
        wrapper={(children) => (
          <Tooltip title={submitDisabledTooltip}>
            <div>{children}</div>
          </Tooltip>
        )}
      >
        <Button
          onClick={() => submitAll(true)}
          size={"small"}
          component={"button"}
          variant={"contained"}
          color={"primary"}
          disabled={!isAnyFormDirty || isAnyFormSubmitting || isAnyFormForbiddenToSubmit}
        >
          save
        </Button>
      </ConditionalWrapper>
    </Stack>
  );
};
