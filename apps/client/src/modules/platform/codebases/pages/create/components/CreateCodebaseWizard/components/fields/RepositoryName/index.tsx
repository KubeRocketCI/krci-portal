import React from "react";
import { useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { codebaseCreationStrategy, gitProvider } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";
import { validationRules } from "@/core/constants/validation";
import { validateField } from "@/core/utils/forms/validation";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const RepositoryName: React.FC = () => {
  const form = useCreateCodebaseForm();
  const trpc = useTRPCClient();
  const gitServerFieldValue = useStore(form.store, (s) => s.values[NAMES.gitServer]);
  const ownerFieldValue = useStore(form.store, (s) => s.values[NAMES.ui_repositoryOwner]);
  const strategyFieldValue = useStore(form.store, (s) => s.values[NAMES.strategy]);

  const gitServerWatch = useGitServerWatchItem({ name: gitServerFieldValue });
  const gitServerProvider = gitServerWatch.data?.spec?.gitProvider;
  const isGerrit = gitServerProvider?.includes(gitProvider.gerrit);

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
    return "";
  }, [apiBaseUrl, repoListQuery.isError]);

  const isImportStrategy = strategyFieldValue === codebaseCreationStrategy.import;

  return (
    <form.AppField
      name={NAMES.ui_repositoryName}
      validators={{
        onChange: ({ value }) => {
          if (isGerrit) return undefined;
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
            form.setFieldValue(NAMES.name, value);
            form.setFieldValue(NAMES.gitUrlPath, `${ownerFieldValue}/${value}`);
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
            tooltipText="Specify the codebase repository name."
            placeholder="repository_name"
            disabled={!ownerFieldValue}
            helperText={helperText || undefined}
          />
        )
      }
    </form.AppField>
  );
};
