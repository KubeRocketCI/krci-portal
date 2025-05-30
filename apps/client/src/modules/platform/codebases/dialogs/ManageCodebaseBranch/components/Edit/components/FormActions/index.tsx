import { useCodebaseBranchCRUD } from "@/core/k8s/api/groups/KRCI/CodebaseBranch";
import { Box, Button, Stack, useTheme } from "@mui/material";
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
    editCodebaseBranch,
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

      await editCodebaseBranch({ codebaseBranch: newCodebaseBranch });
    },
    [codebaseBranch, editCodebaseBranch]
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
        apply
      </Button>
    </Stack>
  );
};
