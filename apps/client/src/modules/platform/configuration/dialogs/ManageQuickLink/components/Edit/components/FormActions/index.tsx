import { Box, Button, Stack, useTheme } from "@mui/material";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { ManageQuickLinkFormValues } from "../../../../types";
import { useQuickLinkCRUD } from "@/k8s/api/groups/KRCI/QuickLink";
import { editQuickLink } from "@my-project/shared";

export const FormActions = () => {
  const {
    props: { quickLink },
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
    triggerPatchQuickLink,
    mutations: { quickLinkPatchMutation },
  } = useQuickLinkCRUD();

  const isLoading = quickLinkPatchMutation.isPending;

  const onSubmit = React.useCallback(
    async (values: ManageQuickLinkFormValues) => {
      if (!quickLink) {
        return;
      }

      const editedQuickLink = editQuickLink(quickLink, {
        visible: values.visible,
        url: values.url,
        icon: values.icon,
      });

      await triggerPatchQuickLink({
        data: {
          quickLink: editedQuickLink,
        },
        callbacks: {
          onSuccess: handleClose,
        },
      });
    },
    [handleClose, quickLink, triggerPatchQuickLink]
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
        apply
      </Button>
    </Stack>
  );
};
