import { useStageCRUD } from "@/k8s/api/groups/KRCI/Stage";
import { Button } from "@/core/components/ui/button";
import React from "react";
import { useStore } from "@tanstack/react-form";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { useStageForm } from "../../../../providers/form/hooks";

export const FormActions = () => {
  const {
    state: { closeDialog },
  } = useCurrentDialog();

  const form = useStageForm();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);

  const handleClose = React.useCallback(() => {
    closeDialog();
    form.reset();
  }, [closeDialog, form]);

  const handleResetFields = React.useCallback(() => {
    form.reset();
  }, [form]);

  const {
    mutations: { stageEditMutation },
  } = useStageCRUD();

  const isPending = stageEditMutation.isPending || isSubmitting;

  return (
    <div className="flex w-full flex-row justify-between gap-4">
      <div className="flex flex-row gap-2">
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
        disabled={!isDirty || isPending || !canSubmit}
      >
        Apply
      </Button>
    </div>
  );
};
