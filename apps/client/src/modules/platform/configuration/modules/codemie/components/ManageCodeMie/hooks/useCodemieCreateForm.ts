import React from "react";
import { useForm } from "react-hook-form";
import { CODEMIE_FORM_NAMES } from "../names";
import { CodemieFormValues } from "../types";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { useCodemieCRUD, useCodemiePermissions } from "@/k8s/api/groups/KRCI/Codemie";
import { createCodemieDraft } from "@my-project/shared";
import { FORM_MODES } from "@/core/types/forms";

export const useCodemieCreateForm = ({
  handleClosePanel,
}: {
  handleClosePanel: (() => void) | undefined;
}): MultiFormItem<CodemieFormValues> => {
  const codemiePermissions = useCodemiePermissions();
  const {
    triggerCreateCodemie,
    mutations: { codemieCreateMutation },
  } = useCodemieCRUD();

  const defaultValues = React.useMemo(() => ({ [CODEMIE_FORM_NAMES.NAME]: "codemie" }), []);

  const form = useForm<CodemieFormValues>({ defaultValues: defaultValues });

  const handleSubmit = React.useCallback(
    async (values: CodemieFormValues) => {
      if (!codemiePermissions.data.create.allowed) {
        return false;
      }

      const codemieDraft = createCodemieDraft({
        tokenEndpoint: values.tokenEndpoint,
        apiUrl: values.apiUrl,
        name: values.name,
      });

      await triggerCreateCodemie({
        data: {
          resource: codemieDraft,
        },
        callbacks: {
          onSuccess: handleClosePanel,
        },
      });
    },
    [codemiePermissions.data.create.allowed, triggerCreateCodemie, handleClosePanel]
  );

  return React.useMemo(
    () => ({
      mode: FORM_MODES.CREATE,
      form,
      onSubmit: form.handleSubmit(handleSubmit),
      isSubmitting: codemieCreateMutation.isPending,
      allowedToSubmit: {
        isAllowed: codemiePermissions.data.create.allowed,
        reason: codemiePermissions.data.create.reason,
      },
    }),
    [
      form,
      handleSubmit,
      codemieCreateMutation.isPending,
      codemiePermissions.data.create.allowed,
      codemiePermissions.data.create.reason,
    ]
  );
};
