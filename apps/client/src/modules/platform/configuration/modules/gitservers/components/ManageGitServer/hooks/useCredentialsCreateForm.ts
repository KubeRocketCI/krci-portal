import React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { CredentialsFormValues, SharedFormValues } from "../types";
import { useSecretCRUD, useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import { FORM_MODES } from "@/core/types/forms";
import { createGitServerSecretDraft } from "@my-project/shared";
import { MultiFormItem } from "@/core/providers/MultiForm/types";

export const useCredentialsCreateForm = ({
  sharedForm,
}: {
  sharedForm: UseFormReturn<SharedFormValues>;
}): MultiFormItem<CredentialsFormValues> => {
  const {
    triggerCreateSecret,
    mutations: { secretCreateMutation },
  } = useSecretCRUD();

  const secretPermissions = useSecretPermissions();

  const form = useForm<CredentialsFormValues>();

  const handleSubmit = React.useCallback(
    async (values: CredentialsFormValues) => {
      if (!secretPermissions.data.create.allowed) {
        return false;
      }

      const sharedValues = sharedForm.getValues();

      const gitServerSecretDraft = createGitServerSecretDraft({
        gitProvider: sharedValues.gitProvider,
        sshPrivateKey: values.sshPrivateKey,
        sshPublicKey: values.sshPublicKey,
        token: values.token,
      });

      await triggerCreateSecret({
        data: {
          resource: gitServerSecretDraft,
        },
      });
    },
    [secretPermissions.data.create.allowed, sharedForm, triggerCreateSecret]
  );

  return React.useMemo(
    () => ({
      mode: FORM_MODES.CREATE,
      form,
      onSubmit: form.handleSubmit(handleSubmit),
      isSubmitting: secretCreateMutation.isPending,
      allowedToSubmit: {
        isAllowed: secretPermissions.data.create.allowed,
        reason: secretPermissions.data.create.reason,
      },
    }),
    [
      form,
      handleSubmit,
      secretCreateMutation.isPending,
      secretPermissions.data.create.allowed,
      secretPermissions.data.create.reason,
    ]
  );
};
