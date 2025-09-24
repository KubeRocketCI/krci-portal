import React from "react";
import { useForm } from "react-hook-form";
import { SHARED_FORM_NAMES } from "../names";
import { SharedFormValues } from "../types";
import { ConfigMap, ContainerRegistryType, Secret, parseRegistrySecretUserProtectedData } from "@my-project/shared";

export const useSharedForm = ({
  EDPConfigMap,
  pushAccountSecret,
  pullAccountSecret,
}: {
  EDPConfigMap: ConfigMap | undefined;
  pushAccountSecret: Secret | undefined;
  pullAccountSecret: Secret | undefined;
}) => {
  const { userName: pullUserName, password: pullPassword } = parseRegistrySecretUserProtectedData(pullAccountSecret);
  const { userName: pushUserName, password: pushPassword } = parseRegistrySecretUserProtectedData(pushAccountSecret);

  const useSameAccountValue = React.useMemo(() => {
    if (!pullUserName || !pushUserName) {
      return false;
    }

    const usernamesAreEqual = pullUserName === pushUserName;
    const passwordsAreEqual = pullPassword === pushPassword;

    if (usernamesAreEqual && passwordsAreEqual) {
      return true;
    }

    return false;
  }, [pullPassword, pullUserName, pushPassword, pushUserName]);

  const defaultValues = React.useMemo(() => {
    return {
      [SHARED_FORM_NAMES.REGISTRY_ENDPOINT]: EDPConfigMap?.data?.container_registry_host,
      [SHARED_FORM_NAMES.REGISTRY_TYPE]: EDPConfigMap?.data?.container_registry_type as ContainerRegistryType,
      [SHARED_FORM_NAMES.USE_SAME_ACCOUNT]: useSameAccountValue,
    };
  }, [EDPConfigMap?.data?.container_registry_host, EDPConfigMap?.data?.container_registry_type, useSameAccountValue]);

  const form = useForm<SharedFormValues>({
    defaultValues: defaultValues,
  });

  React.useEffect(() => {
    form.reset(defaultValues, { keepDirty: true });
  }, [defaultValues, form]);

  return React.useMemo(() => ({ form }), [form]);
};
