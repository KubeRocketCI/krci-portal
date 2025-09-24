import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { FORM_MODES } from "@/core/types/forms";
import {
  containerRegistryType,
  createPullAccountRegistrySecretDraft,
  parseRegistrySecretUserProtectedData,
  Secret,
} from "@my-project/shared";
import React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { PULL_ACCOUNT_FORM_NAMES } from "../names";
import { PullAccountFormValues, SharedFormValues } from "../types";
import { useSecretCRUD, useSecretPermissions } from "@/k8s/api/groups/Core/Secret";

export const usePullAccountCreateForm = ({
  pullAccountSecret,
  sharedForm,
}: {
  pullAccountSecret: Secret | undefined;
  sharedForm: UseFormReturn<SharedFormValues>;
}): MultiFormItem<PullAccountFormValues> => {
  const {
    triggerCreateSecret,
    mutations: { secretCreateMutation },
  } = useSecretCRUD();

  const secretPermissions = useSecretPermissions();

  const defaultValues = React.useMemo(() => {
    const sharedValues = sharedForm.getValues();
    const { userName: pullUserName, password: pullPassword } = parseRegistrySecretUserProtectedData(pullAccountSecret);

    switch (sharedValues.registryType) {
      case containerRegistryType.dockerhub:
      case containerRegistryType.harbor:
      case containerRegistryType.nexus:
        return {
          [PULL_ACCOUNT_FORM_NAMES.PULL_ACCOUNT_PASSWORD]: pullPassword || "",
          [PULL_ACCOUNT_FORM_NAMES.PULL_ACCOUNT_USER]: pullUserName || "",
        };
      default:
        return {};
    }
  }, [pullAccountSecret, sharedForm]);

  const form = useForm<PullAccountFormValues>({
    defaultValues: defaultValues,
  });

  React.useEffect(() => {
    form.reset(defaultValues, { keepDirty: false });
  }, [defaultValues, form]);

  const handleSubmit = React.useCallback(
    async (values: PullAccountFormValues) => {
      if (!secretPermissions.data.create.allowed) {
        return false;
      }

      const sharedValues = sharedForm.getValues();

      await triggerCreateSecret({
        data: {
          resource: createPullAccountRegistrySecretDraft({
            registryType: sharedValues.registryType,
            registryEndpoint: sharedValues.registryEndpoint,
            user: values.pullAccountUser,
            password: values.pullAccountPassword,
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
