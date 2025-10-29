import { useCodebaseBranchCRUD } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { Button, useTheme } from "@mui/material";
import {
  createCodebaseBranchDraftObject,
  createVersioningString,
  editDefaultCodebaseBranchObject,
} from "@my-project/shared";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { ManageCodebaseBranchFormValues } from "../../../../types";

export const FormActions = () => {
  const {
    props: { codebase, defaultBranch },
    state: { closeDialog },
  } = useCurrentDialog();

  const {
    reset,
    formState: { isDirty },
    handleSubmit,
  } = useTypedFormContext();

  const handleResetFields = React.useCallback(() => {
    reset();
  }, [reset]);

  const handleClose = React.useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const {
    triggerCreateCodebaseBranch,
    mutations: { codebaseBranchCreateMutation, codebaseBranchEditMutation },
  } = useCodebaseBranchCRUD();

  const isPending = React.useMemo(
    () => codebaseBranchCreateMutation.isPending || codebaseBranchEditMutation.isPending,
    [codebaseBranchCreateMutation.isPending, codebaseBranchEditMutation.isPending]
  );

  const onSubmit = React.useCallback(
    async (formValues: ManageCodebaseBranchFormValues) => {
      const newDefaultBranchVersion = createVersioningString(
        formValues.defaultBranchVersionStart,
        formValues.defaultBranchVersionPostfix
      );

      const newCodebaseBranch = createCodebaseBranchDraftObject({
        branchName: formValues.branchName,
        fromCommit: formValues.fromCommit,
        release: formValues.release,
        codebase: codebase.metadata.name,
        pipelines: {
          build: formValues.buildPipeline,
          review: formValues.reviewPipeline,
        },
        version: formValues.version,
      });

      if (formValues.release) {
        const newDefaultCodebaseBranch = editDefaultCodebaseBranchObject(defaultBranch, {
          version: newDefaultBranchVersion,
        });

        await triggerCreateCodebaseBranch({
          data: {
            codebaseBranch: newCodebaseBranch,
            defaultCodebaseBranch: newDefaultCodebaseBranch,
          },
        });
      } else {
        await triggerCreateCodebaseBranch({
          data: {
            codebaseBranch: newCodebaseBranch,
          },
        });
      }
      reset();
      handleClose();
    },
    [codebase.metadata.name, reset, handleClose, defaultBranch, triggerCreateCodebaseBranch]
  );

  const theme = useTheme();

  return (
    <div className="flex justify-between w-full">
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
        create
      </Button>
    </div>
  );
};
