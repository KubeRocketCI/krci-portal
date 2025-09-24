import React from "react";
import { useForm } from "react-hook-form";
import { JiraServerFormValues } from "../types";
import { editJiraServer, JiraServer } from "@my-project/shared";
import { JIRA_SERVER_FORM_NAMES } from "../constants";
import { useJiraServerCRUD, useJiraServerPermissions } from "@/k8s/api/groups/KRCI/JiraServer";
import { FORM_MODES } from "@/core/types/forms";

export const useJiraServerEditForm = ({
  jiraServer,
  handleClosePanel,
}: {
  jiraServer: JiraServer | undefined;
  handleClosePanel: (() => void) | undefined;
}) => {
  const {
    triggerEditJiraServer,
    mutations: { jiraServerEditMutation },
  } = useJiraServerCRUD();

  const jiraServerPermissions = useJiraServerPermissions();
  const defaultValues = React.useMemo(
    () => ({
      [JIRA_SERVER_FORM_NAMES.URL]: jiraServer?.spec.apiUrl || jiraServer?.spec.rootUrl,
    }),
    [jiraServer?.spec.apiUrl, jiraServer?.spec.rootUrl]
  );

  const form = useForm<JiraServerFormValues>({
    defaultValues: defaultValues,
  });

  React.useEffect(() => {
    form.reset(defaultValues, { keepDirty: false });
  }, [defaultValues, form]);

  const handleSubmit = React.useCallback(
    async (values: JiraServerFormValues) => {
      if (!jiraServerPermissions.data.patch.allowed || !jiraServer) {
        return false;
      }

      const updatedJiraServer = editJiraServer(jiraServer, {
        url: values.url,
      });

      await triggerEditJiraServer({
        data: {
          resource: updatedJiraServer,
        },
        callbacks: {
          onSuccess: handleClosePanel,
        },
      });
    },
    [handleClosePanel, jiraServer, jiraServerPermissions.data.patch.allowed, triggerEditJiraServer]
  );

  return React.useMemo(
    () => ({
      mode: FORM_MODES.EDIT,
      form,
      onSubmit: form.handleSubmit(handleSubmit),
      isSubmitting: jiraServerEditMutation.isPending,
      allowedToSubmit: {
        isAllowed: jiraServerPermissions.data.patch.allowed,
        reason: jiraServerPermissions.data.patch.reason,
      },
    }),
    [
      form,
      handleSubmit,
      jiraServerEditMutation.isPending,
      jiraServerPermissions.data.patch.allowed,
      jiraServerPermissions.data.patch.reason,
    ]
  );
};
