import React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { PUSH_ACCOUNT_FORM_NAMES } from "../names";
import { PushAccountFormValues, SharedFormValues } from "../types";
import {
  containerRegistryType,
  parseRegistrySecretAuth,
  parseRegistrySecretUserProtectedData,
  Secret,
  editPushAccountRegistrySecret,
} from "@my-project/shared";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretCRUD, useSecretPermissions } from "@/k8s/api/groups/Core/Secret";

export const usePushAccountEditForm = ({
  pushAccountSecret,
  sharedForm,
}: {
  pushAccountSecret: Secret | undefined;
  sharedForm: UseFormReturn<SharedFormValues>;
}): MultiFormItem<PushAccountFormValues> => {
  const {
    triggerEditSecret,
    mutations: { secretEditMutation },
  } = useSecretCRUD();

  const secretPermissions = useSecretPermissions();

  const defaultValues = React.useMemo(() => {
    const sharedValues = sharedForm.getValues();

    const { auth } = parseRegistrySecretAuth(pushAccountSecret);

    const { userName: pushUserName, password: pushPassword } = parseRegistrySecretUserProtectedData(pushAccountSecret);

    switch (sharedValues.registryType) {
      case containerRegistryType.openshift:
        return {
          [PUSH_ACCOUNT_FORM_NAMES.PUSH_ACCOUNT_PASSWORD]: auth || "",
        };
      default:
        return {
          [PUSH_ACCOUNT_FORM_NAMES.PUSH_ACCOUNT_PASSWORD]: pushPassword || "",
          [PUSH_ACCOUNT_FORM_NAMES.PUSH_ACCOUNT_USER]: pushUserName || "",
        };
    }
  }, [pushAccountSecret, sharedForm]);

  const form = useForm<PushAccountFormValues>({
    defaultValues: defaultValues,
  });

  React.useEffect(() => {
    form.reset(defaultValues, { keepDirty: false });
  }, [defaultValues, form]);

  const handleSubmit = React.useCallback(
    async (values: PushAccountFormValues) => {
      if (!secretPermissions.data.patch.allowed || !pushAccountSecret) {
        return false;
      }

      const sharedValues = sharedForm.getValues();

      await triggerEditSecret({
        data: {
          resource: editPushAccountRegistrySecret(pushAccountSecret, {
            registryType: sharedValues.registryType,
            registryEndpoint: sharedValues.registryEndpoint,
            user: values.pushAccountUser,
            password: values.pushAccountPassword,
          }),
        },
      });
    },
    [pushAccountSecret, secretPermissions.data.patch.allowed, sharedForm, triggerEditSecret]
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
