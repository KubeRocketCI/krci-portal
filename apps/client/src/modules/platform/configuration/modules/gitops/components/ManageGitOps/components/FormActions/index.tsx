import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { useGitOpsForm } from "../../providers/form/hooks";
import { useGitOpsData } from "../../providers/data/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { useCodebaseCRUD, useCodebasePermissions } from "@/k8s/api/groups/KRCI/Codebase";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { useStore } from "@tanstack/react-form";

export const FormActions = () => {
  const form = useGitOpsForm();
  const { currentElement, handleClosePlaceholder, isReadOnly } = useGitOpsData();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);

  const isPlaceholder = typeof currentElement === "string" && currentElement === "placeholder";
  const mode = isPlaceholder ? FORM_MODES.CREATE : FORM_MODES.EDIT;

  const {
    mutations: { codebaseCreateMutation, codebaseSecretCreateMutation, codebaseSecretDeleteMutation },
  } = useCodebaseCRUD();

  const codebasePermissions = useCodebasePermissions();

  const isLoading =
    codebaseCreateMutation.isPending ||
    codebaseSecretCreateMutation.isPending ||
    codebaseSecretDeleteMutation.isPending ||
    isSubmitting;

  const handleReset = React.useCallback(() => {
    form.reset();
  }, [form]);

  return (
    <div className="flex justify-between gap-4">
      <div>
        {mode === FORM_MODES.CREATE && (
          <Button onClick={handleClosePlaceholder} variant="ghost" size="sm">
            Cancel
          </Button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={handleReset} size="sm" variant="ghost" disabled={!isDirty || isReadOnly}>
          Undo Changes
        </Button>
        <ConditionalWrapper
          condition={!codebasePermissions.data.create.allowed}
          wrapper={(children) => (
            <Tooltip title={codebasePermissions.data.create.reason}>
              <div>{children}</div>
            </Tooltip>
          )}
        >
          <Button
            type="button"
            size="sm"
            variant="default"
            disabled={isLoading || isReadOnly || !codebasePermissions.data.create.allowed || !canSubmit}
            onClick={() => form.handleSubmit()}
          >
            Save
          </Button>
        </ConditionalWrapper>
      </div>
    </div>
  );
};
