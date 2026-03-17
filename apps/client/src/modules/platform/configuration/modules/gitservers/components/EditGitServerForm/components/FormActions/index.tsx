import React from "react";
import { Button } from "@/core/components/ui/button";
import { useEditGitServerForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";

export const FormActions: React.FC = () => {
  const form = useEditGitServerForm();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty}>
        Undo Changes
      </Button>
      <Button onClick={handleSubmit} size="sm" variant="default" disabled={!isDirty || isSubmitting}>
        Save
      </Button>
    </div>
  );
};
