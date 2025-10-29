import { Button, Tooltip } from "@mui/material";
import React from "react";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { useRegistryFormsContext } from "../../hooks/useRegistryFormsContext";
import { useResetRegistry } from "../../hooks/useResetRegistry";
import { SHARED_FORM_NAMES } from "../../names";
import { useDataContext } from "../../providers/Data/hooks";
import { RotateCcw } from "lucide-react";
import { ConfirmResourcesUpdatesDialog } from "@/core/components/dialogs/ConfirmResourcesUpdates";
import { containerRegistryType } from "@my-project/shared";
import { useSecretPermissions } from "@/k8s/api/groups/Core/Secret";

export const Actions = ({ handleCloseCreateDialog }: { handleCloseCreateDialog: (() => void) | undefined }) => {
  const { forms, resetAll, submitAll, isAnyFormDirty, isAnyFormSubmitting, isAnyFormForbiddenToSubmit, sharedForm } =
    useRegistryFormsContext();

  const { EDPConfigMap, pushAccountSecret, pullAccountSecret, tektonServiceAccount } = useDataContext();

  const { resetRegistry, isLoading: isResetting } = useResetRegistry({
    EDPConfigMap,
    pushAccountSecret,
    pullAccountSecret,
    tektonServiceAccount,
    onSuccess: () => {
      resetAll();
    },
  });

  const secretPermissions = useSecretPermissions();

  const registryType = sharedForm.watch(SHARED_FORM_NAMES.REGISTRY_TYPE);

  const someOfTheSecretsHasExternalOwner = React.useMemo(() => {
    switch (registryType) {
      case containerRegistryType.ecr:
        return !!pushAccountSecret?.metadata?.ownerReferences;
      default:
        return !!pushAccountSecret?.metadata?.ownerReferences || !!pullAccountSecret?.metadata?.ownerReferences;
    }
  }, [registryType, pushAccountSecret?.metadata?.ownerReferences, pullAccountSecret?.metadata?.ownerReferences]);

  const { setDialog } = useDialogContext();

  const submitDisabledTooltip = isAnyFormForbiddenToSubmit
    ? Object.values(forms).find((form) => !form.allowedToSubmit.isAllowed)?.allowedToSubmit.reason
    : "";

  const canReset = !someOfTheSecretsHasExternalOwner && secretPermissions.data.delete.allowed;

  const deleteDisabledTooltip = someOfTheSecretsHasExternalOwner
    ? "Some of the secrets has external owners. Please, delete it by your own."
    : secretPermissions.data.delete.reason;

  const mode = registryType ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  return (
    <div className="flex justify-between gap-2">
      <div className="mr-auto">
        {mode === FORM_MODES.EDIT ? (
          <ConditionalWrapper
            condition={!canReset}
            wrapper={(children) => {
              return <Tooltip title={deleteDisabledTooltip}>{children}</Tooltip>;
            }}
          >
            <Button
              variant="contained"
              size="small"
              color="primary"
              style={{ pointerEvents: "auto" }}
              onClick={() => {
                setDialog(ConfirmResourcesUpdatesDialog, {
                  deleteCallback: () => {
                    resetRegistry();
                  },
                  text: "Are you sure you want to reset the registry?",
                  resourcesArray: [],
                });
              }}
              startIcon={<RotateCcw size={16} />}
              disabled={!registryType || someOfTheSecretsHasExternalOwner}
            >
              Reset registry
            </Button>
          </ConditionalWrapper>
        ) : (
          <Button onClick={handleCloseCreateDialog} size="small" color="inherit">
            cancel
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            resetAll();
            sharedForm.reset();
          }}
          size="small"
          component={"button"}
          disabled={!isAnyFormDirty}
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
            onClick={async () => {
              const success = await submitAll(true);
              if (success && handleCloseCreateDialog) {
                handleCloseCreateDialog();
              }
            }}
            size={"small"}
            component={"button"}
            variant={"contained"}
            color={"primary"}
            disabled={!isAnyFormDirty || isAnyFormSubmitting || isResetting || isAnyFormForbiddenToSubmit}
          >
            save
          </Button>
        </ConditionalWrapper>
      </div>
    </div>
  );
};
