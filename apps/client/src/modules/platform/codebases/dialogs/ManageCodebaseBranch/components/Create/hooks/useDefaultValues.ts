import React from "react";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import { ManageCodebaseBranchFormValues } from "../../../types";
import { codebaseVersioning, getVersionAndPostfixFromVersioningString } from "@my-project/shared";

export const useDefaultValues = () => {
  const {
    props: { codebase, defaultBranch, pipelines },
  } = useCurrentDialog();

  const defaultBranchVersion = defaultBranch?.spec.version;
  const versioningType = codebase?.spec.versioning.type;

  return React.useMemo(() => {
    const defaultBranchName = defaultBranch?.spec.branchName || "";

    let base: Partial<ManageCodebaseBranchFormValues> = {
      // Set fromCommit to default branch name when fromType is "branch" (default)
      [CODEBASE_BRANCH_FORM_NAMES.fromCommit.name]: defaultBranchName,
      [CODEBASE_BRANCH_FORM_NAMES.fromType.name]: "branch",
      [CODEBASE_BRANCH_FORM_NAMES.release.name]: false,
      [CODEBASE_BRANCH_FORM_NAMES.reviewPipeline.name]: pipelines?.review,
      [CODEBASE_BRANCH_FORM_NAMES.buildPipeline.name]: pipelines?.build,
      [CODEBASE_BRANCH_FORM_NAMES.securityPipeline.name]: pipelines?.security,
      // Initialize branch name fields
      [CODEBASE_BRANCH_FORM_NAMES.branchName.name]: "",
      [CODEBASE_BRANCH_FORM_NAMES.releaseBranchName.name]: "",
    };

    if (!defaultBranchVersion) {
      return base;
    }

    if (versioningType !== codebaseVersioning.edp && versioningType !== codebaseVersioning.semver) {
      return base;
    }

    const { version, postfix } = getVersionAndPostfixFromVersioningString(defaultBranchVersion);

    base = {
      ...base,
      [CODEBASE_BRANCH_FORM_NAMES.version.name]: defaultBranchVersion,
      [CODEBASE_BRANCH_FORM_NAMES.releaseBranchVersionStart.name]: version,
      [CODEBASE_BRANCH_FORM_NAMES.releaseBranchVersionPostfix.name]: postfix,
      // Default values for UI-only fields used in release mode
      [CODEBASE_BRANCH_FORM_NAMES.defaultBranchVersionStart.name]: version,
      [CODEBASE_BRANCH_FORM_NAMES.defaultBranchVersionPostfix.name]: postfix,
    };

    return base;
  }, [
    pipelines?.review,
    pipelines?.build,
    pipelines?.security,
    defaultBranchVersion,
    versioningType,
    defaultBranch?.spec.branchName,
  ]);
};
