import { useStageCRUD } from "@/k8s/api/groups/KRCI/Stage";
import { Button } from "@/core/components/ui/button";
import React from "react";
import { useEditStageForm } from "../providers/form/hooks";
import { useEditStageData } from "../providers/data/hooks";
import { useStore } from "@tanstack/react-form";

export const FormActions: React.FC = () => {
  const form = useEditStageForm();
  const { closeDialog } = useEditStageData();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);

  const {
    mutations: { stageEditMutation },
  } = useStageCRUD();

  const isPending = stageEditMutation.isPending || isSubmitting;

  const handleResetFields = React.useCallback(() => {
    form.reset();
  }, [form]);

  const handleClose = React.useCallback(() => {
    closeDialog();
    form.reset();
  }, [closeDialog, form]);

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
        disabled={!isDirty || !canSubmit || isPending}
      >
        Apply
      </Button>
    </div>
  );
};
