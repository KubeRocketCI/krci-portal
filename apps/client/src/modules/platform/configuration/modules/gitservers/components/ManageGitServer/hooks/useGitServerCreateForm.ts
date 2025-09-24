import React from "react";
import { useForm } from "react-hook-form";
import { GIT_SERVER_FORM_NAMES } from "../names";
import { GitServerFormValues } from "../types";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { gitUser, gitProvider, createGitServerDraft } from "@my-project/shared";
import { useGitServerCRUD, useGitServerPermissions } from "@/k8s/api/groups/KRCI/GitServer";
import { FORM_MODES } from "@/core/types/forms";

export const useGitServerCreateForm = ({
  handleClosePanel,
}: {
  handleClosePanel: (() => void) | undefined;
}): MultiFormItem<GitServerFormValues> => {
  const {
    triggerCreateGitServer,
    mutations: { gitServerCreateMutation },
  } = useGitServerCRUD();

  const gitServerPermissions = useGitServerPermissions();

  const defaultValues = React.useMemo(() => {
    return {
      [GIT_SERVER_FORM_NAMES.GIT_PROVIDER]: gitProvider.gerrit,
      [GIT_SERVER_FORM_NAMES.SSH_PORT]: 22,
      [GIT_SERVER_FORM_NAMES.HTTPS_PORT]: 443,
      [GIT_SERVER_FORM_NAMES.GIT_USER]: gitUser.GERRIT,
      [GIT_SERVER_FORM_NAMES.SKIP_WEBHOOK_SSL]: false,
    };
  }, []);

  const form = useForm<GitServerFormValues>({
    defaultValues: defaultValues,
  });

  const handleSubmit = React.useCallback(
    async (values: GitServerFormValues) => {
      if (!gitServerPermissions.data.create.allowed) {
        return false;
      }

      const gitServerDraft = createGitServerDraft({
        name: values.name,
        gitHost: values.gitHost,
        gitProvider: values.gitProvider,
        nameSshKeySecret: values.nameSshKeySecret,
        gitUser: values.gitUser,
        httpsPort: values.httpsPort,
        sshPort: values.sshPort,
        skipWebhookSSLVerification: values.skipWebhookSSLVerification,
        webhookUrl: values.webhookURL,
      });

      await triggerCreateGitServer({
        data: {
          resource: gitServerDraft,
        },
        callbacks: {
          onSuccess: handleClosePanel,
        },
      });
    },
    [gitServerPermissions.data.create.allowed, handleClosePanel, triggerCreateGitServer]
  );

  return React.useMemo(
    () => ({
      mode: FORM_MODES.CREATE,
      form,
      onSubmit: form.handleSubmit(handleSubmit),
      isSubmitting: gitServerCreateMutation.isPending,
      allowedToSubmit: {
        isAllowed: gitServerPermissions.data.create.allowed,
        reason: gitServerPermissions.data.create.reason,
      },
    }),
    [
      form,
      handleSubmit,
      gitServerCreateMutation.isPending,
      gitServerPermissions.data.create.allowed,
      gitServerPermissions.data.create.reason,
    ]
  );
};
