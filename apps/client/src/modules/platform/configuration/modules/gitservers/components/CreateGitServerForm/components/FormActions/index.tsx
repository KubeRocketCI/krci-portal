import { Button } from "@/core/components/ui/button";
import React from "react";
import { useCreateGitServerForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";

export interface FormActionsProps {
  onClose: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({ onClose }) => {
  const form = useCreateGitServerForm();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button onClick={onClose} variant="ghost" size="sm">
        Cancel
      </Button>
      <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty} className="ml-auto">
        Undo Changes
      </Button>
      <Button onClick={handleSubmit} size="sm" variant="default" disabled={!isDirty || isSubmitting}>
        Save
      </Button>
    </div>
  );
};
