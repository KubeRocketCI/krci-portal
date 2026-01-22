import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { useClusterSecretForm } from "../../../../providers/form/hooks";
import { useClusterSecretData } from "../../../../providers/data/hooks";
import { useSecretCRUD, useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { useStore } from "@tanstack/react-form";

export const FormActions = () => {
  const { handleClosePlaceholder } = useClusterSecretData();
  const form = useClusterSecretForm();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);

  const {
    mutations: { secretCreateMutation },
  } = useSecretCRUD();

  const secretPermissions = useSecretPermissions();

  const isLoading = secretCreateMutation.isPending || isSubmitting;

  const handleReset = React.useCallback(() => {
    form.reset();
  }, [form]);

  return (
    <div className="flex justify-between gap-4">
      <div>
        <Button onClick={handleClosePlaceholder} variant="ghost" size="sm">
          Cancel
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={handleReset} size="sm" variant="ghost" disabled={!isDirty}>
          Undo Changes
        </Button>
        <ConditionalWrapper
          condition={!secretPermissions.data.create.allowed}
          wrapper={(children) => (
            <Tooltip title={secretPermissions.data.create.reason}>
              <div>{children}</div>
            </Tooltip>
          )}
        >
          <Button
            type="button"
            size="sm"
            variant="default"
            disabled={isLoading || !isDirty || !secretPermissions.data.create.allowed || !canSubmit}
            onClick={() => form.handleSubmit()}
          >
            Save
          </Button>
        </ConditionalWrapper>
      </div>
    </div>
  );
};
