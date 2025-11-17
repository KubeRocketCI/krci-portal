import React from "react";
import { useQuery } from "@tanstack/react-query";
import { FormCombobox } from "@/core/providers/Form/components/FormCombobox";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useTRPCClient } from "@/core/providers/trpc";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";

export const Owner = () => {
  const trpc = useTRPCClient();
  const {
    control,
    formState: { errors },
    watch,
  } = useTypedFormContext();

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
    queryKey: ["gitServerOrgList", gitServerFieldValue],
    queryFn: () =>
      trpc.krakend.getOrganizationList.query({
        gitServer: gitServerFieldValue,
        namespace: defaultNamespace,
        clusterName,
      }),
    enabled: !!apiBaseUrl && !!gitServerFieldValue,
  });

  const organizationsOptions = React.useMemo(() => {
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
      return "Owners auto-discovery cannot be performed.";
    }

    if (query.isError) {
      return "Owners auto-discovery could not be performed.";
    }

    return " ";
  }, [apiBaseUrl, query.isError]);

  return (
    <FormCombobox
      name={CODEBASE_FORM_NAMES.repositoryOwner.name}
      placeholder={"owner"}
      label={"Owner"}
      control={control}
      errors={errors}
      options={organizationsOptions}
      freeSolo={true}
      loading={!!apiBaseUrl && query.isLoading}
      helperText={helperText}
      rules={{
        required: "Select owner",
      }}
    />
  );
};
