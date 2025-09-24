import React from "react";
import { useForm } from "react-hook-form";
import { CODEMIE_FORM_NAMES } from "../names";
import { CodemieFormValues } from "../types";
import { Codemie, editCodemie } from "@my-project/shared";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { FORM_MODES } from "@/core/types/forms";
import { useCodemieCRUD, useCodemiePermissions } from "@/k8s/api/groups/KRCI/Codemie";

export const useCodemieEditForm = ({
  handleClosePanel,
  codemie,
}: {
  handleClosePanel: (() => void) | undefined;
  codemie: Codemie | undefined;
}): MultiFormItem<CodemieFormValues> => {
  const codemiePermissions = useCodemiePermissions();
  const {
    triggerEditCodemie,
    mutations: { codemieEditMutation },
  } = useCodemieCRUD();

  const defaultValues = React.useMemo(() => {
    return {
      [CODEMIE_FORM_NAMES.NAME]: codemie?.spec.oidc.secretRef.name,
      [CODEMIE_FORM_NAMES.API_URL]: codemie?.spec.url,
      [CODEMIE_FORM_NAMES.TOKEN_ENDPOINT]: codemie?.spec.oidc.tokenEndpoint,
    };
  }, [codemie?.spec.oidc.secretRef.name, codemie?.spec.oidc.tokenEndpoint, codemie?.spec.url]);

  const form = useForm<CodemieFormValues>({ defaultValues: defaultValues });

  const handleSubmit = React.useCallback(
    async (values: CodemieFormValues) => {
      if (!codemiePermissions.data.patch.allowed || !codemie) {
        return false;
      }

      const codemieDraft = editCodemie(codemie, {
        tokenEndpoint: values.tokenEndpoint,
        apiUrl: values.apiUrl,
      });

      await triggerEditCodemie({
        data: {
          resource: codemieDraft,
        },
        callbacks: {
          onSuccess: handleClosePanel,
        },
      });
    },
    [codemiePermissions.data.patch.allowed, codemie, triggerEditCodemie, handleClosePanel]
  );

  return React.useMemo(
    () => ({
      mode: FORM_MODES.EDIT,
      form,
      onSubmit: form.handleSubmit(handleSubmit),
      isSubmitting: codemieEditMutation.isPending,
      allowedToSubmit: {
        isAllowed: codemiePermissions.data.patch.allowed,
        reason: codemiePermissions.data.patch.reason,
      },
    }),
    [
      form,
      handleSubmit,
      codemieEditMutation.isPending,
      codemiePermissions.data.patch.allowed,
      codemiePermissions.data.patch.reason,
    ]
  );
};
