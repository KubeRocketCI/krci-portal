import { describe, expect, test } from "vitest";
import { getUsedValues } from "./getUsedValues";
import type { FormNameObject } from "@/core/types/forms";
import type { FieldValues } from "react-hook-form";

describe("getUsedValues", () => {
  test("returns values that have name objects with path property", () => {
    const values: FieldValues = {
      field1: "value1",
      field2: "value2",
      field3: "value3",
    };

    const names: { [key: string]: FormNameObject } = {
      field1: { path: "spec.field1", name: "field1" } as unknown as unknown as FormNameObject,
      field2: { path: "spec.field2", name: "field2" } as unknown as FormNameObject,
    };

    const result = getUsedValues(values, names);

    expect(result).toEqual({
      field1: "value1",
      field2: "value2",
    });
  });

  test("excludes values with null values", () => {
    const values: FieldValues = {
      field1: "value1",
      field2: null,
      field3: "value3",
    };

    const names: { [key: string]: FormNameObject } = {
      field1: { path: "spec.field1", name: "field1" } as unknown as unknown as FormNameObject,
      field2: { path: "spec.field2", name: "field2" } as unknown as FormNameObject,
      field3: { path: "spec.field3", name: "field3" } as unknown as FormNameObject,
    };

    const result = getUsedValues(values, names);

    expect(result).toEqual({
      field1: "value1",
      field3: "value3",
    });
  });

  test("excludes values without corresponding name objects", () => {
    const values: FieldValues = {
      field1: "value1",
      field2: "value2",
      field3: "value3",
    };

    const names: { [key: string]: FormNameObject } = {
      field1: { path: "spec.field1", name: "field1" } as unknown as unknown as FormNameObject,
    };

    const result = getUsedValues(values, names);

    expect(result).toEqual({
      field1: "value1",
    });
  });

  test("excludes values with name objects that don't have path property", () => {
    const values: FieldValues = {
      field1: "value1",
      field2: "value2",
    };

    const names: { [key: string]: FormNameObject } = {
      field1: { path: "spec.field1", name: "field1" } as unknown as unknown as FormNameObject,
      field2: { name: "field2" } as unknown as FormNameObject, // No path property
    };

    const result = getUsedValues(values, names);

    expect(result).toEqual({
      field1: "value1",
    });
  });

  test("returns empty object when no values match criteria", () => {
    const values: FieldValues = {
      field1: null,
      field2: "value2",
    };

    const names: { [key: string]: FormNameObject } = {
      field1: { path: "spec.field1", name: "field1" } as unknown as unknown as FormNameObject,
      // field2 has no name object
    };

    const result = getUsedValues(values, names);

    expect(result).toEqual({});
  });

  test("returns empty object when values is empty", () => {
    const values: FieldValues = {};
    const names: { [key: string]: FormNameObject } = {
      field1: { path: "spec.field1", name: "field1" } as unknown as unknown as FormNameObject,
    };

    const result = getUsedValues(values, names);

    expect(result).toEqual({});
  });

  test("returns empty object when names is empty", () => {
    const values: FieldValues = {
      field1: "value1",
    };
    const names: { [key: string]: FormNameObject } = {};

    const result = getUsedValues(values, names);

    expect(result).toEqual({});
  });

  test("handles various value types", () => {
    const values: FieldValues = {
      stringField: "text",
      numberField: 42,
      booleanField: true,
      arrayField: [1, 2, 3],
      objectField: { key: "value" },
    };

    const names: { [key: string]: FormNameObject } = {
      stringField: { path: "spec.stringField", name: "stringField" } as unknown as FormNameObject,
      numberField: { path: "spec.numberField", name: "numberField" } as unknown as FormNameObject,
      booleanField: { path: "spec.booleanField", name: "booleanField" } as unknown as FormNameObject,
      arrayField: { path: "spec.arrayField", name: "arrayField" } as unknown as FormNameObject,
      objectField: { path: "spec.objectField", name: "objectField" } as unknown as FormNameObject,
    };

    const result = getUsedValues(values, names);

    expect(result).toEqual({
      stringField: "text",
      numberField: 42,
      booleanField: true,
      arrayField: [1, 2, 3],
      objectField: { key: "value" },
    });
  });

  test("handles zero and false values (not null)", () => {
    const values: FieldValues = {
      zeroField: 0,
      falseField: false,
      emptyStringField: "",
    };

    const names: { [key: string]: FormNameObject } = {
      zeroField: { path: "spec.zeroField", name: "zeroField" } as unknown as FormNameObject,
      falseField: { path: "spec.falseField", name: "falseField" } as unknown as FormNameObject,
      emptyStringField: { path: "spec.emptyStringField", name: "emptyStringField" } as unknown as FormNameObject,
    };

    const result = getUsedValues(values, names);

    expect(result).toEqual({
      zeroField: 0,
      falseField: false,
      emptyStringField: "",
    });
  });
});
