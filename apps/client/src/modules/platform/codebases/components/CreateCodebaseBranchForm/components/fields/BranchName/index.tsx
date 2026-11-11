import { Button } from "@/core/components/ui/button";
import React from "react";
import { BranchNameProps } from "./types";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../constants";
import { createVersioningString, getVersionAndPostfixFromVersioningString } from "@my-project/shared";
import { useCreateCodebaseBranchForm } from "../../../providers/form/hooks";
import { useMutation } from "@tanstack/react-query";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useTRPCClient } from "@/core/providers/trpc";
import { RotateCw } from "lucide-react";
import { useStore } from "@tanstack/react-form";
import { useBranchDiscovery } from "../../../hooks/useBranchDiscovery";

export const BranchName = ({ codebase, defaultBranchVersion }: BranchNameProps) => {
  const trpc = useTRPCClient();
  const form = useCreateCodebaseBranchForm();

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const { isGerrit, isEnabled: canUseBranchDiscovery, isLoading, helperText, query } = useBranchDiscovery(codebase);

  const invalidateBranchListCacheMutation = useMutation({
    mutationKey: ["invalidateBranchListCacheMutation", defaultNamespace],
    mutationFn: () =>
      trpc.gitfusion.invalidateBranchListCache.mutate({
        namespace: defaultNamespace,
        clusterName,
      }),
  });

  const branchesOptions = React.useMemo(() => {
    if (isGerrit) {
      return [
        {
          label: codebase.spec.defaultBranch,
          value: codebase.spec.defaultBranch,
        },
      ];
    }

    if (query.isLoading || query.isError || !query.data) {
      return [];
    }

    return (
      query.data.data?.map((branch: { name: string }) => ({
        label: branch.name,
        value: branch.name,
      })) || []
    );
  }, [isGerrit, query.isLoading, query.isError, query.data, codebase.spec.defaultBranch]);

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
            loading={isLoading}
            helperText={helperText}
            suffix={
              canUseBranchDiscovery ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefreshBranches}
                  disabled={invalidateBranchListCacheMutation.isPending || isLoading}
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
