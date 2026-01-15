import { Button } from "@/core/components/ui/button";
import React from "react";
import { BranchNameProps } from "./types";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../names";
import { createVersioningString, getVersionAndPostfixFromVersioningString } from "@my-project/shared";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import { FieldEvent } from "@/core/types/forms";
import { FormCombobox } from "@/core/providers/Form/components/FormCombobox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useTRPCClient } from "@/core/providers/trpc";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { validateField } from "@/core/utils/forms/validation";
import { validationRules } from "@/core/constants/validation";
import { RotateCw } from "lucide-react";

export const BranchName = ({ defaultBranchVersion }: BranchNameProps) => {
  const trpc = useTRPCClient();
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useTypedFormContext();

  const {
    props: { codebaseBranches, codebase },
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

  const existingCodebaseBranchs = codebaseBranches.map((codebaseBranch) => codebaseBranch.spec.branchName);

  const releaseFieldValue = watch(CODEBASE_BRANCH_FORM_NAMES.release.name);

  const handleReleaseBranchNameFieldValueChange = React.useCallback(
    ({ target: { value } }: FieldEvent) => {
      const { release, releaseBranchVersionStart } = getValues();
      if (release || !defaultBranchVersion) {
        return;
      }

      const { postfix } = getVersionAndPostfixFromVersioningString(defaultBranchVersion);
      const newValue = value === "" ? postfix : `${value}-${postfix}`;

      setValue(CODEBASE_BRANCH_FORM_NAMES.releaseBranchVersionPostfix.name, newValue);
      setValue(CODEBASE_BRANCH_FORM_NAMES.version.name, createVersioningString(releaseBranchVersionStart, newValue));
    },
    [defaultBranchVersion, getValues, setValue]
  );

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
      <FormCombobox
        placeholder="Branch name"
        {...register(CODEBASE_BRANCH_FORM_NAMES.branchName.name, {
          required: "Enter branch name",
          validate: (value) => {
            if (existingCodebaseBranchs.includes(value)) {
              return `Branch name "${value}" already exists`;
            }
            if (validationRules.BRANCH_NAME && typeof value === "string") {
              const validationResult = validateField(value, validationRules.BRANCH_NAME);
              if (validationResult !== true) {
                return validationResult;
              }
            }
            return true;
          },
          onChange: handleReleaseBranchNameFieldValueChange,
        })}
        label="Branch Name"
        tooltipText={"Type the branch name that will be created in the Version Control System."}
        control={control}
        errors={errors}
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
    </div>
  );
};
