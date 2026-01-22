import { useCodebaseBranchCRUD } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { editCodebaseBranchObject } from "@my-project/shared";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { ManageCodebaseBranchFormValues } from "../../../../types";

export const FormActions = () => {
  const {
    props: { codebaseBranch, isProtected },
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

  const {
    triggerEditCodebaseBranch,
    mutations: { codebaseBranchEditMutation },
  } = useCodebaseBranchCRUD();

  const isPending = codebaseBranchEditMutation.isPending;

  const onSubmit = React.useCallback(
    async (values: ManageCodebaseBranchFormValues) => {
      if (!codebaseBranch) {
        return;
      }

      const newCodebaseBranch = editCodebaseBranchObject(codebaseBranch, {
        pipelines: {
          build: values.buildPipeline,
          review: values.reviewPipeline,
          ...(values.securityPipeline && { security: values.securityPipeline }),
        },
      });

      await triggerEditCodebaseBranch({
        data: { codebaseBranch: newCodebaseBranch },
        callbacks: { onSuccess: handleClose },
      });
    },
    [codebaseBranch, handleClose, triggerEditCodebaseBranch]
  );

  const isApplyDisabled = isProtected || !isDirty || isPending;

  const applyButton = (
    <Button onClick={handleSubmit(onSubmit)} variant="default" size="sm" disabled={isApplyDisabled}>
      Apply
    </Button>
  );

  return (
    <div className="flex w-full justify-between gap-2">
      <div className="flex gap-1">
        <Button onClick={handleClose} variant="ghost" size="sm">
          Cancel
        </Button>
        <Button onClick={() => reset()} variant="ghost" size="sm" disabled={!isDirty || isProtected}>
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
