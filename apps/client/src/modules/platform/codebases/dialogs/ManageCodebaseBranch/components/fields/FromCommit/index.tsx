import { Grid } from "@mui/material";
import React from "react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../names";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FormAutocompleteSingle } from "@/core/providers/Form/components/FormAutocompleteSingle";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import { useQuery } from "@tanstack/react-query";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { trpc } from "@/core/clients/trpc";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { validateField } from "@/core/utils/forms/validation";
import { validationRules } from "@/core/constants/validation";
import { FieldEvent } from "@/core/types/forms";

const FROM_TYPE_OPTIONS = [
  {
    value: "branch",
    label: "Branch",
  },
  {
    value: "commit",
    label: "Commit Hash",
  },
];

export const FromCommit = () => {
  const {
    register,
    control,
    watch,
    resetField,
    unregister,
    formState: { errors },
  } = useTypedFormContext();

  const {
    props: { codebase },
  } = useCurrentDialog();

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const krciConfigMapWatch = useWatchKRCIConfig();
  const krciConfigMap = krciConfigMapWatch.data;
  const apiBaseUrl = krciConfigMap?.data?.api_gateway_url;

  const codebaseGitUrlPath = codebase.spec.gitUrlPath;
  const codebaseGitServer = codebase.spec.gitServer;
  const codebaseRepoName = codebaseGitUrlPath.split("/").at(-1) || "";
  const codebaseOwner = codebaseGitUrlPath.split("/").filter(Boolean).slice(0, -1).join("/");

  const query = useQuery({
    queryKey: ["branchList", codebaseGitServer, codebaseOwner, codebaseRepoName],
    queryFn: () =>
      trpc.krakend.getBranchList.query({
        gitServer: codebaseGitServer,
        owner: codebaseOwner,
        repoName: codebaseRepoName,
        namespace: defaultNamespace,
        clusterName,
      }),
    enabled: !!apiBaseUrl && !!codebaseGitServer && !!codebaseOwner && !!codebaseRepoName,
  });

  const branchesOptions = React.useMemo(() => {
    if (query.isLoading || query.isError || !query.data) {
      return [];
    }

    if (codebaseGitServer === "gerrit") {
      return [
        {
          label: codebase.spec.defaultBranch,
          value: codebase.spec.defaultBranch,
        },
      ];
    }

    return (
      query.data.data?.map((branch: { name: string }) => ({
        label: branch.name,
        value: branch.name,
      })) || []
    );
  }, [query.isLoading, query.isError, query.data, codebaseGitServer, codebase.spec.defaultBranch]);

  const fromType = watch(CODEBASE_BRANCH_FORM_NAMES.fromType.name) || "branch";

  const helperText = React.useMemo(() => {
    if (!apiBaseUrl) {
      return "Branches auto-discovery cannot be performed.";
    }

    if (query.isError) {
      return "Branches auto-discovery could not be performed.";
    }

    return " ";
  }, [apiBaseUrl, query.isError]);

  const renderInputField = () => {
    if (fromType === "branch") {
      return (
        <FormAutocompleteSingle
          key="branch"
          {...register(CODEBASE_BRANCH_FORM_NAMES.fromCommit.name, {
            validate: (value) => {
              if (!value || value === "") {
                return true;
              }
              if (validationRules.BRANCH_NAME && typeof value === "string") {
                const validationResult = validateField(value, validationRules.BRANCH_NAME);
                if (validationResult !== true) {
                  return validationResult;
                }
              }
              return true;
            },
          })}
          label="Branch name"
          placeholder="Select branch name"
          tooltipText="The new branch will be created starting from the selected branch. If this field is empty, the Default branch will be used."
          control={control}
          errors={errors}
          options={branchesOptions}
          disabled={query.isLoading}
          TextFieldProps={{
            helperText,
          }}
          AutocompleteProps={{
            loading: !!apiBaseUrl && query.isLoading,
            freeSolo: true,
          }}
        />
      );
    } else {
      return (
        <FormTextField
          key="commitHash"
          {...register(CODEBASE_BRANCH_FORM_NAMES.fromCommit.name, {
            pattern: {
              value: /^[a-fA-F0-9]{40}$/,
              message: "Commit hash must be a full Git commit hash (40 hexadecimal characters)",
            },
            validate: (value) => {
              if (!value || value.trim() === "") {
                return true;
              }
              return true;
            },
          })}
          label="Commit hash"
          placeholder="Enter commit hash"
          tooltipText="The new branch will be created starting from the selected commit hash. If this field is empty, the Default branch will be used."
          control={control}
          errors={errors}
        />
      );
    }
  };

  return (
    <Grid container spacing={2} alignItems="flex-start">
      <Grid item xs={6}>
        <FormSelect
          {...register(CODEBASE_BRANCH_FORM_NAMES.fromType.name, {
            onChange: ({ target: { value } }: FieldEvent) => {
              unregister(CODEBASE_BRANCH_FORM_NAMES.fromCommit.name);

              if (value === "commit") {
                resetField(CODEBASE_BRANCH_FORM_NAMES.fromCommit.name, {
                  defaultValue: "",
                });
              } else {
                resetField(CODEBASE_BRANCH_FORM_NAMES.fromCommit.name);
              }
            },
          })}
          control={control}
          errors={errors}
          label="From"
          tooltipText="Choose whether to create the branch from an existing branch or a specific commit hash"
          options={FROM_TYPE_OPTIONS}
          defaultValue="branch"
        />
      </Grid>
      <Grid item xs={6}>
        {renderInputField()}
      </Grid>
    </Grid>
  );
};
