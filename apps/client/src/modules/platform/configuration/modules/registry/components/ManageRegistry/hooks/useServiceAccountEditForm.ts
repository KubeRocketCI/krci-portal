import React from "react";
import { useForm } from "react-hook-form";
import { SERVICE_ACCOUNT_FORM_NAMES } from "../names";
import { ServiceAccountFormValues } from "../types";
import { editRegistryServiceAccount, ServiceAccount } from "@my-project/shared";
import { useServiceAccountCRUD, useServiceAccountPermissions } from "@/k8s/api/groups/Core/ServiceAccount";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { FORM_MODES } from "@/core/types/forms";
import { IRSA_ROLE_ARN_ANNOTATION } from "@my-project/shared";

export const useServiceAccountEditForm = ({
  tektonServiceAccount,
}: {
  tektonServiceAccount: ServiceAccount | undefined;
}): MultiFormItem<ServiceAccountFormValues> => {
  const {
    triggerEditServiceAccount,
    mutations: { serviceAccountEditMutation },
  } = useServiceAccountCRUD();

  const serviceAccountPermissions = useServiceAccountPermissions();

  const defaultValues = React.useMemo(() => {
    return {
      [SERVICE_ACCOUNT_FORM_NAMES.IRSA_ROLE_ARN]:
        tektonServiceAccount?.metadata?.annotations?.[IRSA_ROLE_ARN_ANNOTATION],
    };
  }, [tektonServiceAccount]);

  const form = useForm<ServiceAccountFormValues>({
    defaultValues: defaultValues,
  });

  React.useEffect(() => {
    form.reset(defaultValues, { keepDirty: false });
  }, [defaultValues, form]);

  const handleSubmit = React.useCallback(
    async (values: ServiceAccountFormValues) => {
      if (!serviceAccountPermissions.data.patch.allowed || !tektonServiceAccount) {
        return;
      }

      const updatedServiceAccount = editRegistryServiceAccount(tektonServiceAccount, {
        irsaRoleArn: values.irsaRoleArn,
      });
      triggerEditServiceAccount({ data: { resource: updatedServiceAccount } });
    },
    [serviceAccountPermissions.data.patch.allowed, tektonServiceAccount, triggerEditServiceAccount]
  );

  return React.useMemo(
    () => ({
      mode: FORM_MODES.EDIT,
      form,
      onSubmit: form.handleSubmit(handleSubmit),
      isSubmitting: serviceAccountEditMutation.isPending,
      allowedToSubmit: {
        isAllowed: serviceAccountPermissions.data.patch.allowed,
        reason: serviceAccountPermissions.data.patch.reason,
      },
    }),
    [
      form,
      handleSubmit,
      serviceAccountEditMutation.isPending,
      serviceAccountPermissions.data.patch.allowed,
      serviceAccountPermissions.data.patch.reason,
    ]
  );
};
