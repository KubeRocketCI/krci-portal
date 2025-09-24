import React from "react";
import { useForm } from "react-hook-form";
import { GIT_SERVER_FORM_NAMES } from "../names";
import { GitServerFormValues } from "../types";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { editGitServer, GitServer } from "@my-project/shared";
import { useGitServerCRUD, useGitServerPermissions } from "@/k8s/api/groups/KRCI/GitServer";
import { FORM_MODES } from "@/core/types/forms";

export const useGitServerEditForm = ({
  gitServer,
  webhookURL,
}: {
  gitServer: GitServer | undefined;
  webhookURL: string | undefined;
}): MultiFormItem<GitServerFormValues> => {
  const {
    triggerEditGitServer,
    mutations: { gitServerEditMutation },
  } = useGitServerCRUD();

  const gitServerPermissions = useGitServerPermissions();

  const webhookURLValue = gitServer?.spec?.webhookUrl || webhookURL || "";

  const defaultValues = React.useMemo(() => {
    if (!gitServer) {
      return {};
    }

    return {
      [GIT_SERVER_FORM_NAMES.GIT_PROVIDER]: gitServer.spec.gitProvider,
      [GIT_SERVER_FORM_NAMES.NAME]: gitServer.metadata.name,
      [GIT_SERVER_FORM_NAMES.SSH_PORT]: Number(gitServer.spec.sshPort),
      [GIT_SERVER_FORM_NAMES.HTTPS_PORT]: Number(gitServer.spec.httpsPort),
      [GIT_SERVER_FORM_NAMES.GIT_USER]: gitServer.spec.gitUser,
      [GIT_SERVER_FORM_NAMES.GIT_HOST]: gitServer.spec.gitHost,
      [GIT_SERVER_FORM_NAMES.SKIP_WEBHOOK_SSL]: gitServer.spec.skipWebhookSSLVerification || false,
      [GIT_SERVER_FORM_NAMES.OVERRIDE_WEBHOOK_URL]: !!gitServer.spec?.webhookUrl,
      [GIT_SERVER_FORM_NAMES.WEBHOOK_URL]: webhookURLValue,
    };
  }, [gitServer, webhookURLValue]);

  const form = useForm<GitServerFormValues>({
    defaultValues: defaultValues,
  });

  React.useEffect(() => {
    form.reset(defaultValues, { keepDirty: false });
  }, [defaultValues, form]);

  const handleSubmit = React.useCallback(
    async (values: GitServerFormValues) => {
      if (!gitServerPermissions.data.patch.allowed || !gitServer) {
        return false;
      }

      const gitServerDraft = editGitServer(gitServer, {
        gitHost: values.gitHost,
        gitProvider: values.gitProvider,
        nameSshKeySecret: values.nameSshKeySecret,
        gitUser: values.gitUser,
        httpsPort: values.httpsPort,
        sshPort: values.sshPort,
        skipWebhookSSLVerification: values.skipWebhookSSLVerification,
        webhookUrl: values.webhookURL,
      });

      await triggerEditGitServer({
        data: {
          resource: gitServerDraft,
        },
      });
    },
    [gitServerPermissions.data.patch.allowed, gitServer, triggerEditGitServer]
  );

  return React.useMemo(
    () => ({
      mode: FORM_MODES.EDIT,
      form,
      onSubmit: form.handleSubmit(handleSubmit),
      isSubmitting: gitServerEditMutation.isPending,
      allowedToSubmit: {
        isAllowed: gitServerPermissions.data.patch.allowed,
        reason: gitServerPermissions.data.patch.reason,
      },
    }),
    [
      form,
      handleSubmit,
      gitServerEditMutation.isPending,
      gitServerPermissions.data.patch.allowed,
      gitServerPermissions.data.patch.reason,
    ]
  );
};
