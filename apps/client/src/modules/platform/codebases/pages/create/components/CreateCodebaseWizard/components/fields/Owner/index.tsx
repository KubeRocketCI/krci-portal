import React from "react";
import { useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";
import { isGerritProvider } from "../../../utils";

export const Owner: React.FC = () => {
  const form = useCreateCodebaseForm();
  const trpc = useTRPCClient();
  const gitServerFieldValue = useStore(form.store, (s) => s.values[NAMES.gitServer]);

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
    enabled: !!gitServerFieldValue,
  });

  const options = React.useMemo(() => {
    if (ownerQuery.isLoading || ownerQuery.isError || !ownerQuery.data) return [];
    return ownerQuery.data.data?.map(({ name }: { name: string }) => ({ label: name, value: name })) ?? [];
  }, [ownerQuery.data, ownerQuery.isError, ownerQuery.isLoading]);

  const helperText = ownerQuery.isError ? "Owners auto-discovery could not be performed." : "";

  return (
    <form.AppField
      name={NAMES.ui_repositoryOwner}
      validators={{
        onChange: ({ value, fieldApi }) => {
          const isGerrit = isGerritProvider(fieldApi.form.getFieldValue(NAMES.ui_gitServerProvider));
          if (isGerrit) {
            return undefined;
          }
          if (!value || value.trim().length === 0) return "Select owner";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormCombobox
          label="Owner"
          placeholder="owner"
          options={options}
          freeSolo
          loading={ownerQuery.isLoading}
          helperText={helperText}
        />
      )}
    </form.AppField>
  );
};
