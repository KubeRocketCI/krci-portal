import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FieldEvent } from "@/core/types/forms";
import { mapObjectValuesToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { codebaseVersioning } from "@my-project/shared";
import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

export const CodebaseVersioningField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();

  const codebaseVersioningTypeFieldValue = watch(NAMES.versioningType);
  const versioningStartFromVersionFieldValue = watch(NAMES.ui_versioningStartFromVersion);
  const versioningStartFromSnapshotFieldValue = watch(NAMES.ui_versioningStartFromSnapshot);

  const onStartVersionFromSnapshotStaticFieldChange = React.useCallback(
    ({ target: { value } }: FieldEvent): void => {
      setValue(NAMES.versioningStartFrom, `${versioningStartFromVersionFieldValue || ""}-${value}`);
    },
    [setValue, versioningStartFromVersionFieldValue]
  );

  const onStartVersionFromVersionChange = React.useCallback(
    ({ target: { value } }: FieldEvent): void => {
      setValue(NAMES.versioningStartFrom, `${value}-${versioningStartFromSnapshotFieldValue || ""}`);
    },
    [setValue, versioningStartFromSnapshotFieldValue]
  );

  const handleVersioningTypeChange = React.useCallback(
    ({ target: { value } }: FieldEvent): void => {
      if (
        (value === codebaseVersioning.edp || value === codebaseVersioning.semver) &&
        !versioningStartFromVersionFieldValue &&
        !versioningStartFromSnapshotFieldValue
      ) {
        setValue(NAMES.ui_versioningStartFromVersion, "0.0.0");
        setValue(NAMES.ui_versioningStartFromSnapshot, "SNAPSHOT");
        setValue(NAMES.versioningStartFrom, "0.0.0-SNAPSHOT");
      }
    },
    [setValue, versioningStartFromSnapshotFieldValue, versioningStartFromVersionFieldValue]
  );

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-1">
        <FormSelect
          {...register(NAMES.versioningType, {
            required: "Select codebase versioning type",
            onChange: handleVersioningTypeChange,
          })}
          label="Codebase versioning type"
          tooltipText="Define the versioning strategy for source code and artifacts."
          control={control}
          errors={errors}
          options={mapObjectValuesToSelectOptions(codebaseVersioning)}
        />
      </div>
      {codebaseVersioningTypeFieldValue === codebaseVersioning.edp ||
      codebaseVersioningTypeFieldValue === codebaseVersioning.semver ? (
        <>
          <div className="col-span-2 grid grid-cols-2 gap-4 md:grid-cols-2">
            <FormTextField
              {...register(NAMES.ui_versioningStartFromVersion, {
                required: "Specify the initial version.",
                onBlur: onStartVersionFromVersionChange,
                pattern: {
                  value: /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/,
                  message: "Enter valid semantic versioning format",
                },
              })}
              label="Start version from"
              tooltipText="Define the initial version number or identifier for your codebase to mark the starting point for version control."
              placeholder={"0.0.0"}
              control={control}
              errors={errors}
            />
            <FormTextField
              {...register(NAMES.ui_versioningStartFromSnapshot, {
                required: "Add a suffix.",
                onBlur: onStartVersionFromSnapshotStaticFieldChange,
              })}
              placeholder="SNAPSHOT"
              label="Suffix"
              tooltipText="Add a suffix to your version name to provide categorization. E.g. SNAPSHOT, unstable, test."
              control={control}
              errors={errors}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};
