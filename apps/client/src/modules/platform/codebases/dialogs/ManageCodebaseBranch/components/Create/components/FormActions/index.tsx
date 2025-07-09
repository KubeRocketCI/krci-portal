import { useCodebaseBranchCRUD } from "@/core/k8s/api/groups/KRCI/CodebaseBranch";
import { Box, Button, Stack, useTheme } from "@mui/material";
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

  const handleClose = () => closeDialog();

  const {
    triggerCreateCodebaseBranch,
    mutations: { codebaseBranchCreateMutation, codebaseBranchEditMutation },
  } = useCodebaseBranchCRUD({
    onSuccess: handleClose,
  });

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
          codebaseBranch: newCodebaseBranch,
          defaultCodebaseBranch: newDefaultCodebaseBranch,
        });
      } else {
        await triggerCreateCodebaseBranch({
          codebaseBranch: newCodebaseBranch,
        });
      }
      reset();
    },
    [codebase.metadata.name, reset, defaultBranch, triggerCreateCodebaseBranch]
  );

  const theme = useTheme();

  return (
    <Stack direction="row" spacing={2} justifyContent="space-between" width="100%">
      <Stack direction="row" spacing={1}>
        <Box sx={{ color: theme.palette.text.primary }}>
          <Button onClick={handleClose} size="small" color="inherit">
            cancel
          </Button>
        </Box>
        <Button onClick={handleResetFields} size="small" disabled={!isDirty}>
          undo changes
        </Button>
      </Stack>
      <Button
        onClick={handleSubmit(onSubmit)}
        variant={"contained"}
        color={"primary"}
        size="small"
        disabled={!isDirty || isPending}
      >
        create
      </Button>
    </Stack>
  );
};
