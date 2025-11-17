import { useCodebaseBranchCRUD } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { Button } from "@/core/components/ui/button";
import { editCodebaseBranchObject } from "@my-project/shared";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { ManageCodebaseBranchFormValues } from "../../../../types";

export const FormActions = () => {
  const {
    props: { codebaseBranch },
    state: { closeDialog },
  } = useCurrentDialog();

  const {
    reset,
    formState: { isDirty },
    handleSubmit,
  } = useTypedFormContext();

  const handleClose = React.useCallback(() => {
    closeDialog();
    reset();
  }, [closeDialog, reset]);

  const handleResetFields = React.useCallback(() => {
    reset();
  }, [reset]);

  const {
    triggerEditCodebaseBranch,
    mutations: { codebaseBranchEditMutation },
  } = useCodebaseBranchCRUD();

  const isPending = React.useMemo(() => codebaseBranchEditMutation.isPending, [codebaseBranchEditMutation.isPending]);

  const onSubmit = React.useCallback(
    async (values: ManageCodebaseBranchFormValues) => {
      if (!codebaseBranch) {
        return;
      }

      const newCodebaseBranch = editCodebaseBranchObject(codebaseBranch, {
        pipelines: {
          build: values.buildPipeline,
          review: values.reviewPipeline,
        },
      });

      await triggerEditCodebaseBranch({
        data: { codebaseBranch: newCodebaseBranch },
        callbacks: { onSuccess: handleClose },
      });
    },
    [codebaseBranch, handleClose, triggerEditCodebaseBranch]
  );

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
      <Button onClick={handleSubmit(onSubmit)} variant="default" size="sm" disabled={!isDirty || isPending}>
        Apply
      </Button>
    </div>
  );
};
