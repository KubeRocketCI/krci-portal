import { useCodebaseBranchCRUD } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { useEditCodebaseBranchForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";

interface FormActionsProps {
  isProtected?: boolean;
  onClose: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({ isProtected, onClose }) => {
  const form = useEditCodebaseBranchForm();
  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const handleClose = React.useCallback(() => {
    onClose();
    form.reset();
  }, [onClose, form]);

  const {
    mutations: { codebaseBranchEditMutation },
  } = useCodebaseBranchCRUD();

  const isPending = codebaseBranchEditMutation.isPending || isSubmitting;

  const isApplyDisabled = isProtected || !isDirty || isPending;

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
        <Button onClick={() => form.reset()} variant="ghost" size="sm" disabled={!isDirty || isProtected}>
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
