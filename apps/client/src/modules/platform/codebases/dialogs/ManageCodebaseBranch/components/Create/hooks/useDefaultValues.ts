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
    let base: Partial<ManageCodebaseBranchFormValues> = {
      [CODEBASE_BRANCH_FORM_NAMES.fromCommit.name]: "",
      [CODEBASE_BRANCH_FORM_NAMES.release.name]: false,
      [CODEBASE_BRANCH_FORM_NAMES.reviewPipeline.name]: pipelines?.review,
      [CODEBASE_BRANCH_FORM_NAMES.buildPipeline.name]: pipelines?.build,
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
    };

    return base;
  }, [pipelines?.review, pipelines?.build, defaultBranchVersion, versioningType]);
};
