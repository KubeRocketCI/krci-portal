import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FieldEvent } from "@/core/types/forms";
import { mapObjectValuesToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { codebaseVersioning } from "@my-project/shared";
import React from "react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";

export const CodebaseVersioning = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useTypedFormContext();

  const codebaseVersioningTypeFieldValue = watch(CODEBASE_FORM_NAMES.versioningType.name);
  const versioningStartFromVersionFieldValue = watch(CODEBASE_FORM_NAMES.versioningStartFromVersion.name);
  const versioningStartFromSnapshotFieldValue = watch(CODEBASE_FORM_NAMES.versioningStartFromSnapshot.name);
  const onStartVersionFromSnapshotStaticFieldChange = React.useCallback(
    ({ target: { value } }: FieldEvent): void => {
      setValue(CODEBASE_FORM_NAMES.versioningStartFrom.name, `${versioningStartFromVersionFieldValue || ""}-${value}`);
    },
    [setValue, versioningStartFromVersionFieldValue]
  );

  const onStartVersionFromVersionChange = React.useCallback(
    ({ target: { value } }: FieldEvent): void => {
      setValue(CODEBASE_FORM_NAMES.versioningStartFrom.name, `${value}-${versioningStartFromSnapshotFieldValue || ""}`);
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
        setValue(CODEBASE_FORM_NAMES.versioningStartFromVersion.name, "0.0.0");
        setValue(CODEBASE_FORM_NAMES.versioningStartFromSnapshot.name, "SNAPSHOT");
        setValue(CODEBASE_FORM_NAMES.versioningStartFrom.name, "0.0.0-SNAPSHOT");
      }
    },
    [setValue, versioningStartFromSnapshotFieldValue, versioningStartFromVersionFieldValue]
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <FormSelect
          {...register(CODEBASE_FORM_NAMES.versioningType.name, {
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FormTextField
                {...register(CODEBASE_FORM_NAMES.versioningStartFromVersion.name, {
                  required: "Specify the initial version.",
                  onBlur: onStartVersionFromVersionChange,
                  pattern: {
                    value:
                      /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/,
                    message: "Enter valid semantic versioning format",
                  },
                })}
                label="Start version from"
                tooltipText="Define the initial version number or identifier for your codebase to mark the starting point for version control."
                placeholder={"0.0.0"}
                control={control}
                errors={errors}
              />
            </div>
            <div className="flex flex-col justify-end">
              <FormTextField
                {...register(CODEBASE_FORM_NAMES.versioningStartFromSnapshot.name, {
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
          </div>
        </>
      ) : null}
    </div>
  );
};
