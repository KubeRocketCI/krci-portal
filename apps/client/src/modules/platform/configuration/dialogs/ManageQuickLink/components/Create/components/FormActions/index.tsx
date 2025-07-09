import { Box, Button, Stack, useTheme } from "@mui/material";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { useQuickLinkCRUD } from "@/core/k8s/api/groups/KRCI/QuickLink";
import { ManageQuickLinkFormValues } from "../../../../types";
import { createQuickLinkDraft } from "@my-project/shared";

export const FormActions = () => {
  const {
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
    triggerCreateQuickLink,
    mutations: { quickLinkCreateMutation },
  } = useQuickLinkCRUD();

  const isLoading = quickLinkCreateMutation.isPending;

  const onSubmit = React.useCallback(
    async (values: ManageQuickLinkFormValues) => {
      const newQuickLink = createQuickLinkDraft({
        name: values.name,
        icon: values.icon,
        url: values.url,
        visible: values.visible,
      });

      await triggerCreateQuickLink({
        data: {
          quickLink: newQuickLink,
        },
        callbacks: {
          onSuccess: handleClose,
        },
      });
    },
    [triggerCreateQuickLink, handleClose]
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
        disabled={!isDirty || isLoading}
      >
        create
      </Button>
    </Stack>
  );
};
