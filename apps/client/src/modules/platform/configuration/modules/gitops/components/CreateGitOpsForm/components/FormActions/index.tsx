import { Button } from "@/core/components/ui/button";
import React from "react";
import { useCreateGitOpsForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";
import { useCodebaseCRUD } from "@/k8s/api/groups/KRCI/Codebase";

export interface FormActionsProps {
  onClose: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({ onClose }) => {
  const form = useCreateGitOpsForm();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);

  const {
    mutations: { codebaseCreateMutation, codebaseSecretCreateMutation, codebaseSecretDeleteMutation },
  } = useCodebaseCRUD();

  const isLoading =
    codebaseCreateMutation.isPending ||
    codebaseSecretCreateMutation.isPending ||
    codebaseSecretDeleteMutation.isPending ||
    isSubmitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <div className="flex justify-between gap-2">
      <div className="flex gap-2">
        <Button onClick={onClose} variant="ghost" size="sm">
          Cancel
        </Button>
        <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty}>
          Undo Changes
        </Button>
      </div>
      <Button onClick={handleSubmit} size="sm" variant="default" disabled={isLoading || !canSubmit}>
        Save
      </Button>
    </div>
  );
};
