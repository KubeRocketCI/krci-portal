import {
  IMAGE_TAG_POSTFIX,
  VALUES_OVERRIDE_POSTFIX,
} from "@/modules/platform/cdpipelines/pages/stage-details/constants";

export const checkHighlightedButtons = (values: Record<string, string | boolean>) => {
  const valuesArray = Object.entries(values);
  const imageTagsValues = valuesArray.filter(([key]) => key && key.includes(IMAGE_TAG_POSTFIX));
  const valuesOverrides = valuesArray.filter(([key]) => key && key.includes(VALUES_OVERRIDE_POSTFIX));

  // Filter out undefined/null/empty values - only check defined image tag values
  const definedImageTagsValues = imageTagsValues.filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );

  if (!definedImageTagsValues.length) {
    return {
      latest: false,
      stable: false,
      valuesOverride: false,
    };
  }

  // Only check defined values - all defined values must be latest/stable
  const allVersionsAreLatest = definedImageTagsValues.every(([, value]) => {
    const stringValue = value as string;
    return stringValue && stringValue.includes("latest::");
  });
  const allVersionsAreStable = definedImageTagsValues.every(([, value]) => {
    const stringValue = value as string;
    return stringValue && stringValue.includes("stable::");
  });
  const allAppsHasValuesOverride = valuesOverrides.length > 0 && valuesOverrides.every(([, value]) => value === true);

  return {
    latest: allVersionsAreLatest,
    stable: allVersionsAreStable,
    valuesOverride: allAppsHasValuesOverride,
  };
};
