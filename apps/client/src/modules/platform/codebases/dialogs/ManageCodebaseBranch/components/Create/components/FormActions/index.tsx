import { useCodebaseBranchCRUD } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { Button } from "@/core/components/ui/button";
import React from "react";
import { useCodebaseBranchForm } from "../../../../providers/form/hooks";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { useStore } from "@tanstack/react-form";
import { NAMES } from "../../../../names";

export const FormActions = () => {
  const {
    state: { closeDialog },
  } = useCurrentDialog();

  const form = useCodebaseBranchForm();
  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const handleResetFields = React.useCallback(() => {
    form.reset();
  }, [form]);

  const handleClose = React.useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const {
    mutations: { codebaseBranchCreateMutation, codebaseBranchEditMutation },
  } = useCodebaseBranchCRUD();

  const isPending = React.useMemo(
    () => codebaseBranchCreateMutation.isPending || codebaseBranchEditMutation.isPending || isSubmitting,
    [codebaseBranchCreateMutation.isPending, codebaseBranchEditMutation.isPending, isSubmitting]
  );

  const handleSubmit = React.useCallback(async () => {
    // Get all field names from the schema
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

    // Mark all fields as touched to ensure errors are displayed
    for (const fieldName of allFieldNames) {
      form.setFieldMeta(fieldName, (prev) => ({ ...prev, isTouched: true }));
    }

    // Validate all fields
    await form.validate("change");

    // Check if there are any errors
    let hasErrors = false;
    for (const fieldName of allFieldNames) {
      const fieldMeta = form.getFieldMeta(fieldName);
      const fieldErrors = fieldMeta?.errors || [];

      if (fieldErrors.length > 0) {
        hasErrors = true;
        break;
      }
    }

    // Only submit if there are no errors
    if (!hasErrors) {
      form.handleSubmit();
    }
  }, [form]);

  return (
    <div className="flex w-full justify-between">
      <div className="flex gap-1">
        <Button onClick={handleClose} variant="ghost" size="sm">
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
