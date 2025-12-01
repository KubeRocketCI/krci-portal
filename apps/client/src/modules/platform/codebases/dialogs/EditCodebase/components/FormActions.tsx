import React from "react";
import { Button } from "@/core/components/ui/button";
import { useFormContext } from "react-hook-form";
import { useCodebaseCRUD } from "@/k8s/api/groups/KRCI/Codebase";
import { editCodebaseObject } from "@my-project/shared";
import { EDIT_FORM_NAMES, NAMES } from "@/modules/platform/codebases/components/form-fields";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { dialogName } from "../constants";
import { Codebase } from "@my-project/shared";

interface FormActionsProps {
  codebase: Codebase;
}

export const FormActions: React.FC<FormActionsProps> = ({ codebase }) => {
  const { closeDialog } = useDialogContext();
  const {
    reset,
    formState: { isDirty },
    handleSubmit,
    watch,
  } = useFormContext();

  const hasJiraServerIntegration = (watch as (name: string) => boolean)(
    EDIT_FORM_NAMES[NAMES.HAS_JIRA_SERVER_INTEGRATION].name
  );

  const handleResetFields = React.useCallback(() => {
    reset();
  }, [reset]);

  const handleClose = React.useCallback(() => {
    closeDialog(dialogName);
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
    async (values: Record<string, unknown>) => {
      if (!codebase) {
        return;
      }

      // Access form values using the create wizard field names
      const commitMessagePattern = values[EDIT_FORM_NAMES[NAMES.COMMIT_MESSAGE_PATTERN].name] as string | undefined;
      const jiraServer = hasJiraServerIntegration
        ? (values[EDIT_FORM_NAMES[NAMES.JIRA_SERVER].name] as string | undefined)
        : null;
      const ticketNamePattern = hasJiraServerIntegration
        ? (values[EDIT_FORM_NAMES[NAMES.TICKET_NAME_PATTERN].name] as string | undefined)
        : null;
      const jiraIssueMetadataPayload = hasJiraServerIntegration
        ? (values[EDIT_FORM_NAMES[NAMES.JIRA_ISSUE_METADATA_PAYLOAD].name] as string | undefined)
        : null;

      const updatedCodebase = editCodebaseObject(codebase, {
        jiraServer,
        commitMessagePattern,
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
      <Button variant="default" size="sm" disabled={!isDirty || isPending} onClick={handleSubmit(onSubmit)}>
        Apply
      </Button>
    </div>
  );
};
