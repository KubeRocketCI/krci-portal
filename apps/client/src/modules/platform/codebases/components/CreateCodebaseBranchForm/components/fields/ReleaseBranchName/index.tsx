import React from "react";
import { useCreateCodebaseBranchForm } from "../../../providers/form/hooks";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../constants";
import { BranchNameProps } from "./types";
import { getVersionAndPostfixFromVersioningString, createVersioningString } from "@my-project/shared";
import { useStore } from "@tanstack/react-form";

export const ReleaseBranchName = ({ defaultBranchVersion }: BranchNameProps) => {
  const form = useCreateCodebaseBranchForm();
  const releaseFieldValue = useStore(form.store, (state) => state.values.release);

  const handleReleaseBranchNameChange = React.useCallback((): void => {
    const values = form.store.state.values;
    const { release, releaseBranchVersionStart, releaseBranchName } = values;

    if (release || !defaultBranchVersion) {
      return;
    }

    const { postfix } = getVersionAndPostfixFromVersioningString(defaultBranchVersion);
    const newValue = releaseBranchName === "" ? postfix : `${releaseBranchName}-${postfix}`;

    form.setFieldValue("releaseBranchVersionPostfix", newValue);
    form.setFieldValue("version", createVersioningString(releaseBranchVersionStart, newValue));
  }, [defaultBranchVersion, form]);

  return (
    <div>
      <form.AppField
        name={CODEBASE_BRANCH_FORM_NAMES.releaseBranchName.name as "releaseBranchName"}
        listeners={{
          onChange: handleReleaseBranchNameChange,
        }}
      >
        {(field) => (
          <field.FormTextField
            label="Branch Name"
            tooltipText="Type the branch name that will be created in the Version Control System."
            placeholder="Enter Branch Name"
            disabled={releaseFieldValue}
          />
        )}
      </form.AppField>
    </div>
  );
};
