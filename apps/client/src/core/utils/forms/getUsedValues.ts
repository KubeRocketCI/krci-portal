import { FormNameObject } from "@/core/types/forms";
import { FieldValues } from "react-hook-form";

export const getUsedValues = (values: FieldValues, names: { [key: string]: FormNameObject }) => {
  let result: FieldValues = {};

  for (const [key, value] of Object.entries(values)) {
    const nameObject = names?.[key];
    const isUsedInResourceCreation = nameObject && Object.hasOwn(nameObject, "path");

    if (value === null || !nameObject || !isUsedInResourceCreation) {
      continue;
    }

    result = {
      ...result,
      [key]: value,
    };
  }

  return result;
};
