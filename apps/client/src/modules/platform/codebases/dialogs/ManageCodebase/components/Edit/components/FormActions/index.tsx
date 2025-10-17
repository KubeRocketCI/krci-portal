import { Box, Button, Stack, useTheme } from "@mui/material";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { useCodebaseCRUD } from "@/k8s/api/groups/KRCI/Codebase";
import { editCodebaseObject } from "@my-project/shared";
import { CODEBASE_FORM_NAMES } from "../../../../names";
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
    watch,
  } = useTypedFormContext();

  const hasJiraServerIntegration = watch(CODEBASE_FORM_NAMES.hasJiraServerIntegration.name);

  const handleResetFields = React.useCallback(() => {
    reset();
  }, [reset]);

  const handleClose = React.useCallback(() => {
    closeDialog();
    reset();
  }, [closeDialog, reset]);

  const {
    triggerPatchCodebase,
    mutations: { codebasePatchMutation },
  } = useCodebaseCRUD();

  const isPending = codebasePatchMutation.isPending;

  const onSuccess = React.useCallback(() => {
    handleClose();
  }, [handleClose]);

  const onSubmit = React.useCallback(
    async (values: ManageCodebaseFormValues) => {
      if (!codebase) {
        return;
      }

      // If Jira integration is disabled, clear the Jira-related fields
      const jiraServer = hasJiraServerIntegration ? values.jiraServer : null;
      const ticketNamePattern = hasJiraServerIntegration ? values.ticketNamePattern : null;
      const jiraIssueMetadataPayload = hasJiraServerIntegration ? values.jiraIssueMetadataPayload : null;

      const updatedCodebase = editCodebaseObject(codebase, {
        jiraServer,
        commitMessagePattern: values.commitMessagePattern,
        ticketNamePattern,
        jiraIssueMetadataPayload,
      });

      await triggerPatchCodebase({
        data: {
          codebase: updatedCodebase,
        },
        callbacks: {
          onSuccess,
        },
      });
    },
    [codebase, hasJiraServerIntegration, triggerPatchCodebase, onSuccess]
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
