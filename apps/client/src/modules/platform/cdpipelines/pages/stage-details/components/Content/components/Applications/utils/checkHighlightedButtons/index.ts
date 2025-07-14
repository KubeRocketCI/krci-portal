import {
  IMAGE_TAG_POSTFIX,
  VALUES_OVERRIDE_POSTFIX,
} from "@/modules/platform/cdpipelines/pages/stage-details/constants";

export const checkHighlightedButtons = (values: Record<string, string | boolean>) => {
  const valuesArray = Object.entries(values);
  const imageTagsValues = valuesArray.filter(([key]) => key && key.includes(IMAGE_TAG_POSTFIX));
  const valuesOverrides = valuesArray.filter(([key]) => key && key.includes(VALUES_OVERRIDE_POSTFIX));

  if (!imageTagsValues.length) {
    return {
      latest: false,
      stable: false,
      valuesOverride: false,
    };
  }

  const allVersionsAreLatest = imageTagsValues.every(([, value]) => (value as string)?.includes("latest::"));
  const allVersionsAreStable = imageTagsValues.every(([, value]) => (value as string)?.includes("stable::"));
  const allAppsHasValuesOverride = valuesOverrides.every(([, value]) => value === true);

  return {
    latest: allVersionsAreLatest,
    stable: allVersionsAreStable,
    valuesOverride: allAppsHasValuesOverride,
  };
};
