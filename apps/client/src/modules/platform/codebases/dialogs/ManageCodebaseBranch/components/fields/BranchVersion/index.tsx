import React from "react";
import { useCodebaseBranchForm } from "../../../providers/form/hooks";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../names";
import {
  createReleaseNameString,
  createVersioningString,
  getMajorMinorPatchOfVersion,
  getVersionAndPostfixFromVersioningString,
} from "@my-project/shared";

export const BranchVersion = () => {
  const form = useCodebaseBranchForm();

  const onBranchVersionStartFieldBlur = React.useCallback((): void => {
    const values = form.store.state.values;
    const { release, releaseBranchVersionPostfix, releaseBranchVersionStart } = values;
    const branchVersion = createVersioningString(releaseBranchVersionStart, releaseBranchVersionPostfix);

    form.setFieldValue("version", branchVersion);

    if (!release) {
      return;
    }

    const { version } = getVersionAndPostfixFromVersioningString(branchVersion);
    const { major, minor, patch } = getMajorMinorPatchOfVersion(version);
    const newDefaultBranchMinor = minor + 1;
    const defaultBranchNewVersion = [major, newDefaultBranchMinor, patch].join(".");
    form.setFieldValue("releaseBranchName", createReleaseNameString(major, minor));
    form.setFieldValue("defaultBranchVersionStart", defaultBranchNewVersion);
  }, [form]);

  const onBranchVersionPostfixFieldBlur = React.useCallback((): void => {
    const values = form.store.state.values;
    const { releaseBranchVersionStart, releaseBranchVersionPostfix } = values;

    const branchVersion = createVersioningString(releaseBranchVersionStart, releaseBranchVersionPostfix);
    form.setFieldValue("version", branchVersion);
  }, [form]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <form.AppField
        name={CODEBASE_BRANCH_FORM_NAMES.releaseBranchVersionStart.name as "releaseBranchVersionStart"}
        listeners={{
          onBlur: onBranchVersionStartFieldBlur,
        }}
      >
        {(field) => (
          <field.FormTextField
            label="Branch version"
            tooltipText="Valid identifiers are in the set [A-Za-z0-9]"
            placeholder="0.0.0"
          />
        )}
      </form.AppField>
      <form.AppField
        name={CODEBASE_BRANCH_FORM_NAMES.releaseBranchVersionPostfix.name as "releaseBranchVersionPostfix"}
        listeners={{
          onBlur: onBranchVersionPostfixFieldBlur,
        }}
      >
        {(field) => <field.FormTextField label=" " placeholder="SNAPSHOT" />}
      </form.AppField>
    </div>
  );
};
