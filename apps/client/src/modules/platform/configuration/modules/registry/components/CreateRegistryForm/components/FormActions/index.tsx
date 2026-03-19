import { Button } from "@/core/components/ui/button";
import React from "react";
import { useCreateRegistryForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";

export interface FormActionsProps {
  onClose: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({ onClose }) => {
  const form = useCreateRegistryForm();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <div className="flex w-full justify-between gap-2">
      <div className="flex gap-2">
        <Button onClick={onClose} variant="ghost" size="sm">
          Cancel
        </Button>
        <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty}>
          Undo Changes
        </Button>
      </div>
      <Button onClick={handleSubmit} size="sm" variant="default" disabled={!isDirty || isSubmitting}>
        Save
      </Button>
    </div>
  );
};
