import React from "react";
import { useForm } from "react-hook-form";
import { CodemieSecretFormValues } from "../types";
import { editCodemieSecret } from "@my-project/shared";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretCRUD, useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import { CODEMIE_SECRET_FORM_NAMES } from "../names";
import { Secret, safeDecode } from "@my-project/shared";

export const useCodemieSecretEditForm = ({
  handleClosePanel,
  secret,
}: {
  handleClosePanel: (() => void) | undefined;
  secret: Secret | undefined;
}): MultiFormItem<CodemieSecretFormValues> => {
  const {
    triggerEditSecret,
    mutations: { secretEditMutation },
  } = useSecretCRUD();

  const secretPermissions = useSecretPermissions();

  const defaultValues = React.useMemo(() => {
    return {
      [CODEMIE_SECRET_FORM_NAMES.CLIENT_ID]: safeDecode(secret?.data?.client_id || "", ""),
      [CODEMIE_SECRET_FORM_NAMES.CLIENT_SECRET]: safeDecode(secret?.data?.client_secret || "", ""),
      [CODEMIE_SECRET_FORM_NAMES.NAME]: "codemie",
    };
  }, [secret]);

  const form = useForm<CodemieSecretFormValues>({
    defaultValues,
  });

  const handleSubmit = React.useCallback(
    async (values: CodemieSecretFormValues) => {
      if (!secretPermissions.data.patch.allowed || !secret) {
        return false;
      }

      const secretDraft = editCodemieSecret(secret, {
        clientId: values.clientId,
        clientSecret: values.clientSecret,
      });

      await triggerEditSecret({
        data: {
          resource: secretDraft,
        },
        callbacks: {
          onSuccess: handleClosePanel,
        },
      });
    },
    [handleClosePanel, secret, secretPermissions.data.patch.allowed, triggerEditSecret]
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
