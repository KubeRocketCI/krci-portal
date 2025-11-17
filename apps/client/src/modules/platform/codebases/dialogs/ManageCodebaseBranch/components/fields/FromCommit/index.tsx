import { useTRPCClient } from "@/core/providers/trpc";
import { validationRules } from "@/core/constants/validation";
import { FormCombobox } from "@/core/providers/Form/components/FormCombobox";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FieldEvent } from "@/core/types/forms";
import { validateField } from "@/core/utils/forms/validation";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { useClusterStore } from "@/k8s/store";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";

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
  const trpc = useTRPCClient();
  const {
    register,
    control,
    watch,
    resetField,
    unregister,
    formState: { errors },
  } = useTypedFormContext();

  const releaseValue = watch(CODEBASE_BRANCH_FORM_NAMES.release.name);
  const fromType = watch(CODEBASE_BRANCH_FORM_NAMES.fromType.name) || "branch";

  const {
    props: { codebase, defaultBranch },
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

  const defaultBranchName = defaultBranch?.spec.branchName;

  const defaultBranchOption = React.useMemo(() => {
    return {
      label: defaultBranchName,
      value: defaultBranchName,
    };
  }, [defaultBranchName]);

  const branchesOptions = React.useMemo(() => {
    if (releaseValue && defaultBranch) {
      return [defaultBranchOption];
    }

    if (query.isLoading || query.isError || !query.data) {
      return [defaultBranchOption];
    }

    return (
      query.data.data?.map((branch) => ({
        label: branch.name,
        value: branch.name,
      })) || [defaultBranchOption]
    );
  }, [releaseValue, defaultBranch, query.isLoading, query.isError, query.data, defaultBranchOption]);

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
    if (releaseValue || fromType === "branch") {
      return (
        <FormCombobox
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
          helperText={helperText}
          loading={!!apiBaseUrl && query.isLoading}
          freeSolo={true}
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

  const fromTypeOptions = React.useMemo(() => {
    return FROM_TYPE_OPTIONS.map((option) => ({
      ...option,
      disabled: releaseValue && option.value === "commit",
    }));
  }, [releaseValue]);

  return (
    <div className="grid grid-cols-2 items-start gap-4">
      <div>
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
          options={fromTypeOptions}
          defaultValue="branch"
        />
      </div>
      <div>{renderInputField()}</div>
    </div>
  );
};
