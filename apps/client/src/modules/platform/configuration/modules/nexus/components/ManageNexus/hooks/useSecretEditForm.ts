import React from "react";
import { useForm } from "react-hook-form";
import { IntegrationSecretFormValues } from "../types";
import { editNexusIntegrationSecret } from "@my-project/shared";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretCRUD, useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import { INTEGRATION_SECRET_FORM_NAMES } from "../constants";
import { Secret, safeDecode } from "@my-project/shared";

export const useSecretEditForm = ({
  handleClosePanel,
  secret,
}: {
  handleClosePanel: (() => void) | undefined;
  secret: Secret | undefined;
}): MultiFormItem<IntegrationSecretFormValues> => {
  const {
    triggerEditSecret,
    mutations: { secretEditMutation },
  } = useSecretCRUD();

  const secretPermissions = useSecretPermissions();

  const defaultValues = React.useMemo(() => {
    return {
      [INTEGRATION_SECRET_FORM_NAMES.USERNAME]: safeDecode(secret?.data?.username || "", ""),
      [INTEGRATION_SECRET_FORM_NAMES.PASSWORD]: safeDecode(secret?.data?.password || "", ""),
      [INTEGRATION_SECRET_FORM_NAMES.URL]: safeDecode(secret?.data?.url || "", ""),
    };
  }, [secret]);

  const form = useForm<IntegrationSecretFormValues>({
    defaultValues,
  });

  const handleSubmit = React.useCallback(
    async (values: IntegrationSecretFormValues) => {
      if (!secretPermissions.data.patch.allowed) {
        return false;
      }

      if (!secret) {
        return false;
      }

      const updatedSecret = editNexusIntegrationSecret(secret, {
        username: values.username,
        password: values.password,
        url: values.url,
      });

      await triggerEditSecret({
        data: {
          resource: updatedSecret,
        },
        callbacks: {
          onSuccess: handleClosePanel,
        },
      });
    },
    [handleClosePanel, secretPermissions.data.patch.allowed, triggerEditSecret]
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
