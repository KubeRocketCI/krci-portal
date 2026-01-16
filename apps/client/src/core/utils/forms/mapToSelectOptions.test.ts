import { describe, expect, test } from "vitest";
import { mapArrayToSelectOptions, mapObjectValuesToSelectOptions } from "./mapToSelectOptions";

describe("mapArrayToSelectOptions", () => {
  test("maps array of strings to select options", () => {
    const array = ["option1", "option2", "option3"];

    const result = mapArrayToSelectOptions(array);

    expect(result).toEqual([
      { label: "option1", value: "option1" },
      { label: "option2", value: "option2" },
      { label: "option3", value: "option3" },
    ]);
  });

  test("handles empty array", () => {
    const array: string[] = [];

    const result = mapArrayToSelectOptions(array);

    expect(result).toEqual([]);
  });

  test("handles single item array", () => {
    const array = ["single"];

    const result = mapArrayToSelectOptions(array);

    expect(result).toEqual([{ label: "single", value: "single" }]);
  });

  test("preserves original values", () => {
    const array = ["uppercase", "lowercase", "MixedCase"];

    const result = mapArrayToSelectOptions(array);

    expect(result).toEqual([
      { label: "uppercase", value: "uppercase" },
      { label: "lowercase", value: "lowercase" },
      { label: "MixedCase", value: "MixedCase" },
    ]);
  });

  test("handles array with special characters", () => {
    const array = ["option-1", "option_2", "option.3"];

    const result = mapArrayToSelectOptions(array);

    expect(result).toEqual([
      { label: "option-1", value: "option-1" },
      { label: "option_2", value: "option_2" },
      { label: "option.3", value: "option.3" },
    ]);
  });
});

describe("mapObjectValuesToSelectOptions", () => {
  test("maps object values to select options", () => {
    const object = {
      key1: "option1",
      key2: "option2",
      key3: "option3",
    };

    const result = mapObjectValuesToSelectOptions(object);

    expect(result).toEqual([
      { label: "option1", value: "option1" },
      { label: "option2", value: "option2" },
      { label: "option3", value: "option3" },
    ]);
  });

  test("handles empty object", () => {
    const object: Record<string, string> = {};

    const result = mapObjectValuesToSelectOptions(object);

    expect(result).toEqual([]);
  });

  test("handles single key object", () => {
    const object = {
      key: "value",
    };

    const result = mapObjectValuesToSelectOptions(object);

    expect(result).toEqual([{ label: "value", value: "value" }]);
  });

  test("ignores object keys and only uses values", () => {
    const object = {
      UPPERCASE_KEY: "lowercase-value",
      "kebab-key": "camelCaseValue",
      snake_case_key: "PascalCaseValue",
    };

    const result = mapObjectValuesToSelectOptions(object);

    expect(result).toEqual([
      { label: "lowercase-value", value: "lowercase-value" },
      { label: "camelCaseValue", value: "camelCaseValue" },
      { label: "PascalCaseValue", value: "PascalCaseValue" },
    ]);
  });

  test("handles duplicate values", () => {
    const object = {
      key1: "duplicate",
      key2: "duplicate",
      key3: "unique",
    };

    const result = mapObjectValuesToSelectOptions(object);

    // Should include all values, even duplicates
    expect(result).toEqual([
      { label: "duplicate", value: "duplicate" },
      { label: "duplicate", value: "duplicate" },
      { label: "unique", value: "unique" },
    ]);
  });

  test("preserves value order from object", () => {
    const object = {
      z: "last",
      a: "first",
      m: "middle",
    };

    const result = mapObjectValuesToSelectOptions(object);

    // Values should be in the order they appear in Object.values()
    expect(result.length).toBe(3);
    expect(result.map((r) => r.value)).toContain("last");
    expect(result.map((r) => r.value)).toContain("first");
    expect(result.map((r) => r.value)).toContain("middle");
  });
});
