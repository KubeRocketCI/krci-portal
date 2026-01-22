import React from "react";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useStore } from "@tanstack/react-form";
import { useCodebaseCRUD } from "@/k8s/api/groups/KRCI/Codebase";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { dialogName } from "../constants";
import { useEditCodebaseForm } from "../providers/form/hooks";

interface FormActionsProps {
  isProtected?: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({ isProtected }) => {
  const { closeDialog } = useDialogContext();
  const form = useEditCodebaseForm();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);

  const handleClose = React.useCallback(() => {
    closeDialog(dialogName);
    form.reset();
  }, [closeDialog, form]);

  const {
    mutations: { codebasePatchMutation },
  } = useCodebaseCRUD();

  const isPending = codebasePatchMutation.isPending || isSubmitting;

  const handleReset = React.useCallback(() => {
    form.reset();
  }, [form]);

  const isApplyDisabled = isProtected || !isDirty || isPending || !canSubmit;

  const applyButton = (
    <Button onClick={() => form.handleSubmit()} variant="default" size="sm" disabled={isApplyDisabled}>
      Apply
    </Button>
  );

  return (
    <div className="flex w-full justify-between gap-2">
      <div className="flex gap-1">
        <Button onClick={handleClose} variant="ghost" size="sm">
          Cancel
        </Button>
        <Button onClick={handleReset} variant="ghost" size="sm" disabled={!isDirty || isProtected}>
          Undo Changes
        </Button>
      </div>
      {isProtected ? (
        <Tooltip title="This resource is protected from updates.">
          <div>{applyButton}</div>
        </Tooltip>
      ) : (
        applyButton
      )}
    </div>
  );
};
