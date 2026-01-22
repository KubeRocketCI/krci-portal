import { Button } from "@/core/components/ui/button";
import React from "react";
import { useQuickLinkForm } from "../../../../providers/form/hooks";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { useQuickLinkCRUD } from "@/k8s/api/groups/KRCI/QuickLink";
import { useStore } from "@tanstack/react-form";

export const FormActions = () => {
  const {
    state: { closeDialog },
  } = useCurrentDialog();

  const form = useQuickLinkForm();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);

  const {
    mutations: { quickLinkCreateMutation },
  } = useQuickLinkCRUD();

  const isLoading = quickLinkCreateMutation.isPending || isSubmitting;

  const handleClose = React.useCallback(() => {
    closeDialog();
    form.reset();
  }, [closeDialog, form]);

  const handleResetFields = React.useCallback(() => {
    form.reset();
  }, [form]);

  return (
    <div className="flex w-full justify-between gap-2">
      <div className="flex gap-1">
        <Button onClick={handleClose} variant="ghost" size="sm">
          Cancel
        </Button>
        <Button onClick={handleResetFields} variant="ghost" size="sm" disabled={!isDirty}>
          Undo Changes
        </Button>
      </div>
      <Button
        onClick={() => form.handleSubmit()}
        variant="default"
        size="sm"
        disabled={!isDirty || isLoading || !canSubmit}
      >
        Create
      </Button>
    </div>
  );
};
