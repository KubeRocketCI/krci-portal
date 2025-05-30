import { Box, Button, Stack, useTheme } from "@mui/material";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../../names";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { useCRUD } from "@my-project/client/core/k8s/api/KRCI/Codebase/hooks/useCRUD";
import { ManageCodebaseFormValues } from "../../../../types";

export const FormActions = () => {
  const {
    props: { codebase },
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
    reset();
  }, [closeDialog, reset]);

  const { editCodebase } = useCRUD({
    onSuccess: handleClose,
  });

  const onSubmit = React.useCallback(
    async (values: ManageCodebaseFormValues) => {
      if (!codebase) {
        return;
      }
      // const { hasJiraServerIntegration } = values;

      // const usedValues = getUsedValues(values, CODEBASE_FORM_NAMES);
      // const formValues = hasJiraServerIntegration
      //   ? usedValues
      //   : {
      //       ...usedValues,
      //       jiraServer: null,
      //       ticketNamePattern: null,
      //       jiraIssueMetadataPayload: null,
      //     };

      // const updatedCodebaseData = editResource(CODEBASE_FORM_NAMES, codebaseData, formValues);

      // await editCodebase({
      //   codebaseData: updatedCodebaseData,
      // });
    },
    [codebase, editCodebase]
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
      <Button onClick={handleSubmit(onSubmit)} variant={"contained"} color={"primary"} size="small" disabled={!isDirty}>
        apply
      </Button>
    </Stack>
  );
};
