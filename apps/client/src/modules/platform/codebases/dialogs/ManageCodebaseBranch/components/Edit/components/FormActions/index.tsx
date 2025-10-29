import { useCodebaseBranchCRUD } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { Button, useTheme } from "@mui/material";
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
  } = useCodebaseBranchCRUD({
    onSuccess: handleClose,
  });

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

      await triggerEditCodebaseBranch({ codebaseBranch: newCodebaseBranch });
    },
    [codebaseBranch, triggerEditCodebaseBranch]
  );

  const theme = useTheme();

  return (
    <div className="flex justify-between w-full gap-2">
      <div className="flex gap-1">
        <div className="text-foreground">
          <Button onClick={handleClose} size="small" color="inherit">
            cancel
          </Button>
        </div>
        <Button onClick={handleResetFields} size="small" disabled={!isDirty}>
          undo changes
        </Button>
      </div>
      <Button
        onClick={handleSubmit(onSubmit)}
        variant={"contained"}
        color={"primary"}
        size="small"
        disabled={!isDirty || isPending}
      >
        apply
      </Button>
    </div>
  );
};
