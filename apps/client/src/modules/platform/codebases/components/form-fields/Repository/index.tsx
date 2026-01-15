import { FormCombobox } from "@/core/providers/Form/components/FormCombobox";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useTRPCClient } from "@/core/providers/trpc";
import { FieldEvent } from "@/core/types/forms";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { useClusterStore } from "@/k8s/store";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useShallow } from "zustand/react/shallow";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";
import { isImportStrategy } from "../utils";

export const RepositoryField: React.FC = () => {
  const trpc = useTRPCClient();
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();

  const strategyFieldValue = watch(NAMES.strategy);
  const ownerFieldValue = watch(NAMES.ui_repositoryOwner);
  const gitServerFieldValue = watch(NAMES.gitServer);

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
      trpc.gitfusion.getRepositoryList.query({
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
      {...register(NAMES.ui_repositoryName, {
        onChange: ({ target: { value } }: FieldEvent) => {
          if (value && typeof value === "string") {
            setValue(NAMES.name, value, { shouldValidate: true });
            setValue(NAMES.gitUrlPath, `${ownerFieldValue}/${value}`);
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
      {...register(NAMES.ui_repositoryName, {
        onChange: ({ target: { value } }: FieldEvent) => {
          if (value && typeof value === "string") {
            setValue(NAMES.name, value);
            setValue(NAMES.gitUrlPath, `${ownerFieldValue}/${value}`);
          }
        },
        validate: (value: string) => {
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
