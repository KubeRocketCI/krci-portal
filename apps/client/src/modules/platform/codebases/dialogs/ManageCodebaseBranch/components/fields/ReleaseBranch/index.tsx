import React from "react";
import { RELEASE_BRANCH_POSTFIX } from "../../../constants";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../names";
import { ReleaseBranchProps } from "./types";
import { FormCheckbox } from "@/core/providers/Form/components/FormCheckbox";
import { FormControlLabelWithTooltip } from "@/core/providers/Form/components/FormControlLabelWithTooltip";
import { FieldEvent } from "@/core/types/forms";
import {
  getVersionAndPostfixFromVersioningString,
  getMajorMinorPatchOfVersion,
  createReleaseNameString,
  createVersioningString,
} from "@my-project/shared";

const createReleaseName = (versionFieldValue: string) => {
  if (!versionFieldValue) {
    return "";
  }
  const { version } = getVersionAndPostfixFromVersioningString(versionFieldValue);
  const { major, minor } = getMajorMinorPatchOfVersion(version);

  return createReleaseNameString(major, minor);
};

export const ReleaseBranch = ({ defaultBranchVersion }: ReleaseBranchProps) => {
  const {
    register,
    control,
    formState: { errors },
    setValue,
    getValues,
  } = useTypedFormContext();

  const handleReleaseValueChange = React.useCallback(
    ({ target: { value } }: FieldEvent<string>) => {
      const { version, releaseBranchVersionStart, defaultBranchVersionPostfix } = getValues();
      if (!version || !defaultBranchVersion) {
        return;
      }

      const { postfix } = getVersionAndPostfixFromVersioningString(defaultBranchVersion);
      const newReleaseName = createReleaseName(version);
      const newReleaseBranchName = value ? newReleaseName : "";
      const branchVersionPostfix = value ? RELEASE_BRANCH_POSTFIX : postfix;
      const newVersion = value
        ? createVersioningString(releaseBranchVersionStart, RELEASE_BRANCH_POSTFIX)
        : createVersioningString(releaseBranchVersionStart, postfix);

      const [currentBranchVersion] = newVersion.split("-");
      const { major, minor, patch } = getMajorMinorPatchOfVersion(currentBranchVersion);
      const newDefaultBranchMinor = minor + 1;
      const defaultBranchNewVersion = [major, newDefaultBranchMinor, patch].join(".");

      setValue(CODEBASE_BRANCH_FORM_NAMES.releaseBranchName.name, newReleaseBranchName);
      setValue(CODEBASE_BRANCH_FORM_NAMES.releaseBranchVersionPostfix.name, branchVersionPostfix);
      setValue(CODEBASE_BRANCH_FORM_NAMES.version.name, newVersion);
      setValue(CODEBASE_BRANCH_FORM_NAMES.defaultBranchVersionStart.name, defaultBranchNewVersion);

      if (!defaultBranchVersionPostfix) {
        setValue(CODEBASE_BRANCH_FORM_NAMES.defaultBranchVersionPostfix.name, postfix);
      }
    },
    [defaultBranchVersion, getValues, setValue]
  );

  return (
    <FormCheckbox
      {...register(CODEBASE_BRANCH_FORM_NAMES.release.name, {
        onChange: handleReleaseValueChange,
      })}
      label={<FormControlLabelWithTooltip label={"Release branch"} />}
      control={control}
      errors={errors}
    />
  );
};
