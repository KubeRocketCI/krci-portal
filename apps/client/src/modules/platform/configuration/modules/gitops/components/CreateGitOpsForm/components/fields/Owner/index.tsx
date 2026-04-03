import React from "react";
import { useQuery } from "@tanstack/react-query";
import { gitProvider } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { useStore } from "@tanstack/react-form";
import { CODEBASE_FORM_NAMES } from "../../../constants";
import { useCreateGitOpsForm } from "../../../providers/form/hooks";
export const Owner = () => {
  const form = useCreateGitOpsForm();
  const trpc = useTRPCClient();
  const gitServerFieldValue = useStore(form.store, (s) => s.values[CODEBASE_FORM_NAMES.GIT_SERVER]);
  const providerFieldValue = useStore(form.store, (s) => s.values[CODEBASE_FORM_NAMES.UI_GIT_SERVER_PROVIDER]);
  const repositoryNameFieldValue = useStore(form.store, (s) => s.values[CODEBASE_FORM_NAMES.UI_REPOSITORY_NAME]);

  const krciConfigMapWatch = useWatchKRCIConfig();
  const apiBaseUrl = krciConfigMapWatch.data?.data?.api_gateway_url;

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((s) => ({ clusterName: s.clusterName, defaultNamespace: s.defaultNamespace }))
  );

  const ownerQuery = useQuery({
    queryKey: ["gitServerOrgList", gitServerFieldValue],
    queryFn: () =>
      trpc.gitfusion.getOrganizationList.query({
        gitServer: gitServerFieldValue ?? "",
        namespace: defaultNamespace,
        clusterName,
      }),
    enabled: !!apiBaseUrl && !!gitServerFieldValue,
  });

  const options = React.useMemo(() => {
    if (ownerQuery.isLoading || ownerQuery.isError || !ownerQuery.data) return [];
    return ownerQuery.data.data?.map(({ name }: { name: string }) => ({ label: name, value: name })) ?? [];
  }, [ownerQuery.data, ownerQuery.isError, ownerQuery.isLoading]);

  const helperText = React.useMemo(() => {
    if (!apiBaseUrl) return "Owners auto-discovery cannot be performed.";
    if (ownerQuery.isError) return "Owners auto-discovery could not be performed.";
    return "";
  }, [apiBaseUrl, ownerQuery.isError]);

  return (
    <form.AppField
      name={CODEBASE_FORM_NAMES.UI_REPOSITORY_OWNER}
      validators={{
        onChange: ({ value }) => {
          if (providerFieldValue === gitProvider.gerrit) return undefined;
          if (!value || value.trim().length === 0) return "Select owner";
          return undefined;
        },
      }}
      listeners={{
        onChange: ({ value }) => {
          if (value && repositoryNameFieldValue) {
            form.setFieldValue(CODEBASE_FORM_NAMES.GIT_URL_PATH, `${value}/${repositoryNameFieldValue}`);
          }
        },
      }}
    >
      {(field) => (
        <field.FormCombobox
          label="Owner"
          placeholder="owner"
          options={options}
          freeSolo
          loading={!!apiBaseUrl && ownerQuery.isLoading}
          helperText={helperText}
        />
      )}
    </form.AppField>
  );
};
