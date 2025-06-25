import { useTypedFormContext } from "@/modules/platform/codebases/dialogs/ManageCodebase/hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "@/modules/platform/codebases/dialogs/ManageCodebase/names";
import { codebaseVersioning } from "@my-project/shared";
import React from "react";

const defaultEDPVersioningValue = "0.1.0-SNAPSHOT";

export const useUpdateVersioningFields = () => {
  const { watch, setValue } = useTypedFormContext();

  const versioningStartFromFieldValue = watch(CODEBASE_FORM_NAMES.versioningStartFrom.name) as string;
  const versioningTypeFieldValue = watch(CODEBASE_FORM_NAMES.versioningType.name);

  React.useEffect(() => {
    if (
      (versioningTypeFieldValue === codebaseVersioning.edp || versioningTypeFieldValue === codebaseVersioning.semver) &&
      !versioningStartFromFieldValue
    ) {
      setValue(CODEBASE_FORM_NAMES.versioningStartFrom.name, defaultEDPVersioningValue, {
        shouldDirty: false,
      });
    }

    if (versioningTypeFieldValue === codebaseVersioning.default) {
      setValue(CODEBASE_FORM_NAMES.versioningStartFrom.name, undefined, {
        shouldDirty: false,
      });
    }

    if (versioningStartFromFieldValue) {
      const [version, snapshot] = versioningStartFromFieldValue.split("-");
      setValue(CODEBASE_FORM_NAMES.versioningStartFromVersion.name, version, {
        shouldDirty: false,
      });
      setValue(CODEBASE_FORM_NAMES.versioningStartFromSnapshot.name, snapshot, {
        shouldDirty: false,
      });
    }
  }, [setValue, versioningStartFromFieldValue, versioningTypeFieldValue]);
};
