import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { useStore } from "@tanstack/react-form";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { FORM_MODES } from "@/core/types/forms";
import { useDataContext } from "../../providers/Data/hooks";
import { RotateCcw } from "lucide-react";
import { ConfirmResourcesUpdatesDialog } from "@/core/components/dialogs/ConfirmResourcesUpdates";
import { containerRegistryType } from "@my-project/shared";
import { useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import { useManageRegistryForm } from "../../providers/form/hooks";
import { useResetRegistry } from "../../hooks/useResetRegistry";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { NAMES } from "../../schema";

export const Actions = ({ handleCloseCreateDialog }: { handleCloseCreateDialog: (() => void) | undefined }) => {
  const form = useManageRegistryForm();
  const { EDPConfigMap, pushAccountSecret, pullAccountSecret, tektonServiceAccount } = useDataContext();

  const { resetRegistry, isLoading: isResetting } = useResetRegistry({
    EDPConfigMap,
    pushAccountSecret,
    pullAccountSecret,
    tektonServiceAccount,
    onSuccess: () => {
      form.reset();
    },
  });

  const secretPermissions = useSecretPermissions();

  // Subscribe to form state
  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const registryType = useStore(form.store, (state) => state.values[NAMES.REGISTRY_TYPE]);

  const someOfTheSecretsHasExternalOwner = React.useMemo(() => {
    switch (registryType) {
      case containerRegistryType.ecr:
        return !!pushAccountSecret?.metadata?.ownerReferences;
      default:
        return !!pushAccountSecret?.metadata?.ownerReferences || !!pullAccountSecret?.metadata?.ownerReferences;
    }
  }, [registryType, pushAccountSecret?.metadata?.ownerReferences, pullAccountSecret?.metadata?.ownerReferences]);

  const { setDialog } = useDialogContext();

  const canReset = !someOfTheSecretsHasExternalOwner && secretPermissions.data.delete.allowed;

  const deleteDisabledTooltip = someOfTheSecretsHasExternalOwner
    ? "Some of the secrets has external owners. Please, delete it by your own."
    : secretPermissions.data.delete.reason;

  const mode = registryType ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

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
              variant="default"
              size="sm"
              className="pointer-events-auto"
              onClick={() => {
                setDialog(ConfirmResourcesUpdatesDialog, {
                  deleteCallback: () => {
                    resetRegistry();
                  },
                  text: "Are you sure you want to reset the registry?",
                  resourcesArray: [],
                });
              }}
              disabled={!registryType || someOfTheSecretsHasExternalOwner}
            >
              <RotateCcw size={16} />
              Reset Registry
            </Button>
          </ConditionalWrapper>
        ) : (
          <Button onClick={handleCloseCreateDialog} variant="ghost" size="sm">
            Cancel
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty}>
          Undo Changes
        </Button>
        <Button onClick={handleSubmit} size="sm" variant="default" disabled={!isDirty || isSubmitting || isResetting}>
          Save
        </Button>
      </div>
    </div>
  );
};
