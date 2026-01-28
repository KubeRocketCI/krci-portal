import { useCodebaseBranchCRUD } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { Button } from "@/core/components/ui/button";
import React from "react";
import { useCreateCodebaseBranchForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";
import { NAMES } from "../../constants";

interface FormActionsProps {
  onClose: () => void;
}

export const FormActions = ({ onClose }: FormActionsProps) => {
  const form = useCreateCodebaseBranchForm();
  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const handleResetFields = React.useCallback(() => {
    form.reset();
  }, [form]);

  const {
    mutations: { codebaseBranchCreateMutation, codebaseBranchEditMutation },
  } = useCodebaseBranchCRUD();

  const isPending = React.useMemo(
    () => codebaseBranchCreateMutation.isPending || codebaseBranchEditMutation.isPending || isSubmitting,
    [codebaseBranchCreateMutation.isPending, codebaseBranchEditMutation.isPending, isSubmitting]
  );

  const handleSubmit = React.useCallback(async () => {
    const allFieldNames = [
      NAMES.NAME,
      NAMES.CODEBASE_NAME_LABEL,
      NAMES.CODEBASE_NAME,
      NAMES.FROM_TYPE,
      NAMES.FROM_COMMIT,
      NAMES.RELEASE,
      NAMES.VERSION,
      NAMES.RELEASE_BRANCH_VERSION_START,
      NAMES.RELEASE_BRANCH_VERSION_POSTFIX,
      NAMES.DEFAULT_BRANCH_VERSION_START,
      NAMES.DEFAULT_BRANCH_VERSION_POSTFIX,
      NAMES.BUILD_PIPELINE,
      NAMES.REVIEW_PIPELINE,
      NAMES.SECURITY_PIPELINE,
      NAMES.BRANCH_NAME,
      NAMES.RELEASE_BRANCH_NAME,
    ];

    for (const fieldName of allFieldNames) {
      form.setFieldMeta(fieldName, (prev) => ({ ...prev, isTouched: true }));
    }

    await form.validate("change");

    let hasErrors = false;
    for (const fieldName of allFieldNames) {
      const fieldMeta = form.getFieldMeta(fieldName);
      const fieldErrors = fieldMeta?.errors || [];
      if (fieldErrors.length > 0) {
        hasErrors = true;
        break;
      }
    }

    if (!hasErrors) {
      form.handleSubmit();
    }
  }, [form]);

  return (
    <div className="flex w-full justify-between">
      <div className="flex gap-1">
        <Button onClick={onClose} variant="ghost" size="sm">
          Cancel
        </Button>
        <Button onClick={handleResetFields} variant="ghost" size="sm" disabled={!isDirty}>
          Undo Changes
        </Button>
      </div>
      <Button onClick={handleSubmit} variant="default" size="sm" disabled={isPending}>
        Create
      </Button>
    </div>
  );
};
