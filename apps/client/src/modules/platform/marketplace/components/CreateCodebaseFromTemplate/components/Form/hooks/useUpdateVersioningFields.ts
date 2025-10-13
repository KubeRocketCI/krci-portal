import React from "react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FROM_TEMPLATE_FORM_NAMES } from "../../../names";
import { codebaseVersioning } from "@my-project/shared";

const defaultEDPVersioningValue = "0.1.0-SNAPSHOT";

export const useUpdateVersioningFields = (): void => {
  const { watch, setValue } = useTypedFormContext();
  const versioningStartFromFieldValue = watch(CODEBASE_FROM_TEMPLATE_FORM_NAMES.VERSIONING_START_FROM);
  const versioningTypeFieldValue = watch(CODEBASE_FROM_TEMPLATE_FORM_NAMES.VERSIONING_TYPE);

  React.useEffect(() => {
    if (
      (versioningTypeFieldValue === codebaseVersioning.edp || versioningTypeFieldValue === codebaseVersioning.semver) &&
      !versioningStartFromFieldValue
    ) {
      setValue(CODEBASE_FROM_TEMPLATE_FORM_NAMES.VERSIONING_START_FROM, defaultEDPVersioningValue);
    }

    if (versioningTypeFieldValue === codebaseVersioning.default) {
      setValue(CODEBASE_FROM_TEMPLATE_FORM_NAMES.VERSIONING_START_FROM, "");
    }

    if (versioningStartFromFieldValue) {
      const [version, snapshot] = versioningStartFromFieldValue.split("-");
      setValue(CODEBASE_FROM_TEMPLATE_FORM_NAMES.VERSIONING_START_FROM_VERSION, version);
      setValue(CODEBASE_FROM_TEMPLATE_FORM_NAMES.VERSIONING_START_FROM_POSTFIX, snapshot);
    }
  }, [setValue, versioningStartFromFieldValue, versioningTypeFieldValue]);
};
