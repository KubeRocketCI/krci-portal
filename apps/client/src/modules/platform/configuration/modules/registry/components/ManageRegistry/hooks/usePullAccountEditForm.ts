import React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { PULL_ACCOUNT_FORM_NAMES } from "../names";
import { PullAccountFormValues, SharedFormValues } from "../types";
import { parseRegistrySecretUserProtectedData, Secret, editPullAccountRegistrySecret } from "@my-project/shared";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { FORM_MODES } from "@/core/types/forms";
import { useSecretCRUD, useSecretPermissions } from "@/k8s/api/groups/Core/Secret";

export const usePullAccountEditForm = ({
  pullAccountSecret,
  sharedForm,
}: {
  pullAccountSecret: Secret | undefined;
  sharedForm: UseFormReturn<SharedFormValues>;
}): MultiFormItem<PullAccountFormValues> => {
  const {
    triggerEditSecret,
    mutations: { secretEditMutation },
  } = useSecretCRUD();

  const secretPermissions = useSecretPermissions();

  const defaultValues = React.useMemo(() => {
    const { userName: pullUserName, password: pullPassword } = parseRegistrySecretUserProtectedData(pullAccountSecret);

    return {
      [PULL_ACCOUNT_FORM_NAMES.PULL_ACCOUNT_PASSWORD]: pullPassword || "",
      [PULL_ACCOUNT_FORM_NAMES.PULL_ACCOUNT_USER]: pullUserName || "",
    };
  }, [pullAccountSecret]);

  const form = useForm<PullAccountFormValues>({
    defaultValues: defaultValues,
  });

  React.useEffect(() => {
    form.reset(defaultValues, { keepDirty: false });
  }, [defaultValues, form]);

  const handleSubmit = React.useCallback(
    async (values: PullAccountFormValues) => {
      if (!secretPermissions.data.patch.allowed || !pullAccountSecret) {
        return false;
      }

      const sharedValues = sharedForm.getValues();

      await triggerEditSecret({
        data: {
          resource: editPullAccountRegistrySecret(pullAccountSecret, {
            registryType: sharedValues.registryType,
            registryEndpoint: sharedValues.registryEndpoint,
            user: values.pullAccountUser,
            password: values.pullAccountPassword,
          }),
        },
      });
    },
    [pullAccountSecret, secretPermissions.data.patch.allowed, sharedForm, triggerEditSecret]
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
