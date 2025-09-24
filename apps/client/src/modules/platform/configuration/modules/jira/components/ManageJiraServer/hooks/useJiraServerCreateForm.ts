import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { FORM_MODES } from "@/core/types/forms";
import { useJiraServerCRUD, useJiraServerPermissions } from "@/k8s/api/groups/KRCI/JiraServer";
import React from "react";
import { useForm } from "react-hook-form";
import { JiraServerFormValues } from "../types";
import { createJiraServerDraft } from "@my-project/shared";

export const useJiraServerCreateForm = ({
  handleClosePanel,
}: {
  handleClosePanel: (() => void) | undefined;
}): MultiFormItem<JiraServerFormValues> => {
  const {
    triggerCreateJiraServer,
    mutations: { jiraServerCreateMutation },
  } = useJiraServerCRUD();

  const jiraServerPermissions = useJiraServerPermissions();

  const defaultValues = React.useMemo(() => ({}), []);

  const form = useForm<JiraServerFormValues>({
    defaultValues: defaultValues,
  });

  React.useEffect(() => {
    form.reset(defaultValues, { keepDirty: false });
  }, [defaultValues, form]);

  const handleSubmit = React.useCallback(
    async (values: JiraServerFormValues) => {
      if (!jiraServerPermissions.data.create.allowed) {
        return false;
      }

      const jiraServerDraft = createJiraServerDraft({
        url: values.url,
      });

      await triggerCreateJiraServer({
        data: {
          resource: jiraServerDraft,
        },
        callbacks: {
          onSuccess: handleClosePanel,
        },
      });
    },
    [handleClosePanel, jiraServerPermissions.data.create.allowed, triggerCreateJiraServer]
  );

  return React.useMemo(
    () => ({
      mode: FORM_MODES.CREATE,
      form,
      onSubmit: form.handleSubmit(handleSubmit),
      isSubmitting: jiraServerCreateMutation.isPending,
      allowedToSubmit: {
        isAllowed: jiraServerPermissions.data.create.allowed,
        reason: jiraServerPermissions.data.create.reason,
      },
    }),
    [
      form,
      handleSubmit,
      jiraServerCreateMutation.isPending,
      jiraServerPermissions.data.create.allowed,
      jiraServerPermissions.data.create.reason,
    ]
  );
};
