import React from "react";
import { useForm } from "react-hook-form";
import { IntegrationSecretFormValues } from "../types";
import { createSonarQubeIntegrationSecretDraft } from "@my-project/shared";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretCRUD, useSecretPermissions } from "@/k8s/api/groups/Core/Secret";

export const useSecretCreateForm = ({
  handleClosePanel,
}: {
  handleClosePanel: (() => void) | undefined;
}): MultiFormItem<IntegrationSecretFormValues> => {
  const {
    triggerCreateSecret,
    mutations: { secretCreateMutation },
  } = useSecretCRUD();

  const secretPermissions = useSecretPermissions();

  const form = useForm<IntegrationSecretFormValues>();

  const handleSubmit = React.useCallback(
    async (values: IntegrationSecretFormValues) => {
      if (!secretPermissions.data.create.allowed) {
        return false;
      }

      const secretDraft = createSonarQubeIntegrationSecretDraft({
        token: values.token,
        url: values.url,
      });

      await triggerCreateSecret({
        data: {
          resource: secretDraft,
        },
        callbacks: {
          onSuccess: handleClosePanel,
        },
      });
    },
    [handleClosePanel, secretPermissions.data.create.allowed, triggerCreateSecret]
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
