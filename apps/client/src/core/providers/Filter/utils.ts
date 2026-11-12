import { FilterValueMap } from "./types";

/**
 * The subset of `values` that differs from `defaultValues`, limited to `filterKeys`.
 * An empty array and an empty string count as default. This is the shape written to the URL.
 */
export const getNonDefaultFilterValues = <Values extends FilterValueMap>(
  values: Partial<Values>,
  defaultValues: Values,
  filterKeys: readonly string[] = Object.keys(defaultValues)
): Partial<Values> => {
  const result: Record<string, unknown> = {};

  for (const key of filterKeys) {
    const currentValue = values[key];
    const defaultValue = defaultValues[key];

    if (Array.isArray(currentValue)) {
      if (currentValue.length > 0) {
        result[key] = currentValue;
      }
    } else if (typeof currentValue === "string") {
      if (currentValue !== "" && currentValue !== defaultValue) {
        result[key] = currentValue;
      }
    } else if (currentValue !== undefined && currentValue !== defaultValue) {
      result[key] = currentValue;
    }
  }

  return result as Partial<Values>;
};
