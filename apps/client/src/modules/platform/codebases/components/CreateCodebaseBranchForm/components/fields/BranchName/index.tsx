import { Button } from "@/core/components/ui/button";
import React from "react";
import { BranchNameProps } from "./types";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../constants";
import { createVersioningString, getVersionAndPostfixFromVersioningString } from "@my-project/shared";
import { useCreateCodebaseBranchForm } from "../../../providers/form/hooks";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useTRPCClient } from "@/core/providers/trpc";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { RotateCw } from "lucide-react";
import { useStore } from "@tanstack/react-form";

export const BranchName = ({ codebase, defaultBranchVersion }: BranchNameProps) => {
  const trpc = useTRPCClient();
  const form = useCreateCodebaseBranchForm();

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

  const canLoadBranches = React.useMemo(() => {
    return !!apiBaseUrl && !!codebaseGitServer && !!codebaseOwner && !!codebaseRepoName;
  }, [apiBaseUrl, codebaseGitServer, codebaseOwner, codebaseRepoName]);

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
    enabled: canLoadBranches,
  });

  const invalidateBranchListCacheMutation = useMutation({
    mutationKey: ["invalidateBranchListCacheMutation", defaultNamespace],
    mutationFn: () =>
      trpc.gitfusion.invalidateBranchListCache.mutate({
        namespace: defaultNamespace,
        clusterName,
      }),
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

  const releaseFieldValue = useStore(form.store, (state) => state.values.release);

  const handleBranchNameChange = React.useCallback((): void => {
    const values = form.store.state.values;
    const { release, releaseBranchVersionStart, branchName } = values;

    if (release || !defaultBranchVersion) {
      return;
    }

    const { postfix } = getVersionAndPostfixFromVersioningString(defaultBranchVersion);
    const newValue = branchName === "" ? postfix : `${branchName}-${postfix}`;

    form.setFieldValue("releaseBranchVersionPostfix", newValue);
    form.setFieldValue("version", createVersioningString(releaseBranchVersionStart, newValue));
  }, [defaultBranchVersion, form]);

  const handleRefreshBranches = React.useCallback(() => {
    invalidateBranchListCacheMutation.mutate(undefined, {
      onSuccess: () => {
        query.refetch();
      },
    });
  }, [invalidateBranchListCacheMutation, query]);

  const helperText = React.useMemo(() => {
    if (!apiBaseUrl) {
      return "Branches auto-discovery cannot be performed.";
    }

    if (query.isError) {
      return "Branches auto-discovery could not be performed.";
    }

    return " ";
  }, [apiBaseUrl, query.isError]);

  return (
    <div>
      <form.AppField
        name={CODEBASE_BRANCH_FORM_NAMES.branchName.name}
        listeners={{
          onChange: handleBranchNameChange,
        }}
      >
        {(field) => (
          <field.FormCombobox
            placeholder="Branch name"
            label="Branch Name"
            tooltipText="Type the branch name that will be created in the Version Control System."
            options={branchesOptions}
            disabled={releaseFieldValue}
            freeSolo={true}
            loading={!!apiBaseUrl && query.isLoading}
            helperText={helperText}
            suffix={
              canLoadBranches ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefreshBranches}
                  disabled={invalidateBranchListCacheMutation.isPending || query.isLoading}
                  title="Refresh branches"
                  className="text-inherit"
                >
                  <RotateCw size={16} />
                </Button>
              ) : undefined
            }
          />
        )}
      </form.AppField>
    </div>
  );
};
