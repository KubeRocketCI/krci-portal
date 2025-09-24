import React from "react";
import { useForm } from "react-hook-form";
import { CODEMIE_SECRET_FORM_NAMES } from "../names";
import { CodemieSecretFormValues } from "../types";
import { useSecretCRUD, useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { FORM_MODES } from "@/core/types/forms";
import { createCodemieSecretDraft } from "@my-project/shared";

export const useCodemieSecretCreateForm = ({
  handleClosePanel,
}: {
  handleClosePanel: (() => void) | undefined;
}): MultiFormItem<CodemieSecretFormValues> => {
  const {
    triggerCreateSecret,
    mutations: { secretCreateMutation },
  } = useSecretCRUD();

  const secretPermissions = useSecretPermissions();

  const defaultValues = React.useMemo(() => {
    return {
      [CODEMIE_SECRET_FORM_NAMES.NAME]: "codemie",
    };
  }, []);

  const form = useForm<CodemieSecretFormValues>({ defaultValues: defaultValues });

  const handleSubmit = React.useCallback(
    async (values: CodemieSecretFormValues) => {
      if (!secretPermissions.data.create.allowed) {
        return false;
      }

      const secretDraft = createCodemieSecretDraft({
        clientId: values.clientId,
        clientSecret: values.clientSecret,
        name: values.name,
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
