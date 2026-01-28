import { useTRPCClient } from "@/core/providers/trpc";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { useClusterStore } from "@/k8s/store";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useCreateCodebaseBranchForm } from "../../../providers/form/hooks";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../constants";
import { useStore } from "@tanstack/react-form";
import type { Codebase, CodebaseBranch } from "@my-project/shared";

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

interface FromCommitProps {
  codebase: Codebase;
  defaultBranch: CodebaseBranch;
}

export const FromCommit = ({ codebase, defaultBranch }: FromCommitProps) => {
  const trpc = useTRPCClient();
  const form = useCreateCodebaseBranchForm();

  const releaseValue = useStore(form.store, (state) => state.values.release);
  const fromType = useStore(form.store, (state) => state.values.fromType) || "branch";

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
      trpc.gitfusion.getBranchList.query({
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

  const fromTypeOptions = React.useMemo(() => {
    return FROM_TYPE_OPTIONS.map((option) => ({
      ...option,
      disabled: releaseValue && option.value === "commit",
    }));
  }, [releaseValue]);

  const handleFromTypeChange = React.useCallback(() => {
    form.setFieldValue("fromCommit", "");
  }, [form]);

  return (
    <div className="grid grid-cols-2 items-start gap-4">
      <div>
        <form.AppField
          name={CODEBASE_BRANCH_FORM_NAMES.fromType.name as "fromType"}
          listeners={{
            onChange: handleFromTypeChange,
          }}
        >
          {(field) => (
            <field.FormSelect
              label="From"
              tooltipText="Choose whether to create the branch from an existing branch or a specific commit hash"
              options={fromTypeOptions}
            />
          )}
        </form.AppField>
      </div>
      <div>
        {releaseValue || fromType === "branch" ? (
          <form.AppField name={CODEBASE_BRANCH_FORM_NAMES.fromCommit.name as "fromCommit"}>
            {(field) => (
              <field.FormCombobox
                label="Branch name"
                placeholder="Select branch name"
                tooltipText="The new branch will be created starting from the selected branch. If this field is empty, the Default branch will be used."
                options={branchesOptions}
                disabled={query.isLoading}
                helperText={helperText}
                loading={!!apiBaseUrl && query.isLoading}
                freeSolo={true}
              />
            )}
          </form.AppField>
        ) : (
          <form.AppField name={CODEBASE_BRANCH_FORM_NAMES.fromCommit.name as "fromCommit"}>
            {(field) => (
              <field.FormTextField
                label="Commit hash"
                placeholder="Enter commit hash"
                tooltipText="The new branch will be created starting from the selected commit hash. If this field is empty, the Default branch will be used."
              />
            )}
          </form.AppField>
        )}
      </div>
    </div>
  );
};
