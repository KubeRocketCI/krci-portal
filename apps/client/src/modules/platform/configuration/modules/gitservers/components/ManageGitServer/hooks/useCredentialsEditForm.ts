import React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { CredentialsFormValues, SharedFormValues } from "../types";
import { createGitServerSecretName, editGitServerSecret, gitProvider, safeDecode } from "@my-project/shared";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { useSecretCRUD, useSecretPermissions, useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { CREDENTIALS_FORM_NAMES, GIT_SERVER_FORM_NAMES } from "../names";
import { FORM_MODES } from "@/core/types/forms";

export const useCredentialsEditForm = ({
  sharedForm,
}: {
  sharedForm: UseFormReturn<SharedFormValues>;
}): MultiFormItem<CredentialsFormValues> => {
  const {
    triggerEditSecret,
    mutations: { secretEditMutation },
  } = useSecretCRUD();

  const secretPermissions = useSecretPermissions();

  const gitProviderSharedValue = sharedForm.watch(GIT_SERVER_FORM_NAMES.GIT_PROVIDER);

  const gitServerSecretWatch = useSecretWatchItem({
    name: createGitServerSecretName(gitProviderSharedValue || ""),
  });

  const gitServerSecret = gitServerSecretWatch.query.data;

  const defaultValues = React.useMemo(() => {
    let base: Partial<CredentialsFormValues> = {};

    if (!gitServerSecret) {
      return base;
    }

    const sharedValues = sharedForm.getValues();

    switch (sharedValues.gitProvider) {
      case gitProvider.gerrit:
        base = {
          ...base,
          [CREDENTIALS_FORM_NAMES.SSH_PRIVATE_KEY]: safeDecode(gitServerSecret?.data?.["id_rsa"] || ""),
          [CREDENTIALS_FORM_NAMES.SSH_PUBLIC_KEY]: safeDecode(gitServerSecret?.data?.["id_rsa.pub"] || ""),
        };
        break;
      case gitProvider.gitlab:
        base = {
          ...base,
          [CREDENTIALS_FORM_NAMES.SSH_PRIVATE_KEY]: safeDecode(gitServerSecret?.data?.["id_rsa"] || ""),
          [CREDENTIALS_FORM_NAMES.TOKEN]: safeDecode(gitServerSecret?.data?.token || ""),
        };
        break;
      case gitProvider.github:
        base = {
          ...base,
          [CREDENTIALS_FORM_NAMES.SSH_PRIVATE_KEY]: safeDecode(gitServerSecret?.data?.["id_rsa"] || ""),
          [CREDENTIALS_FORM_NAMES.TOKEN]: safeDecode(gitServerSecret?.data?.token || ""),
        };
        break;
      case gitProvider.bitbucket:
        base = {
          ...base,
          [CREDENTIALS_FORM_NAMES.SSH_PRIVATE_KEY]: safeDecode(gitServerSecret?.data?.["id_rsa"] || ""),
          [CREDENTIALS_FORM_NAMES.TOKEN]: safeDecode(gitServerSecret?.data?.token || ""),
        };
        break;
      default:
        break;
    }

    return base;
  }, [gitServerSecret, sharedForm]);

  const form = useForm<CredentialsFormValues>({
    defaultValues: defaultValues,
  });

  React.useEffect(() => {
    form.reset(defaultValues, { keepDirty: false });
  }, [defaultValues, form]);

  const handleSubmit = React.useCallback(
    async (values: CredentialsFormValues) => {
      if (!secretPermissions.data.patch.allowed || !gitServerSecret) {
        return false;
      }

      const sharedValues = sharedForm.getValues();

      const gitServerSecretDraft = editGitServerSecret(gitServerSecret, {
        gitProvider: sharedValues.gitProvider,
        sshPrivateKey: values.sshPrivateKey,
        sshPublicKey: values.sshPublicKey,
        token: values.token,
      });

      await triggerEditSecret({
        data: {
          resource: gitServerSecretDraft,
        },
      });
    },
    [gitServerSecret, secretPermissions.data.patch.allowed, sharedForm, triggerEditSecret]
  );

  return React.useMemo(
    () => ({
      mode: FORM_MODES.EDIT,
      form,
      onSubmit: form.handleSubmit(handleSubmit),
      isSubmitting: secretEditMutation.isPending,
      allowedToSubmit: {
        isAllowed: secretPermissions.data.patch.allowed,
        reason: secretPermissions.data.patch.reason,
      },
    }),
    [
      form,
      handleSubmit,
      secretEditMutation.isPending,
      secretPermissions.data.patch.allowed,
      secretPermissions.data.patch.reason,
    ]
  );
};
