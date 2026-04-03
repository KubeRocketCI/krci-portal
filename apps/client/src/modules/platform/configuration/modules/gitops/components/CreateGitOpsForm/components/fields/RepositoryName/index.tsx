import React from "react";
import { useQuery } from "@tanstack/react-query";
import { codebaseCreationStrategy, gitProvider } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { validationRules } from "@/core/constants/validation";
import { validateField } from "@/core/utils/forms/validation";
import { useStore } from "@tanstack/react-form";
import { CODEBASE_FORM_NAMES } from "../../../constants";
import { useCreateGitOpsForm } from "../../../providers/form/hooks";
export const RepositoryName = () => {
  const form = useCreateGitOpsForm();
  const trpc = useTRPCClient();
  const gitServerFieldValue = useStore(form.store, (s) => s.values[CODEBASE_FORM_NAMES.GIT_SERVER]);
  const ownerFieldValue = useStore(form.store, (s) => s.values[CODEBASE_FORM_NAMES.UI_REPOSITORY_OWNER]);
  const strategyFieldValue = useStore(form.store, (s) => s.values[CODEBASE_FORM_NAMES.STRATEGY]);
  const providerFieldValue = useStore(form.store, (s) => s.values[CODEBASE_FORM_NAMES.UI_GIT_SERVER_PROVIDER]);

  const krciConfigMapWatch = useWatchKRCIConfig();
  const apiBaseUrl = krciConfigMapWatch.data?.data?.api_gateway_url;

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((s) => ({ clusterName: s.clusterName, defaultNamespace: s.defaultNamespace }))
  );

  const repoListQuery = useQuery({
    queryKey: ["gitServerRepoList", gitServerFieldValue, ownerFieldValue],
    queryFn: () =>
      trpc.gitfusion.getRepositoryList.query({
        gitServer: gitServerFieldValue ?? "",
        owner: ownerFieldValue ?? "",
        namespace: defaultNamespace,
        clusterName,
      }),
    enabled: !!apiBaseUrl && !!gitServerFieldValue && !!ownerFieldValue,
  });

  const repositoryOptions = React.useMemo(() => {
    if (repoListQuery.isLoading || repoListQuery.isError || !repoListQuery.data) return [];
    return (
      repoListQuery.data.data?.map(({ name }: { name: string }) => ({
        label: name,
        value: name,
      })) ?? []
    );
  }, [repoListQuery.data, repoListQuery.isError, repoListQuery.isLoading]);

  const helperText = React.useMemo(() => {
    if (!apiBaseUrl) return "Repositories auto-discovery cannot be performed.";
    if (repoListQuery.isError) return "Repositories auto-discovery could not be performed.";
    return undefined;
  }, [apiBaseUrl, repoListQuery.isError]);

  const isImportStrategy = strategyFieldValue === codebaseCreationStrategy.import;

  return (
    <form.AppField
      name={CODEBASE_FORM_NAMES.UI_REPOSITORY_NAME}
      validators={{
        onChange: ({ value }) => {
          if (providerFieldValue === gitProvider.gerrit) return undefined;
          if (!value || value.trim().length === 0) {
            return isImportStrategy ? "Select repository" : "Enter the repository name";
          }
          if (value.length < 3) return "Repository name must be at least 3 characters long";

          const validationResult = validateField(value, validationRules.REPOSITORY_NAME);
          if (validationResult !== true) return validationResult;

          if (
            !isImportStrategy &&
            !repoListQuery.isLoading &&
            !repoListQuery.isError &&
            repositoryOptions.length > 0 &&
            repositoryOptions.some((option) => option.value === value)
          ) {
            return "Repository with this name already exists";
          }
          return undefined;
        },
      }}
      listeners={{
        onChange: ({ value }) => {
          if (value && ownerFieldValue) {
            form.setFieldValue(CODEBASE_FORM_NAMES.GIT_URL_PATH, `${ownerFieldValue}/${value}`);
          }
        },
      }}
    >
      {(field) =>
        isImportStrategy ? (
          <field.FormCombobox
            label="Repository"
            placeholder="repository_name"
            options={repositoryOptions}
            freeSolo
            loading={!!apiBaseUrl && repoListQuery.isLoading}
            helperText={helperText}
            disabled={!ownerFieldValue}
          />
        ) : (
          <field.FormTextField
            label="Repository name"
            tooltipText="Specify the GitOps repository name."
            placeholder="repository_name"
            disabled={!ownerFieldValue}
            helperText={helperText}
          />
        )
      }
    </form.AppField>
  );
};
