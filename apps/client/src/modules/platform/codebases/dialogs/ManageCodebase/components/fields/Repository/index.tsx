import React from "react";
import { useQuery } from "@tanstack/react-query";
import { FormCombobox } from "@/core/providers/Form/components/FormCombobox";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FieldEvent } from "@/core/types/forms";
import { validateField } from "@/core/utils/forms/validation";
import { validationRules } from "@/core/constants/validation";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { isImportStrategy } from "../../../utils";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { trpc } from "@/core/clients/trpc";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";

export const Repository = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useTypedFormContext();

  const strategyFieldValue = watch(CODEBASE_FORM_NAMES.strategy.name);
  const ownerFieldValue = watch(CODEBASE_FORM_NAMES.repositoryOwner.name);
  const gitServerFieldValue = watch(CODEBASE_FORM_NAMES.gitServer.name);

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const krciConfigMapWatch = useWatchKRCIConfig();
  const krciConfigMap = krciConfigMapWatch.data;
  const apiBaseUrl = krciConfigMap?.data?.api_gateway_url;

  const query = useQuery({
    queryKey: ["gitServerRepoList", gitServerFieldValue, ownerFieldValue],
    queryFn: () =>
      trpc.krakend.getRepositoryList.query({
        gitServer: gitServerFieldValue,
        owner: ownerFieldValue,
        namespace: defaultNamespace,
        clusterName,
      }),
    enabled: !!apiBaseUrl && !!gitServerFieldValue && !!ownerFieldValue,
  });

  const repositoryOptions = React.useMemo(() => {
    if (query.isLoading || query.isError || !query.data) {
      return [];
    }

    return (
      query.data.data?.map(({ name }: { name: string }) => ({
        label: name,
        value: name,
      })) || []
    );
  }, [query.data, query.isError, query.isLoading]);

  const helperText = React.useMemo(() => {
    if (!apiBaseUrl) {
      return "Repositories auto-discovery cannot be performed.";
    }

    if (query.isError) {
      return "Repositories auto-discovery could not be performed.";
    }

    return " ";
  }, [apiBaseUrl, query.isError]);

  return isImportStrategy(strategyFieldValue) ? (
    <FormCombobox
      placeholder={"repository_name"}
      {...register(CODEBASE_FORM_NAMES.repositoryName.name, {
        required: "Select repository",
        onChange: ({ target: { value } }: FieldEvent) => {
          if (value && typeof value === "string") {
            setValue(CODEBASE_FORM_NAMES.name.name, value);
            setValue(CODEBASE_FORM_NAMES.gitUrlPath.name, `${ownerFieldValue}/${value}`);
          }
        },
      })}
      label={"Repository"}
      control={control}
      errors={errors}
      disabled={!ownerFieldValue}
      options={repositoryOptions}
      freeSolo={true}
      loading={!!apiBaseUrl && query.isLoading}
      helperText={helperText}
    />
  ) : (
    <FormTextField
      {...register(CODEBASE_FORM_NAMES.repositoryName.name, {
        required: "Enter the repository name",
        onChange: ({ target: { value } }: FieldEvent) => {
          if (value && typeof value === "string") {
            setValue(CODEBASE_FORM_NAMES.name.name, value);
            setValue(CODEBASE_FORM_NAMES.gitUrlPath.name, `${ownerFieldValue}/${value}`);
          }
        },
        validate: (value) => {
          if (!value) {
            return "Repository name is required";
          }
          if (value.length < 3) {
            return "Repository name must be at least 3 characters long";
          }

          const validationResult = validateField(value, validationRules.REPOSITORY_NAME);
          if (validationResult !== true) {
            return validationResult;
          }

          if (
            !query.isLoading &&
            !query.isError &&
            repositoryOptions.length > 0 &&
            repositoryOptions.some((option) => option.value === value)
          ) {
            return "Repository with this name already exists";
          }

          return true;
        },
      })}
      label="Repository name"
      placeholder="repository_name"
      control={control}
      errors={errors}
      disabled={!ownerFieldValue}
    />
  );
};
