import React from "react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../names";
import { FieldEvent } from "@/core/types/forms";
import {
  createReleaseNameString,
  createVersioningString,
  getMajorMinorPatchOfVersion,
  getVersionAndPostfixFromVersioningString,
} from "@my-project/shared";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";

export const BranchVersion = () => {
  const {
    register,
    control,
    formState: { errors },
    setValue,
    getValues,
  } = useTypedFormContext();

  const onBranchVersionStartFieldValueChange = React.useCallback(
    ({ target: { value } }: FieldEvent<string>): void => {
      const { release, releaseBranchVersionPostfix } = getValues();
      const branchVersion = createVersioningString(value, releaseBranchVersionPostfix);

      setValue(CODEBASE_BRANCH_FORM_NAMES.version.name, branchVersion);

      if (!release) {
        return;
      }

      const { version } = getVersionAndPostfixFromVersioningString(branchVersion);
      const { major, minor, patch } = getMajorMinorPatchOfVersion(version);
      const newDefaultBranchMinor = minor + 1;
      const defaultBranchNewVersion = [major, newDefaultBranchMinor, patch].join(".");
      setValue(CODEBASE_BRANCH_FORM_NAMES.releaseBranchName.name, createReleaseNameString(major, minor));
      setValue(CODEBASE_BRANCH_FORM_NAMES.defaultBranchVersionStart.name, defaultBranchNewVersion);
    },
    [getValues, setValue]
  );

  const onBranchVersionPostfixFieldValueChange = React.useCallback(
    ({ target: { value } }: FieldEvent<string>): void => {
      const { releaseBranchVersionStart } = getValues();

      const branchVersion = createVersioningString(releaseBranchVersionStart, value);
      setValue(CODEBASE_BRANCH_FORM_NAMES.version.name, branchVersion);
    },
    [getValues, setValue]
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormTextField
        {...register(CODEBASE_BRANCH_FORM_NAMES.releaseBranchVersionStart.name, {
          required: "Branch version",
          onBlur: onBranchVersionStartFieldValueChange,
          pattern: {
            value: /^([0-9]+)\.([0-9]+)\.([0-9]+)?$/,
            message: "Enter valid semantic versioning format",
          },
        })}
        label={"Branch version"}
        tooltipText={"Valid identifiers are in the set [A-Za-z0-9]"}
        placeholder={"0.0.0"}
        control={control}
        errors={errors}
      />
      <FormTextField
        {...register(CODEBASE_BRANCH_FORM_NAMES.releaseBranchVersionPostfix.name, {
          onBlur: onBranchVersionPostfixFieldValueChange,
        })}
        label=" "
        placeholder={"SNAPSHOT"}
        control={control}
        errors={errors}
      />
    </div>
  );
};
