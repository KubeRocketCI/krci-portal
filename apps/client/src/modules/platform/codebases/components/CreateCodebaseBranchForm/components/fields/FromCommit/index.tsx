import React from "react";
import { useCreateCodebaseBranchForm } from "../../../providers/form/hooks";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../constants";
import { useStore } from "@tanstack/react-form";
import type { Codebase, CodebaseBranch } from "@my-project/shared";
import { useBranchDiscovery } from "../../../hooks/useBranchDiscovery";

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
  const form = useCreateCodebaseBranchForm();

  const releaseValue = useStore(form.store, (state) => state.values.release);
  const fromType = useStore(form.store, (state) => state.values.fromType) || "branch";

  const { isEnabled: canUseBranchDiscovery, isLoading, helperText, query } = useBranchDiscovery(codebase);

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

    if (!canUseBranchDiscovery || query.isLoading || query.isError || !query.data) {
      return [defaultBranchOption];
    }

    return (
      query.data.data?.map((branch) => ({
        label: branch.name,
        value: branch.name,
      })) || [defaultBranchOption]
    );
  }, [
    releaseValue,
    defaultBranch,
    canUseBranchDiscovery,
    query.isLoading,
    query.isError,
    query.data,
    defaultBranchOption,
  ]);

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
                disabled={isLoading}
                helperText={helperText}
                loading={isLoading}
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
