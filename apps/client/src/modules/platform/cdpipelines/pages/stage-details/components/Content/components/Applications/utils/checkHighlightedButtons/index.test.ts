import { describe, expect, test } from "vitest";
import { checkHighlightedButtons } from "./index";
import {
  IMAGE_TAG_POSTFIX,
  VALUES_OVERRIDE_POSTFIX,
} from "@/modules/platform/cdpipelines/pages/stage-details/constants";

describe("checkHighlightedButtons", () => {
  test("returns all false when no image tag values", () => {
    const values = {
      otherField: "value",
    };

    const result = checkHighlightedButtons(values);

    expect(result).toEqual({
      latest: false,
      stable: false,
      valuesOverride: false,
    });
  });

  test("returns latest true when all versions are latest", () => {
    const values = {
      [`app1${IMAGE_TAG_POSTFIX}`]: "latest::tag1",
      [`app2${IMAGE_TAG_POSTFIX}`]: "latest::tag2",
    };

    const result = checkHighlightedButtons(values);

    expect(result).toEqual({
      latest: true,
      stable: false,
      valuesOverride: false,
    });
  });

  test("returns stable true when all versions are stable", () => {
    const values = {
      [`app1${IMAGE_TAG_POSTFIX}`]: "stable::tag1",
      [`app2${IMAGE_TAG_POSTFIX}`]: "stable::tag2",
    };

    const result = checkHighlightedButtons(values);

    expect(result).toEqual({
      latest: false,
      stable: true,
      valuesOverride: false,
    });
  });

  test("returns valuesOverride true when all apps have values override", () => {
    const values = {
      [`app1${IMAGE_TAG_POSTFIX}`]: "some::tag",
      [`app1${VALUES_OVERRIDE_POSTFIX}`]: true,
      [`app2${IMAGE_TAG_POSTFIX}`]: "some::tag",
      [`app2${VALUES_OVERRIDE_POSTFIX}`]: true,
    };

    const result = checkHighlightedButtons(values);

    expect(result).toEqual({
      latest: false,
      stable: false,
      valuesOverride: true,
    });
  });

  test("returns all true when conditions are met", () => {
    const values = {
      [`app1${IMAGE_TAG_POSTFIX}`]: "latest::tag1",
      [`app1${VALUES_OVERRIDE_POSTFIX}`]: true,
      [`app2${IMAGE_TAG_POSTFIX}`]: "latest::tag2",
      [`app2${VALUES_OVERRIDE_POSTFIX}`]: true,
    };

    const result = checkHighlightedButtons(values);

    expect(result).toEqual({
      latest: true,
      stable: false,
      valuesOverride: true,
    });
  });

  test("returns latest false when mixed versions", () => {
    const values = {
      [`app1${IMAGE_TAG_POSTFIX}`]: "latest::tag1",
      [`app2${IMAGE_TAG_POSTFIX}`]: "stable::tag2",
    };

    const result = checkHighlightedButtons(values);

    expect(result).toEqual({
      latest: false,
      stable: false,
      valuesOverride: false,
    });
  });

  test("returns stable false when mixed versions", () => {
    const values = {
      [`app1${IMAGE_TAG_POSTFIX}`]: "stable::tag1",
      [`app2${IMAGE_TAG_POSTFIX}`]: "latest::tag2",
    };

    const result = checkHighlightedButtons(values);

    expect(result).toEqual({
      latest: false,
      stable: false,
      valuesOverride: false,
    });
  });

  test("returns valuesOverride false when not all apps have override", () => {
    const values = {
      [`app1${IMAGE_TAG_POSTFIX}`]: "some::tag",
      [`app1${VALUES_OVERRIDE_POSTFIX}`]: true,
      [`app2${IMAGE_TAG_POSTFIX}`]: "some::tag",
      [`app2${VALUES_OVERRIDE_POSTFIX}`]: false,
    };

    const result = checkHighlightedButtons(values);

    expect(result).toEqual({
      latest: false,
      stable: false,
      valuesOverride: false,
    });
  });

  test("handles empty values object", () => {
    const result = checkHighlightedButtons({});

    expect(result).toEqual({
      latest: false,
      stable: false,
      valuesOverride: false,
    });
  });

  test("ignores non-image-tag and non-values-override fields", () => {
    const values = {
      [`app1${IMAGE_TAG_POSTFIX}`]: "latest::tag1",
      otherField: "value",
      anotherField: "123",
    };

    const result = checkHighlightedButtons(values);

    expect(result).toEqual({
      latest: true,
      stable: false,
      valuesOverride: false,
    });
  });
});
