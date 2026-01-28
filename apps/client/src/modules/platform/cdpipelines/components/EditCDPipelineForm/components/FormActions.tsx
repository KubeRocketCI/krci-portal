import React from "react";
import { Button } from "@/core/components/ui/button";
import { useCDPipelineCRUD } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useStore } from "@tanstack/react-form";
import { useEditCDPipelineForm } from "../providers/form/hooks";

interface FormActionsProps {
  onClose: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({ onClose }) => {
  const form = useEditCDPipelineForm();

  // Type-safe selectors using the properly typed form
  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);

  const {
    mutations: { cdPipelineEditMutation },
  } = useCDPipelineCRUD();

  const isPending = cdPipelineEditMutation.isPending || isSubmitting;

  const handleResetFields = React.useCallback(() => {
    form.reset();
  }, [form]);

  const handleClose = React.useCallback(() => {
    onClose();
    form.reset();
  }, [onClose, form]);

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
        variant="default"
        size="sm"
        disabled={!isDirty || !canSubmit || isPending}
        onClick={() => form.handleSubmit()}
      >
        Apply
      </Button>
    </div>
  );
};
