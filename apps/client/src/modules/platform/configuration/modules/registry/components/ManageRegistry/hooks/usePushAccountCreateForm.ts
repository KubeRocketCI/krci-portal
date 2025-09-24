import React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { PUSH_ACCOUNT_FORM_NAMES } from "../names";
import { PushAccountFormValues, SharedFormValues } from "../types";
import {
  containerRegistryType,
  parseRegistrySecretAuth,
  parseRegistrySecretUserProtectedData,
  createPushAccountRegistrySecretDraft,
  Secret,
} from "@my-project/shared";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretCRUD, useSecretPermissions } from "@/k8s/api/groups/Core/Secret";

export const usePushAccountCreateForm = ({
  pushAccountSecret,
  sharedForm,
}: {
  pushAccountSecret: Secret | undefined;
  sharedForm: UseFormReturn<SharedFormValues>;
}): MultiFormItem<PushAccountFormValues> => {
  const {
    triggerCreateSecret,
    mutations: { secretCreateMutation },
  } = useSecretCRUD();

  const secretPermissions = useSecretPermissions();

  const defaultValues = React.useMemo(() => {
    const sharedValues = sharedForm.getValues();

    const { auth } = parseRegistrySecretAuth(pushAccountSecret);

    const { userName: pushUserName, password: pushPassword } = parseRegistrySecretUserProtectedData(pushAccountSecret);

    switch (sharedValues.registryType) {
      case containerRegistryType.dockerhub:
      case containerRegistryType.harbor:
      case containerRegistryType.nexus:
        return {
          [PUSH_ACCOUNT_FORM_NAMES.PUSH_ACCOUNT_PASSWORD]: pushPassword || "",
          [PUSH_ACCOUNT_FORM_NAMES.PUSH_ACCOUNT_USER]: pushUserName || "",
        };

      case containerRegistryType.openshift:
        return {
          [PUSH_ACCOUNT_FORM_NAMES.PUSH_ACCOUNT_PASSWORD]: auth || "",
        };
      default:
        return {};
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
      if (!secretPermissions.data.create.allowed) {
        return false;
      }

      const sharedValues = sharedForm.getValues();

      await triggerCreateSecret({
        data: {
          resource: createPushAccountRegistrySecretDraft({
            registryType: sharedValues.registryType,
            registryEndpoint: sharedValues.registryEndpoint,
            user: values.pushAccountUser,
            password: values.pushAccountPassword,
          }),
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
