import React from "react";
import { CODEBASE_BRANCH_FORM_NAMES } from "../constants";
import type { CreateCodebaseBranchFormValues } from "../types";
import type { Codebase, CodebaseBranch } from "@my-project/shared";
import { codebaseVersioning, getVersionAndPostfixFromVersioningString } from "@my-project/shared";

interface UseDefaultValuesProps {
  codebase: Codebase;
  defaultBranch: CodebaseBranch;
  pipelines: {
    review?: string;
    build?: string;
    security?: string;
  };
}

export const useDefaultValues = ({ codebase, defaultBranch, pipelines }: UseDefaultValuesProps) => {
  const defaultBranchVersion = defaultBranch?.spec.version;
  const versioningType = codebase?.spec.versioning.type;

  return React.useMemo(() => {
    const defaultBranchName = defaultBranch?.spec.branchName || "";

    let base: Partial<CreateCodebaseBranchFormValues> = {
      [CODEBASE_BRANCH_FORM_NAMES.fromCommit.name]: defaultBranchName,
      [CODEBASE_BRANCH_FORM_NAMES.fromType.name]: "branch",
      [CODEBASE_BRANCH_FORM_NAMES.release.name]: false,
      [CODEBASE_BRANCH_FORM_NAMES.reviewPipeline.name]: pipelines?.review,
      [CODEBASE_BRANCH_FORM_NAMES.buildPipeline.name]: pipelines?.build,
      [CODEBASE_BRANCH_FORM_NAMES.securityPipeline.name]: pipelines?.security,
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
